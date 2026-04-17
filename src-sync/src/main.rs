mod auth;
mod config;
mod db;
mod error;
mod models;
mod routes;

use std::net::SocketAddr;

use axum::{routing::{get, post}, Router};
use config::Config;
use error::AppError;
use sqlx::SqlitePool;
use tower_http::limit::RequestBodyLimitLayer;
use tracing::info;

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub pool: SqlitePool,
}

#[tokio::main]
async fn main() -> Result<(), AppError> {
    dotenvy::dotenv().ok();
    init_tracing();

    let config = Config::from_env()?;
    let pool = db::connect(&config.database_url).await?;
    let app = build_app(AppState {
        config: config.clone(),
        pool,
    });

    let addr: SocketAddr = config
        .bind_addr
        .parse()
        .map_err(|error| AppError::Config(format!("invalid SYNC_BIND_ADDR: {error}")))?;

    info!(bind_addr = %addr, database_url = %config.database_url, "starting sync backend");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|error| AppError::Internal(format!("failed to bind server: {error}")))?;

    axum::serve(listener, app)
        .await
        .map_err(|error| AppError::Internal(format!("server error: {error}")))
}

fn init_tracing() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "slowlife_sync=info,tower_http=info".into()),
        )
        .init();
}

fn build_app(state: AppState) -> Router {
    Router::new()
        .route("/health", get(routes::health::health))
        .route("/sync/push", post(routes::push::push))
        .route("/sync/pull", get(routes::pull::pull))
        .layer(RequestBodyLimitLayer::new(1024 * 1024))
        .with_state(state)
}

pub fn now_millis() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

#[cfg(test)]
mod tests {
    use axum::{body::Body, http::{Request, StatusCode}};
    use serde_json::json;
    use sqlx::{Row, SqlitePool};
    use tempfile::tempdir;
    use tower::util::ServiceExt;

    use super::*;

    async fn test_app() -> (Router, SqlitePool, tempfile::TempDir) {
        let temp_dir = tempdir().expect("failed to create temp dir");
        let db_path = temp_dir.path().join("test.db");
        let database_url = format!("sqlite:{}", db_path.display());
        let pool = db::connect(&database_url)
            .await
            .expect("failed to connect test db");

        let state = AppState {
            config: Config {
                app_secret: "test-secret".into(),
                bind_addr: "127.0.0.1:8787".into(),
                db_path: db_path.display().to_string(),
                database_url,
            },
            pool: pool.clone(),
        };

        (build_app(state), pool, temp_dir)
    }

    #[tokio::test]
    async fn health_returns_ok() {
        let (app, _pool, _temp_dir) = test_app().await;
        let response = app
            .oneshot(Request::builder().uri("/health").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn push_rejects_missing_secret() {
        let (app, _pool, _temp_dir) = test_app().await;
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/sync/push")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        json!({
                            "device_id": "device-a",
                            "changes": [{
                                "table_name": "todos",
                                "row_id": "todo-1",
                                "operation": "upsert",
                                "data": {"id": "todo-1"},
                                "created_at": 100
                            }]
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn push_stores_changes_and_snapshots() {
        let (app, pool, _temp_dir) = test_app().await;
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/sync/push")
                    .header("content-type", "application/json")
                    .header("x-secret-key", "test-secret")
                    .body(Body::from(
                        json!({
                            "device_id": "device-a",
                            "changes": [{
                                "table_name": "todos",
                                "row_id": "todo-1",
                                "operation": "upsert",
                                "data": {"id": "todo-1", "title": "a"},
                                "created_at": 100
                            }]
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let change_count: i64 = sqlx::query("SELECT COUNT(*) as count FROM changes")
            .fetch_one(&pool)
            .await
            .unwrap()
            .get("count");
        let snapshot_count: i64 = sqlx::query("SELECT COUNT(*) as count FROM snapshots")
            .fetch_one(&pool)
            .await
            .unwrap()
            .get("count");

        assert_eq!(change_count, 1);
        assert_eq!(snapshot_count, 1);
    }

    #[tokio::test]
    async fn push_delete_updates_tombstone_snapshot() {
        let (app, pool, _temp_dir) = test_app().await;

        for body in [
            json!({
                "device_id": "device-a",
                "changes": [{
                    "table_name": "todos",
                    "row_id": "todo-1",
                    "operation": "upsert",
                    "data": {"id": "todo-1", "title": "a"},
                    "created_at": 100
                }]
            }),
            json!({
                "device_id": "device-a",
                "changes": [{
                    "table_name": "todos",
                    "row_id": "todo-1",
                    "operation": "delete",
                    "data": {"id": "todo-1", "deleted_at": 200},
                    "created_at": 200
                }]
            }),
        ] {
            let response = app
                .clone()
                .oneshot(
                    Request::builder()
                        .method("POST")
                        .uri("/sync/push")
                        .header("content-type", "application/json")
                        .header("x-secret-key", "test-secret")
                        .body(Body::from(body.to_string()))
                        .unwrap(),
                )
                .await
                .unwrap();

            assert_eq!(response.status(), StatusCode::OK);
        }

        let row = sqlx::query("SELECT operation, updated_at FROM snapshots WHERE table_name = ? AND row_id = ?")
            .bind("todos")
            .bind("todo-1")
            .fetch_one(&pool)
            .await
            .unwrap();

        assert_eq!(row.get::<String, _>("operation"), "delete");
        assert_eq!(row.get::<i64, _>("updated_at"), 200);
    }

    #[tokio::test]
    async fn pull_excludes_same_device_and_respects_since() {
        let (app, _pool, _temp_dir) = test_app().await;

        for body in [
            json!({
                "device_id": "device-a",
                "changes": [{
                    "table_name": "todos",
                    "row_id": "todo-1",
                    "operation": "upsert",
                    "data": {"id": "todo-1"},
                    "created_at": 100
                }]
            }),
            json!({
                "device_id": "device-b",
                "changes": [{
                    "table_name": "todos",
                    "row_id": "todo-2",
                    "operation": "upsert",
                    "data": {"id": "todo-2"},
                    "created_at": 200
                }]
            }),
        ] {
            let response = app
                .clone()
                .oneshot(
                    Request::builder()
                        .method("POST")
                        .uri("/sync/push")
                        .header("content-type", "application/json")
                        .header("x-secret-key", "test-secret")
                        .body(Body::from(body.to_string()))
                        .unwrap(),
                )
                .await
                .unwrap();

            assert_eq!(response.status(), StatusCode::OK);
        }

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/sync/pull?since=150&device_id=device-a")
                    .header("x-secret-key", "test-secret")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let value: serde_json::Value = serde_json::from_slice(&body).unwrap();
        let changes = value["changes"].as_array().unwrap();

        assert_eq!(changes.len(), 1);
        assert_eq!(changes[0]["device_id"], "device-b");
        assert_eq!(changes[0]["row_id"], "todo-2");
    }
}
