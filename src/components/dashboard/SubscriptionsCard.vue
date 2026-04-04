<script setup lang="ts">
import { computed } from 'vue'
import { useFinances } from '../../composables/useFinances'
import { formatMoney, renewalLabel } from '../../core/constants'

const { sortedSubscriptions } = useFinances()

const subs = computed(() => sortedSubscriptions.value.slice(0, 4))
</script>

<template>
  <div class="c s4">
    <div class="c-t">
      subscriptions
      <router-link to="/finances">manage</router-link>
    </div>
    <div v-for="sub in subs" :key="sub.id" class="sub-row">
      <div class="sr-info">
        <span class="sr-dot" :style="{ background: sub.color }"></span>
        <span class="sr-name">{{ sub.name }}</span>
        <span class="sr-when">{{ renewalLabel(sub.next_date) }}</span>
      </div>
      <span class="sr-amt">{{ formatMoney(sub.amount, sub.currency) }}</span>
    </div>
  </div>
</template>

<style scoped>
.sub-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 0;
}

.sub-row:hover {
  background: var(--bg-hover);
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
