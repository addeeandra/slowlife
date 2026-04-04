<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import EntryEditor from '../components/journal/EntryEditor.vue'
import TimelineEntry from '../components/journal/TimelineEntry.vue'
import TodoRow from '../components/todos/TodoRow.vue'
import EventRow from '../components/events/EventRow.vue'
import { useFocusMode } from '../composables/useFocusMode'
import { useJournal } from '../composables/useJournal'
import { useTodos } from '../composables/useTodos'
import { useEvents } from '../composables/useEvents'
import { useSpaces } from '../composables/useSpaces'
import { useTodoDialog } from '../composables/useTodoDialog'
import { useEventDialog } from '../composables/useEventDialog'
import { toISO } from '../core/constants'

const router = useRouter()
const { activeTarget, targetLabel, exit, openLauncher } = useFocusMode()
const { saveEntry, entries } = useJournal()
const { todos, toggleStatus } = useTodos()
const { events } = useEvents()
const { spaces } = useSpaces()
const { openEdit: openTodoEdit, openNewWithContext: openTodoCreate } = useTodoDialog()
const { openEvent, openCreateWithContext } = useEventDialog()

const journalText = ref('')

const focusSpace = computed(() => spaces.value.find(item => item.id === activeTarget.value?.spaceId) || null)

const focusedEntries = computed(() => {
  if (!activeTarget.value) return []
  return entries.value.filter(entry => {
    const matchesCategory = entry.space === activeTarget.value?.spaceId && entry.category === activeTarget.value?.categoryId
    if (!matchesCategory) return false
    if (activeTarget.value?.kind === 'project') return entry.item === activeTarget.value.projectId
    return true
  }).slice(0, 8)
})

const focusedTodos = computed(() => {
  if (!activeTarget.value) return []
  return todos.value
    .filter(todo => {
      const matchesCategory = todo.space_id === activeTarget.value?.spaceId && todo.category_id === activeTarget.value?.categoryId
      if (!matchesCategory) return false
      if (activeTarget.value?.kind === 'project') return todo.project_id === activeTarget.value.projectId
      return true
    })
    .sort((a, b) => {
      const statusWeight = a.status === 'done' || a.status === 'cancelled' ? 1 : 0
      const otherStatusWeight = b.status === 'done' || b.status === 'cancelled' ? 1 : 0
      return statusWeight - otherStatusWeight || a.priority.localeCompare(b.priority) || (a.due_date || '9').localeCompare(b.due_date || '9')
    })
})

