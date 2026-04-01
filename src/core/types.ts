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
  created_at: string
}

export interface EventOccurrence extends Event {
  occurrence_date: string
  is_recurring_instance: boolean
  parent_id: number | null
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
