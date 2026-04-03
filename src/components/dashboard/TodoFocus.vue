<script setup lang="ts">
import { useTodos } from '../../composables/useTodos'
import { TODO_PRIORITIES } from '../../core/constants'

const { highPriorityOpen } = useTodos()
</script>

<template>
  <div class="c s4">
    <div class="c-t">
      todo focus
      <router-link to="/todos">all</router-link>
    </div>
    <div class="tf-list">
      <div
        v-if="!highPriorityOpen.length"
        style="font-size: 0.68rem; color: var(--text-dim); padding: 4px 0"
      >
        no high-priority todos
      </div>
      <router-link
        v-for="t in highPriorityOpen"
        :key="t.id"
        to="/todos"
        class="tf"
      >
        <span class="tf-p" :style="{ background: TODO_PRIORITIES[t.priority].color }"></span>
        <span class="tf-n">{{ t.title }}</span>
        <span class="tf-pri">{{ t.priority }}</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.tf-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tf {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  text-decoration: none;
  transition: opacity var(--dur-fast) var(--ease);
}

.tf:hover {
  opacity: 0.8;
}

.tf-p {
  width: 4px;
  height: 4px;
  flex-shrink: 0;
}

.tf-n {
  font-size: 0.72rem;
  color: var(--text);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tf-pri {
  font-size: 0.5rem;
  padding: 0 4px;
  border: 1px solid var(--border);
  color: var(--text-dim);
  flex-shrink: 0;
}
</style>
