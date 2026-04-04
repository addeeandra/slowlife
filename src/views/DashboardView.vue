<script setup lang="ts">
import PageHeader from '../components/PageHeader.vue'
import NudgeCard from '../components/dashboard/NudgeCard.vue'
import SignalRow from '../components/dashboard/SignalRow.vue'
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap.vue'
import PinnedProjects from '../components/dashboard/PinnedProjects.vue'
import UpcomingEvents from '../components/dashboard/UpcomingEvents.vue'
import SubscriptionsCard from '../components/dashboard/SubscriptionsCard.vue'
import MoodWeek from '../components/dashboard/MoodWeek.vue'
import RecentEntries from '../components/dashboard/RecentEntries.vue'
import TodoFocus from '../components/dashboard/TodoFocus.vue'
import FocusRateCard from '../components/dashboard/FocusRateCard.vue'
</script>

<template>
  <div class="no-pointer no-select">
    <PageHeader title="dashboard" meta="signal, not noise" />
    <div class="dg">
      <NudgeCard />
      <SignalRow />
      <ActivityHeatmap />
      <PinnedProjects />
      <TodoFocus />
      <FocusRateCard />
      <UpcomingEvents />
      <MoodWeek />
      <SubscriptionsCard />
      <RecentEntries />
    </div>
  </div>
</template>

<style scoped>
.no-pointer {
  cursor: default;
}
.no-select {
  user-select: none;
}

.dg {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 10px;
}

@media (max-width: 768px) {
  .dg {
    grid-template-columns: 1fr;
  }
}
</style>
