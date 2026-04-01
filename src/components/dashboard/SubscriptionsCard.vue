<script setup lang="ts">
import { computed } from 'vue'
import { useFinances } from '../../composables/useFinances'
import { formatCurrency } from '../../core/constants'

const { sortedSubscriptions } = useFinances()

const subs = computed(() => sortedSubscriptions.value.slice(0, 4))

function renewalLabel(nextDate: string): string {
  const nd = new Date(nextDate + 'T00:00:00')
  const diff = Math.ceil((nd.getTime() - new Date().getTime()) / 864e5)
  if (diff <= 0) return 'today'
  if (diff === 1) return 'tmrw'
  return `${diff}d`
}
</script>

<template>
  <div class="c s5">
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
      <span class="sr-amt">{{ formatCurrency(sub.amount) }}</span>
    </div>
  </div>
</template>

<style scoped>
.c {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 10px 12px;
}

.s5 {
  grid-column: span 5;
}

.c-t {
  font-size: 0.58rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.c-t a {
  color: var(--text-dim);
  text-decoration: none;
  font-size: 0.55rem;
}

.c-t a:hover {
  color: var(--accent);
}

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

@media (max-width: 1024px) {
  .s5 {
    grid-column: span 12;
  }
}
</style>
