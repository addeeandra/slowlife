use axum::{extract::State, http::HeaderMap, Json};

use crate::{
    auth::ensure_authorized,
    db,
    error::AppError,
    models::{PushRequest, PushResponse},
    now_millis,
    AppState,
};

const MAX_CHANGES_PER_PUSH: usize = 1000;

pub async fn push(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<PushRequest>,
) -> Result<Json<PushResponse>, AppError> {
    ensure_authorized(&headers, &state)?;
    validate_push_request(&request)?;

    let received_at = now_millis();
    let updated_snapshots =
        db::store_changes(&state.pool, &request.device_id, &request.changes, received_at).await?;

    Ok(Json(PushResponse {
        ok: true,
        stored_changes: request.changes.len(),
        updated_snapshots,
        received_at,
    }))
}

fn validate_push_request(request: &PushRequest) -> Result<(), AppError> {
    if request.device_id.trim().is_empty() {
        return Err(AppError::BadRequest("device_id is required".into()));
    }

    if request.changes.is_empty() {
        return Err(AppError::BadRequest("changes must not be empty".into()));
    }

    if request.changes.len() > MAX_CHANGES_PER_PUSH {
        return Err(AppError::BadRequest(format!(
            "changes exceeds max batch size of {MAX_CHANGES_PER_PUSH}"
        )));
    }

    for change in &request.changes {
        if change.table_name.trim().is_empty() {
            return Err(AppError::BadRequest("change table_name is required".into()));
        }

        if change.row_id.trim().is_empty() {
            return Err(AppError::BadRequest("change row_id is required".into()));
        }

        if !change.data.is_object() {
            return Err(AppError::BadRequest(
                "change data must be a JSON object".into(),
            ));
        }
    }

    Ok(())
}
