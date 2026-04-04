<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { MoodKey } from '../core/types'
import PageHeader from '../components/PageHeader.vue'
import DateBar from '../components/journal/DateBar.vue'
import MoodPicker from '../components/journal/MoodPicker.vue'
import WritingPrompt from '../components/journal/WritingPrompt.vue'
import EntryEditor from '../components/journal/EntryEditor.vue'
import TagRow from '../components/journal/TagRow.vue'
import TimelineEntry from '../components/journal/TimelineEntry.vue'
import { useJournal } from '../composables/useJournal'
import { useSpaces } from '../composables/useSpaces'

const route = useRoute()
const { saveEntry, filteredEntries, countEntries } = useJournal()
const { spaces, categories, projects, currentSpace, switchSpace, expandedCategories } = useSpaces()

const editorText = ref('')
const selectedMood = ref<MoodKey | null>(null)
const selectedTags = ref<Set<string>>(new Set())

const space = computed(() => (route.params.space as string) || 'casual')
const category = computed(() => (route.params.category as string) || null)
const item = computed(() => {
  const v = route.params.item as string
  return v && v !== 'undefined' && v !== 'null' ? v : null
})

watch(space, (s) => {
  if (s !== currentSpace.value) switchSpace(s)
}, { immediate: true })

watch(category, (c) => {
  if (c) expandedCategories.value.add(c)
})

const isWorkSpace = computed(() => space.value === 'work')

const title = computed(() => {
  if (item.value && category.value) {
    const proj = projects.value.find(
      p => p.id === item.value && p.category_id === category.value && p.space_id === space.value
    )
    if (proj) return proj.label
  }
  if (category.value) {
    const cat = categories.value.find(c => c.id === category.value && c.space_id === space.value)
    if (cat) return cat.label
  }
  const sp = spaces.value.find(s => s.id === space.value)
  return sp ? sp.label : space.value
})

const meta = computed(() => {
  if (!category.value) return ''
  const count = countEntries(space.value, category.value, item.value)
  return `${count} entr${count === 1 ? 'y' : 'ies'}`
})

const breadcrumbs = computed(() => {
  const crumbs: { label: string; to?: string }[] = [
    { label: 'home', to: '/' },
  ]
  const sp = spaces.value.find(s => s.id === space.value)
  crumbs.push({ label: sp?.label || space.value, to: `/journal/${space.value}` })
  if (category.value) {
    const cat = categories.value.find(c => c.id === category.value && c.space_id === space.value)
    if (item.value) {
      crumbs.push({ label: cat?.label || category.value, to: `/journal/${space.value}/${category.value}` })
      const proj = projects.value.find(
        p => p.id === item.value && p.category_id === category.value && p.space_id === space.value
      )
      crumbs.push({ label: proj?.label || item.value })
    } else {
      crumbs.push({ label: cat?.label || category.value })
    }
  }
  return crumbs
})

const timeline = computed(() => {
  if (!category.value) return []
  return filteredEntries(space.value, category.value, item.value)
})

async function handleSave() {
  if (!editorText.value.trim() || !category.value) return
  await saveEntry(
    space.value,
    category.value,
    item.value,
    editorText.value.trim(),
    selectedMood.value,
    [...selectedTags.value]
  )
  editorText.value = ''
  selectedMood.value = null
  selectedTags.value = new Set()
}
</script>

<template>
  <div :class="{ 'space-work': isWorkSpace }">
    <PageHeader :title="title" :meta="meta" :breadcrumbs="breadcrumbs" />

    <div class="journal-area">
      <DateBar />
      <MoodPicker v-model="selectedMood" />
      <WritingPrompt :space="space" />
      <EntryEditor v-model="editorText" @save="handleSave" />
      <TagRow :space="space" v-model="selectedTags" />

      <div class="tl-sep"></div>

      <div v-if="!timeline.length" class="empty">no entries yet.</div>
      <TimelineEntry
        v-for="entry in timeline"
        :key="entry.id"
        :entry="entry"
        :space="space"
      />
    </div>
  </div>
</template>

<style scoped>
.journal-area {
  max-width: 580px;
  margin: 0 auto;
}

.tl-sep {
  height: 1px;
  background: var(--border);
  margin: 20px 0;
}

.empty {
  text-align: center;
  padding: 30px;
  color: var(--text-dim);
  font-size: 0.75rem;
}

.space-work :deep(.prompt-c) {
  background: var(--work-dim);
  border-color: var(--work-dim);
}

.space-work :deep(.ph) {
  color: var(--work);
}
</style>
