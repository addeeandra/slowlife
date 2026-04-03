<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'
import { openUrl } from '@tauri-apps/plugin-opener'
import type { EventOccurrence, GoogleCalendar } from '../../core/types'
import { DAY_ABBR, MONTH_ABBR } from '../../core/constants'

const props = defineProps<{
  open: boolean
  event: EventOccurrence | null
  calendars: GoogleCalendar[]
}>()

const emit = defineEmits<{ close: [] }>()

const calendar = computed(() =>
  props.calendars.find(c => c.calendar_id === props.event?.external_calendar_id) || null
)

const label = computed(() => {
  if (!props.event) return ''
  const d = new Date(props.event.occurrence_date + 'T00:00:00')
  const date = `${DAY_ABBR[d.getDay()]}, ${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`
  const time = props.event.time ? ` ${props.event.time}${props.event.end_time ? `-${props.event.end_time}` : ''}` : ' all day'
  return `${date}${time}`
})

const descriptionHtml = computed(() => {
  if (!props.event?.description) return ''
  return DOMPurify.sanitize(props.event.description, {
    USE_PROFILES: { html: true },
  })
})

async function openOriginal() {
  if (!props.event?.external_url) return
  await openUrl(props.event.external_url)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="gd-backdrop" @click="emit('close')"></div>
    <div v-if="open && event" class="gd-modal">
      <div class="gd-head">
        <div>
          <div class="gd-title">{{ event.title }}</div>
          <div class="gd-meta">{{ label }}</div>
        </div>
        <button type="button" class="b-close" @click="emit('close')">esc</button>
      </div>

      <div class="gd-badges">
        <span class="gd-badge source">google</span>
        <span class="gd-badge">{{ event.type }}</span>
        <span v-if="calendar" class="gd-badge">{{ calendar.summary }}</span>
      </div>

      <div v-if="event.description" class="gd-section">
        <div class="gd-label">description</div>
        <div class="gd-body gd-html" v-html="descriptionHtml"></div>
      </div>

      <div class="gd-section">
        <div class="gd-label">source</div>
        <div class="gd-body dim">read only. edit this event in google calendar.</div>
      </div>

      <div class="gd-actions">
        <button class="btn ghost" @click="emit('close')">close</button>
        <button class="btn" :disabled="!event.external_url" @click="openOriginal">open in google calendar</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.gd-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 120;
}

.gd-modal {
  position: fixed;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: min(520px, 94vw);
  background: var(--bg);
  border: 1px solid var(--border);
  z-index: 130;
  padding: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
}

.gd-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.gd-title {
  font-size: 0.9rem;
  color: var(--text);
}

.gd-meta {
  font-size: 0.64rem;
  color: var(--text-dim);
  margin-top: 4px;
}

.gd-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.gd-badge {
  font-size: 0.55rem;
  padding: 2px 6px;
  border: 1px solid var(--border);
  color: var(--text-dim);
}

.gd-badge.source {
  border-color: var(--accent);
  color: var(--accent);
}

.gd-section {
  margin-bottom: 12px;
}

.gd-label {
  font-size: 0.58rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.gd-body {
  font-size: 0.72rem;
  color: var(--text);
  white-space: pre-wrap;
  line-height: 1.6;
}

.gd-body.dim {
  color: var(--text-dim);
}

.gd-html :deep(p),
.gd-html :deep(ul),
.gd-html :deep(ol) {
  margin: 0 0 8px;
}

.gd-html :deep(ul),
.gd-html :deep(ol) {
  padding-left: 18px;
}

.gd-html :deep(li + li) {
  margin-top: 4px;
}

.gd-html :deep(a) {
  color: var(--accent);
  text-decoration: underline;
}

.gd-html :deep(br) {
  line-height: 1.8;
}

.gd-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

</style>
