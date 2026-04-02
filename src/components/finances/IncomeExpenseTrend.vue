<script setup lang="ts">
import { computed } from 'vue'
import { useFinances } from '../../composables/useFinances'
import { formatMoney } from '../../core/constants'

const { incomeExpenseTrend, financeSettings } = useFinances()

const points = computed(() => incomeExpenseTrend())
const maxValue = computed(() => Math.max(1, ...points.value.flatMap(point => [point.income, point.expenses])))
</script>

<template>
  <div class="c" style="margin-bottom: 10px">
    <div class="c-t">income vs expense</div>
    <div v-if="points.length" class="trend-grid">
      <div v-for="point in points" :key="point.key" class="trend-col">
        <div class="trend-bars">
          <div class="bar income" :style="{ height: `${(point.income / maxValue) * 92}px` }"></div>
          <div class="bar expense" :style="{ height: `${(point.expenses / maxValue) * 92}px` }"></div>
        </div>
        <div class="trend-label">{{ point.label }}</div>
        <div class="trend-net">{{ formatMoney(point.net, financeSettings.base_currency) }}</div>
      </div>
    </div>
    <div v-else class="empty">not enough history yet</div>
  </div>
</template>

<style scoped>
.trend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 8px;
  align-items: end;
}

.trend-col {
  text-align: center;
}

.trend-bars {
  height: 96px;
  display: flex;
  align-items: end;
  justify-content: center;
  gap: 6px;
}

.bar {
  width: 12px;
}

.bar.income {
  background: var(--green);
}

.bar.expense {
  background: var(--red);
}

.trend-label {
  margin-top: 4px;
  font-size: 0.55rem;
  color: var(--text-dim);
}

.trend-net {
  font-size: 0.55rem;
}

.empty {
  font-size: 0.68rem;
  color: var(--text-dim);
}
</style>
