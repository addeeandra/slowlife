<script setup lang="ts">
import { useSpaces } from '../../composables/useSpaces'

const { currentSpace, switchSpace } = useSpaces()
</script>

<template>
  <div class="sb-tabs">
    <button
      class="sb-tab"
      :class="{ 'on-casual': currentSpace === 'casual' }"
      @click="switchSpace('casual')"
    >
      casual
    </button>
    <button
      class="sb-tab"
      :class="{ 'on-work': currentSpace === 'work' }"
      @click="switchSpace('work')"
    >
      work
    </button>
  </div>
</template>

<style scoped>
.sb-tabs {
  display: flex;
  gap: 1px;
  padding: 2px 6px;
}

.sb-tab {
  flex: 1;
  padding: 3px 0;
  text-align: center;
  font-family: var(--mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border: 1px solid var(--border);
  background: none;
  color: var(--text-dim);
  cursor: pointer;
  transition: all var(--dur-base) var(--ease);
}

.sb-tab:first-child {
  border-right: none;
}

.sb-tab:hover {
  color: var(--text-mid);
}

.sb-tab.on-casual {
  background: var(--accent-dim);
  color: var(--accent);
  border-color: var(--accent-dim);
}

.sb-tab.on-work {
  background: var(--work-dim);
  color: var(--work);
  border-color: var(--work-dim);
}
</style>
