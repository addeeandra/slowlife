<script setup lang="ts">
import type { Account } from '../../core/types'
import { formatMoney } from '../../core/constants'

const props = defineProps<{
  account: Account & { current_balance?: number; converted_balance?: number | null }
  baseCurrency: string
  selected?: boolean
}>()

const emit = defineEmits<{
  edit: [account: Account]
  toggle: [account: Account]
}>()

function handleEdit(e: MouseEvent) {
  e.stopPropagation()
  emit('edit', props.account)
}
</script>

<template>
  <button type="button" class="fin-row" :class="{ selected }" @click="emit('toggle', account)">
    <span class="edit-btn" @click="handleEdit">edit</span>
    <span class="f-n">
      {{ account.name }}
      <span class="f-sub">init {{ formatMoney(account.initial_balance, account.currency) }}</span>
    </span>
    <span class="f-right">
      <span class="f-v">{{ formatMoney(account.current_balance ?? account.initial_balance, account.currency) }}</span>
      <span v-if="account.currency !== baseCurrency && account.converted_balance !== null" class="f-sub">
        {{ formatMoney(account.converted_balance || 0, baseCurrency) }}
      </span>
    </span>
  </button>
</template>

<style scoped>
.fin-row {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  min-height: 88px;
  padding: 10px;
  border: 1px solid var(--border);
  box-sizing: border-box;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.fin-row.selected {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.fin-row:hover {
  background: var(--bg-hover);
}

.f-n {
  display: flex;
  flex-direction: column;
  font-size: 0.72rem;
  color: var(--text-mid);
}

.f-right {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: auto;
}

.f-v {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text);
}

.f-sub {
  font-size: 0.55rem;
  color: var(--text-dim);
}

.edit-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  border: 1px solid var(--border);
  padding: 2px 5px;
  font-size: 0.55rem;
  color: var(--text-dim);
  background: var(--bg);
}

.fin-row:hover .edit-btn {
  opacity: 1;
}
</style>
