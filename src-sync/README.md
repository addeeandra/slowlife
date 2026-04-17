# slowlife sync backend

Minimal Rust sync relay for slowlife using `axum + sqlx + SQLite`.

## Endpoints

- `GET /health`
- `POST /sync/push`
- `GET /sync/pull`

## Environment

- `SYNC_SECRET` required shared secret checked against `x-secret-key`
- `SYNC_BIND_ADDR` optional, defaults to `127.0.0.1:8787`
- `SYNC_DB_PATH` optional, defaults to `./sync.db` relative to the process working directory

Copy `.env.example` to `.env` and set a real `SYNC_SECRET`.

## Run locally

```bash
cd src-sync
cargo run
```

## Health check

```bash
curl http://127.0.0.1:8787/health
```

## Push example

```bash
curl -X POST http://127.0.0.1:8787/sync/push \
  -H 'content-type: application/json' \
  -H 'x-secret-key: change-me' \
  -d '{
    "device_id": "device-a",
    "changes": [
      {
        "table_name": "todos",
        "row_id": "todo-1",
        "operation": "upsert",
        "data": {"id": "todo-1", "title": "Buy milk", "updated_at": 1710000000000},
        "created_at": 1710000000000
      }
    ]
  }'
```

## Pull example

```bash
curl 'http://127.0.0.1:8787/sync/pull?since=0&device_id=device-b' \
  -H 'x-secret-key: change-me'
```

## Notes

- Incoming changes are stored in a central `changes` table.
- Latest row state is maintained in `snapshots` for future new-device bootstrap support.
- `delete` operations are stored as tombstones in `snapshots`.
- `pull` excludes changes originating from the requesting device.

## Roadmap

- Add `GET /sync/bootstrap` so new devices can hydrate from `snapshots` instead of replaying the full `changes` history.
- Add pull pagination or cursor-based batching so large sync histories do not need to return in a single response.
- Add structured deployment support such as a `Dockerfile` and environment-specific run examples.
- Add more integration tests covering out-of-order timestamps, snapshot replacement rules, and malformed payload edge cases.
- Add operational guardrails such as request logging, rate limiting, and optional per-device credentials if the relay becomes internet-facing.
