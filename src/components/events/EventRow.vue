<script setup lang="ts">
import type { Event } from '../../core/types'

defineProps<{ event: Event; showType?: boolean }>()
const emit = defineEmits<{ select: [event: Event] }>()
</script>

<template>
  <div class="ev" @click="emit('select', event)">
    <span class="ev-t">{{ event.time || '--:--' }}</span>
    <span class="ev-d" :style="{ background: event.color }"></span>
    <span class="ev-n">{{ event.title }}</span>
    <span v-if="event.source === 'google'" class="ev-src">google</span>
    <span class="ev-tag" :class="event.type">{{ event.type }}</span>
  </div>
</template>

<style scoped>
.ev {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 0;
  cursor: pointer;
  transition: background var(--dur-base) var(--ease);
}

.ev:hover {
  background: var(--bg-hover);
}

.ev-t {
  font-size: 0.6rem;
  color: var(--text-dim);
  width: 38px;
  flex-shrink: 0;
}

.ev-d {
  width: 4px;
  height: 4px;
  flex-shrink: 0;
}

.ev-n {
  font-size: 0.72rem;
  color: var(--text);
  flex: 1;
}

.ev-tag {
  font-size: 0.5rem;
  padding: 0 4px;
  border: 1px solid var(--border);
  color: var(--text-dim);
}

.ev-tag.meeting {
  border-color: var(--work-dim);
  color: var(--work);
}

.ev-tag.holiday {
  border-color: var(--green-dim);
  color: var(--green);
}

.ev-tag.reminder {
  border-color: var(--red-dim, #3d1f1f);
  color: var(--red);
}

.ev-src {
  font-size: 0.5rem;
  padding: 0 4px;
  border: 1px solid var(--accent);
  color: var(--accent);
}
</style>
