<script setup lang="ts">
import { ref, computed } from 'vue'
import type { JournalEntry, MoodKey } from '../../core/types'
import { MOODS, MONTH_ABBR } from '../../core/constants'
import { useJournal } from '../../composables/useJournal'
import { renderMarkdown } from '../../core/markdown'
import MoodPicker from './MoodPicker.vue'
import TagRow from './TagRow.vue'

const props = defineProps<{ entry: JournalEntry; space: string }>()

const { updateEntry, deleteEntry } = useJournal()

const isEditing = ref(false)
const isExpanded = ref(false)
const showConfirmDelete = ref(false)
const editText = ref('')
const editMood = ref<MoodKey | null>(null)
const editTags = ref<Set<string>>(new Set())

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} - ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function parseTags(tags: string): string[] {
  try { return JSON.parse(tags) } catch { return [] }
}

const renderedText = computed(() => renderMarkdown(props.entry.text))

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function startEdit() {
  showConfirmDelete.value = false
  editText.value = props.entry.text
  editMood.value = props.entry.mood as MoodKey | null
  editTags.value = new Set(parseTags(props.entry.tags))
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

async function saveEdit() {
  if (!editText.value.trim()) return
  await updateEntry(props.entry.id, {
    text: editText.value.trim(),
    mood: editMood.value,
    tags: [...editTags.value],
  })
  isEditing.value = false
}

function promptDelete() {
  isEditing.value = false
  showConfirmDelete.value = true
}

function cancelDelete() {
  showConfirmDelete.value = false
}

async function confirmDelete() {
  await deleteEntry(props.entry.id)
}
</script>

<template>
  <!-- Edit mode -->
  <div v-if="isEditing" class="tl-entry editing">
    <div class="tl-hdr">
      <span class="tl-date">{{ formatDate(entry.created_at) }}</span>
      <div class="tl-hdr-acts">
        <button class="tl-act tl-act-del" @click="promptDelete">delete</button>
        <button class="tl-act" @click="saveEdit">save</button>
        <button class="tl-act tl-act-dim" @click="cancelEdit">cancel</button>
      </div>
    </div>
    <textarea class="tl-edit-area" v-model="editText" rows="16" />
    <MoodPicker v-model="editMood" />
    <TagRow :space="space" v-model="editTags" />
  </div>

  <!-- Delete confirmation -->
  <div v-else-if="showConfirmDelete" class="tl-entry confirm-delete">
    <div class="tl-hdr">
      <span class="tl-date">{{ formatDate(entry.created_at) }}</span>
    </div>
    <div class="tl-text">{{ entry.text }}</div>
    <div class="confirm-row">
      delete this entry?
      <button class="cf-yes" @click="confirmDelete">yes</button>
      <button class="cf-no" @click="cancelDelete">no</button>
    </div>
  </div>

  <!-- Read mode -->
  <div v-else class="tl-entry" @click="toggleExpand" @dblclick.stop="startEdit">
    <div class="tl-hdr">
      <span class="tl-date">{{ formatDate(entry.created_at) }}</span>
      <div class="tl-hdr-acts">
        <button v-if="isExpanded" class="tl-act" @click.stop="startEdit">✎</button>
        <span v-if="entry.mood" class="tl-mood">{{ MOODS[entry.mood as MoodKey] }}</span>
      </div>
    </div>
    <div class="tl-text" :class="{ expanded: isExpanded }" v-html="renderedText" />
    <div v-if="parseTags(entry.tags).length" class="tl-tags">
      <span v-for="tag in parseTags(entry.tags)" :key="tag" class="tl-tag">{{ tag }}</span>
    </div>
    <div class="tl-edit-hint">{{ isExpanded ? 'click to collapse' : 'click to expand' }} / double click to edit </div>
  </div>
</template>

<style scoped>
.tl-entry {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 12px 14px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: border-color var(--dur-fast) var(--ease);
}

.tl-entry:hover {
  border-color: var(--text-dim);
}

.tl-entry.editing,
.tl-entry.confirm-delete {
  cursor: default;
  border-color: var(--accent-dim);
}

.tl-entry.editing:hover,
.tl-entry.confirm-delete:hover {
  border-color: var(--accent-dim);
}

.tl-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.tl-date {
  font-size: 0.65rem;
  color: var(--text-dim);
}

.tl-mood {
  font-size: 0.8rem;
}

.tl-hdr-acts {
  display: flex;
  gap: 6px;
}

.tl-act {
  font-family: var(--mono);
  font-size: 0.58rem;
  background: none;
  border: 1px solid var(--border);
  color: var(--text-dim);
  padding: 1px 6px;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease);
}

.tl-act:hover {
  color: var(--text);
  border-color: var(--text-dim);
}

.tl-act-dim {
  opacity: 0.6;
}

.tl-act-del:hover {
  color: var(--red);
  border-color: var(--red);
}

.tl-edit-area {
  width: 100%;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.68rem;
  padding: 8px;
  resize: vertical;
  outline: none;
  line-height: 1.5;
  margin-bottom: 12px;
}

.tl-text {
  font-size: 0.78rem;
  color: var(--text-mid);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tl-text.expanded {
  -webkit-line-clamp: unset;
  overflow: visible;
}

.tl-text :deep(p) { margin: 0 0 4px; }
.tl-text :deep(p:last-child) { margin-bottom: 0; }
.tl-text :deep(ul), .tl-text :deep(ol) { padding-left: 16px; margin: 0; }
.tl-text :deep(code) { font-family: var(--mono); font-size: 0.85em; background: var(--bg-hover); padding: 0 3px; }
.tl-text :deep(strong) { color: var(--text); }
.tl-text :deep(h1), .tl-text :deep(h2), .tl-text :deep(h3) { font-size: 0.85rem; color: var(--text); margin: 0 0 4px; font-weight: 600; }

.tl-tags {
  display: flex;
  gap: 3px;
  margin-top: 5px;
}

.tl-tag {
  font-size: 0.55rem;
  padding: 0 5px;
  border: 1px solid var(--border);
  color: var(--text-dim);
}

.tl-edit-hint {
  font-size: 0.5rem;
  color: var(--text-dim);
  margin-top: 6px;
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease);
}

.tl-entry:hover .tl-edit-hint {
  opacity: 1;
}

.confirm-row {
  margin-top: 8px;
  padding: 4px 6px;
  font-family: var(--mono);
  font-size: 0.58rem;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--red-dim);
}

.cf-yes, .cf-no {
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 0.58rem;
  padding: 0 2px;
}

.cf-yes {
  color: var(--red);
}

.cf-no {
  color: var(--text-dim);
}

.cf-yes:hover, .cf-no:hover {
  color: var(--text);
}
</style>
