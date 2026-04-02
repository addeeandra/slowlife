<script setup lang="ts">
import type { Transaction } from '../../core/types'
import { formatCurrency } from '../../core/constants'

defineProps<{ transaction: Transaction }>()

const emit = defineEmits<{
  edit: [transaction: Transaction]
}>()
</script>

<template>
  <button type="button" class="fin-row" @click="emit('edit', transaction)">
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
  </button>
</template>

<style scoped>
.fin-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 3px 0;
  border-bottom: 1px solid var(--border);
  background: transparent;
  border-left: none;
  border-right: none;
  border-top: none;
  cursor: pointer;
  text-align: left;
}

.fin-row:last-child {
  border-bottom: none;
}

.fin-row:hover .f-n,
.fin-row:hover .f-date {
  color: var(--text);
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
