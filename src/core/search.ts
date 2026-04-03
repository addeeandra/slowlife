import { getDb } from './db'
import type { Event, JournalEntry, Todo, Transaction } from './types'

export interface SearchTransactionRow extends Transaction {
  account_name: string
  account_currency: string
  category_label: string | null
}

function normalizeQuery(query: string) {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
}

function buildMatchQuery(query: string) {
  const terms = normalizeQuery(query)
  if (!terms.length) return ''
  return terms.map(term => `${escapeTerm(term)}*`).join(' ')
}

function escapeTerm(term: string) {
  return term.replace(/["]+/g, ' ').trim()
}

export async function rebuildJournalSearchIndex() {
  const db = await getDb()
  await db.execute('DELETE FROM journal_entries_fts')
  await db.execute(`
    INSERT INTO journal_entries_fts (rowid, text, tags, space, category, item)
    SELECT id, text, COALESCE(tags, ''), space, category, COALESCE(item, '')
    FROM journal_entries
  `)
}

export async function rebuildEventsSearchIndex() {
  const db = await getDb()
  await db.execute('DELETE FROM events_fts')
  await db.execute(`
    INSERT INTO events_fts (rowid, title, description, type, space_id, category_id, source)
    SELECT id, title, COALESCE(description, ''), type, COALESCE(space_id, ''), COALESCE(category_id, ''), COALESCE(source, 'local')
    FROM events
  `)
}

export async function rebuildTransactionsSearchIndex() {
  const db = await getDb()
  await db.execute('DELETE FROM transactions_fts')
  await db.execute(`
    INSERT INTO transactions_fts (rowid, description, account_name, category_label, type)
    SELECT
      transactions.id,
      transactions.description,
      COALESCE(accounts.name, ''),
      COALESCE(transaction_categories.label, ''),
      transactions.type
    FROM transactions
    LEFT JOIN accounts ON accounts.id = transactions.account_id
    LEFT JOIN transaction_categories ON transaction_categories.id = transactions.category_id
  `)
}

export async function rebuildTodosSearchIndex() {
  const db = await getDb()
  await db.execute('DELETE FROM todos_fts')
  await db.execute(`
    INSERT INTO todos_fts (rowid, title, description, status, priority, space_id, category_id, project_id)
    SELECT id, title, COALESCE(description, ''), status, priority, COALESCE(space_id, ''), COALESCE(category_id, ''), COALESCE(project_id, '')
    FROM todos
  `)
}

export async function upsertJournalSearchIndex(entryId: number) {
  const db = await getDb()
  await db.execute('DELETE FROM journal_entries_fts WHERE rowid = $1', [entryId])
  await db.execute(`
    INSERT INTO journal_entries_fts (rowid, text, tags, space, category, item)
    SELECT id, text, COALESCE(tags, ''), space, category, COALESCE(item, '')
    FROM journal_entries
    WHERE id = $1
  `, [entryId])
}

export async function deleteJournalSearchIndex(entryId: number) {
  const db = await getDb()
  await db.execute('DELETE FROM journal_entries_fts WHERE rowid = $1', [entryId])
}

export async function upsertEventSearchIndex(eventId: number) {
  const db = await getDb()
  await db.execute('DELETE FROM events_fts WHERE rowid = $1', [eventId])
  await db.execute(`
    INSERT INTO events_fts (rowid, title, description, type, space_id, category_id, source)
    SELECT id, title, COALESCE(description, ''), type, COALESCE(space_id, ''), COALESCE(category_id, ''), COALESCE(source, 'local')
    FROM events
    WHERE id = $1
  `, [eventId])
}

export async function deleteEventSearchIndex(eventId: number) {
  const db = await getDb()
  await db.execute('DELETE FROM events_fts WHERE rowid = $1', [eventId])
}

export async function upsertTransactionSearchIndex(transactionId: number) {
  const db = await getDb()
  await db.execute('DELETE FROM transactions_fts WHERE rowid = $1', [transactionId])
  await db.execute(`
    INSERT INTO transactions_fts (rowid, description, account_name, category_label, type)
    SELECT
      transactions.id,
      transactions.description,
      COALESCE(accounts.name, ''),
      COALESCE(transaction_categories.label, ''),
      transactions.type
    FROM transactions
    LEFT JOIN accounts ON accounts.id = transactions.account_id
    LEFT JOIN transaction_categories ON transaction_categories.id = transactions.category_id
    WHERE transactions.id = $1
  `, [transactionId])
}

export async function deleteTransactionSearchIndex(transactionId: number) {
  const db = await getDb()
  await db.execute('DELETE FROM transactions_fts WHERE rowid = $1', [transactionId])
}

export async function upsertTodoSearchIndex(todoId: number) {
  const db = await getDb()
  await db.execute('DELETE FROM todos_fts WHERE rowid = $1', [todoId])
  await db.execute(`
    INSERT INTO todos_fts (rowid, title, description, status, priority, space_id, category_id, project_id)
    SELECT id, title, COALESCE(description, ''), status, priority, COALESCE(space_id, ''), COALESCE(category_id, ''), COALESCE(project_id, '')
    FROM todos
    WHERE id = $1
  `, [todoId])
}

export async function deleteTodoSearchIndex(todoId: number) {
  const db = await getDb()
  await db.execute('DELETE FROM todos_fts WHERE rowid = $1', [todoId])
}

export async function searchJournalEntries(query: string, limit: number = 8) {
  const match = buildMatchQuery(query)
  if (!match) return []
  const db = await getDb()
  return db.select<(JournalEntry & { rank: number })[]>(`
    SELECT journal_entries.*, bm25(journal_entries_fts) AS rank
    FROM journal_entries_fts
    JOIN journal_entries ON journal_entries.id = journal_entries_fts.rowid
    WHERE journal_entries_fts MATCH $1
    ORDER BY rank, journal_entries.created_at DESC
    LIMIT $2
  `, [match, limit])
}

export async function searchEvents(query: string, limit: number = 8) {
  const match = buildMatchQuery(query)
  if (!match) return []
  const db = await getDb()
  return db.select<(Event & { rank: number })[]>(`
    SELECT events.*, bm25(events_fts) AS rank
    FROM events_fts
    JOIN events ON events.id = events_fts.rowid
    WHERE events_fts MATCH $1
    ORDER BY rank, events.date DESC, COALESCE(events.time, '') DESC
    LIMIT $2
  `, [match, limit])
}

export async function searchTransactions(query: string, limit: number = 8) {
  const match = buildMatchQuery(query)
  if (!match) return []
  const db = await getDb()
  return db.select<(SearchTransactionRow & { rank: number })[]>(`
    SELECT
      transactions.*, 
      COALESCE(accounts.name, '') AS account_name,
      COALESCE(accounts.currency, 'IDR') AS account_currency,
      transaction_categories.label AS category_label,
      bm25(transactions_fts) AS rank
    FROM transactions_fts
    JOIN transactions ON transactions.id = transactions_fts.rowid
    LEFT JOIN accounts ON accounts.id = transactions.account_id
    LEFT JOIN transaction_categories ON transaction_categories.id = transactions.category_id
    WHERE transactions_fts MATCH $1
    ORDER BY transactions.date DESC, CASE WHEN transactions.type = 'expense' THEN 0 ELSE 1 END, rank
    LIMIT $2
  `, [match, limit])
}

export async function searchTodos(query: string, limit: number = 8) {
  const match = buildMatchQuery(query)
  if (!match) return []
  const db = await getDb()
  return db.select<(Todo & { rank: number })[]>(`
    SELECT todos.*, bm25(todos_fts) AS rank
    FROM todos_fts
    JOIN todos ON todos.id = todos_fts.rowid
    WHERE todos_fts MATCH $1
      AND todos.status IN ('open', 'in_progress')
    ORDER BY rank,
      CASE todos.priority WHEN 'P0' THEN 0 WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'P3' THEN 3 ELSE 4 END,
      COALESCE(todos.due_date, '9999-12-31')
    LIMIT $2
  `, [match, limit])
}
