<script setup lang="ts">
import type { Transaction } from '../../core/types'
import { formatCurrency } from '../../core/constants'

defineProps<{ transaction: Transaction }>()
</script>

<template>
  <div class="fin-row">
    <span class="f-n">
      {{ transaction.description }}
      <span class="f-date">{{ transaction.date }}</span>
    </span>
    <span
      class="f-v"
      :class="{ inc: transaction.type === 'income', exp: transaction.type === 'expense' }"
    >
      {{ transaction.type === 'income' ? '+' : '' }}{{ formatCurrency(transaction.amount) }}
    </span>
  </div>
</template>

<style scoped>
.fin-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 0;
  border-bottom: 1px solid var(--border);
}

.fin-row:last-child {
  border-bottom: none;
}

.f-n {
  font-size: 0.72rem;
  color: var(--text-mid);
}

.f-date {
  font-size: 0.55rem;
  color: var(--text-dim);
}

.f-v {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text);
}

.f-v.inc {
  color: var(--green);
}

.f-v.exp {
  color: var(--red);
}
</style>
