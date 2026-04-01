<script setup lang="ts">
import type { JournalEntry } from '../../core/types'
import { MOODS, MONTH_ABBR } from '../../core/constants'
import type { MoodKey } from '../../core/types'

defineProps<{ entry: JournalEntry }>()

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function parseTags(tags: string): string[] {
  try {
    return JSON.parse(tags)
  } catch {
    return []
  }
}
</script>

<template>
  <div class="tl-entry">
    <div class="tl-hdr">
      <span class="tl-date">{{ formatDate(entry.created_at) }}</span>
      <span v-if="entry.mood" class="tl-mood">{{ MOODS[entry.mood as MoodKey] }}</span>
    </div>
    <div class="tl-text">{{ entry.text }}</div>
    <div v-if="parseTags(entry.tags).length" class="tl-tags">
      <span v-for="tag in parseTags(entry.tags)" :key="tag" class="tl-tag">{{ tag }}</span>
    </div>
  </div>
</template>

<style scoped>
.tl-entry {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 12px 14px;
  margin-bottom: 6px;
}

.tl-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3px;
}

.tl-date {
  font-size: 0.65rem;
  color: var(--text-dim);
}

.tl-mood {
  font-size: 0.8rem;
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
</style>
