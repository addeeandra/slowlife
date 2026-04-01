<script setup lang="ts">
import { TAGS } from '../../core/constants'

const props = defineProps<{ space: string }>()
const model = defineModel<Set<string>>({ default: () => new Set() })

function toggle(tag: string) {
  const next = new Set(model.value)
  if (next.has(tag)) {
    next.delete(tag)
  } else {
    next.add(tag)
  }
  model.value = next
}

function tagsForSpace(): string[] {
  return TAGS[props.space] || TAGS.casual
}
</script>

<template>
  <div class="tags-row">
    <span
      v-for="tag in tagsForSpace()"
      :key="tag"
      class="tag"
      :class="{ selected: model.has(tag) }"
      @click="toggle(tag)"
    >
      {{ tag }}
    </span>
  </div>
</template>

<style scoped>
.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  font-family: var(--mono);
  font-size: 0.6rem;
  padding: 2px 8px;
  border: 1px solid var(--border);
  background: none;
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.1s;
}

.tag:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.tag.selected {
  background: var(--accent-dim);
  border-color: var(--accent);
  color: var(--accent);
}
</style>
