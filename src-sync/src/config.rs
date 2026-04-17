use std::env;

use crate::error::AppError;

#[derive(Clone)]
pub struct Config {
    pub app_secret: String,
    pub bind_addr: String,
    pub db_path: String,
    pub database_url: String,
}

impl Config {
    pub fn from_env() -> Result<Self, AppError> {
        let app_secret = env::var("SYNC_SECRET")
            .map_err(|_| AppError::Config("SYNC_SECRET is required".into()))?;
        let bind_addr = env::var("SYNC_BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:8787".into());
        let db_path = env::var("SYNC_DB_PATH").unwrap_or_else(|_| "./sync.db".into());

        Ok(Self {
            app_secret,
            bind_addr,
            db_path: db_path.clone(),
            database_url: format!("sqlite://{db_path}"),
        })
    }
}
