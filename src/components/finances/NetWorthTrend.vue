<script setup lang="ts">
import { computed } from 'vue'
import { useFinances } from '../../composables/useFinances'
import { formatMoney } from '../../core/constants'

const { netWorthTrend, financeSettings } = useFinances()

const points = computed(() => netWorthTrend())
const maxValue = computed(() => Math.max(1, ...points.value.map(point => point.net_worth)))
</script>

<template>
  <div class="c" style="margin-bottom: 10px">
    <div class="c-t">net worth trend</div>
    <div v-if="points.length" class="nw-grid">
      <div v-for="point in points" :key="point.id" class="nw-col">
        <div class="nw-bar-wrap">
          <div class="nw-bar" :style="{ height: `${(point.net_worth / maxValue) * 92}px` }"></div>
        </div>
        <div class="nw-label">{{ point.label }}</div>
      </div>
    </div>
    <div v-if="points.length" class="nw-last">latest {{ formatMoney(points[points.length - 1].net_worth, financeSettings.base_currency) }}</div>
    <div v-else class="empty">no snapshots yet</div>
  </div>
</template>

<style scoped>
.nw-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18px, 1fr));
  gap: 4px;
  align-items: end;
}

.nw-col {
  text-align: center;
}

.nw-bar-wrap {
  height: 96px;
  display: flex;
  align-items: end;
  justify-content: center;
}

.nw-bar {
  width: 100%;
  max-width: 10px;
  background: var(--accent);
}

.nw-label {
  margin-top: 4px;
  font-size: 0.48rem;
  color: var(--text-dim);
}

.nw-last,
.empty {
  margin-top: 6px;
  font-size: 0.68rem;
  color: var(--text-dim);
}
</style>
