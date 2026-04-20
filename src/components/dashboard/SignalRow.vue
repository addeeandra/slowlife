<script setup lang="ts">
import { ref, watch } from 'vue'
import { useJournal } from '../../composables/useJournal'
import { useFinances } from '../../composables/useFinances'
import { useTodos } from '../../composables/useTodos'
import { MOODS } from '../../core/constants'
import { formatMoney } from '../../core/constants'

const STORAGE_KEY = 'slowlife.dashboard.censor-finance'

const { streak, daysActiveThisWeek, dominantMoodThisWeek } = useJournal()
const { netWorth, totalSubsMonthly, accounts, includedAccounts, activeSubscriptions, financeSettings } = useFinances()
const { openCount, overdueTodos } = useTodos()

const censorFinance = ref(true)

try {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw !== null) censorFinance.value = raw === 'true'
} catch (_) {
  /* ignore storage availability */
}

watch(censorFinance, value => {
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch (_) {
    /* ignore storage availability */
  }
})
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
      <div class="s-l">todos</div>
      <div class="s-v">{{ openCount }}</div>
      <div class="s-c">{{ overdueTodos.length ? `${overdueTodos.length} overdue` : 'open' }}</div>
    </div>
    <div class="sig">
      <div class="s-l">net worth</div>
      <button type="button" class="s-v s-toggle" @click="censorFinance = !censorFinance">
        {{ censorFinance ? '••••••' : formatMoney(netWorth, financeSettings.base_currency) }}
      </button>
      <div class="s-c">{{ includedAccounts.length }}/{{ accounts.length }} included · {{ censorFinance ? 'hide' : 'reveal' }}</div>
    </div>
    <div class="sig">
      <div class="s-l">subs/mo</div>
      <button type="button" class="s-v s-toggle" @click="censorFinance = !censorFinance">
        {{ censorFinance ? '••••••' : formatMoney(totalSubsMonthly, financeSettings.base_currency) }}
      </button>
      <div class="s-c">{{ activeSubscriptions.length }} active · {{ censorFinance ? 'hide' : 'reveal' }}</div>
    </div>
  </div>
</template>

<style scoped>
.sig-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
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

.s-toggle {
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
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
