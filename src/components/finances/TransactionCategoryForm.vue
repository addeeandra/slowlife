<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '../BaseModal.vue'
import type { TransactionCategory } from '../../core/types'

const props = defineProps<{
  open: boolean
  category?: TransactionCategory | null
}>()

const emit = defineEmits<{
  save: [data: { label: string; kind: 'income' | 'expense'; color: string; monthly_budget: number | null }]
  delete: [id: number]
  close: []
}>()

const label = ref('')
const kind = ref<'income' | 'expense'>('expense')
const color = ref('#c4956a')
const monthlyBudget = ref('')

const isEdit = computed(() => !!props.category)
const canSave = computed(() => label.value.trim().length > 0)

watch(() => props.open, open => {
  if (open) {
    if (props.category) {
      label.value = props.category.label
      kind.value = props.category.kind
      color.value = props.category.color
      monthlyBudget.value = props.category.monthly_budget === null ? '' : String(props.category.monthly_budget)
    } else {
      label.value = ''
      kind.value = 'expense'
      color.value = '#c4956a'
      monthlyBudget.value = ''
    }
  }
})

function handleSave() {
  if (!canSave.value) return
  emit('save', {
    label: label.value.trim(),
    kind: kind.value,
    color: color.value,
    monthly_budget: monthlyBudget.value ? Number(monthlyBudget.value) : null,
  })
}
</script>

<template>
  <BaseModal :open="open" width="min(480px, 96vw)" top="8%" @close="emit('close')">
    <div class="ff-modal-inner">
      <div class="ff-head">
        <div class="ff-title">{{ isEdit ? 'edit category' : 'new category' }}</div>
        <button type="button" class="b-close" @click="emit('close')">esc</button>
      </div>
      <div class="ff-field"><input v-model="label" class="ff-input" placeholder="category label" /></div>
      <div class="ff-field">
        <label class="ff-label">kind</label>
        <div class="pill-list">
          <button class="pill" :class="{ active: kind === 'expense' }" @click="kind = 'expense'">expense</button>
          <button class="pill" :class="{ active: kind === 'income' }" @click="kind = 'income'">income</button>
        </div>
      </div>
      <div class="ff-row">
        <div class="ff-field"><label class="ff-label">color</label><input v-model="color" class="ff-input ff-sm" /></div>
        <div class="ff-field"><label class="ff-label">monthly budget</label><input v-model="monthlyBudget" type="number" class="ff-input ff-sm" /></div>
      </div>
      <div class="ff-footer">
        <div class="ff-left"><button v-if="isEdit" class="btn danger" @click="emit('delete', category!.id)">delete</button></div>
        <div class="ff-actions"><button class="btn ghost" @click="emit('close')">cancel</button><button class="btn" :disabled="!canSave" @click="handleSave">save</button></div>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.ff-modal-inner { padding: 16px; }
.ff-head, .ff-footer, .ff-row { display: flex; gap: 8px; }
.ff-head, .ff-footer { align-items: center; justify-content: space-between; }
.ff-head { margin-bottom: 12px; }
.ff-title { font-family: var(--mono); font-size: 0.9rem; }
.ff-field { margin-bottom: 10px; flex: 1; }
.ff-label { display: block; font-size: 0.58rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
.ff-input { width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text); font-family: var(--mono); font-size: 0.78rem; padding: 8px 10px; }
.ff-input:focus { outline: none; border-color: var(--accent); }
.ff-sm { min-width: 0; }
.pill-list { display: flex; gap: 8px; flex-wrap: wrap; }
.pill { border: 1px solid var(--border); background: transparent; color: var(--text-mid); font-family: var(--mono); font-size: 0.68rem; padding: 6px 10px; }
.pill.active { color: var(--text); border-color: var(--text); }
.ff-left, .ff-actions { display: flex; gap: 8px; }
@media (max-width: 768px) { .ff-row, .ff-footer { flex-direction: column; align-items: stretch; } }
</style>
