<script setup lang="ts">
import { computed } from 'vue'
import type { EventOccurrence } from '../../core/types'
import { DAY_ABBR, toISO } from '../../core/constants'

const props = defineProps<{
  year: number
  month: number
  occurrences: EventOccurrence[]
}>()

const emit = defineEmits<{
  selectDate: [date: string]
  selectEvent: [event: EventOccurrence]
}>()

const todayISO = computed(() => toISO(new Date()))

interface DayCell {
  date: string
  day: number
  inMonth: boolean
  isToday: boolean
  events: EventOccurrence[]
}

const cells = computed<DayCell[]>(() => {
  const firstDay = new Date(props.year, props.month, 1).getDay()
  const daysInMonth = new Date(props.year, props.month + 1, 0).getDate()
  const daysInPrev = new Date(props.year, props.month, 0).getDate()

  const result: DayCell[] = []

  const byDate: Record<string, EventOccurrence[]> = {}
  for (const ev of props.occurrences) {
    const d = ev.occurrence_date
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(ev)
  }

  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrev - i
    const prevMonth = props.month - 1
    const yr = prevMonth < 0 ? props.year - 1 : props.year
    const mn = prevMonth < 0 ? 11 : prevMonth
    const date = toISO(new Date(yr, mn, day))
    result.push({ date, day, inMonth: false, isToday: date === todayISO.value, events: byDate[date] || [] })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = toISO(new Date(props.year, props.month, d))
    result.push({ date, day: d, inMonth: true, isToday: date === todayISO.value, events: byDate[date] || [] })
  }

  const totalCells = Math.ceil(result.length / 7) * 7
  let nextDay = 1
  while (result.length < totalCells) {
    const nextMonth = props.month + 1
    const yr = nextMonth > 11 ? props.year + 1 : props.year
    const mn = nextMonth > 11 ? 0 : nextMonth
    const date = toISO(new Date(yr, mn, nextDay))
    result.push({ date, day: nextDay, inMonth: false, isToday: date === todayISO.value, events: byDate[date] || [] })
    nextDay++
  }

  return result
})
</script>

<template>
  <div class="cm">
    <div class="cm-header">
      <div v-for="d in DAY_ABBR" :key="d" class="cm-hd">{{ d }}</div>
    </div>
    <div class="cm-grid">
      <div
        v-for="(cell, i) in cells"
        :key="i"
        class="cm-cell"
        :class="{ dim: !cell.inMonth, today: cell.isToday }"
        @click="emit('selectDate', cell.date)"
      >
        <span class="cm-day">{{ cell.day }}</span>
        <div class="cm-evts">
          <div
            v-for="(ev, j) in cell.events.slice(0, 3)"
            :key="ev.id + '-' + j"
            class="cm-pill"
            :style="{ background: ev.color }"
            :title="(ev.time || '') + ' ' + ev.title"
            @click.stop="emit('selectEvent', ev)"
          >
            <span class="cm-pill-t">{{ ev.title }}</span>
          </div>
          <div v-if="cell.events.length > 3" class="cm-more">
            +{{ cell.events.length - 3 }} more
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cm-header {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 1px;
  margin-bottom: 2px;
}

.cm-hd {
  font-size: 0.58rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: center;
  padding: 4px 0;
}

.cm-grid {
  display: grid;
  min-height: 80vh;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 1px;
  background: var(--border);
}

.cm-cell {
  background: var(--bg);
  min-height: 80px;
  min-width: 0;
  padding: 4px;
  cursor: pointer;
  overflow: hidden;
  transition: background var(--dur-base) var(--ease);
}

.cm-cell:hover {
  background: var(--bg-hover);
}

.cm-cell.dim {
  opacity: 0.35;
}

.cm-cell.today {
  background: var(--accent-dim);
}

.cm-cell.today:hover {
  background: var(--bg-hover);
}

.cm-day {
  font-size: 0.6rem;
  color: var(--text-mid);
  display: block;
  margin-bottom: 2px;
}

.cm-cell.today .cm-day {
  color: var(--accent);
  font-weight: 600;
}

.cm-evts {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.cm-pill {
  padding: 1px 3px;
  cursor: pointer;
  overflow: hidden;
}

.cm-pill:hover {
  opacity: 0.8;
}

.cm-pill-t {
  font-size: 0.52rem;
  color: var(--bg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  font-weight: 600;
}

.cm-more {
  font-size: 0.48rem;
  color: var(--text-dim);
  padding: 1px 3px;
}

@media (max-width: 768px) {
  .cm-cell {
    min-height: 50px;
    padding: 2px;
  }

  .cm-pill-t {
    font-size: 0.45rem;
  }
}
</style>
