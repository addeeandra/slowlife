<script setup lang="ts">
</script>

<template>
  <div>
    <div class="page-hdr">
      <h2>events</h2>
      <span class="meta">meetings, agendas, holidays</span>
    </div>
    <div class="placeholder">events — coming soon</div>
  </div>
</template>

<style scoped>
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

.placeholder {
  color: var(--text-dim);
  font-size: 0.78rem;
  padding: 40px 0;
}
</style>
