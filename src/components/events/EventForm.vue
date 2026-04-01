<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import type { Event, EventType, RecurrenceRule } from '../../core/types'
import { EVENT_TYPES, RECURRENCE_PRESETS } from '../../core/constants'
import { useSpaces } from '../../composables/useSpaces'

const props = defineProps<{
  open: boolean
  event?: Event | null
  prefillDate?: string | null
}>()

const emit = defineEmits<{
  save: [data: {
    title: string
    date: string
    time: string | null
    end_time: string | null
    type: EventType
    color: string
    description: string | null
    space_id: string | null
    category_id: string | null
    recurrence_rule: string | null
  }]
  delete: [id: number]
  close: []
}>()

const { spaces, categories } = useSpaces()

const title = ref('')
const date = ref('')
const time = ref('')
const endTime = ref('')
const type = ref<EventType>('agenda')
const description = ref('')
const spaceId = ref<string | null>(null)
const categoryId = ref<string | null>(null)
const recurrenceIdx = ref(0)
const confirmDelete = ref(false)

const isEdit = computed(() => !!props.event)

const canSave = computed(() => title.value.trim().length > 0 && date.value.length > 0)

const spaceCategories = computed(() =>
  spaceId.value ? categories.value.filter(c => c.space_id === spaceId.value) : []
)

