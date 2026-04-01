<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import { usePinned } from '../../composables/usePinned'

const router = useRouter()
const { pinnedWithMeta, unpin, updateSortOrder } = usePinned()

type PinnedMeta = (typeof pinnedWithMeta.value)[number]

const localPins = ref<PinnedMeta[]>([...pinnedWithMeta.value])

watch(
  pinnedWithMeta,
  value => {
    localPins.value = [...value]
  },
  { deep: true }
)

function navigate(p: PinnedMeta) {
  const path = p.item_id
    ? `/journal/${p.spaceId}/${p.category_id}/${p.item_id}`
    : `/journal/${p.spaceId}/${p.category_id}`
  router.push(path)
}

async function persistOrder() {
  await updateSortOrder(localPins.value.map(p => p.id))
}
</script>

<template>
  <div class="c s4">
    <div class="c-t">pinned</div>

    <div v-if="!localPins.length" class="empty">nothing pinned</div>

    <draggable
      v-else
      :list="localPins"
      item-key="id"
      handle=".drag-handle"
      :animation="150"
      :force-fallback="true"
      :fallback-on-body="true"
      :fallback-tolerance="10"
      fallback-class="pin-dragging"
      chosen-class="pin-chosen"
      drag-class="pin-drag"
      @change="persistOrder"
      @end="persistOrder"
    >
      <template #item="{ element: p }">
        <div class="pin" :class="p.spaceId">
          <span class="drag-handle">⠿</span>
          <div class="p-info" @click="navigate(p)">
            <div class="p-name">{{ p.name }}</div>
            <div class="p-meta">{{ p.lastStr }} / {{ p.weekCount }} this wk</div>
          </div>
          <button class="p-x" @click.stop="unpin(p.id)">[x]</button>
        </div>
      </template>
    </draggable>
  </div>
</template>

<style scoped>
.empty {
  font-size: 0.68rem;
  color: var(--text-dim);
  padding: 4px 0;
}

.pin {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  margin-bottom: 3px;
  border-left: 2px solid var(--border);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease);
  user-select: none;
}

.pin:hover {
  background: var(--bg-hover);
}

.pin.casual { border-left-color: var(--accent); }
.pin.work   { border-left-color: var(--work); }

.drag-handle {
  font-size: 0.65rem;
  color: var(--text-dim);
  opacity: 0;
  cursor: grab;
  flex-shrink: 0;
  transition: opacity var(--dur-fast) var(--ease);
}

.drag-handle:active { cursor: grabbing; }

.pin:hover .drag-handle { opacity: 1; }

.p-info { flex: 1; }

.p-name {
  font-size: 0.72rem;
  color: var(--text);
}

.p-meta {
  font-size: 0.55rem;
  color: var(--text-dim);
}

.p-x {
  font-size: 0.5rem;
  color: var(--text-dim);
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease);
  font-family: var(--mono);
}

.pin:hover .p-x { opacity: 1; }
.p-x:hover { color: var(--red); }
</style>

<!-- SortableJS fallback classes are injected outside scoped context -->
<style>
.pin-dragging {
  opacity: 0.85 !important;
  background: #2a2a27 !important;
  border-left: 2px solid #c4956a !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4) !important;
}

.pin-chosen {
  opacity: 0.5;
}
</style>
