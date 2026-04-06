<script setup lang="ts">
import { computed } from 'vue'
import { useTodos } from '../../composables/useTodos'
import { DAY_ABBR } from '../../core/constants'

const { focusToday, focusThisWeek, focusHistory } = useTodos()

function dayLabel(dateStr: string): string {
  return DAY_ABBR[new Date(dateStr + 'T12:00:00').getDay()][0].toUpperCase()
}

function pct(rate: number): string {
  return Math.round(rate * 100) + '%'
}

function barColor(rate: number): string {
  if (rate <= 0.33) return 'var(--green)'
  if (rate <= 0.66) return 'var(--accent)'
  return 'var(--red)'
}

function blockVis(i: number, a: number): { i: number; a: number } {
  const total = i + a
  if (total === 0) return { i: 0, a: 0 }
  if (total <= 20) return { i, a }
  const scale = 20 / total
  return { i: Math.round(i * scale), a: Math.round(a * scale) }
}

const todayBlocks = computed(() => blockVis(focusToday.value.i, focusToday.value.a))
const weekBlocks = computed(() => blockVis(focusThisWeek.value.i, focusThisWeek.value.a))

const hasAnyData = computed(() =>
  focusHistory.value.some(d => d.i + d.a > 0)
)

const maxRate = computed(() =>
  focusHistory.value.reduce((max, d) => Math.max(max, d.rate), 0.01)
)
</script>

<template>
  <div class="c s4">
    <div class="c-t">inattentive rate</div>

    <div v-if="!hasAnyData" class="fr-empty">no completed todos yet</div>

    <template v-else>
      <div class="fr-row">
        <span class="fr-label">today</span>
        <span class="fr-pct" :style="{ color: focusToday.i + focusToday.a === 0 ? 'var(--text-dim)' : barColor(focusToday.rate) }">
          {{ focusToday.i + focusToday.a === 0 ? '--' : pct(focusToday.rate) }}
        </span>
        <span class="fr-vis">
          <span class="fr-open">(</span>
          <span v-for="n in todayBlocks.i" :key="'i' + n" class="fr-blk-i">-</span>
          <span v-for="n in todayBlocks.a" :key="'a' + n" class="fr-blk-a">+</span>
          <span class="fr-open">)</span>
        </span>
      </div>

      <div class="fr-row">
        <span class="fr-label">week</span>
        <span class="fr-pct" :style="{ color: focusThisWeek.i + focusThisWeek.a === 0 ? 'var(--text-dim)' : barColor(focusThisWeek.rate) }">
          {{ focusThisWeek.i + focusThisWeek.a === 0 ? '--' : pct(focusThisWeek.rate) }}
        </span>
        <span class="fr-vis">
          <span class="fr-open">(</span>
          <span v-for="n in weekBlocks.i" :key="'i' + n" class="fr-blk-i">-</span>
          <span v-for="n in weekBlocks.a" :key="'a' + n" class="fr-blk-a">+</span>
          <span class="fr-open">)</span>
        </span>
      </div>

      <div class="fr-chart">
        <div
          v-for="day in focusHistory"
          :key="day.date"
          class="fr-col"
        >
          <div class="fr-bar-wrap">
            <div
              v-if="day.i + day.a > 0"
              class="fr-bar"
              :style="{
                height: `${(day.rate / maxRate) * 56}px`,
                background: barColor(day.rate),
              }"
            ></div>
            <div v-else class="fr-bar-nil"></div>
          </div>
          <div class="fr-day">{{ dayLabel(day.date) }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.fr-empty {
  font-size: 0.6rem;
  color: var(--text-dim);
  margin-top: 8px;
}

.fr-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 6px;
}

.fr-label {
  font-size: 0.58rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  width: 32px;
  flex-shrink: 0;
}

.fr-pct {
  font-size: 0.72rem;
  font-weight: 600;
  width: 34px;
  flex-shrink: 0;
}

.fr-vis {
  font-size: 0.6rem;
  color: var(--text-dim);
  letter-spacing: 0.02em;
  overflow: hidden;
  white-space: nowrap;
}

.fr-open {
  color: var(--text-dim);
}

.fr-blk-i {
  color: var(--red);
}

.fr-blk-a {
  color: var(--green);
}

.fr-chart {
  display: flex;
  gap: 4px;
  margin-top: 10px;
  align-items: flex-end;
}

.fr-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.fr-bar-wrap {
  height: 56px;
  display: flex;
  align-items: flex-end;
  width: 100%;
  justify-content: center;
}

.fr-bar {
  width: 8px;
  min-height: 2px;
  transition: height var(--dur-mid) var(--ease);
}

.fr-bar-nil {
  width: 4px;
  height: 2px;
  background: var(--border);
}

.fr-day {
  font-size: 0.5rem;
  color: var(--text-dim);
  text-transform: uppercase;
}
</style>
