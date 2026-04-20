<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '../BaseModal.vue'
import type { Account } from '../../core/types'

const props = defineProps<{
  open: boolean
  account?: Account | null
  currentBalance?: number
}>()

const emit = defineEmits<{
  save: [data: { name: string; initial_balance: number; currency: string; include_in_stats: number }]
  adjust: [data: { target_balance: number; date: string; description: string | null }]
  delete: [id: number]
  close: []
}>()

const name = ref('')
const initialBalance = ref('0')
const currency = ref('IDR')
const includeInStats = ref(true)
const adjustmentBalance = ref('')
const adjustmentDate = ref('')
const adjustmentDescription = ref('')
const confirmDelete = ref(false)

const isEdit = computed(() => !!props.account)
const canSave = computed(() => name.value.trim().length > 0 && Number.isFinite(Number(initialBalance.value)))
const canAdjust = computed(() =>
  !!props.account && adjustmentDate.value.length > 0 && Number.isFinite(Number(adjustmentBalance.value))
)

watch(() => props.open, (open) => {
  if (open) {
    confirmDelete.value = false
    if (props.account) {
      name.value = props.account.name
      initialBalance.value = String(props.account.initial_balance)
      currency.value = props.account.currency
      includeInStats.value = props.account.include_in_stats === 1
      adjustmentBalance.value = String(props.currentBalance ?? 0)
      adjustmentDate.value = new Date().toISOString().slice(0, 10)
      adjustmentDescription.value = ''
    } else {
      name.value = ''
      initialBalance.value = '0'
      currency.value = 'IDR'
      includeInStats.value = true
      adjustmentBalance.value = ''
      adjustmentDate.value = new Date().toISOString().slice(0, 10)
      adjustmentDescription.value = ''
    }
  }
})

function handleSave() {
  if (!canSave.value) return
  emit('save', {
    name: name.value.trim(),
    initial_balance: Number(initialBalance.value),
    currency: currency.value.trim().toUpperCase() || 'IDR',
    include_in_stats: includeInStats.value ? 1 : 0,
  })
}

function handleAdjust() {
  if (!canAdjust.value) return
  emit('adjust', {
    target_balance: Number(adjustmentBalance.value),
    date: adjustmentDate.value,
    description: adjustmentDescription.value.trim() || null,
  })
}

function handleDelete() {
  if (!props.account) return
  if (!confirmDelete.value) {
    confirmDelete.value = true
    return
  }
  emit('delete', props.account.id)
}
</script>

<template>
  <BaseModal :open="open" width="min(460px, 96vw)" top="8%" @close="emit('close')">
    <div class="ff-modal-inner">
      <div class="ff-head">
        <div class="ff-title">{{ isEdit ? 'edit account' : 'new account' }}</div>
        <button type="button" class="b-close" @click="emit('close')">esc</button>
      </div>

      <div class="ff-field">
        <input
          v-model="name"
          type="text"
          placeholder="account name"
          class="ff-input"
          @keydown.ctrl.enter.prevent="handleSave"
        />
      </div>

      <div class="ff-row">
        <div class="ff-field">
          <label class="ff-label">initial balance</label>
          <input v-model="initialBalance" type="number" step="0.01" class="ff-input ff-sm" />
        </div>
        <div class="ff-field">
          <label class="ff-label">currency</label>
          <input v-model="currency" type="text" maxlength="3" class="ff-input ff-sm ff-upper" />
        </div>
      </div>

      <label class="ff-check-row">
        <input v-model="includeInStats" type="checkbox" class="ff-check" />
        <span>
          <span class="ff-check-label">include in stats</span>
          <span class="ff-check-copy">dashboard, reports, net worth, income/expense, and budgets</span>
        </span>
      </label>

      <div v-if="isEdit" class="ff-adjust">
        <div class="ff-adjust-head">balance adjustment</div>
        <div class="ff-adjust-copy">
          current computed balance: {{ currentBalance }}
        </div>
        <div class="ff-row">
          <div class="ff-field">
            <label class="ff-label">actual balance</label>
            <input v-model="adjustmentBalance" type="number" step="0.01" class="ff-input ff-sm" />
          </div>
          <div class="ff-field">
            <label class="ff-label">adjustment date</label>
            <input v-model="adjustmentDate" type="date" class="ff-input ff-sm" />
          </div>
        </div>
        <div class="ff-field">
          <label class="ff-label">note (optional)</label>
          <input v-model="adjustmentDescription" type="text" class="ff-input" placeholder="balance adjustment" />
        </div>
        <button class="btn" :disabled="!canAdjust" @click="handleAdjust">apply adjustment</button>
      </div>

      <div class="ff-footer">
        <div class="ff-left">
          <button v-if="isEdit" class="btn danger" @click="handleDelete">
            {{ confirmDelete ? 'confirm delete' : 'delete' }}
          </button>
        </div>
        <div class="ff-actions">
          <button class="btn ghost" @click="emit('close')">cancel</button>
          <button class="btn" :disabled="!canSave" @click="handleSave">save</button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.ff-modal-inner {
  padding: 16px;
}

.ff-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.ff-title {
  font-family: var(--mono);
  font-size: 0.9rem;
}

.ff-field {
  margin-bottom: 10px;
  flex: 1;
}

.ff-row {
  display: flex;
  gap: 10px;
}

.ff-label {
  display: block;
  font-size: 0.58rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.ff-input {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.78rem;
  padding: 8px 10px;
}

.ff-input:focus {
  outline: none;
  border-color: var(--accent);
}

.ff-check-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.68rem;
  color: var(--text);
}

.ff-check {
  margin-top: 2px;
  accent-color: var(--accent);
}

.ff-check-label {
  display: block;
}

.ff-check-copy {
  display: block;
  margin-top: 2px;
  font-size: 0.58rem;
  color: var(--text-dim);
}

.ff-sm {
  min-width: 0;
}

.ff-upper {
  text-transform: uppercase;
}

.ff-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  gap: 8px;
}

.ff-adjust {
  margin-top: 6px;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid var(--border);
  background: var(--bg-hover);
}

.ff-adjust-head {
  font-size: 0.62rem;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.ff-adjust-copy {
  font-size: 0.62rem;
  color: var(--text-dim);
  margin-bottom: 8px;
}

.ff-left,
.ff-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .ff-row,
  .ff-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .ff-left,
  .ff-actions {
    justify-content: space-between;
  }
}
</style>
