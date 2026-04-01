import { ref } from 'vue'
import { getDb } from '../core/db'
import type { Event, EventOccurrence, EventType, RecurrenceRule } from '../core/types'
import { MONTH_ABBR, DAY_ABBR, EVENT_TYPES, toISO, sortByDateTime } from '../core/constants'
import { useFinances } from './useFinances'

const events = ref<Event[]>([])

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toOccurrence(event: Event, occurrenceDate: string, isRecurring: boolean): EventOccurrence {
  return {
    ...event,
    occurrence_date: occurrenceDate,
    is_recurring_instance: isRecurring,
    parent_id: isRecurring ? event.id : null,
  }
}

function expandRecurrences(evts: Event[], rangeStart: string, rangeEnd: string): EventOccurrence[] {
  const results: EventOccurrence[] = []

  for (const ev of evts) {
    if (!ev.recurrence_rule) {
      if (ev.date >= rangeStart && ev.date <= rangeEnd) {
        results.push(toOccurrence(ev, ev.date, false))
      }
      continue
    }

    let rule: RecurrenceRule
    try { rule = JSON.parse(ev.recurrence_rule) } catch { continue }

    const start = new Date(ev.date + 'T00:00:00')
    const end = rule.until ? new Date(rule.until + 'T00:00:00') : null
    let count = 0
    const maxCount = rule.count || 365

    if (rule.freq === 'weekly' && rule.byDay?.length) {
      const dayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
      const targetDays = rule.byDay.map(d => dayMap[d]).filter(d => d !== undefined)

      // find the first week start (sunday of the event's week)
      const weekStart = new Date(start)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())

      let weekCount = 0
      const current = new Date(weekStart)

      while (true) {
        for (const targetDay of targetDays) {
          const d = new Date(current)
          d.setDate(d.getDate() + targetDay)
          const iso = toISO(d)

          if (iso < ev.date) continue
          if (end && d > end) break
          if (count >= maxCount) break

          if (iso >= rangeStart && iso <= rangeEnd) {
            results.push(toOccurrence(ev, iso, true))
          }
          count++
        }

        if (end && current > end) break
        if (count >= maxCount) break
        if (toISO(current) > rangeEnd && toISO(current) > (rule.until || rangeEnd)) break

        current.setDate(current.getDate() + 7 * rule.interval)
        weekCount++
        if (weekCount > 520) break // safety: ~10 years
      }
    } else {
      const current = new Date(start)

      while (true) {
        const iso = toISO(current)

        if (end && current > end) break
        if (count >= maxCount) break
        if (iso > rangeEnd && iso > (rule.until || rangeEnd)) break

        if (iso >= rangeStart && iso <= rangeEnd) {
          results.push(toOccurrence(ev, iso, count > 0))
        }
        count++

        switch (rule.freq) {
          case 'daily':
            current.setDate(current.getDate() + rule.interval)
            break
          case 'weekly':
            current.setDate(current.getDate() + 7 * rule.interval)
            break
          case 'monthly':
            current.setMonth(current.getMonth() + rule.interval)
            break
          case 'yearly':
            current.setFullYear(current.getFullYear() + rule.interval)
            break
        }

        if (count > 520) break // safety
      }
    }
  }

  return results
}

