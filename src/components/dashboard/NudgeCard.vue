<script setup lang="ts">
import { computed } from 'vue'
import { useJournal } from '../../composables/useJournal'

const { hasEntriesToday, streak } = useJournal()

const message = computed(() => {
  const hr = new Date().getHours()
  let msg = hr < 12
    ? 'morning. a fresh page awaits.'
    : hr < 17
      ? "afternoon -- what's on your mind?"
      : 'evening. how did today go?'
  if (streak.value > 0) {
    msg += ` <strong>${streak.value}-day streak</strong> on the line.`
  }
  return msg
})

const show = computed(() => !hasEntriesToday())
</script>

<template>
  <div v-if="show" class="nudge">
    <div class="n-l">today</div>
    <span v-html="message"></span>
  </div>
</template>

<style scoped>
.nudge {
  grid-column: span 12;
  background: var(--accent-dim);
  border: 1px solid var(--accent-dim);
  padding: 8px 12px;
  font-size: 0.75rem;
  color: var(--text);
}

.n-l {
  font-size: 0.55rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent);
  margin-bottom: 2px;
}
</style>
