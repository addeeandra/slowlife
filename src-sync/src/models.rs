use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Deserialize)]
pub struct PushRequest {
    pub device_id: String,
    pub changes: Vec<IncomingChange>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct IncomingChange {
    pub table_name: String,
    pub row_id: String,
    pub operation: ChangeOperation,
    pub data: Value,
    pub created_at: i64,
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "TEXT", rename_all = "snake_case")]
pub enum ChangeOperation {
    Upsert,
    Delete,
}

impl ChangeOperation {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Upsert => "upsert",
            Self::Delete => "delete",
        }
    }
}

#[derive(Debug, Serialize)]
pub struct PushResponse {
    pub ok: bool,
    pub stored_changes: usize,
    pub updated_snapshots: usize,
    pub received_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct PullQuery {
    pub since: Option<i64>,
    pub device_id: String,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct StoredChange {
    pub id: i64,
    pub device_id: String,
    pub table_name: String,
    pub row_id: String,
    pub operation: String,
    pub data: String,
    pub created_at: i64,
    pub received_at: i64,
}

#[derive(Debug, Serialize)]
pub struct PullResponse {
    pub changes: Vec<StoredChangePayload>,
    pub server_time: i64,
}

#[derive(Debug, Serialize)]
pub struct StoredChangePayload {
    pub id: i64,
    pub device_id: String,
    pub table_name: String,
    pub row_id: String,
    pub operation: String,
    pub data: Value,
    pub created_at: i64,
    pub received_at: i64,
}

#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub ok: bool,
    pub server_time: i64,
}
