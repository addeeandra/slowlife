<script setup lang="ts">
import { computed } from 'vue'
import { useFinances } from '../../composables/useFinances'
import { formatMoney } from '../../core/constants'

const props = defineProps<{
  monthKey: string
}>()

const { monthlyBudgetRows, financeSettings } = useFinances()

const rows = computed(() => monthlyBudgetRows(props.monthKey))
</script>

<template>
  <div class="c" style="margin-bottom: 10px">
    <div class="c-t">budget overview</div>
    <div v-if="rows.length" class="bo-list">
      <div v-for="row in rows" :key="row.id" class="bo-row" :class="{ over: row.over }">
        <div class="bo-head">
          <span class="bo-name">{{ row.label }}</span>
          <span class="bo-vals">{{ formatMoney(row.spent, financeSettings.base_currency) }} / {{ formatMoney(row.budget, financeSettings.base_currency) }}</span>
        </div>
        <div class="bo-bar">
          <div class="bo-fill" :style="{ width: `${row.percent}%`, background: row.color }"></div>
        </div>
        <div class="bo-foot">
          <span>{{ row.over ? 'over by' : 'remaining' }}</span>
          <span>{{ formatMoney(Math.abs(row.remaining), financeSettings.base_currency) }}</span>
        </div>
      </div>
    </div>
    <div v-else class="empty">no budgets yet</div>
  </div>
</template>

<style scoped>
.bo-list {
  display: grid;
  gap: 8px;
}

@media (min-width: 769px) {
  .bo-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.bo-row {
  border: 1px solid var(--border);
  padding: 8px;
}

.bo-row.over {
  border-color: var(--red);
}

.bo-head,
.bo-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.bo-name,
.bo-vals {
  font-size: 0.68rem;
}

.bo-foot {
  margin-top: 4px;
  color: var(--text-dim);
  font-size: 0.55rem;
}

.bo-bar {
  margin-top: 6px;
  height: 8px;
  background: var(--border);
}

.bo-fill {
  height: 100%;
}

.empty {
  font-size: 0.68rem;
  color: var(--text-dim);
}
</style>
