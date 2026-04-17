use sqlx::{sqlite::{SqliteConnectOptions, SqlitePoolOptions}, SqlitePool};
use std::str::FromStr;

use crate::{error::AppError, models::{IncomingChange, StoredChange}};

pub async fn connect(database_url: &str) -> Result<SqlitePool, AppError> {
    let options = SqliteConnectOptions::from_str(database_url)
        .map_err(|error| AppError::Config(format!("invalid database url: {error}")))?
        .create_if_missing(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;

    migrate(&pool).await?;

    Ok(pool)
}

async fn migrate(pool: &SqlitePool) -> Result<(), AppError> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS changes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          device_id TEXT NOT NULL,
          table_name TEXT NOT NULL,
          row_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          received_at INTEGER NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS snapshots (
          table_name TEXT NOT NULL,
          row_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          data TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          source_device_id TEXT NOT NULL,
          received_at INTEGER NOT NULL,
          PRIMARY KEY (table_name, row_id)
        )
        "#,
    )
    .execute(pool)
    .await?;

    for statement in [
        "CREATE INDEX IF NOT EXISTS idx_changes_created_at ON changes(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_changes_received_at ON changes(received_at)",
        "CREATE INDEX IF NOT EXISTS idx_changes_device_created_at ON changes(device_id, created_at)",
        "CREATE INDEX IF NOT EXISTS idx_changes_pull ON changes(created_at, device_id)",
        "CREATE INDEX IF NOT EXISTS idx_changes_table_row ON changes(table_name, row_id)",
    ] {
        sqlx::query(statement).execute(pool).await?;
    }

    Ok(())
}

pub async fn store_changes(
    pool: &SqlitePool,
    device_id: &str,
    changes: &[IncomingChange],
    received_at: i64,
) -> Result<usize, AppError> {
    let mut tx = pool.begin().await?;
    let mut updated_snapshots = 0usize;

    for change in changes {
        let data = serde_json::to_string(&change.data)
            .map_err(|error| AppError::BadRequest(format!("invalid change data: {error}")))?;

        sqlx::query(
            r#"
            INSERT INTO changes (device_id, table_name, row_id, operation, data, created_at, received_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(device_id)
        .bind(&change.table_name)
        .bind(&change.row_id)
        .bind(change.operation.as_str())
        .bind(&data)
        .bind(change.created_at)
        .bind(received_at)
        .execute(&mut *tx)
        .await?;

        let existing = sqlx::query_as::<_, SnapshotRow>(
            r#"
            SELECT updated_at, received_at
            FROM snapshots
            WHERE table_name = ? AND row_id = ?
            "#,
        )
        .bind(&change.table_name)
        .bind(&change.row_id)
        .fetch_optional(&mut *tx)
        .await?;

        let should_update = match existing {
            Some(row) => {
                change.created_at > row.updated_at
                    || (change.created_at == row.updated_at && received_at >= row.received_at)
            }
            None => true,
        };

        if should_update {
            sqlx::query(
                r#"
                INSERT INTO snapshots (table_name, row_id, operation, data, updated_at, source_device_id, received_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(table_name, row_id) DO UPDATE SET
                  operation = excluded.operation,
                  data = excluded.data,
                  updated_at = excluded.updated_at,
                  source_device_id = excluded.source_device_id,
                  received_at = excluded.received_at
                "#,
            )
            .bind(&change.table_name)
            .bind(&change.row_id)
            .bind(change.operation.as_str())
            .bind(&data)
            .bind(change.created_at)
            .bind(device_id)
            .bind(received_at)
            .execute(&mut *tx)
            .await?;

            updated_snapshots += 1;
        }
    }

    tx.commit().await?;

    Ok(updated_snapshots)
}

pub async fn pull_changes(
    pool: &SqlitePool,
    since: i64,
    device_id: &str,
) -> Result<Vec<StoredChange>, AppError> {
    let rows = sqlx::query_as::<_, StoredChange>(
        r#"
        SELECT id, device_id, table_name, row_id, operation, data, created_at, received_at
        FROM changes
        WHERE created_at > ? AND device_id != ?
        ORDER BY created_at ASC, id ASC
        "#,
    )
    .bind(since)
    .bind(device_id)
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

#[derive(sqlx::FromRow)]
struct SnapshotRow {
    updated_at: i64,
    received_at: i64,
}