const focusedEvents = computed(() => {
  if (!activeTarget.value) return []
  const today = toISO(new Date())
  return events.value
    .filter(event => event.space_id === activeTarget.value?.spaceId && event.category_id === activeTarget.value?.categoryId)
    .filter(event => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
    .slice(0, 18)
})

const journalMeta = computed(() => focusedEntries.value.length === 1 ? '1 note' : `${focusedEntries.value.length} notes`)
const todoMeta = computed(() => {
  const openCount = focusedTodos.value.filter(todo => todo.status === 'open' || todo.status === 'in_progress').length
  return openCount === 1 ? '1 active' : `${openCount} active`
})
const eventMeta = computed(() => focusedEvents.value.length === 1 ? '1 upcoming' : `${focusedEvents.value.length} upcoming`)

watch(activeTarget, async (target) => {
  if (!target) {
    openLauncher()
    await router.replace('/')
  }
}, { immediate: true })

async function handleSaveJournal() {
  if (!activeTarget.value || !journalText.value.trim()) return
  await saveEntry(
    activeTarget.value.spaceId,
    activeTarget.value.categoryId,
    activeTarget.value.kind === 'project' ? activeTarget.value.projectId : null,
    journalText.value.trim(),
    null,
    []
  )
  journalText.value = ''
}

function createTodo() {
  if (!activeTarget.value) return
  openTodoCreate({
    space_id: activeTarget.value.spaceId,
    category_id: activeTarget.value.categoryId,
    project_id: activeTarget.value.kind === 'project' ? activeTarget.value.projectId : null,
  })
}

function createEvent() {
  if (!activeTarget.value) return
  openCreateWithContext({
    date: toISO(new Date()),
    space_id: activeTarget.value.spaceId,
    category_id: activeTarget.value.categoryId,
  })
}

</script>

<template>
  <div class="focus-shell">
    <header class="focus-head">
      <div>
        <div class="focus-kicker">focus mode</div>
        <h1>{{ targetLabel }}</h1>
        <div class="focus-meta">
          <span>{{ activeTarget?.kind === 'project' ? 'project focus' : 'category focus' }}</span>
          <span>events shared by category</span>
          <span>esc to exit</span>
        </div>
      </div>
      <div class="focus-actions">
        <button class="btn ghost" @click="openLauncher">change target</button>
        <button class="btn" @click="exit">exit focus mode</button>
      </div>
    </header>

    <div class="focus-grid">
      <section class="focus-panel focus-journal">
        <div class="focus-panel-head">
          <div>
            <div class="focus-panel-title">journal</div>
            <div class="focus-panel-meta">{{ journalMeta }}</div>
          </div>
        </div>
        <EntryEditor v-model="journalText" @save="handleSaveJournal" />
        <div v-if="!focusedEntries.length" class="focus-empty">no notes in this focus context yet.</div>
        <TimelineEntry
          v-for="entry in focusedEntries"
          :key="entry.id"
          :entry="entry"
          :space="focusSpace?.id || 'casual'"
        />
      </section>

      <section class="focus-panel">
        <div class="focus-panel-head">
          <div>
            <div class="focus-panel-title">todos</div>
            <div class="focus-panel-meta">{{ todoMeta }}</div>
          </div>
          <button class="mini-btn" @click="createTodo">+ todo</button>
        </div>
        <div class="focus-list">
          <TodoRow
            v-for="todo in focusedTodos"
            :key="todo.id"
            :todo="todo"
            @toggle="toggleStatus"
            @click="openTodoEdit"
          />
          <div v-if="!focusedTodos.length" class="focus-empty">no todos for this focus target.</div>
        </div>
      </section>

      <section class="focus-panel">
        <div class="focus-panel-head">
          <div>
            <div class="focus-panel-title">events</div>
            <div class="focus-panel-meta">{{ eventMeta }}</div>
          </div>
          <button class="mini-btn" @click="createEvent">+ event</button>
        </div>
        <div class="focus-list">
          <div v-for="event in focusedEvents" :key="`${event.id}-${event.date}`" class="focus-event-row">
            <div class="focus-event-date">{{ event.date }}</div>
            <EventRow :event="event" @select="openEvent" />
          </div>
          <div v-if="!focusedEvents.length" class="focus-empty">no upcoming category events.</div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.focus-shell {
  min-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.focus-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.focus-kicker {
  font-size: 0.58rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
  margin-bottom: 4px;
}

.focus-head h1 {
  font-size: 1.15rem;
  font-weight: 400;
}

.focus-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 6px;
  font-size: 0.62rem;
  color: var(--text-dim);
}

.focus-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.focus-grid {
  display: grid;
  grid-template-columns: minmax(360px, 1.2fr) minmax(280px, 0.9fr) minmax(280px, 0.9fr);
  gap: 14px;
  min-height: 0;
  flex: 1;
}

.focus-panel {
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  background: var(--bg-card);
  padding: 12px;
}

.focus-journal {
  overflow: auto;
}

.focus-panel-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.focus-panel-title {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-mid);
}

.focus-panel-meta {
  font-size: 0.6rem;
  color: var(--text-dim);
  margin-top: 2px;
}

.focus-list {
  overflow: auto;
  min-height: 0;
}

.focus-empty {
  padding: 20px 8px;
  font-size: 0.68rem;
  color: var(--text-dim);
}

.focus-event-row {
  padding: 6px 0;
  border-top: 1px solid var(--border);
}

.focus-event-row:first-child {
  border-top: none;
}

.focus-event-date {
  font-size: 0.56rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 2px;
}

@media (max-width: 1200px) {
  .focus-grid {
    grid-template-columns: 1fr;
  }

  .focus-panel,
  .focus-journal,
  .focus-list {
    overflow: visible;
  }
}

@media (max-width: 720px) {
  .focus-head {
    flex-direction: column;
  }

  .focus-actions {
    width: 100%;
  }
}
</style>
