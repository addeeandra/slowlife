<script setup lang="ts">
import { useJournal } from '../../composables/useJournal'

const { streak } = useJournal()
</script>

<template>
  <div class="sb-footer">
    <template v-if="streak > 0">
      <strong>{{ streak }}</strong> day streak
    </template>
    <template v-else>
      start your streak
    </template>
  </div>
</template>

<style scoped>
.sb-footer {
  padding: 8px 12px;
  border-top: 1px solid var(--border);
  margin-top: auto;
  font-size: 0.65rem;
  color: var(--text-dim);
}

.sb-footer strong {
  color: var(--accent);
}
</style>
