<script setup lang="ts">
import { computed } from 'vue'
import { useJournal } from '../../composables/useJournal'

const { moodByDay } = useJournal()

const days = computed(() => moodByDay())
</script>

<template>
  <div class="c s3">
    <div class="c-t">mood</div>
    <div class="mw">
      <div v-for="(d, i) in days" :key="i" class="md">
        <div class="md-l">{{ d.day }}</div>
        <div v-if="d.emoji" class="md-e">{{ d.emoji }}</div>
        <div v-else class="md-nil"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mw {
  display: flex;
  gap: 3px;
}

.md {
  flex: 1;
  text-align: center;
}

.md-l {
  font-size: 0.5rem;
  color: var(--text-dim);
  margin-bottom: 1px;
}

.md-e {
  font-size: 0.75rem;
}

.md-nil {
  width: 12px;
  height: 12px;
  background: var(--border);
  margin: 0 auto;
}
</style>
