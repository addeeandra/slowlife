<script setup lang="ts">
import { computed } from 'vue'
import { useEvents } from '../../composables/useEvents'
import { MONTH_ABBR } from '../../core/constants'

const { upcomingEvents } = useEvents()

const events = computed(() => upcomingEvents(5))

function dateLabel(dateStr: string): string {
  const todayISO = new Date().toISOString().slice(0, 10)
  if (dateStr === todayISO) return 'today'
  const d = new Date(dateStr + 'T00:00:00')
  return `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`
}
</script>

<template>
  <div class="c s4">
    <div class="c-t">
      upcoming
      <router-link to="/events">all</router-link>
    </div>
    <div class="ev-list">
      <div
        v-if="!events.length"
        style="font-size: 0.68rem; color: var(--text-dim); padding: 4px 0"
      >
        nothing scheduled
      </div>
      <div v-for="ev in events" :key="ev.id + '-' + ev.occurrence_date" class="ev">
        <span class="ev-t">{{ ev.time || '--:--' }}</span>
        <span class="ev-d" :style="{ background: ev.color }"></span>
        <span class="ev-n">{{ ev.title }}</span>
        <span v-if="ev.source === 'google'" class="ev-src">google</span>
        <span class="ev-tag" :class="ev.type">{{ dateLabel(ev.occurrence_date) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ev-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ev {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
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