export function useEvents() {
  async function load() {
    const db = await getDb()
    events.value = await db.select<Event[]>(
      'SELECT * FROM events ORDER BY date, time'
    )
  }

  async function createEvent(data: {
    title: string
    date: string
    time?: string | null
    end_time?: string | null
    type?: EventType
    color?: string
    description?: string | null
    space_id?: string | null
    category_id?: string | null
    recurrence_rule?: string | null
  }) {
    const db = await getDb()
    const type = data.type || 'agenda'
    const color = data.color || EVENT_TYPES[type].color
    await db.execute(
      `INSERT INTO events (title, date, time, end_time, type, color, description, space_id, category_id, recurrence_rule)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        data.title,
        data.date,
        data.time || null,
        data.end_time || null,
        type,
        color,
        data.description || null,
        data.space_id || null,
        data.category_id || null,
        data.recurrence_rule || null,
      ]
    )
    await load()
  }

  async function updateEvent(id: number, patch: Partial<Event>) {
    const db = await getDb()
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    const allowed = ['title', 'date', 'time', 'end_time', 'type', 'color', 'description', 'space_id', 'category_id', 'recurrence_rule'] as const
    for (const key of allowed) {
      if (key in patch) {
        fields.push(`${key} = $${idx}`)
        values.push(patch[key] ?? null)
        idx++
      }
    }

    if (!fields.length) return
    values.push(id)
    await db.execute(`UPDATE events SET ${fields.join(', ')} WHERE id = $${idx}`, values)
    await load()
  }

  async function deleteEvent(id: number) {
    const db = await getDb()
    await db.execute('DELETE FROM events WHERE id = $1', [id])
    await load()
  }

  function eventsForMonth(year: number, month: number): EventOccurrence[] {
    const rangeStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const rangeEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const expanded = expandRecurrences(events.value, rangeStart, rangeEnd)
    const subEvents = subscriptionEvents(year, month)
    return [...expanded, ...subEvents].sort(sortByDateTime)
  }

  function eventsForWeek(startDate: string): EventOccurrence[] {
    const start = new Date(startDate + 'T00:00:00')
    const end = addDays(start, 6)
    const rangeStart = toISO(start)
    const rangeEnd = toISO(end)

    const expanded = expandRecurrences(events.value, rangeStart, rangeEnd)
    const subEvents1 = subscriptionEvents(start.getFullYear(), start.getMonth())
    const subEvents2 = end.getMonth() !== start.getMonth()
      ? subscriptionEvents(end.getFullYear(), end.getMonth())
      : []
    const allSubs = [...subEvents1, ...subEvents2].filter(
      e => e.occurrence_date >= rangeStart && e.occurrence_date <= rangeEnd
    )

    return [...expanded, ...allSubs].sort(sortByDateTime)
  }

  function eventsForDate(date: string): EventOccurrence[] {
    const expanded = expandRecurrences(events.value, date, date)
    const d = new Date(date + 'T00:00:00')
    const subEvents = subscriptionEvents(d.getFullYear(), d.getMonth()).filter(
      e => e.occurrence_date === date
    )
    return [...expanded, ...subEvents].sort(sortByDateTime)
  }

  function subscriptionEvents(year: number, month: number): EventOccurrence[] {
    const { subscriptions } = useFinances()
    const rangeStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const rangeEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    return subscriptions.value
      .filter(s => s.next_date >= rangeStart && s.next_date <= rangeEnd)
      .map(s => ({
        id: -(s.id + 1000),
        title: `${s.name} renewal`,
        date: s.next_date,
        time: null,
        end_time: null,
        type: 'reminder' as const,
        color: s.color,
        description: null,
        space_id: null,
        category_id: null,
        recurrence_rule: null,
        google_id: null,
        source: 'local' as const,
        created_at: '',
        occurrence_date: s.next_date,
        is_recurring_instance: false,
        parent_id: null,
      }))
  }

  function upcomingEvents(count: number = 5): EventOccurrence[] {
    const todayISO = toISO(new Date())
    const futureDate = toISO(addDays(new Date(), 60))
    const expanded = expandRecurrences(events.value, todayISO, futureDate)

    const now = new Date()
    const subEvents1 = subscriptionEvents(now.getFullYear(), now.getMonth())
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const subEvents2 = subscriptionEvents(nextMonth.getFullYear(), nextMonth.getMonth())
    const allSubs = [...subEvents1, ...subEvents2].filter(e => e.occurrence_date >= todayISO)

    return [...expanded, ...allSubs]
      .sort(sortByDateTime)
      .slice(0, count)
  }

  function groupedByDate(): { date: string; label: string; isToday: boolean; events: Event[] }[] {
    const todayISO = toISO(new Date())
    const sorted = [...events.value].sort(sortByDateTime)
    const groups: { date: string; label: string; isToday: boolean; events: Event[] }[] = []
    let currentDate = ''

    sorted.forEach(ev => {
      if (ev.date !== currentDate) {
        currentDate = ev.date
        const isToday = ev.date === todayISO
        const d = new Date(ev.date + 'T00:00:00')
        const label = isToday
          ? 'today'
          : `${DAY_ABBR[d.getDay()]}, ${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`
        groups.push({ date: ev.date, label, isToday, events: [] })
      }
      groups[groups.length - 1].events.push(ev)
    })

    return groups
  }

  return {
    events,
    load,
    createEvent,
    updateEvent,
    deleteEvent,
    eventsForMonth,
    eventsForWeek,
    eventsForDate,
    upcomingEvents,
    groupedByDate,
  }
}
