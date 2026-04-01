<script setup lang="ts">
import { ref, watch } from 'vue'
import { PROMPTS } from '../../core/constants'

const props = defineProps<{ space: string }>()

const promptText = ref('')

function shuffle() {
  const pool = PROMPTS[props.space] || PROMPTS.casual
  const current = promptText.value
  let next: string
  do {
    next = pool[Math.floor(Math.random() * pool.length)]
  } while (next === current && pool.length > 1)
  promptText.value = next
}

watch(() => props.space, shuffle, { immediate: true })
</script>

<template>
  <div class="prompt-c" @click="shuffle">
    <div class="ph">prompt</div>
    <div class="pt">{{ promptText }}</div>
  </div>
</template>

<style scoped>
.prompt-c {
  background: var(--accent-dim);
  border: 1px solid var(--accent-dim);
  padding: 10px 12px;
  margin-bottom: 12px;
  cursor: pointer;
}

.prompt-c:hover {
  opacity: 0.8;
}

.ph {
  font-size: 0.55rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent);
  margin-bottom: 2px;
}

.pt {
  font-size: 0.78rem;
  color: var(--text-mid);
  font-style: italic;
}

:deep(.space-work) .prompt-c {
  background: var(--work-dim);
  border-color: var(--work-dim);
}

:deep(.space-work) .ph {
  color: var(--work);
}
</style>
