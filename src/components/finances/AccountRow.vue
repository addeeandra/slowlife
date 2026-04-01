<script setup lang="ts">
import type { Account } from '../../core/types'
import { formatCurrency } from '../../core/constants'

defineProps<{ account: Account }>()
</script>

<template>
  <div class="fin-row">
    <span class="f-n">{{ account.name }}</span>
    <span class="f-v">{{ formatCurrency(account.balance) }}</span>
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

.f-v {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text);
}
</style>
