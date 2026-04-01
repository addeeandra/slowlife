<script setup lang="ts">
import { MONTH_ABBR, DAY_ABBR } from '../../core/constants'

const now = new Date()
const day = DAY_ABBR[now.getDay()]
const date = `${MONTH_ABBR[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`
</script>

<template>
  <div class="date-bar">
    <div class="day">{{ day }}</div>
    <div class="date">{{ date }}</div>
  </div>
</template>

<style scoped>
.date-bar {
  text-align: center;
  margin-bottom: 16px;
}

.day {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-dim);
}

.date {
  font-size: 0.85rem;
  color: var(--text-mid);
}
</style>
