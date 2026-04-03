<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import type { Subscription } from '../../core/types'

const props = defineProps<{
  open: boolean
  subscription?: Subscription | null
}>()

const emit = defineEmits<{
  save: [data: { name: string; amount: number; currency: string; cycle: string; next_date: string; color: string }]
  cancel: [id: number]
  restore: [id: number]
  delete: [id: number]
  close: []
}>()

const name = ref('')
const amount = ref('')
const currency = ref('IDR')
const cycle = ref('monthly')
const nextDate = ref('')
const color = ref('#c4956a')

const isEdit = computed(() => !!props.subscription)
const canSave = computed(() => name.value.trim().length > 0 && Number(amount.value) > 0 && nextDate.value.length > 0)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(() => props.open, open => {
  if (open) {
    document.addEventListener('keydown', onKeydown)
    if (props.subscription) {
      name.value = props.subscription.name
      amount.value = String(props.subscription.amount)
      currency.value = props.subscription.currency
      cycle.value = props.subscription.cycle
      nextDate.value = props.subscription.next_date
      color.value = props.subscription.color
    } else {
      name.value = ''
      amount.value = ''
      currency.value = 'IDR'
      cycle.value = 'monthly'
      nextDate.value = new Date().toISOString().slice(0, 10)
      color.value = '#c4956a'
    }
  } else {
    document.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

function handleSave() {
  if (!canSave.value) return
  emit('save', {
    name: name.value.trim(),
    amount: Number(amount.value),
    currency: currency.value.trim().toUpperCase(),
    cycle: cycle.value,
    next_date: nextDate.value,
    color: color.value,
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="ff-backdrop" @click="emit('close')"></div>
    <div v-if="open" class="ff-modal">
      <div class="ff-head">
        <div class="ff-title">{{ isEdit ? 'edit subscription' : 'new subscription' }}</div>
        <button type="button" class="b-close" @click="emit('close')">esc</button>
      </div>
      <div class="ff-field"><input v-model="name" class="ff-input" placeholder="name" /></div>
      <div class="ff-row">
        <div class="ff-field"><label class="ff-label">amount</label><input v-model="amount" type="number" class="ff-input ff-sm" /></div>
        <div class="ff-field"><label class="ff-label">currency</label><input v-model="currency" maxlength="3" class="ff-input ff-sm" /></div>
      </div>
      <div class="ff-row">
        <div class="ff-field">
          <label class="ff-label">cycle</label>
          <select v-model="cycle" class="ff-input ff-sm">
            <option value="monthly">monthly</option>
            <option value="quarterly">quarterly</option>
            <option value="yearly">yearly</option>
          </select>
        </div>
        <div class="ff-field"><label class="ff-label">next date</label><input v-model="nextDate" type="date" class="ff-input ff-sm" /></div>
      </div>
      <div class="ff-field"><label class="ff-label">color</label><input v-model="color" class="ff-input" /></div>
      <div class="ff-footer">
        <div class="ff-left">
          <button v-if="isEdit && !subscription?.cancelled_at" class="btn" @click="emit('cancel', subscription!.id)">cancel tracking</button>
          <button v-if="isEdit && subscription?.cancelled_at" class="btn" @click="emit('restore', subscription!.id)">restore</button>
          <button v-if="isEdit" class="btn danger" @click="emit('delete', subscription!.id)">delete</button>
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
.ff-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); z-index: 120; }
.ff-modal { position: fixed; top: 8%; left: 50%; transform: translateX(-50%); width: min(520px, 96vw); max-height: 88vh; overflow-y: auto; background: var(--bg); border: 1px solid var(--border); z-index: 130; padding: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35); }
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
