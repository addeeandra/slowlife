<script setup lang="ts">
import { useAssets } from '../../composables/useAssets'
import { useSpaces } from '../../composables/useSpaces'
import type { Asset } from '../../core/types'

const { recentlyOpened: recent, openAsset } = useAssets()
const { spaces, categories, projects } = useSpaces()

function hostLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function openedLabel(value: string | null) {
  if (!value) return '--'
  const diff = Math.floor((Date.now() - new Date(value).getTime()) / 864e5)
  if (diff <= 0) return 'today'
  if (diff === 1) return 'yesterday'
  return `${diff}d ago`
}

function assetMeta(asset: Asset) {
  const space = spaces.value.find(item => item.id === asset.space_id)
  const category = categories.value.find(item => item.id === asset.category_id && item.space_id === asset.space_id)
  const project = asset.project_id
    ? projects.value.find(
        item => item.id === asset.project_id
          && item.category_id === asset.category_id
          && item.space_id === asset.space_id
      )
    : null

  return {
    color: space?.color || 'var(--border)',
    location: [space?.label, category?.label, project?.label].filter(Boolean).join(' / '),
  }
}
</script>

<template>
  <div class="c s4">
    <div class="c-t">last interacted assets</div>
    <div class="ra-list">
      <div v-if="!recent.length" class="ra-empty">no assets opened yet</div>
      <div v-for="asset in recent" :key="asset.id" class="ra-item" @click="openAsset(asset)">
        <span class="ra-dot" :style="{ background: assetMeta(asset).color }"></span>
        <div class="ra-body">
          <div class="ra-title-row">
            <span class="ra-title">{{ asset.title }}</span>
            <span class="ra-opened">{{ openedLabel(asset.last_opened_at) }}</span>
          </div>
          <div class="ra-meta">{{ assetMeta(asset).location }}</div>
          <div class="ra-sub">{{ hostLabel(asset.url) }}<template v-if="asset.tags.length"> · {{ asset.tags.slice(0, 2).join(', ') }}</template></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ra-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ra-empty {
  font-size: 0.68rem;
  color: var(--text-dim);
  padding: 4px 0;
}

.ra-item {
  display: flex;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.ra-item:last-child {
  border-bottom: none;
}

.ra-item:hover {
  background: var(--bg-hover);
}

.ra-dot {
  width: 4px;
  height: 4px;
  margin-top: 5px;
  flex-shrink: 0;
}

.ra-body {
  flex: 1;
  min-width: 0;
}

.ra-title-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.ra-title {
  font-size: 0.72rem;
  color: var(--text);
}

.ra-opened,
.ra-meta,
.ra-sub {
  font-size: 0.55rem;
  color: var(--text-dim);
}

.ra-sub {
  color: var(--text-mid);
}
</style>
