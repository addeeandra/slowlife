<script setup lang="ts">
import { MONTH_ABBR } from '../../core/constants'

const props = defineProps<{
  year: number
  month: number
  viewMode: 'month' | 'week' | 'list'
  weekLabel?: string
  syncLabel: string
  syncDisabled?: boolean
}>()

const emit = defineEmits<{
  navigate: [direction: -1 | 0 | 1]
  setView: [mode: 'month' | 'week' | 'list']
  create: []
  syncGoogle: []
}>()

function label(): string {
  if (props.viewMode === 'week' && props.weekLabel) return props.weekLabel
  return `${MONTH_ABBR[props.month]} ${props.year}`
}
</script>

<template>
  <div class="cn">
    <div class="cn-left">
      <button class="cn-btn" @click="emit('navigate', -1)">&lt;</button>
      <button class="cn-btn" @click="emit('navigate', 0)">today</button>
      <button class="cn-btn" @click="emit('navigate', 1)">&gt;</button>
      <span class="cn-label">{{ label() }}</span>
    </div>
    <div class="cn-right">
      <div class="cn-sync">
        <button class="cn-btn" :disabled="syncDisabled" @click="emit('syncGoogle')">{{ syncLabel }}</button>
      </div>
      <div class="cn-modes">
        <button
          v-for="m in (['month', 'week', 'list'] as const)"
          :key="m"
          class="cn-mode"
          :class="{ active: viewMode === m }"
          @click="emit('setView', m)"
        >
          {{ m }}
        </button>
      </div>
      <button class="cn-add" @click="emit('create')">+</button>
    </div>
  </div>
</template>

<style scoped>
.cn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 8px;
}

.cn-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cn-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cn-sync {
  display: flex;
  gap: 4px;
}

.cn-btn {
  font-family: var(--mono);
  font-size: 0.68rem;
  padding: 4px 8px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-mid);
  cursor: pointer;
  transition: color var(--dur-base) var(--ease);
}

.cn-btn:hover {
  color: var(--text);
  border-color: var(--accent);
}

.cn-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: var(--border);
  color: var(--text-dim);
}

.cn-btn:disabled:hover {
  color: var(--text-dim);
  border-color: var(--border);
}

.cn-label {
  font-size: 0.82rem;
  color: var(--text);
  margin-left: 8px;
  font-weight: 600;
}

.cn-modes {
  display: flex;
  gap: 0;
}

.cn-mode {
  font-family: var(--mono);
  font-size: 0.6rem;
  padding: 4px 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-dim);
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: all var(--dur-base) var(--ease);
}

.cn-mode + .cn-mode {
  border-left: none;
}

.cn-mode:hover {
  color: var(--text-mid);
}

.cn-mode.active {
  color: var(--accent);
  background: var(--accent-dim);
  border-color: var(--accent);
}

.cn-mode.active + .cn-mode {
  border-left-color: var(--accent);
}

.cn-add {
  font-family: var(--mono);
  font-size: 0.82rem;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--bg);
  cursor: pointer;
  transition: opacity var(--dur-base) var(--ease);
}

.cn-add:hover {
  opacity: 0.85;
}

@media (max-width: 768px) {
  .cn {
    flex-wrap: wrap;
  }
}
</style>
