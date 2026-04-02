<script setup lang="ts">
import type { Account } from '../../core/types'
import { formatCurrency } from '../../core/constants'

defineProps<{ account: Account }>()

const emit = defineEmits<{
  edit: [account: Account]
}>()
</script>

<template>
  <button type="button" class="fin-row" @click="emit('edit', account)">
    <span class="f-n">{{ account.name }}</span>
    <span class="f-v">{{ formatCurrency(account.balance) }}</span>
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
.fin-row:hover .f-v {
  color: var(--text);
}

.f-n {
  font-size: 0.72rem;
  color: var(--text-mid);
}

.f-v {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text);
}
</style>
