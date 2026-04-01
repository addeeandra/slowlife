import type { MoodKey } from './types'

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

export const MONTH_ABBR = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
export const DAY_ABBR = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function formatCurrency(n: number): string {
  const a = Math.abs(n)
  if (a >= 1e6) return (n < 0 ? '-' : '') + 'Rp' + (a / 1e6).toFixed(1) + 'M'
  if (a >= 1e3) return (n < 0 ? '-' : '') + 'Rp' + (a / 1e3).toFixed(0) + 'K'
  return 'Rp' + n.toLocaleString()
}
