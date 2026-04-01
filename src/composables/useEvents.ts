import { ref } from 'vue'
import { getDb } from '../core/db'
import type { Event } from '../core/types'
import { MONTH_ABBR, DAY_ABBR } from '../core/constants'

const events = ref<Event[]>([])

export function useEvents() {
  async function load() {
    const db = await getDb()
    events.value = await db.select<Event[]>(
      'SELECT * FROM events ORDER BY date, time'
    )
  }

  function upcomingEvents(count: number = 5): Event[] {
    const todayISO = new Date().toISOString().slice(0, 10)
    return events.value
      .filter(e => e.date >= todayISO)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
      .slice(0, count)
  }

  function groupedByDate(): { date: string; label: string; isToday: boolean; events: Event[] }[] {
    const todayISO = new Date().toISOString().slice(0, 10)
    const sorted = [...events.value].sort(
      (a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')
    )
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

  return { events, load, upcomingEvents, groupedByDate }
}
