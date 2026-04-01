<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import EventRow from '../components/events/EventRow.vue'
import { useEvents } from '../composables/useEvents'

const { groupedByDate } = useEvents()

const groups = computed(() => groupedByDate())
</script>

<template>
  <div>
    <PageHeader title="events" meta="meetings, agendas, holidays" />
    <div class="page-area">
      <template v-for="group in groups" :key="group.date">
        <div class="ev-page-group" :class="{ 'today-g': group.isToday }">
          {{ group.label }}
        </div>
        <EventRow v-for="ev in group.events" :key="ev.id" :event="ev" />
      </template>
      <div v-if="!groups.length" class="empty">no events</div>
    </div>
  </div>
</template>

<style scoped>
.page-area {
  max-width: 580px;
}

.ev-page-group {
  font-size: 0.6rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 14px 0 4px;
  font-weight: 600;
}

.ev-page-group.today-g {
  color: var(--accent);
}

.empty {
  text-align: center;
  padding: 30px;
  color: var(--text-dim);
  font-size: 0.75rem;
}
</style>
