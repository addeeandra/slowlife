use axum::{extract::{Query, State}, http::HeaderMap, Json};

use crate::{
    auth::ensure_authorized,
    db,
    error::AppError,
    models::{PullQuery, PullResponse, StoredChangePayload},
    now_millis,
    AppState,
};

pub async fn pull(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<PullQuery>,
) -> Result<Json<PullResponse>, AppError> {
    ensure_authorized(&headers, &state)?;

    if query.device_id.trim().is_empty() {
        return Err(AppError::BadRequest("device_id is required".into()));
    }

    let changes = db::pull_changes(&state.pool, query.since.unwrap_or(0), &query.device_id).await?;
    let changes = changes
        .into_iter()
        .map(|change| {
            let data = serde_json::from_str(&change.data)
                .map_err(|error| AppError::Internal(format!("stored change data is invalid JSON: {error}")))?;

            Ok(StoredChangePayload {
                id: change.id,
                device_id: change.device_id,
                table_name: change.table_name,
                row_id: change.row_id,
                operation: change.operation,
                data,
                created_at: change.created_at,
                received_at: change.received_at,
            })
        })
        .collect::<Result<Vec<_>, AppError>>()?;

    Ok(Json(PullResponse {
        changes,
        server_time: now_millis(),
    }))
}
