<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
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

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(() => props.open, open => {
  if (open) {
    document.addEventListener('keydown', onKeydown)
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
  } else {
    document.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

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
  <Teleport to="body">
    <div v-if="open" class="ff-backdrop" @click="emit('close')"></div>
    <div v-if="open" class="ff-modal">
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
  </Teleport>
</template>

<style scoped>
.ff-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); z-index: 120; }
.ff-modal { position: fixed; top: 8%; left: 50%; transform: translateX(-50%); width: min(480px, 96vw); max-height: 88vh; overflow-y: auto; background: var(--bg); border: 1px solid var(--border); z-index: 130; padding: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35); }
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
