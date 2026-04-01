<script setup lang="ts">
import type { Subscription } from '../../core/types'
import { formatCurrency, renewalLabel } from '../../core/constants'

defineProps<{ subscription: Subscription }>()
</script>

<template>
  <div class="sub-row">
    <div class="sr-info">
      <span class="sr-dot" :style="{ background: subscription.color }"></span>
      <span class="sr-name">{{ subscription.name }}</span>
      <span class="sr-when">{{ renewalLabel(subscription.next_date) }}</span>
    </div>
    <span class="sr-amt">{{ formatCurrency(subscription.amount) }}</span>
  </div>
</template>

<style scoped>
.sub-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 0;
}

.sr-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.sr-dot {
  width: 4px;
  height: 4px;
}

.sr-name {
  font-size: 0.72rem;
  color: var(--text);
}

.sr-when {
  font-size: 0.55rem;
  color: var(--text-dim);
}

.sr-amt {
  font-size: 0.72rem;
  color: var(--text-mid);
}
</style>
