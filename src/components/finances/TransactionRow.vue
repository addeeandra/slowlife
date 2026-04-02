<script setup lang="ts">
import type { Transaction } from '../../core/types'
import { formatMoney } from '../../core/constants'

defineProps<{
  transaction: Transaction & { account_currency?: string; account_name?: string; category_label?: string | null }
}>()

const emit = defineEmits<{
  edit: [transaction: Transaction]
}>()
</script>

<template>
  <button type="button" class="fin-row" @click="emit('edit', transaction)">
    <span class="f-n">
      {{ transaction.description }}
      <span v-if="transaction.account_name" class="f-cat">{{ transaction.account_name }}</span>
      <span v-if="transaction.category_label" class="f-cat">{{ transaction.category_label }}</span>
      <span v-if="transaction.entry_mode === 'adjustment'" class="f-cat">adjustment</span>
      <span class="f-date">{{ transaction.date }}</span>
    </span>
    <span
      class="f-v"
      :class="{ inc: transaction.type === 'income', exp: transaction.type === 'expense' }"
    >
      {{ transaction.type === 'income' ? '+' : '' }}{{ formatMoney(transaction.amount, transaction.account_currency || 'IDR') }}
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
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 0.72rem;
  color: var(--text-mid);
}

.f-date {
  font-size: 0.55rem;
  color: var(--text-dim);
}

.f-cat {
  display: inline-block;
  margin-left: 6px;
  font-size: 0.52rem;
  color: var(--text-dim);
  text-transform: uppercase;
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
