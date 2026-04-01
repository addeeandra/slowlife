<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import CalendarNav from '../components/events/CalendarNav.vue'
import CalendarMonth from '../components/events/CalendarMonth.vue'
import CalendarWeek from '../components/events/CalendarWeek.vue'
import DayDetail from '../components/events/DayDetail.vue'
import EventForm from '../components/events/EventForm.vue'
import EventRow from '../components/events/EventRow.vue'
import { useEvents } from '../composables/useEvents'
import type { Event, EventOccurrence } from '../core/types'
import { MONTH_ABBR, toISO } from '../core/constants'

const {
  eventsForMonth,
  eventsForWeek,
  groupedByDate,
  createEvent,
  updateEvent,
  deleteEvent,
} = useEvents()

const viewMode = ref<'month' | 'week' | 'list'>('month')
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())
const weekStart = ref(getWeekStart(new Date()))
const selectedDate = ref<string | null>(null)
const formOpen = ref(false)
const editingEvent = ref<Event | null>(null)
const prefillDate = ref<string | null>(null)

function getWeekStart(d: Date): string {
  const date = new Date(d)
  date.setDate(date.getDate() - date.getDay())
  return toISO(date)
}

const monthOccurrences = computed(() => eventsForMonth(currentYear.value, currentMonth.value))
const weekOccurrences = computed(() => eventsForWeek(weekStart.value))
const groups = computed(() => groupedByDate())

const weekLabel = computed(() => {
  const start = new Date(weekStart.value + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const sMonth = MONTH_ABBR[start.getMonth()]
  const eMonth = MONTH_ABBR[end.getMonth()]
  if (sMonth === eMonth) {
    return `${sMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`
  }
  return `${sMonth} ${start.getDate()} - ${eMonth} ${end.getDate()}, ${end.getFullYear()}`
})

function navigate(direction: -1 | 0 | 1) {
  if (viewMode.value === 'month') {
    if (direction === 0) {
      currentYear.value = new Date().getFullYear()
      currentMonth.value = new Date().getMonth()
    } else {
      currentMonth.value += direction
      if (currentMonth.value > 11) { currentMonth.value = 0; currentYear.value++ }
      if (currentMonth.value < 0) { currentMonth.value = 11; currentYear.value-- }
    }
  } else if (viewMode.value === 'week') {
    if (direction === 0) {
      weekStart.value = getWeekStart(new Date())
    } else {
      const d = new Date(weekStart.value + 'T00:00:00')
      d.setDate(d.getDate() + direction * 7)
      weekStart.value = toISO(d)
    }
  }
  selectedDate.value = null
}

function setView(mode: 'month' | 'week' | 'list') {
  viewMode.value = mode
  selectedDate.value = null
}

function onSelectDate(date: string) {
  selectedDate.value = selectedDate.value === date ? null : date
}

function openEdit(ev: Event | EventOccurrence) {
  if (ev.id < 0) return
  editingEvent.value = ev
  formOpen.value = true
}

function openCreate() {
  editingEvent.value = null
  prefillDate.value = selectedDate.value
  formOpen.value = true
}

async function onSave(data: Parameters<typeof createEvent>[0]) {
  if (editingEvent.value) {
    await updateEvent(editingEvent.value.id, data)
  } else {
    await createEvent(data)
  }
  formOpen.value = false
  editingEvent.value = null
}

async function onDelete(id: number) {
  await deleteEvent(id)
  formOpen.value = false
  editingEvent.value = null
}
</script>

<template>
  <div>
    <PageHeader title="events" meta="calendar" />

    <CalendarNav
      :year="currentYear"
      :month="currentMonth"
      :view-mode="viewMode"
      :week-label="weekLabel"
      @navigate="navigate"
      @set-view="setView"
      @create="openCreate"
    />

    <div v-if="viewMode === 'month'" class="cal-area">
      <CalendarMonth
        :year="currentYear"
        :month="currentMonth"
        :occurrences="monthOccurrences"
        @select-date="onSelectDate"
        @select-event="openEdit"
      />
      <DayDetail
        v-if="selectedDate"
        :date="selectedDate"
        :occurrences="monthOccurrences"
        @select-event="openEdit"
        @create="openCreate"
        @close="selectedDate = null"
      />
    </div>

    <div v-else-if="viewMode === 'week'" class="cal-area">
      <CalendarWeek
        :start-date="weekStart"
        :occurrences="weekOccurrences"
        @select-date="onSelectDate"
        @select-event="openEdit"
      />
      <DayDetail
        v-if="selectedDate"
        :date="selectedDate"
        :occurrences="weekOccurrences"
        @select-event="openEdit"
        @create="openCreate"
        @close="selectedDate = null"
      />
    </div>

    <div v-else class="list-area">
      <template v-for="group in groups" :key="group.date">
        <div class="ev-page-group" :class="{ 'today-g': group.isToday }">
          {{ group.label }}
        </div>
        <EventRow
          v-for="ev in group.events"
          :key="ev.id"
          :event="ev"
          @select="openEdit"
        />
      </template>
      <div v-if="!groups.length" class="empty">no events</div>
    </div>

    <EventForm
      :open="formOpen"
      :event="editingEvent"
      :prefill-date="prefillDate"
      @save="onSave"
      @delete="onDelete"
      @close="formOpen = false"
    />
  </div>
</template>

<style scoped>
.cal-area {
  width: 100%;
}

.list-area {
  max-width: 580px;
}

.ev-page-group {
  font-size: 0.6rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 14px 0 4px;
  font-weight: 600;
}

.ev-page-group.today-g {
  color: var(--accent);
}

.empty {
  text-align: center;
  padding: 30px;
  color: var(--text-dim);
  font-size: 0.75rem;
}
</style>
