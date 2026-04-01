import { ref, computed } from 'vue'
import { getDb } from '../core/db'
import type { JournalEntry, MoodKey } from '../core/types'
import { MOODS, DAY_ABBR, MONTH_ABBR } from '../core/constants'

const entries = ref<JournalEntry[]>([])

export function useJournal() {
  async function load() {
    const db = await getDb()
    entries.value = await db.select<JournalEntry[]>(
      'SELECT * FROM journal_entries ORDER BY created_at DESC'
    )
  }

  async function saveEntry(
    space: string,
    category: string,
    item: string | null,
    text: string,
    mood: MoodKey | null,
    tags: string[]
  ) {
    const db = await getDb()
    await db.execute(
      'INSERT INTO journal_entries (space, category, item, text, mood, tags) VALUES ($1, $2, $3, $4, $5, $6)',
      [space, category, item, text, mood, JSON.stringify(tags)]
    )
    await load()
  }

  function filteredEntries(space: string, category: string, item: string | null): JournalEntry[] {
    return entries.value.filter(
      e => e.space === space && e.category === category && (!item || e.item === item)
    )
  }

  function countEntries(space: string, category: string, item?: string | null): number {
    return entries.value.filter(
      e => e.space === space && e.category === category && (!item || e.item === item)
    ).length
  }

  const streak = computed(() => {
    let s = 0
    const day = 864e5
    const c = new Date()
    c.setHours(0, 0, 0, 0)
    for (let i = 0; i < 365; i++) {
      const dateStr = c.toDateString()
      if (entries.value.some(e => new Date(e.created_at).toDateString() === dateStr)) {
        s++
        c.setTime(c.getTime() - day)
      } else {
        break
      }
    }
    return s
  })

  const daysActiveThisWeek = computed(() => {
    const now = new Date()
    const wa = new Date(now.getTime() - 7 * 864e5)
    const days = new Set(
      entries.value
        .filter(e => new Date(e.created_at) >= wa)
        .map(e => new Date(e.created_at).toDateString())
    )
    return days.size
  })

  const dominantMoodThisWeek = computed<MoodKey | null>(() => {
    const now = new Date()
    const wa = new Date(now.getTime() - 7 * 864e5)
    const weekEntries = entries.value.filter(e => new Date(e.created_at) >= wa && e.mood)
    const counts: Record<string, number> = {}
    weekEntries.forEach(e => {
      if (e.mood) counts[e.mood] = (counts[e.mood] || 0) + 1
    })
    let top: MoodKey | null = null
    let topCount = 0
    for (const [mood, count] of Object.entries(counts)) {
      if (count > topCount) {
        top = mood as MoodKey
        topCount = count
      }
    }
    return top
  })

  function moodByDay(): { day: string; emoji: string | null }[] {
    const now = new Date()
    const result: { day: string; emoji: string | null }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 864e5)
      const dayEntries = entries.value.filter(
        e => new Date(e.created_at).toDateString() === d.toDateString() && e.mood
      )
      result.push({
        day: DAY_ABBR[d.getDay()][0],
        emoji: dayEntries.length ? MOODS[dayEntries[0].mood as MoodKey] : null,
      })
    }
    return result
  }

  function recentEntries(count: number = 4): JournalEntry[] {
    return entries.value.slice(0, count)
  }

  function heatmapRange() {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const weeks = 20
    const totalDays = weeks * 7
    const start = new Date(now.getTime() - (totalDays - 1 + now.getDay()) * 864e5)
    return { now, totalDays, start }
  }

  function heatmapData(): { level: number; isToday: boolean; isFuture: boolean }[] {
    const { now, totalDays, start } = heatmapRange()

    const dayCounts: Record<string, number> = {}
    entries.value.forEach(e => {
      const d = new Date(e.created_at)
      d.setHours(0, 0, 0, 0)
      const k = d.toDateString()
      dayCounts[k] = (dayCounts[k] || 0) + 1
    })

    const cells: { level: number; isToday: boolean; isFuture: boolean }[] = []
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start.getTime() + i * 864e5)
      const c = dayCounts[d.toDateString()] || 0
      const isToday = d.toDateString() === now.toDateString()
      const isFuture = d > now
      let level = 0
      if (!isFuture && c > 0) {
        level = c === 1 ? 1 : c === 2 ? 2 : c === 3 ? 3 : 4
      }
      cells.push({ level, isToday, isFuture })
    }
    return cells
  }

  function heatmapMonths(): string[] {
    const { totalDays, start } = heatmapRange()

    const months: string[] = []
    let lastMonth = -1
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start.getTime() + i * 864e5)
      if (d.getDay() === 0 && d.getMonth() !== lastMonth) {
        months.push(MONTH_ABBR[d.getMonth()])
        lastMonth = d.getMonth()
      }
    }
    return months
  }

  function hasEntriesToday(): boolean {
    const today = new Date().toDateString()
    return entries.value.some(e => new Date(e.created_at).toDateString() === today)
  }

  return {
    entries,
    load,
    saveEntry,
    filteredEntries,
    countEntries,
    streak,
    daysActiveThisWeek,
    dominantMoodThisWeek,
    moodByDay,
    recentEntries,
    heatmapData,
    heatmapMonths,
    hasEntriesToday,
  }
}
