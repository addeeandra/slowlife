<script setup lang="ts">
import { computed } from 'vue'
import { useJournal } from '../../composables/useJournal'

const { heatmapData, heatmapMonths } = useJournal()

const cells = computed(() => heatmapData())
const months = computed(() => heatmapMonths())
</script>

<template>
  <div class="c s4">
    <div class="c-t">activity</div>
    <div class="hm-months">
      <span v-for="m in months" :key="m">{{ m }}</span>
    </div>
    <div class="hm-grid">
      <div
        v-for="(cell, i) in cells"
        :key="i"
        class="hm-c"
        :class="{
          l1: cell.level === 1,
          l2: cell.level === 2,
          l3: cell.level === 3,
          l4: cell.level === 4,
          today: cell.isToday,
        }"
      ></div>
    </div>
    <div class="hm-leg">
      <span>less</span>
      <div class="h" style="background: var(--border)"></div>
      <div class="h" style="background: #3d2e1f"></div>
      <div class="h" style="background: #5a4530"></div>
      <div class="h" style="background: #8a6a45"></div>
      <div class="h" style="background: #c4956a"></div>
      <span>more</span>
    </div>
  </div>
</template>

<style scoped>
.hm-months {
  display: flex;
  justify-content: space-between;
  font-size: 0.5rem;
  color: var(--text-dim);
  margin-bottom: 3px;
}

.hm-grid {
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 2px;
}

.hm-c {
  aspect-ratio: 1;
  background: var(--border);
  min-width: 0;
}

.hm-c.l1 { background: #3d2e1f; }
.hm-c.l2 { background: #5a4530; }
.hm-c.l3 { background: #8a6a45; }
.hm-c.l4 { background: #c4956a; }
.hm-c.today { outline: 1px solid var(--accent); }

.hm-leg {
  display: flex;
  align-items: center;
  gap: 2px;
  justify-content: flex-end;
  margin-top: 4px;
  font-size: 0.5rem;
  color: var(--text-dim);
}

.hm-leg .h {
  width: 7px;
  height: 7px;
}
</style>
