import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null

const DB_NAME = import.meta.env.DEV ? 'slowlife-dev.db' : 'slowlife.db'

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load(`sqlite:${DB_NAME}`)
    await migrate(db)
  }
  return db
}

async function migrate(db: Database) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space TEXT NOT NULL,
      category TEXT NOT NULL,
      item TEXT,
      text TEXT NOT NULL,
      mood TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      type TEXT NOT NULL DEFAULT 'agenda',
      color TEXT DEFAULT '#c4956a',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'IDR',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'IDR',
      cycle TEXT NOT NULL DEFAULT 'monthly',
      next_date TEXT NOT NULL,
      color TEXT DEFAULT '#c4956a',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS spaces (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      color TEXT NOT NULL
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT NOT NULL,
      space_id TEXT NOT NULL,
      label TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      PRIMARY KEY (id, space_id),
      FOREIGN KEY (space_id) REFERENCES spaces(id)
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      space_id TEXT NOT NULL,
      label TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      PRIMARY KEY (id, category_id, space_id),
      FOREIGN KEY (category_id, space_id) REFERENCES categories(id, space_id)
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS pinned (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      item_id TEXT,
      sort_order INTEGER DEFAULT 0
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS google_account (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      client_id TEXT,
      client_secret TEXT,
      email TEXT,
      access_token TEXT,
      refresh_token TEXT,
      expires_at TEXT,
      connected INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS google_calendars (
      calendar_id TEXT PRIMARY KEY,
      summary TEXT NOT NULL,
      "primary" INTEGER NOT NULL DEFAULT 0,
      selected INTEGER NOT NULL DEFAULT 0,
      background_color TEXT,
      foreground_color TEXT,
      access_role TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS google_calendar_sync_state (
      calendar_id TEXT PRIMARY KEY,
      next_sync_token TEXT,
      last_synced_at TEXT,
      last_error TEXT,
      FOREIGN KEY (calendar_id) REFERENCES google_calendars(calendar_id)
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'P2',
      complexity TEXT NOT NULL DEFAULT 'C2',
      space_id TEXT,
      category_id TEXT,
      project_id TEXT,
      due_date TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await migrateEvents(db)
}

async function migrateEvents(db: Database) {
  const cols = [
    "ALTER TABLE events ADD COLUMN end_time TEXT",
    "ALTER TABLE events ADD COLUMN description TEXT",
    "ALTER TABLE events ADD COLUMN space_id TEXT",
    "ALTER TABLE events ADD COLUMN category_id TEXT",
    "ALTER TABLE events ADD COLUMN recurrence_rule TEXT",
    "ALTER TABLE events ADD COLUMN google_id TEXT",
    "ALTER TABLE events ADD COLUMN source TEXT DEFAULT 'local'",
    "ALTER TABLE events ADD COLUMN external_calendar_id TEXT",
    "ALTER TABLE events ADD COLUMN external_url TEXT",
    "ALTER TABLE events ADD COLUMN external_status TEXT",
    "ALTER TABLE events ADD COLUMN is_readonly INTEGER DEFAULT 0",
    "ALTER TABLE events ADD COLUMN sync_updated_at TEXT",
    "ALTER TABLE events ADD COLUMN external_event_type TEXT",
  ]
  for (const sql of cols) {
    try { await db.execute(sql) } catch (_) { /* column already exists */ }
  }

  try { await db.execute("ALTER TABLE google_account ADD COLUMN client_id TEXT") } catch (_) { /* column already exists */ }
  try { await db.execute("ALTER TABLE google_account ADD COLUMN client_secret TEXT") } catch (_) { /* column already exists */ }
}
