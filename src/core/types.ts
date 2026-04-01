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
  balance: number
  currency: string
  created_at: string
}

export interface Transaction {
  id: number
  account_id: number
  description: string
  amount: number
  type: string
  date: string
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
