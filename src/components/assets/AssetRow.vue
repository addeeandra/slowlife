<script setup lang="ts">
import { computed } from 'vue'
import type { Asset } from '../../core/types'

const props = defineProps<{
  asset: Asset
  showScope?: boolean
}>()

const emit = defineEmits<{
  open: [asset: Asset]
  edit: [asset: Asset]
}>()

const host = computed(() => {
  try {
    return new URL(props.asset.url).hostname.replace(/^www\./, '')
  } catch {
    return props.asset.url
  }
})

const openedLabel = computed(() => recencyLabel(props.asset.last_opened_at))

function recencyLabel(value: string | null) {
  if (!value) return ''
  const diff = Math.floor((Date.now() - new Date(value).getTime()) / 864e5)
  if (diff <= 0) return 'opened today'
  if (diff === 1) return 'opened yesterday'
  return `opened ${diff}d ago`
}
</script>

<template>
  <div class="asset-row" @click="emit('open', asset)">
    <div class="asset-main">
      <div class="asset-top">
        <span class="asset-title">{{ asset.title }}</span>
        <span class="asset-host">{{ host }}</span>
      </div>
      <div v-if="asset.description" class="asset-desc">{{ asset.description }}</div>
      <div class="asset-meta">
        <span v-if="showScope" class="asset-badge">{{ asset.project_id ? 'project' : 'shared' }}</span>
        <span v-if="openedLabel" class="asset-opened">{{ openedLabel }}</span>
        <span v-for="tag in asset.tags.slice(0, 4)" :key="tag" class="asset-tag">#{{ tag }}</span>
      </div>
    </div>
    <button class="asset-edit" @click.stop="emit('edit', asset)">edit</button>
  </div>
</template>

<style scoped>
.asset-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 8px 0;
  border-top: 1px solid var(--border);
  cursor: pointer;
}

.asset-row:first-child {
  border-top: none;
}

.asset-row:hover {
  background: var(--bg-hover);
}

.asset-main {
  flex: 1;
  min-width: 0;
}

.asset-top {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.asset-title {
  font-size: 0.74rem;
  color: var(--text);
}

.asset-host {
  font-size: 0.56rem;
  color: var(--text-dim);
}

.asset-desc {
  margin-top: 3px;
  font-size: 0.63rem;
  color: var(--text-mid);
  line-height: 1.4;
}

.asset-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.asset-badge,
.asset-opened,
.asset-tag {
  font-size: 0.54rem;
  color: var(--text-dim);
  padding: 1px 5px;
  border: 1px solid var(--border);
}

.asset-badge {
  color: var(--accent);
  border-color: var(--accent);
}

.asset-tag {
  background: var(--bg);
}

.asset-edit {
  flex-shrink: 0;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 0.58rem;
  padding: 4px 6px;
  cursor: pointer;
}

.asset-edit:hover {
  border-color: var(--text);
  color: var(--text);
}
</style>
