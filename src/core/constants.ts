import type { MoodKey, EventType, RecurrenceRule } from './types'

export const TAGS: Record<string, string[]> = {
  casual: ['gratitude', 'reflection', 'memory', 'idea', 'dream', 'vent', 'milestone'],
  work: ['standup', 'blocker', 'win', 'idea', 'decision', 'learning', 'review'],
}

export const PROMPTS: Record<string, string[]> = {
  casual: [
    'what made you smile today?',
    'what are you grateful for?',
    'describe a moment from today.',
    "what's on your mind?",
    'if today had a title?',
    'what are you looking forward to?',
  ],
  work: [
    'what did you accomplish?',
    "what's blocking you?",
    'what decision did you make?',
    'what would you do differently?',
    'what surprised you?',
    'most important thing tomorrow?',
  ],
}

export const MOODS: Record<MoodKey, string> = {
  great: '\u{1F60A}',
  good: '\u{1F642}',
  okay: '\u{1F610}',
  bad: '\u{1F615}',
  awful: '\u{1F61E}',
}

export const EVENT_TYPES: Record<EventType, { label: string; color: string; dimColor: string }> = {
  meeting:  { label: 'meeting',  color: '#6a9ec4', dimColor: '#1f2e3d' },
  agenda:   { label: 'agenda',   color: '#c4956a', dimColor: '#3d2e1f' },
  holiday:  { label: 'holiday',  color: '#6aaa7a', dimColor: '#1f3326' },
  reminder: { label: 'reminder', color: '#c46a6a', dimColor: '#3d1f1f' },
}

export const RECURRENCE_PRESETS: { label: string; value: RecurrenceRule | null }[] = [
  { label: 'none', value: null },
  { label: 'daily', value: { freq: 'daily', interval: 1 } },
  { label: 'weekly', value: { freq: 'weekly', interval: 1 } },
  { label: 'biweekly', value: { freq: 'weekly', interval: 2 } },
  { label: 'monthly', value: { freq: 'monthly', interval: 1 } },
  { label: 'yearly', value: { freq: 'yearly', interval: 1 } },
]

export const MONTH_ABBR = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
export const DAY_ABBR = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function sortByDateTime<T extends { occurrence_date?: string; date?: string; time: string | null }>(a: T, b: T): number {
  const ad = a.occurrence_date || a.date || ''
  const bd = b.occurrence_date || b.date || ''
  return ad.localeCompare(bd) || (a.time || '').localeCompare(b.time || '')
}

export function renewalLabel(nextDate: string): string {
  const nd = new Date(nextDate + 'T00:00:00')
  const diff = Math.ceil((nd.getTime() - new Date().getTime()) / 864e5)
  if (diff <= 0) return 'today'
  if (diff === 1) return 'tomorrow'
  return `in ${diff}d`
}

export function formatCurrency(n: number): string {
  const a = Math.abs(n)
  if (a >= 1e6) return (n < 0 ? '-' : '') + 'Rp' + (a / 1e6).toFixed(1) + 'M'
  if (a >= 1e3) return (n < 0 ? '-' : '') + 'Rp' + (a / 1e3).toFixed(0) + 'K'
  return 'Rp' + n.toLocaleString()
}
