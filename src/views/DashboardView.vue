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
import RecentAssets from '../components/dashboard/RecentAssets.vue'
import TodoFocus from '../components/dashboard/TodoFocus.vue'
import FocusRateCard from '../components/dashboard/FocusRateCard.vue'
</script>

<template>
  <div class="no-pointer no-select">
    <PageHeader title="dashboard" meta="signal, not noise" />
    <div class="dg">
      <NudgeCard />
      <SignalRow />
      <UpcomingEvents />
      <PinnedProjects />
      <TodoFocus />
      <ActivityHeatmap />
      <div class="s4 df">
        <FocusRateCard class="grow" />
        <MoodWeek />
      </div>
      <SubscriptionsCard />
      <RecentEntries />
      <RecentAssets />
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

.df {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.grow {
  flex-grow: 1;
}

@media (max-width: 768px) {
  .dg {
    grid-template-columns: 1fr;
  }
}
</style>
