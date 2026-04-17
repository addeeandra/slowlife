use axum::{extract::State, Json};

use crate::{models::HealthResponse, now_millis, AppState};

pub async fn health(State(_state): State<AppState>) -> Json<HealthResponse> {
    Json(HealthResponse {
        ok: true,
        server_time: now_millis(),
    })
}
