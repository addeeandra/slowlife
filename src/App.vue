<script setup lang="ts">
import AppSidebar from './components/AppSidebar.vue'
</script>

<template>
  <div class="shell">
    <AppSidebar />
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
}

.main {
  flex: 1;
  margin-left: var(--sidebar-w);
  padding: 16px 24px 60px;
}

@media (max-width: 768px) {
  .main {
    margin-left: 0;
    padding: 12px 12px 60px;
  }
}
</style>
