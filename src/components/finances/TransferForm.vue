<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from '../BaseModal.vue'
import Select from '../Select.vue'
import { useFinances, type TransferInput } from '../../composables/useFinances'
import { toISO } from '../../core/constants'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  save: [data: TransferInput]
  close: []
}>()

const { accounts } = useFinances()

const fromAccountId = ref<number | null>(null)
const toAccountId = ref<number | null>(null)
const amount = ref('')
const date = ref('')

const accountOptions = computed(() => accounts.value.map(account => ({
  value: account.id,
  label: account.name,
})))

const toAccountOptions = computed(() => accountOptions.value.map(option => ({
  ...option,
  disabled: option.value === fromAccountId.value,
})))

const canSave = computed(() =>
  !!fromAccountId.value && !!toAccountId.value && fromAccountId.value !== toAccountId.value && Number(amount.value) > 0 && date.value.length > 0
)

watch(() => props.open, (open) => {
  if (open) {
    fromAccountId.value = accounts.value[0]?.id ?? null
    toAccountId.value = accounts.value[1]?.id ?? null
    amount.value = ''
    date.value = toISO(new Date())
  }
})

watch(fromAccountId, (newVal) => {
  if (toAccountId.value === newVal) {
    toAccountId.value = accounts.value.find(a => a.id !== newVal)?.id ?? null
  }
})

function handleSave() {
  if (!canSave.value || !fromAccountId.value || !toAccountId.value) return
  emit('save', {
    from_account_id: fromAccountId.value,
    to_account_id: toAccountId.value,
    amount: Number(amount.value),
    date: date.value,
  })
}
</script>

<template>
  <BaseModal :open="open" width="min(520px, 96vw)" top="8%" @close="emit('close')">
    <div class="tf-modal-inner" @keydown.ctrl.enter.prevent="handleSave" @keydown.meta.enter.prevent="handleSave">
      <div class="tf-head">
        <div class="tf-title">transfer</div>
        <button type="button" class="b-close" @click="emit('close')">esc</button>
      </div>

      <div class="tf-field">
        <label class="tf-label">from account</label>
        <Select
          v-model="fromAccountId"
          :options="accountOptions"
          placeholder="select account"
        />
      </div>

      <div class="tf-field">
        <label class="tf-label">to account</label>
        <Select
          v-model="toAccountId"
          :options="toAccountOptions"
          placeholder="select account"
        />
      </div>

      <div class="tf-row">
        <div class="tf-field">
          <label class="tf-label">amount</label>
          <input v-model="amount" type="number" min="0" step="0.01" class="tf-input tf-sm" />
        </div>
        <div class="tf-field">
          <label class="tf-label">date</label>
          <input v-model="date" type="date" class="tf-input tf-sm" />
        </div>
      </div>

      <div class="tf-footer">
        <button class="btn ghost" @click="emit('close')">cancel</button>
        <button class="btn" :disabled="!canSave" @click="handleSave">transfer</button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.tf-modal-inner {
  padding: 16px;
}

.tf-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.tf-title {
  font-family: var(--mono);
  font-size: 0.9rem;
}

.tf-field {
  margin-bottom: 10px;
  flex: 1;
}

.tf-row {
  display: flex;
  gap: 10px;
}

.tf-label {
  display: block;
  font-size: 0.58rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.tf-input {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.78rem;
  padding: 8px 10px;
}

.tf-input:focus {
  outline: none;
  border-color: var(--accent);
}

.tf-sm {
  min-width: 0;
}

.tf-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

@media (max-width: 768px) {
  .tf-row,
  .tf-footer {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
