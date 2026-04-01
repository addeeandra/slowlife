<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePinned } from '../../composables/usePinned'

const router = useRouter()
const { pinnedWithMeta, unpin } = usePinned()

function navigate(p: { spaceId: string; category_id: string; item_id: string | null }) {
  const path = p.item_id
    ? `/journal/${p.spaceId}/${p.category_id}/${p.item_id}`
    : `/journal/${p.spaceId}/${p.category_id}`
  router.push(path)
}
</script>

<template>
  <div class="c s5">
    <div class="c-t">pinned</div>
    <div class="pin-list">
      <div
        v-if="!pinnedWithMeta.length"
        style="font-size: 0.68rem; color: var(--text-dim); padding: 4px 0"
      >
        nothing pinned
      </div>
      <div
        v-for="p in pinnedWithMeta"
        :key="p.id"
        class="pin"
        :class="p.spaceId"
        @click="navigate(p)"
      >
        <div class="p-info">
          <div class="p-name">{{ p.name }}</div>
          <div class="p-meta">{{ p.lastStr }} / {{ p.weekCount }} this wk</div>
        </div>
        <button class="p-x" @click.stop="unpin(p.id)">[x]</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.c {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 10px 12px;
}

.s5 {
  grid-column: span 5;
}

.c-t {
  font-size: 0.58rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pin-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pin {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border-left: 2px solid var(--border);
  cursor: pointer;
  transition: background 0.08s;
}

.pin:hover {
  background: var(--bg-hover);
}

.pin.casual {
  border-left-color: var(--accent);
}

.pin.work {
  border-left-color: var(--work);
}

.p-info {
  flex: 1;
}

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
  transition: opacity 0.1s;
  font-family: var(--mono);
}

.pin:hover .p-x {
  opacity: 1;
}

.p-x:hover {
  color: var(--red);
}

@media (max-width: 1024px) {
  .s5 {
    grid-column: span 12;
  }
}
</style>
