<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  placeholder?: string
}>()

const emit = defineEmits<{
  confirm: [value: string]
  cancel: []
}>()

const inputValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    inputValue.value = ''
    await nextTick()
    inputRef.value?.focus()
  }
})

function confirm() {
  const value = inputValue.value.trim()
  if (value) {
    emit('confirm', value)
  } else {
    emit('cancel')
  }
}

function cancel() {
  emit('cancel')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') confirm()
  if (e.key === 'Escape') cancel()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="dlg-overlay" @click.self="cancel">
      <div class="dlg">
        <div class="dlg-title">{{ title }}</div>
        <input
          ref="inputRef"
          v-model="inputValue"
          class="dlg-input"
          :placeholder="placeholder"
          @keydown="onKeydown"
        />
        <div class="dlg-actions">
          <button class="dlg-btn cancel" @click="cancel">cancel</button>
          <button class="dlg-btn confirm" :disabled="!inputValue.trim()" @click="confirm">add</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dlg-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dlg {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 16px;
  min-width: 280px;
  max-width: 360px;
  width: 100%;
}

.dlg-title {
  font-family: var(--mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  margin-bottom: 10px;
}

.dlg-input {
  width: 100%;
  font-family: var(--mono);
  font-size: 0.78rem;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--border);
  padding: 6px 8px;
  outline: none;
}

.dlg-input:focus {
  border-color: var(--accent);
}

.dlg-input::placeholder {
  color: var(--text-dim);
}

.dlg-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 12px;
}

.dlg-btn {
  font-family: var(--mono);
  font-size: 0.68rem;
  padding: 4px 12px;
  cursor: pointer;
  transition: opacity var(--dur-base) var(--ease);
}

.dlg-btn.cancel {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-dim);
}

.dlg-btn.cancel:hover {
  color: var(--text-mid);
  border-color: var(--text-dim);
}

.dlg-btn.confirm {
  background: var(--text);
  border: 1px solid var(--text);
  color: var(--bg);
}

.dlg-btn.confirm:hover {
  opacity: 0.85;
}

.dlg-btn.confirm:disabled {
  opacity: 0.2;
  cursor: default;
}
</style>
