<script setup lang="ts">
import { ref, computed } from 'vue'

const text = defineModel<string>({ default: '' })
const emit = defineEmits<{ save: [] }>()

const savedFeedback = ref(false)

const wordCount = computed(() => {
  const trimmed = text.value.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
})

const canSave = computed(() => text.value.trim().length > 0)

function save() {
  if (!canSave.value) return
  emit('save')
  savedFeedback.value = true
  setTimeout(() => {
    savedFeedback.value = false
  }, 1000)
}
</script>

<template>
  <div class="editor-c">
    <textarea
      id="j-editor"
      v-model="text"
      placeholder="start writing..."
    ></textarea>
    <div class="editor-ft">
      <span class="wc">{{ wordCount }} words</span>
      <button class="save-btn" :disabled="!canSave" @click="save">
        {{ savedFeedback ? 'saved' : 'save' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.editor-c {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 16px;
  margin-bottom: 12px;
}

.editor-c textarea {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-family: var(--mono);
  font-size: 0.82rem;
  line-height: 1.7;
  color: var(--text);
  background: transparent;
  min-height: 140px;
}

.editor-c textarea::placeholder {
  color: var(--text-dim);
}

.editor-ft {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.wc {
  font-size: 0.6rem;
  color: var(--text-dim);
}

.save-btn {
  font-family: var(--mono);
  font-size: 0.68rem;
  padding: 4px 12px;
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--bg);
  cursor: pointer;
  transition: opacity var(--dur-base) var(--ease);
}

.save-btn:hover {
  opacity: 0.85;
}

.save-btn:disabled {
  opacity: 0.2;
  cursor: default;
}
</style>
