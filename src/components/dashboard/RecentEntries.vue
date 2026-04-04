<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useJournal } from '../../composables/useJournal'
import { useSpaces } from '../../composables/useSpaces'
import { MOODS, MONTH_ABBR } from '../../core/constants'
import { renderMarkdown } from '../../core/markdown'
import type { JournalEntry, MoodKey } from '../../core/types'

const router = useRouter()
const { recentEntries } = useJournal()
const { spaces, categories, projects } = useSpaces()

const recent = computed(() => recentEntries(4))
const renderedTexts = computed(() =>
  Object.fromEntries(recent.value.map(e => [e.id, renderMarkdown(e.text)]))
)

function entryMeta(entry: JournalEntry): { dateStr: string; location: string; color: string } {
  const d = new Date(entry.created_at)
  const dateStr = `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`
  const sp = spaces.value.find(s => s.id === entry.space)
  const cat = categories.value.find(c => c.id === entry.category && c.space_id === entry.space)
  const parts = [sp?.label, cat?.label]
  if (entry.item && cat) {
    const proj = projects.value.find(
      p => p.id === entry.item && p.category_id === cat.id && p.space_id === entry.space
    )
    if (proj) parts.push(proj.label)
  }
  return {
    dateStr,
    location: parts.filter(Boolean).join(' / '),
    color: sp?.color || 'var(--border)',
  }
}

function navigate(entry: JournalEntry) {
  const path = entry.item
    ? `/journal/${entry.space}/${entry.category}/${entry.item}`
    : `/journal/${entry.space}/${entry.category}`
  router.push(path)
}
</script>

<template>
  <div class="c s8">
    <div class="c-t">recent</div>
    <div class="rec">
      <div
        v-if="!recent.length"
        style="font-size: 0.68rem; color: var(--text-dim)"
      >
        no entries yet
      </div>
      <div
        v-for="entry in recent"
        :key="entry.id"
        class="rec-i"
        @click="navigate(entry)"
      >
        <span class="ri-d" :style="{ background: entryMeta(entry).color }"></span>
        <div class="ri-b">
          <div class="ri-m">{{ entryMeta(entry).dateStr }} / {{ entryMeta(entry).location }}</div>
          <div class="ri-t" v-html="renderedTexts[entry.id]" />
        </div>
        <span v-if="entry.mood" class="ri-e">{{ MOODS[entry.mood as MoodKey] }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rec {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.rec-i {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.rec-i:last-child {
  border-bottom: none;
}

.rec-i:hover {
  background: var(--bg-hover);
}

.ri-d {
  width: 4px;
  height: 4px;
  margin-top: 5px;
  flex-shrink: 0;
}

.ri-b {
  flex: 1;
  min-width: 0;
}

.ri-m {
  font-size: 0.55rem;
  color: var(--text-dim);
}

.ri-t {
  font-size: 0.72rem;
  color: var(--text-mid);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ri-t :deep(p) { margin: 0; display: inline; }
.ri-t :deep(strong) { color: var(--text); }

.ri-e {
  font-size: 0.7rem;
  flex-shrink: 0;
  margin-top: 1px;
}
</style>
