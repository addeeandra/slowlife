<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import AppFab from './components/AppFab.vue'
import CommandPalette from './components/CommandPalette.vue'
import QuickCaptureModal from './components/QuickCaptureModal.vue'
import EventForm from './components/events/EventForm.vue'
import GoogleEventDetail from './components/events/GoogleEventDetail.vue'
import JournalEntryPreviewDialog from './components/journal/JournalEntryPreviewDialog.vue'
import TodoForm from './components/todos/TodoForm.vue'
import { useKeyboard } from './composables/useKeyboard'
import { useSpaces } from './composables/useSpaces'
import { useJournal } from './composables/useJournal'
import { useEvents } from './composables/useEvents'
import { useFinances } from './composables/useFinances'
import { usePinned } from './composables/usePinned'
import { useTodos } from './composables/useTodos'
import { useSidebar } from './composables/useSidebar'
import { useQuickCapture } from './composables/useQuickCapture'
import { useEventDialog } from './composables/useEventDialog'
import { useGoogleCalendarSync } from './composables/useGoogleCalendarSync'
import { useJournalPreviewDialog } from './composables/useJournalPreviewDialog'
import { useTodoDialog } from './composables/useTodoDialog'
import type { Todo, TodoPriority, TodoStatus } from './core/types'

const { init, destroy } = useKeyboard()
const { isOpen: sidebarOpen, toggle: toggleSidebar, close: closeSidebar } = useSidebar()
const { init: initQuickCapture, destroy: destroyQuickCapture } = useQuickCapture()
const { createEvent, updateEvent, deleteEvent } = useEvents()
useFinances()
const { calendars, load: loadGoogleSync } = useGoogleCalendarSync()
const { formOpen: eventFormOpen, editingEvent, prefillDate, googleEvent, closeForm: closeEventForm, closeGoogleDetail } = useEventDialog()
const { isOpen: journalPreviewOpen, entry: journalPreviewEntry, closeEntry: closeJournalPreview } = useJournalPreviewDialog()
const { formOpen: todoFormOpen, editingTodo, closeForm: closeTodoForm } = useTodoDialog()
const { createTodo, updateTodo, deleteTodo } = useTodos()

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
    useTodos().load(),
    loadGoogleSync(),
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

async function handleEventSave(data: Parameters<typeof createEvent>[0]) {
  if (editingEvent.value) {
    await updateEvent(editingEvent.value.id, data)
  } else {
    await createEvent(data)
  }
  closeEventForm()
}

async function handleEventDelete(id: number) {
  await deleteEvent(id)
  closeEventForm()
}

async function handleTodoSave(data: {
  title: string
  description: string | null
  priority: TodoPriority
  complexity: Todo['complexity']
  status: TodoStatus
  space_id: string | null
  category_id: string | null
  project_id: string | null
  due_date: string | null
}) {
  if (editingTodo.value) {
    const completedAt = data.status === 'done' && editingTodo.value.status !== 'done'
      ? new Date().toISOString().replace('T', ' ').slice(0, 19)
      : data.status !== 'done' ? null : editingTodo.value.completed_at
    await updateTodo(editingTodo.value.id, { ...data, completed_at: completedAt })
  } else {
    await createTodo(data)
  }
  closeTodoForm()
}

async function handleTodoDelete(id: number) {
  await deleteTodo(id)
  closeTodoForm()
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
  <CommandPalette />
  <QuickCaptureModal />
  <EventForm
    :open="eventFormOpen"
    :event="editingEvent"
    :prefill-date="prefillDate"
    @save="handleEventSave"
    @delete="handleEventDelete"
    @close="closeEventForm"
  />
  <GoogleEventDetail
    :open="!!googleEvent"
    :event="googleEvent"
    :calendars="calendars"
    @close="closeGoogleDetail"
  />
  <JournalEntryPreviewDialog
    :open="journalPreviewOpen"
    :entry="journalPreviewEntry"
    @close="closeJournalPreview"
  />
  <TodoForm
    :open="todoFormOpen"
    :todo="editingTodo"
    @save="handleTodoSave"
    @delete="handleTodoDelete"
    @close="closeTodoForm"
  />
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
