export type MoodKey = 'awful' | 'bad' | 'okay' | 'good' | 'great'

export interface JournalEntry {
  id: number
  space: string
  category: string
  item: string | null
  text: string
  mood: MoodKey | null
  tags: string // JSON string in SQLite
  created_at: string
}

export type EventType = 'meeting' | 'agenda' | 'holiday' | 'reminder'

export interface RecurrenceRule {
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  until?: string
  count?: number
  byDay?: string[]
}

export type EventSource = 'local' | 'google'

export interface Event {
  id: number
  title: string
  date: string
  time: string | null
  end_time: string | null
  type: EventType
  color: string
  description: string | null
  space_id: string | null
  category_id: string | null
  recurrence_rule: string | null
  google_id: string | null
  source: EventSource
  external_calendar_id: string | null
  external_url: string | null
  external_status: string | null
  is_readonly: number
  sync_updated_at: string | null
  external_event_type: string | null
  created_at: string
}

export interface EventOccurrence extends Event {
  occurrence_date: string
  is_recurring_instance: boolean
  parent_id: number | null
}

export interface GoogleAccount {
  id: number
  client_id: string | null
  client_secret: string | null
  email: string | null
  access_token: string | null
  refresh_token: string | null
  expires_at: string | null
  connected: number
  created_at: string
}

export interface GoogleCalendar {
  calendar_id: string
  summary: string
  primary: number
  selected: number
  background_color: string | null
  foreground_color: string | null
  access_role: string | null
  created_at: string
}

export interface GoogleCalendarSyncState {
  calendar_id: string
  next_sync_token: string | null
  last_synced_at: string | null
  last_error: string | null
}

export interface GoogleCalendarListResponse {
  items?: GoogleCalendarListEntry[]
  nextPageToken?: string
}

export interface GoogleCalendarListEntry {
  id: string
  summary?: string
  primary?: boolean
  backgroundColor?: string
  foregroundColor?: string
  accessRole?: string
}

export interface GoogleEventsListResponse {
  items?: GoogleCalendarEvent[]
  nextPageToken?: string
  nextSyncToken?: string
}

export interface GoogleCalendarEvent {
  id: string
  status?: string
  summary?: string
  description?: string
  htmlLink?: string
  eventType?: string
  updated?: string
  start?: {
    date?: string
    dateTime?: string
    timeZone?: string
  }
  end?: {
    date?: string
    dateTime?: string
    timeZone?: string
  }
}

export interface Account {
  id: number
  name: string
  initial_balance: number
  currency: string
  created_at: string
}

export type TransactionType = 'income' | 'expense'
export type TransactionEntryMode = 'manual' | 'adjustment'

export interface Transaction {
  id: number
  account_id: number
  description: string
  amount: number
  type: TransactionType
  date: string
  category_id: number | null
  entry_mode: TransactionEntryMode
  created_at: string
}

export type TransactionCategoryKind = 'income' | 'expense'

export interface TransactionCategory {
  id: number
  label: string
  kind: TransactionCategoryKind
  color: string
  monthly_budget: number | null
  sort_order: number
  created_at: string
}

export interface Subscription {
  id: number
  name: string
  amount: number
  currency: string
  cycle: string
  next_date: string
  color: string
  cancelled_at: string | null
  created_at: string
}

export interface FinanceSettings {
  id: number
  base_currency: string
}

export interface ExchangeRate {
  id: number
  from_currency: string
  to_currency: string
  rate: number
  effective_date: string
  created_at: string
}

export interface NetWorthSnapshot {
  id: number
  snapshot_date: string
  net_worth: number
  base_currency: string
  created_at: string
}

export interface Space {
  id: string
  label: string
  color: string
}

export interface Category {
  id: string
  space_id: string
  label: string
  sort_order: number
}

export interface Project {
  id: string
  category_id: string
  space_id: string
  label: string
  sort_order: number
}

export interface Pinned {
  id: number
  space_id: string
  category_id: string
  item_id: string | null
  sort_order: number
}

export interface CategoryNode {
  category: Category
  projects: Project[]
}

export type TodoStatus = 'open' | 'in_progress' | 'done' | 'cancelled'
export type TodoPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4'
export type TodoComplexity = 'C0' | 'C1' | 'C2' | 'C3' | 'C4'

export interface Todo {
  id: number
  title: string
  description: string | null
  status: TodoStatus
  priority: TodoPriority
  complexity: TodoComplexity
  space_id: string | null
  category_id: string | null
  project_id: string | null
  due_date: string | null
  completed_at: string | null
  created_at: string
}

export interface CommandPaletteNavigationResult {
  type: 'navigation'
  id: string
  label: string
  meta: string
  route: string
}

export interface CommandPaletteJournalTargetResult {
  type: 'journal_target'
  id: string
  label: string
  meta: string
  route: string
}

export interface CommandPaletteJournalEntryResult {
  type: 'journal_entry'
  id: string
  label: string
  meta: string
  entry: JournalEntry
}

export interface CommandPaletteEventResult {
  type: 'event'
  id: string
  label: string
  meta: string
  event: EventOccurrence | Event
}

export interface CommandPaletteTransactionResult {
  type: 'transaction'
  id: string
  label: string
  meta: string
  transaction: Transaction
  detail: {
    account_name: string
    account_currency: string
    category_label: string | null
  }
}

export interface CommandPaletteTodoResult {
  type: 'todo'
  id: string
  label: string
  meta: string
  todo: Todo
}

export type CommandPaletteResult =
  | CommandPaletteNavigationResult
  | CommandPaletteJournalTargetResult
  | CommandPaletteJournalEntryResult
  | CommandPaletteEventResult
  | CommandPaletteTransactionResult
  | CommandPaletteTodoResult
