<script setup lang="ts">
import type { MoodKey } from '../../core/types'
import { MOODS } from '../../core/constants'

const model = defineModel<MoodKey | null>()

const moods: MoodKey[] = ['awful', 'bad', 'okay', 'good', 'great']

function select(mood: MoodKey) {
  model.value = model.value === mood ? null : mood
}
</script>

<template>
  <div class="mood-sec">
    <div class="ml">mood</div>
    <div class="mood-opts">
      <button
        v-for="mood in moods"
        :key="mood"
        class="mood-btn"
        :class="{ selected: model === mood }"
        @click="select(mood)"
      >
        {{ MOODS[mood] }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.mood-sec {
  text-align: center;
  margin-bottom: 16px;
}

.ml {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  margin-bottom: 6px;
}

.mood-opts {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.mood-btn {
  width: 30px;
  height: 30px;
  border: 1px solid var(--border);
  background: none;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mood-btn:hover {
  border-color: var(--accent);
}

.mood-btn.selected {
  border-color: var(--accent);
  background: var(--accent-dim);
}
</style>
