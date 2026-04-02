<script setup lang="ts">
import type { Subscription } from '../../core/types'
import { formatMoney, renewalLabel } from '../../core/constants'

defineProps<{ subscription: Subscription }>()

const emit = defineEmits<{
  edit: [subscription: Subscription]
}>()
</script>

<template>
  <button type="button" class="sub-row" @click="emit('edit', subscription)">
    <div class="sr-info">
      <span class="sr-dot" :style="{ background: subscription.color }"></span>
      <span class="sr-stack">
        <span class="sr-name">{{ subscription.name }}</span>
        <span class="sr-when">
          {{ subscription.next_date }}
          <template v-if="!subscription.cancelled_at"> · {{ renewalLabel(subscription.next_date) }}</template>
          <template v-else> · cancelled</template>
        </span>
      </span>
    </div>
    <span class="sr-amt">{{ formatMoney(subscription.amount, subscription.currency) }}</span>
  </button>
</template>

<style scoped>
.sub-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 3px 0;
  background: transparent;
  border: none;
  text-align: left;
}

.sub-row:hover {
  background: var(--bg-hover);
}

.sr-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.sr-stack {
  display: flex;
  flex-direction: column;
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
