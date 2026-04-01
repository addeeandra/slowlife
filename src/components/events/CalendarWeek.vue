<script setup lang="ts">
import { computed } from 'vue'
import type { EventOccurrence } from '../../core/types'
import { DAY_ABBR, toISO } from '../../core/constants'

const props = defineProps<{
  startDate: string
  occurrences: EventOccurrence[]
}>()

const emit = defineEmits<{
  selectDate: [date: string]
  selectEvent: [event: EventOccurrence]
}>()

const todayISO = computed(() => toISO(new Date()))

interface DayColumn {
  date: string
  dayAbbr: string
  dayNum: number
  isToday: boolean
  allDay: EventOccurrence[]
  timed: EventOccurrence[]
}

const columns = computed<DayColumn[]>(() => {
  const start = new Date(props.startDate + 'T00:00:00')
  const byDate: Record<string, EventOccurrence[]> = {}
  for (const ev of props.occurrences) {
    const d = ev.occurrence_date
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(ev)
  }

  const cols: DayColumn[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const iso = toISO(d)
    const dayEvents = byDate[iso] || []
    cols.push({
      date: iso,
      dayAbbr: DAY_ABBR[d.getDay()],
      dayNum: d.getDate(),
      isToday: iso === todayISO.value,
      allDay: dayEvents.filter(e => !e.time),
      timed: dayEvents.filter(e => !!e.time).sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    })
  }
  return cols
})
</script>

<template>
  <div class="cw">
    <div
      v-for="col in columns"
      :key="col.date"
      class="cw-col"
      :class="{ today: col.isToday }"
      @click="emit('selectDate', col.date)"
    >
      <div class="cw-head">
        <span class="cw-abbr">{{ col.dayAbbr }}</span>
        <span class="cw-num" :class="{ 'cw-today': col.isToday }">{{ col.dayNum }}</span>
      </div>
      <div class="cw-events">
        <div
          v-for="ev in col.allDay"
          :key="'a-' + ev.id"
          class="cw-ev allday"
          :style="{ borderLeftColor: ev.color }"
          @click.stop="emit('selectEvent', ev)"
        >
          <span class="cw-ev-n">{{ ev.title }}</span>
          <span class="cw-ev-tag" :class="ev.type">{{ ev.type }}</span>
        </div>
        <div
          v-for="ev in col.timed"
          :key="'t-' + ev.id"
          class="cw-ev"
          :style="{ borderLeftColor: ev.color }"
          @click.stop="emit('selectEvent', ev)"
        >
          <span class="cw-ev-time">{{ ev.time }}</span>
          <span class="cw-ev-n">{{ ev.title }}</span>
        </div>
        <div v-if="!col.allDay.length && !col.timed.length" class="cw-empty">--</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cw {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--border);
}

.cw-col {
  background: var(--bg);
  min-height: 160px;
  cursor: pointer;
  transition: background var(--dur-base) var(--ease);
}

.cw-col:hover {
  background: var(--bg-hover);
}

.cw-col.today {
  background: var(--accent-dim);
}

.cw-head {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 6px 6px 4px;
  border-bottom: 1px solid var(--border);
}

.cw-abbr {
  font-size: 0.58rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.cw-num {
  font-size: 0.72rem;
  color: var(--text-mid);
}

.cw-today {
  color: var(--accent);
  font-weight: 600;
}

.cw-events {
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cw-ev {
  padding: 3px 4px;
  border-left: 2px solid var(--accent);
  cursor: pointer;
  transition: background var(--dur-base) var(--ease);
}

.cw-ev:hover {
  background: var(--bg-hover);
}

.cw-ev.allday {
  background: var(--bg-card);
}

.cw-ev-time {
  font-size: 0.52rem;
  color: var(--text-dim);
  display: block;
}

.cw-ev-n {
  font-size: 0.62rem;
  color: var(--text);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cw-ev-tag {
  font-size: 0.48rem;
  color: var(--text-dim);
}

.cw-ev-tag.meeting { color: var(--work); }
.cw-ev-tag.holiday { color: var(--green); }
.cw-ev-tag.reminder { color: var(--red); }

.cw-empty {
  font-size: 0.6rem;
  color: var(--text-dim);
  padding: 4px;
  text-align: center;
}

@media (max-width: 768px) {
  .cw {
    grid-template-columns: 1fr;
  }

  .cw-col {
    min-height: auto;
  }

  .cw-head {
    background: var(--bg-card);
  }
}
</style>
