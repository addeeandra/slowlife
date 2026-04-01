<script setup lang="ts">
defineProps<{
  title: string
  meta?: string
  breadcrumbs?: { label: string; to?: string }[]
}>()
</script>

<template>
  <div v-if="breadcrumbs?.length" class="bc">
    <template v-for="(crumb, i) in breadcrumbs" :key="i">
      <router-link v-if="crumb.to" :to="crumb.to">{{ crumb.label }}</router-link>
      <span v-else class="bc-cur">{{ crumb.label }}</span>
      <span v-if="i < breadcrumbs.length - 1"> / </span>
    </template>
  </div>
  <div class="page-hdr">
    <h2>{{ title }}</h2>
    <span v-if="meta" class="meta">{{ meta }}</span>
  </div>
</template>

<style scoped>
.bc {
  font-size: 0.65rem;
  color: var(--text-dim);
  margin-bottom: 4px;
}

.bc a {
  color: var(--text-mid);
  text-decoration: none;
}

.bc a:hover {
  color: var(--accent);
}

.bc-cur {
  color: var(--text);
}

.page-hdr {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.page-hdr h2 {
  font-family: var(--mono);
  font-size: 0.9rem;
  font-weight: 400;
}

.meta {
  font-size: 0.65rem;
  color: var(--text-dim);
}
</style>
