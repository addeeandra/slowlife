<script setup lang="ts">
import { computed } from 'vue'
import type { EventOccurrence } from '../../core/types'
import { DAY_ABBR, MONTH_ABBR } from '../../core/constants'

const props = defineProps<{
  date: string
  occurrences: EventOccurrence[]
}>()

const emit = defineEmits<{
  selectEvent: [event: EventOccurrence]
  create: []
  close: []
}>()

const todayISO = computed(() => {
  const n = new Date()
  const y = n.getFullYear()
  const m = String(n.getMonth() + 1).padStart(2, '0')
  const d = String(n.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
})

const label = computed(() => {
  if (props.date === todayISO.value) return 'today'
  const d = new Date(props.date + 'T00:00:00')
  return `${DAY_ABBR[d.getDay()]}, ${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`
})

const events = computed(() =>
  props.occurrences
    .filter(e => e.occurrence_date === props.date)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
)
</script>

<template>
  <Teleport to="body">
    <div class="dd-backdrop" @click="emit('close')"></div>
    <div class="dd-dialog">
      <div class="dd-head">
        <span class="dd-label">{{ label }}</span>
        <span class="dd-count">{{ events.length }} event{{ events.length !== 1 ? 's' : '' }}</span>
        <button class="dd-close" @click="emit('close')">esc</button>
      </div>
      <div class="dd-list">
        <div
          v-for="ev in events"
          :key="ev.id + '-' + ev.occurrence_date"
          class="dd-ev"
          @click="emit('selectEvent', ev)"
        >
          <span class="dd-time">{{ ev.time || 'all day' }}</span>
          <span class="dd-dot" :style="{ background: ev.color }"></span>
          <span class="dd-name">{{ ev.title }}</span>
          <span class="dd-tag" :class="ev.type">{{ ev.type }}</span>
          <span v-if="ev.is_recurring_instance" class="dd-rec" title="recurring">r</span>
        </div>
        <div v-if="!events.length" class="dd-empty">no events</div>
      </div>
      <button class="dd-add" @click="emit('create')">+ add event</button>
    </div>
  </Teleport>
</template>

<style scoped>
.dd-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 110;
}

.dd-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(420px, 92vw);
  background: var(--bg);
  border: 1px solid var(--border);
  z-index: 115;
  padding: 14px 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
  max-height: 70vh;
  overflow-y: auto;
}

.dd-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.dd-label {
  font-size: 0.82rem;
  color: var(--text);
  font-weight: 600;
}

.dd-count {
  font-size: 0.58rem;
  color: var(--text-dim);
  flex: 1;
}

.dd-close {
  font-family: var(--mono);
  font-size: 0.6rem;
  padding: 3px 8px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-dim);
  cursor: pointer;
}

.dd-close:hover {
  color: var(--text);
  border-color: var(--accent);
}

.dd-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dd-ev {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 0;
  cursor: pointer;
  transition: background var(--dur-base) var(--ease);
}

.dd-ev:hover {
  background: var(--bg-hover);
}

.dd-time {
  font-size: 0.6rem;
  color: var(--text-dim);
  width: 48px;
  flex-shrink: 0;
}

.dd-dot {
  width: 4px;
  height: 4px;
  flex-shrink: 0;
}

.dd-name {
  font-size: 0.72rem;
  color: var(--text);
  flex: 1;
}

.dd-tag {
  font-size: 0.5rem;
  padding: 0 4px;
  border: 1px solid var(--border);
  color: var(--text-dim);
}

.dd-tag.meeting { border-color: var(--work-dim); color: var(--work); }
.dd-tag.holiday { border-color: var(--green-dim); color: var(--green); }
.dd-tag.reminder { border-color: var(--red-dim, #3d1f1f); color: var(--red); }

.dd-rec {
  font-size: 0.48rem;
  color: var(--text-dim);
  border: 1px solid var(--border);
  padding: 0 3px;
  font-style: italic;
}

.dd-empty {
  font-size: 0.68rem;
  color: var(--text-dim);
  padding: 10px 0;
}

.dd-add {
  font-family: var(--mono);
  font-size: 0.62rem;
  color: var(--accent);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px 0 0;
  transition: opacity var(--dur-base) var(--ease);
}

.dd-add:hover {
  opacity: 0.75;
}
</style>
