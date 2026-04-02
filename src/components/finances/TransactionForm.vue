<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import type { Transaction } from '../../core/types'
import { useFinances } from '../../composables/useFinances'

const props = defineProps<{
  open: boolean
  transaction?: Transaction | null
}>()

const emit = defineEmits<{
  save: [data: { account_id: number; description: string; amount: number; type: 'income' | 'expense'; date: string; category_id: number | null }]
  delete: [id: number]
  close: []
}>()

const { accounts, expenseCategories, incomeCategories } = useFinances()

const accountId = ref<number | null>(null)
const description = ref('')
const amount = ref('')
const type = ref<'income' | 'expense'>('expense')
const date = ref('')
const categoryId = ref<number | null>(null)
const confirmDelete = ref(false)

const isEdit = computed(() => !!props.transaction)
const canSave = computed(() => {
  const numericAmount = Number(amount.value)
  return description.value.trim().length > 0 && !!accountId.value && date.value.length > 0 && numericAmount > 0
})

const visibleCategories = computed(() =>
  type.value === 'income' ? incomeCategories.value : expenseCategories.value
)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(() => props.open, (open) => {
  if (open) {
    document.addEventListener('keydown', onKeydown)
    confirmDelete.value = false
    if (props.transaction) {
      accountId.value = props.transaction.account_id
      description.value = props.transaction.description
      amount.value = String(Math.abs(props.transaction.amount))
      type.value = props.transaction.type === 'income' ? 'income' : 'expense'
      date.value = props.transaction.date
      categoryId.value = props.transaction.category_id
    } else {
      accountId.value = accounts.value[0]?.id ?? null
      description.value = ''
      amount.value = ''
      type.value = 'expense'
      date.value = new Date().toISOString().slice(0, 10)
      categoryId.value = null
    }
  } else {
    document.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

function handleSave() {
  if (!canSave.value || !accountId.value) return
  emit('save', {
    account_id: accountId.value,
    description: description.value.trim(),
    amount: Number(amount.value),
    type: type.value,
    date: date.value,
    category_id: categoryId.value,
  })
}

watch(type, () => {
  if (!visibleCategories.value.find(category => category.id === categoryId.value)) {
    categoryId.value = null
  }
})

function handleDelete() {
  if (!props.transaction) return
  if (!confirmDelete.value) {
    confirmDelete.value = true
    return
  }
  emit('delete', props.transaction.id)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="ff-backdrop" @click="emit('close')"></div>
    <div v-if="open" class="ff-modal">
      <div class="ff-head">
        <div class="ff-title">{{ isEdit ? 'edit transaction' : 'new transaction' }}</div>
        <button type="button" class="b-close" @click="emit('close')">esc</button>
      </div>

      <div class="ff-field">
        <input
          v-model="description"
          type="text"
          placeholder="description"
          class="ff-input"
          @keydown.ctrl.enter.prevent="handleSave"
        />
      </div>

      <div class="ff-field">
        <label class="ff-label">account</label>
        <select v-model="accountId" class="ff-input">
          <option :value="null" disabled>select account</option>
          <option v-for="account in accounts" :key="account.id" :value="account.id">
            {{ account.name }}
          </option>
        </select>
      </div>

      <div class="ff-field">
        <label class="ff-label">type</label>
        <div class="pill-list">
          <button
            class="pill"
            :class="{ active: type === 'expense', exp: type === 'expense' }"
            @click="type = 'expense'"
          >
            expense
          </button>
          <button
            class="pill"
            :class="{ active: type === 'income', inc: type === 'income' }"
            @click="type = 'income'"
          >
            income
          </button>
        </div>
      </div>

      <div class="ff-field">
        <label class="ff-label">category</label>
        <select v-model="categoryId" class="ff-input">
          <option :value="null">uncategorized</option>
          <option v-for="category in visibleCategories" :key="category.id" :value="category.id">
            {{ category.label }}
          </option>
        </select>
      </div>

      <div class="ff-row">
        <div class="ff-field">
          <label class="ff-label">amount</label>
          <input v-model="amount" type="number" min="0" step="0.01" class="ff-input ff-sm" />
        </div>
        <div class="ff-field">
          <label class="ff-label">date</label>
          <input v-model="date" type="date" class="ff-input ff-sm" />
        </div>
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
  </Teleport>
</template>

<style scoped>
.ff-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 120;
}

.ff-modal {
  position: fixed;
  top: 8%;
  left: 50%;
  transform: translateX(-50%);
  width: min(520px, 96vw);
  background: var(--bg);
  border: 1px solid var(--border);
  z-index: 130;
  padding: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
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
  border-color: var(--text);
}

.ff-sm {
  min-width: 0;
}

.pill-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pill {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-mid);
  font-family: var(--mono);
  font-size: 0.68rem;
  padding: 6px 10px;
  text-transform: lowercase;
}

.pill.active.inc {
  border-color: var(--green);
  color: var(--green);
  background: color-mix(in srgb, var(--green) 12%, transparent);
}

.pill.active.exp {
  border-color: var(--red);
  color: var(--red);
  background: color-mix(in srgb, var(--red) 12%, transparent);
}

.ff-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  gap: 8px;
}

.ff-left,
.ff-actions {
  display: flex;
  gap: 8px;
}

.btn {
  border: 1px solid var(--border);
  background: var(--bg-hover);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.72rem;
  padding: 7px 10px;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn.ghost {
  background: transparent;
}

.btn.danger {
  color: var(--red);
  border-color: var(--red);
}

.b-close {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 0.68rem;
  padding: 4px 6px;
}

@media (max-width: 768px) {
  .ff-modal {
    top: 6%;
  }

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
