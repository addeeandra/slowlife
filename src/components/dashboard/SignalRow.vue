<script setup lang="ts">
import { useJournal } from '../../composables/useJournal'
import { useFinances } from '../../composables/useFinances'
import { MOODS } from '../../core/constants'
import { formatCurrency } from '../../core/constants'

const { streak, daysActiveThisWeek, dominantMoodThisWeek } = useJournal()
const { netWorth, totalSubsMonthly, accounts, subscriptions } = useFinances()
</script>

<template>
  <div class="sig-row">
    <div class="sig">
      <div class="s-l">streak</div>
      <div class="s-v">{{ streak }}</div>
      <div class="s-c">day{{ streak !== 1 ? 's' : '' }}</div>
    </div>
    <div class="sig">
      <div class="s-l">this week</div>
      <div class="s-v">{{ daysActiveThisWeek }}/7</div>
      <div class="s-c">days active</div>
    </div>
    <div class="sig">
      <div class="s-l">feeling</div>
      <div class="s-v">{{ dominantMoodThisWeek ? MOODS[dominantMoodThisWeek] : '--' }}</div>
      <div class="s-c">{{ dominantMoodThisWeek || 'no data' }}</div>
    </div>
    <div class="sig">
      <div class="s-l">net worth</div>
      <div class="s-v">{{ formatCurrency(netWorth) }}</div>
      <div class="s-c">{{ accounts.length }} accts</div>
    </div>
    <div class="sig">
      <div class="s-l">subs/mo</div>
      <div class="s-v">{{ formatCurrency(totalSubsMonthly) }}</div>
      <div class="s-c">{{ subscriptions.length }} active</div>
    </div>
  </div>
</template>

<style scoped>
.sig-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  grid-column: span 12;
}

.sig {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 8px 10px;
}

.s-l {
  font-size: 0.55rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-dim);
}

.s-v {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin-top: 1px;
}

.s-c {
  font-size: 0.55rem;
  color: var(--text-dim);
}

@media (max-width: 1024px) {
  .sig-row {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .sig-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
