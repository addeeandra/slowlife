import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:slowlife.db')
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
  ]
  for (const sql of cols) {
    try { await db.execute(sql) } catch (_) { /* column already exists */ }
  }
}
