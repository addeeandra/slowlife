<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import AppFab from './components/AppFab.vue'
import QuickCaptureModal from './components/QuickCaptureModal.vue'
import { useKeyboard } from './composables/useKeyboard'
import { useSpaces } from './composables/useSpaces'
import { useJournal } from './composables/useJournal'
import { useEvents } from './composables/useEvents'
import { useFinances } from './composables/useFinances'
import { usePinned } from './composables/usePinned'
import { useSidebar } from './composables/useSidebar'
import { useQuickCapture } from './composables/useQuickCapture'

const { init, destroy } = useKeyboard()
const { isOpen: sidebarOpen, toggle: toggleSidebar, close: closeSidebar } = useSidebar()
const { init: initQuickCapture, destroy: destroyQuickCapture } = useQuickCapture()

onMounted(async () => {
  init()
  initQuickCapture()
  if (import.meta.env.PROD) {
    window.addEventListener('contextmenu', blockContextMenu)
  }
  await Promise.all([
    useSpaces().load(),
    useJournal().load(),
    useEvents().load(),
    useFinances().load(),
    usePinned().load(),
  ])
})

onUnmounted(() => {
  destroy()
  destroyQuickCapture()
  if (import.meta.env.PROD) {
    window.removeEventListener('contextmenu', blockContextMenu)
  }
})

function blockContextMenu(e: MouseEvent) {
  e.preventDefault()
}
</script>

<template>
  <button v-if="!sidebarOpen" class="sb-toggle" @click="toggleSidebar">&#9776;</button>
  <div class="sb-overlay" :class="{ open: sidebarOpen }" @click="closeSidebar"></div>

  <div class="shell">
    <AppSidebar />
    <main class="main">
      <router-view />
    </main>
  </div>

  <AppFab />
  <QuickCaptureModal />
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

.sb-toggle {
  display: none;
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 30;
  width: 28px;
  height: 28px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-dim);
  cursor: pointer;
  font-size: 0.8rem;
  align-items: center;
  justify-content: center;
}

.sb-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 15;
}

.sb-overlay.open {
  display: block;
}

@media (max-width: 768px) {
  .main {
    margin-left: 0;
    padding: 48px 12px 60px;
  }

  .sb-toggle {
    display: flex;
  }
}
</style>
