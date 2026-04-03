<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { JournalEntry, MoodKey } from '../../core/types'
import { MONTH_ABBR, MOODS } from '../../core/constants'
import { useJournal } from '../../composables/useJournal'
import MoodPicker from './MoodPicker.vue'
import TagRow from './TagRow.vue'

const props = defineProps<{
  open: boolean
  entry: JournalEntry | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { updateEntry, deleteEntry } = useJournal()

const isEditing = ref(false)
const confirmDelete = ref(false)
const text = ref('')
const mood = ref<MoodKey | null>(null)
const tags = ref<Set<string>>(new Set())

const title = computed(() => {
  if (!props.entry) return ''
  return props.entry.item || props.entry.category
})

const meta = computed(() => {
  if (!props.entry) return ''
  const d = new Date(props.entry.created_at)
  const scope = [props.entry.space, props.entry.category, props.entry.item].filter(Boolean).join(' / ')
  return `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}  ${scope}`
})

watch(() => props.open, (open) => {
  if (!open || !props.entry) return
  isEditing.value = false
  confirmDelete.value = false
  text.value = props.entry.text
  mood.value = props.entry.mood as MoodKey | null
  tags.value = new Set(parseTags(props.entry.tags))
})

function parseTags(value: string) {
  try {
    return JSON.parse(value) as string[]
  } catch {
    return []
  }
}

async function save() {
  if (!props.entry || !text.value.trim()) return
  await updateEntry(props.entry.id, {
    text: text.value.trim(),
    mood: mood.value,
    tags: [...tags.value],
  })
  isEditing.value = false
}

async function remove() {
  if (!props.entry) return
  if (!confirmDelete.value) {
    confirmDelete.value = true
    return
  }
  await deleteEntry(props.entry.id)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="jp-backdrop" @click="emit('close')"></div>
    <div v-if="open && entry" class="jp-modal">
      <div class="jp-head">
        <div>
          <div class="jp-title">{{ title }}</div>
          <div class="jp-meta">{{ meta }}</div>
        </div>
        <button type="button" class="b-close" @click="emit('close')">esc</button>
      </div>

      <div class="jp-badges">
        <span class="jp-badge">journal</span>
        <span v-if="entry.mood || mood" class="jp-badge">{{ MOODS[(isEditing ? mood : entry.mood) as MoodKey] }}</span>
      </div>

      <template v-if="isEditing">
        <textarea v-model="text" class="jp-textarea" rows="8"></textarea>
        <MoodPicker v-model="mood" />
        <TagRow :space="entry.space" v-model="tags" />
      </template>
      <template v-else>
        <div class="jp-text">{{ entry.text }}</div>
        <div v-if="parseTags(entry.tags).length" class="jp-tags">
          <span v-for="tag in parseTags(entry.tags)" :key="tag" class="jp-tag">{{ tag }}</span>
        </div>
      </template>

      <div class="jp-actions">
        <button v-if="isEditing" class="btn ghost" @click="isEditing = false">cancel</button>
        <button v-else class="btn ghost" @click="isEditing = true">edit</button>
        <button v-if="isEditing" class="btn" :disabled="!text.trim()" @click="save">save</button>
        <button class="btn danger" @click="remove">{{ confirmDelete ? 'confirm delete' : 'delete' }}</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.jp-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 120;
}

.jp-modal {
  position: fixed;
  top: 8%;
  left: 50%;
  transform: translateX(-50%);
  width: min(620px, 96vw);
  background: var(--bg);
  border: 1px solid var(--border);
  z-index: 130;
  padding: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
  max-height: 86vh;
  overflow-y: auto;
}

.jp-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.jp-title {
  font-family: var(--mono);
  font-size: 0.9rem;
  color: var(--text);
}

.jp-meta {
  font-size: 0.62rem;
  color: var(--text-dim);
  margin-top: 4px;
}

.jp-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.jp-badge,
.jp-tag {
  font-size: 0.55rem;
  padding: 1px 6px;
  border: 1px solid var(--border);
  color: var(--text-dim);
}

.jp-text {
  font-size: 0.76rem;
  line-height: 1.7;
  color: var(--text);
  white-space: pre-wrap;
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 12px;
}

.jp-textarea {
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.76rem;
  line-height: 1.7;
  padding: 12px;
  resize: vertical;
  margin-bottom: 12px;
}

.jp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.jp-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

</style>