const typeKeys = Object.keys(EVENT_TYPES) as EventType[]

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(() => props.open, (open) => {
  if (open) {
    document.addEventListener('keydown', onKeydown)
    confirmDelete.value = false
    if (props.event) {
      title.value = props.event.title
      date.value = props.event.date
      time.value = props.event.time || ''
      endTime.value = props.event.end_time || ''
      type.value = props.event.type
      description.value = props.event.description || ''
      spaceId.value = props.event.space_id
      categoryId.value = props.event.category_id
      if (props.event.recurrence_rule) {
        try {
          const rule: RecurrenceRule = JSON.parse(props.event.recurrence_rule)
          const idx = RECURRENCE_PRESETS.findIndex(p =>
            p.value && p.value.freq === rule.freq && p.value.interval === rule.interval
          )
          recurrenceIdx.value = idx >= 0 ? idx : 0
        } catch {
          recurrenceIdx.value = 0
        }
      } else {
        recurrenceIdx.value = 0
      }
    } else {
      title.value = ''
      date.value = props.prefillDate || ''
      time.value = ''
      endTime.value = ''
      type.value = 'agenda'
      description.value = ''
      spaceId.value = null
      categoryId.value = null
      recurrenceIdx.value = 0
    }
  } else {
    document.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

function pickSpace(id: string | null) {
  spaceId.value = id
  categoryId.value = null
}

function handleSave() {
  if (!canSave.value) return
  const preset = RECURRENCE_PRESETS[recurrenceIdx.value]
  const rule = preset?.value ? JSON.stringify(preset.value) : null

  emit('save', {
    title: title.value.trim(),
    date: date.value,
    time: time.value || null,
    end_time: endTime.value || null,
    type: type.value,
    color: EVENT_TYPES[type.value].color,
    description: description.value.trim() || null,
    space_id: spaceId.value,
    category_id: categoryId.value,
    recurrence_rule: rule,
  })
}

function handleDelete() {
  if (!props.event) return
  if (!confirmDelete.value) {
    confirmDelete.value = true
    return
  }
  emit('delete', props.event.id)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="ef-backdrop" @click="emit('close')"></div>
    <div v-if="open" class="ef-modal">
      <div class="ef-head">
        <div class="ef-title">{{ isEdit ? 'edit event' : 'new event' }}</div>
        <button type="button" class="b-close" @click="emit('close')">esc</button>
      </div>

      <div class="ef-field">
        <input
          v-model="title"
          type="text"
          placeholder="event title"
          class="ef-input"
          @keydown.ctrl.enter.prevent="handleSave"
        />
      </div>

      <div class="ef-row">
        <div class="ef-field">
          <label class="ef-label">date</label>
          <input v-model="date" type="date" class="ef-input ef-sm" />
        </div>
        <div class="ef-field">
          <label class="ef-label">time</label>
          <input v-model="time" type="time" class="ef-input ef-sm" />
        </div>
        <div class="ef-field">
          <label class="ef-label">end</label>
          <input v-model="endTime" type="time" class="ef-input ef-sm" />
        </div>
      </div>

      <div class="ef-field">
        <label class="ef-label">type</label>
        <div class="pill-list">
          <button
            v-for="t in typeKeys"
            :key="t"
            class="pill"
            :class="{ active: type === t }"
            :style="type === t ? { borderColor: EVENT_TYPES[t].color, color: EVENT_TYPES[t].color, background: EVENT_TYPES[t].dimColor } : {}"
            @click="type = t"
          >
            <span class="dot" :style="{ background: EVENT_TYPES[t].color }"></span>
            {{ EVENT_TYPES[t].label }}
          </button>
        </div>
      </div>

      <div class="ef-field">
        <label class="ef-label">recurrence</label>
        <div class="pill-list">
          <button
            v-for="(p, idx) in RECURRENCE_PRESETS"
            :key="idx"
            class="pill"
            :class="{ active: recurrenceIdx === idx }"
            @click="recurrenceIdx = idx"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <div class="ef-field">
        <label class="ef-label">description (optional)</label>
        <textarea
          v-model="description"
          class="ef-textarea"
          placeholder="notes..."
          rows="3"
        ></textarea>
      </div>

      <div class="ef-field">
        <label class="ef-label">space (optional)</label>
        <div class="pill-list">
          <button
            class="pill"
            :class="{ active: spaceId === null }"
            @click="pickSpace(null)"
          >
            none
          </button>
          <button
            v-for="s in spaces"
            :key="s.id"
            class="pill"
            :class="{ active: spaceId === s.id }"
            @click="pickSpace(s.id)"
          >
            <span class="dot" :style="{ background: s.color }"></span>
            {{ s.label }}
          </button>
        </div>
      </div>

      <div v-if="spaceId && spaceCategories.length" class="ef-field">
        <label class="ef-label">category</label>
        <div class="pill-list">
          <button
            class="pill"
            :class="{ active: categoryId === null }"
            @click="categoryId = null"
          >
            none
          </button>
          <button
            v-for="c in spaceCategories"
            :key="c.id"
            class="pill"
            :class="{ active: categoryId === c.id }"
            @click="categoryId = c.id"
          >
            {{ c.label }}
          </button>
        </div>
      </div>

      <div class="ef-footer">
        <div class="ef-left">
          <button v-if="isEdit" class="btn danger" @click="handleDelete">
            {{ confirmDelete ? 'confirm delete' : 'delete' }}
          </button>
        </div>
        <div class="ef-actions">
          <button class="btn ghost" @click="emit('close')">cancel</button>
          <button class="btn" :disabled="!canSave" @click="handleSave">save</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ef-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 120;
}

.ef-modal {
  position: fixed;
  top: 6%;
  left: 50%;
  transform: translateX(-50%);
  width: min(560px, 96vw);
  background: var(--bg);
  border: 1px solid var(--border);
  z-index: 130;
  padding: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
  max-height: 88vh;
  overflow-y: auto;
}

.ef-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.ef-title {
  font-family: var(--mono);
  font-size: 0.9rem;
}

.ef-field {
  margin-bottom: 10px;
}

.ef-label {
  display: block;
  font-size: 0.58rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.ef-input {
  width: 100%;
  font-family: var(--mono);
  font-size: 0.78rem;
  padding: 8px 10px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  outline: none;
}

.ef-input:focus {
  border-color: var(--accent);
}

.ef-input.ef-sm {
  width: auto;
  flex: 1;
}

.ef-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.ef-row .ef-field {
  flex: 1;
  margin-bottom: 0;
}

.ef-textarea {
  width: 100%;
  font-family: var(--mono);
  font-size: 0.72rem;
  padding: 8px 10px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  outline: none;
  resize: vertical;
  line-height: 1.6;
}

.ef-textarea:focus {
  border-color: var(--accent);
}

.pill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-mid);
  cursor: pointer;
  font-family: var(--mono);
  font-size: 0.68rem;
  transition: all var(--dur-base) var(--ease);
}

.pill:hover {
  color: var(--text);
  border-color: var(--accent);
}

.pill.active {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-dim);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  flex-shrink: 0;
}

.ef-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.ef-actions {
  display: flex;
  gap: 8px;
}

.btn {
  font-family: var(--mono);
  font-size: 0.68rem;
  padding: 5px 12px;
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--bg);
  cursor: pointer;
  transition: opacity var(--dur-base) var(--ease);
}

.btn:hover {
  opacity: 0.85;
}

.btn:disabled {
  opacity: 0.25;
  cursor: default;
}

.btn.ghost {
  background: transparent;
  color: var(--text);
}

.btn.danger {
  border-color: var(--red);
  background: transparent;
  color: var(--red);
}

.btn.danger:hover {
  background: var(--red);
  color: var(--bg);
}

@media (max-width: 720px) {
  .pill-list {
    gap: 4px;
  }
}
</style>
