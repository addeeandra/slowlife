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
</script>

<template>
  <div>
    <PageHeader title="dashboard" meta="signal, not noise" />
    <div class="dg">
      <NudgeCard />
      <SignalRow />
      <ActivityHeatmap />
      <PinnedProjects />
      <UpcomingEvents />
      <SubscriptionsCard />
      <MoodWeek />
      <RecentEntries />
    </div>
  </div>
</template>

<style scoped>
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
