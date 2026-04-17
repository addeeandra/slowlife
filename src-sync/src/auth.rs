use axum::http::HeaderMap;
use subtle::ConstantTimeEq;

use crate::{error::AppError, AppState};

pub fn ensure_authorized(headers: &HeaderMap, state: &AppState) -> Result<(), AppError> {
    let provided = headers
        .get("x-secret-key")
        .and_then(|value| value.to_str().ok())
        .ok_or(AppError::Unauthorized)?;

    if provided
        .as_bytes()
        .ct_eq(state.config.app_secret.as_bytes())
        .into()
    {
        return Ok(());
    }

    Err(AppError::Unauthorized)
}
