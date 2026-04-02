<script setup lang="ts">
import { useFinances } from '../../composables/useFinances'
import { formatMoney } from '../../core/constants'

const { netWorth, totalIncome, totalExpenses, financeSettings } = useFinances()
</script>

<template>
  <div class="fin-sum">
    <div class="fs">
      <div class="fs-l">net worth</div>
      <div class="fs-v">{{ formatMoney(netWorth, financeSettings.base_currency) }}</div>
    </div>
    <div class="fs">
      <div class="fs-l">income</div>
      <div class="fs-v inc">+{{ formatMoney(totalIncome, financeSettings.base_currency) }}</div>
    </div>
    <div class="fs">
      <div class="fs-l">expenses</div>
      <div class="fs-v exp">-{{ formatMoney(totalExpenses, financeSettings.base_currency) }}</div>
    </div>
  </div>
</template>

<style scoped>
.fin-sum {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.fs {
  flex: 1;
  padding: 6px 8px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
}

.fs-l {
  font-size: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-dim);
}

.fs-v {
  font-size: 0.82rem;
  font-weight: 600;
}

.fs-v.inc {
  color: var(--green);
}

.fs-v.exp {
  color: var(--red);
}

@media (max-width: 768px) {
  .fin-sum {
    flex-direction: column;
  }
}
</style>
