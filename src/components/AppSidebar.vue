<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useSidebar } from '../composables/useSidebar'
import SpaceTabs from './sidebar/SpaceTabs.vue'
import CategoryTree from './sidebar/CategoryTree.vue'
import StreakFooter from './sidebar/StreakFooter.vue'

const router = useRouter()
const route = useRoute()
const { isOpen, closeIfMobile } = useSidebar()

function isActive(name: string) {
  return route.name === name
}

function navigateTo(path: string) {
  router.push(path)
  closeIfMobile()
}
</script>

<template>
  <aside class="sidebar" :class="{ open: isOpen }">
    <div class="sb-brand">slowlife<span>v0</span></div>

    <nav class="sb-nav">
      <button
        class="sb-item"
        :class="{ active: isActive('dashboard') }"
        @click="navigateTo('/')"
      >
        dashboard
        <span class="sb-k">ctrl+1</span>
      </button>
      <button
        class="sb-item"
        :class="{ active: isActive('events') }"
        @click="navigateTo('/events')"
      >
        events
        <span class="sb-k">ctrl+2</span>
      </button>
      <button
        class="sb-item"
        :class="{ active: isActive('finances') }"
        @click="navigateTo('/finances')"
      >
        finances
        <span class="sb-k">ctrl+3</span>
      </button>
      <button
        class="sb-item"
        :class="{ active: isActive('todos') }"
        @click="navigateTo('/todos')"
      >
        todos
        <span class="sb-k">ctrl+4</span>
      </button>
    </nav>

    <div class="sb-sep"></div>

    <div class="sb-label">journal</div>
    <SpaceTabs />
    <CategoryTree />
    <StreakFooter />
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-w);
  background: var(--bg);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 20;
  overflow-y: auto;
  transform: translateX(-100%);
  transition: transform var(--dur-slow) var(--ease);
}

.sidebar.open {
  transform: translateX(0);
}

.sb-brand {
  padding: 14px 12px 10px;
  border-bottom: 1px solid var(--border);
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  color: var(--text);
}

.sb-brand span {
  color: var(--text-dim);
  font-size: 0.7rem;
  margin-left: 4px;
}

.sb-nav {
  padding: 6px 6px 2px;
}

.sb-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  width: 100%;
  font-family: var(--mono);
  font-size: 0.78rem;
  color: var(--text-mid);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all var(--dur-fast) var(--ease);
}

.sb-item:hover {
  color: var(--text);
  background: var(--bg-hover);
}

.sb-item.active {
  color: var(--accent);
  background: var(--accent-dim);
}

.sb-k {
  margin-left: auto;
  font-size: 0.6rem;
  color: var(--text-dim);
  opacity: 0.6;
}

.sb-sep {
  height: 1px;
  background: var(--border);
  margin: 6px 6px;
}

.sb-label {
  font-size: 0.6rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 8px 8px 3px;
}

@media (max-width: 768px) {
  .sidebar {
    box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  }

  .sidebar.open {
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
  }
}
</style>
