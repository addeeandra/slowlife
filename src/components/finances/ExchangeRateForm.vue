<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '../BaseModal.vue'
import type { ExchangeRate } from '../../core/types'

const props = defineProps<{
  open: boolean
  rate?: ExchangeRate | null
  baseCurrency: string
}>()

const emit = defineEmits<{
  save: [data: { from_currency: string; to_currency: string; rate: number; effective_date: string }]
  delete: [id: number]
  close: []
}>()

const fromCurrency = ref('USD')
const toCurrency = ref('IDR')
const rate = ref('')
const effectiveDate = ref('')

const isEdit = computed(() => !!props.rate)
const canSave = computed(() => fromCurrency.value.trim().length === 3 && Number(rate.value) > 0 && effectiveDate.value.length > 0)

watch(() => props.open, open => {
  if (open) {
    if (props.rate) {
      fromCurrency.value = props.rate.from_currency
      toCurrency.value = props.rate.to_currency
      rate.value = String(props.rate.rate)
      effectiveDate.value = props.rate.effective_date
    } else {
      fromCurrency.value = 'USD'
      toCurrency.value = props.baseCurrency
      rate.value = ''
      effectiveDate.value = new Date().toISOString().slice(0, 10)
    }
  }
})

function handleSave() {
  if (!canSave.value) return
  emit('save', {
    from_currency: fromCurrency.value.trim().toUpperCase(),
    to_currency: toCurrency.value.trim().toUpperCase(),
    rate: Number(rate.value),
    effective_date: effectiveDate.value,
  })
}

function handleDelete() {
  if (!props.rate) return
  emit('delete', props.rate.id)
}
</script>

<template>
  <BaseModal :open="open" width="min(480px, 96vw)" top="8%" @close="emit('close')">
    <div class="ff-modal-inner">
      <div class="ff-head">
        <div class="ff-title">{{ isEdit ? 'edit exchange rate' : 'new exchange rate' }}</div>
        <button type="button" class="b-close" @click="emit('close')">esc</button>
      </div>
      <div class="ff-row">
        <div class="ff-field"><label class="ff-label">from</label><input v-model="fromCurrency" maxlength="3" class="ff-input ff-sm" /></div>
        <div class="ff-field"><label class="ff-label">to</label><input v-model="toCurrency" maxlength="3" class="ff-input ff-sm" /></div>
      </div>
      <div class="ff-row">
        <div class="ff-field"><label class="ff-label">rate</label><input v-model="rate" type="number" step="0.0001" class="ff-input ff-sm" /></div>
        <div class="ff-field"><label class="ff-label">effective date</label><input v-model="effectiveDate" type="date" class="ff-input ff-sm" /></div>
      </div>
      <div class="ff-footer">
        <div class="ff-left"><button v-if="isEdit" class="btn danger" @click="handleDelete">delete</button></div>
        <div class="ff-actions"><button class="btn ghost" @click="emit('close')">cancel</button><button class="btn" :disabled="!canSave" @click="handleSave">save</button></div>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.ff-modal-inner { padding: 16px; }
.ff-head, .ff-footer, .ff-row { display: flex; gap: 8px; }
.ff-head, .ff-footer { align-items: center; justify-content: space-between; }
.ff-title { font-family: var(--mono); font-size: 0.9rem; }
.ff-field { margin-bottom: 10px; flex: 1; }
.ff-label { display: block; font-size: 0.58rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
.ff-input { width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text); font-family: var(--mono); font-size: 0.78rem; padding: 8px 10px; }
.ff-input:focus { outline: none; border-color: var(--accent); }
.ff-sm { min-width: 0; }
.ff-left, .ff-actions { display: flex; gap: 8px; }
@media (max-width: 768px) { .ff-row, .ff-footer { flex-direction: column; align-items: stretch; } }
</style>
