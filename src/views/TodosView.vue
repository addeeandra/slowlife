<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import TodoRow from '../components/todos/TodoRow.vue'
import TodoForm from '../components/todos/TodoForm.vue'
import { useTodos } from '../composables/useTodos'
import type { Todo, TodoStatus, TodoPriority } from '../core/types'
import { TODO_PRIORITIES, TODO_STATUSES } from '../core/constants'

const {
  todosByStatus,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleStatus,
  openCount,
} = useTodos()

const formOpen = ref(false)
const editingTodo = ref<Todo | null>(null)
const filterStatus = ref<TodoStatus | 'all'>('all')
const filterPriority = ref<TodoPriority | 'all'>('all')
const sortBy = ref<'priority' | 'due_date' | 'created_at'>('priority')

const collapsed = ref<Record<string, boolean>>({
  done: true,
  cancelled: true,
})

const statusOrder: TodoStatus[] = ['open', 'in_progress', 'done', 'cancelled']
const priorityKeys = Object.keys(TODO_PRIORITIES) as TodoPriority[]

const groups = computed(() => {
  const byStatus = todosByStatus()
  const result: { status: TodoStatus; label: string; items: Todo[] }[] = []

  for (const s of statusOrder) {
    if (filterStatus.value !== 'all' && filterStatus.value !== s) continue

    let items = byStatus[s]

    if (filterPriority.value !== 'all') {
      items = items.filter(t => t.priority === filterPriority.value)
    }

    if (sortBy.value === 'due_date') {
      items = [...items].sort((a, b) => (a.due_date || '9').localeCompare(b.due_date || '9'))
    } else if (sortBy.value === 'created_at') {
      items = [...items].sort((a, b) => b.created_at.localeCompare(a.created_at))
    }

    result.push({ status: s, label: TODO_STATUSES[s].label, items })
  }

  return result
})

function openNew() {
  editingTodo.value = null
  formOpen.value = true
}

function openEdit(todo: Todo) {
  editingTodo.value = todo
  formOpen.value = true
}

async function handleSave(data: {
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
  formOpen.value = false
}

async function handleDelete(id: number) {
  await deleteTodo(id)
  formOpen.value = false
}

function toggleCollapse(status: string) {
  collapsed.value[status] = !collapsed.value[status]
}
</script>

<template>
  <PageHeader title="todos" :meta="`${openCount} open`" />

  <div class="td-bar">
    <div class="td-filters">
      <div class="td-filter">
        <span class="td-fl">status</span>
        <select v-model="filterStatus" class="td-sel">
          <option value="all">all</option>
          <option v-for="s in statusOrder" :key="s" :value="s">{{ TODO_STATUSES[s].label }}</option>
        </select>
      </div>
      <div class="td-filter">
        <span class="td-fl">priority</span>
        <select v-model="filterPriority" class="td-sel">
          <option value="all">all</option>
          <option v-for="p in priorityKeys" :key="p" :value="p">{{ p }} {{ TODO_PRIORITIES[p].label }}</option>
        </select>
      </div>
      <div class="td-filter">
        <span class="td-fl">sort</span>
        <select v-model="sortBy" class="td-sel">
          <option value="priority">priority</option>
          <option value="due_date">due date</option>
          <option value="created_at">newest</option>
        </select>
      </div>
    </div>
    <button class="td-new" @click="openNew">+ new</button>
  </div>

  <div class="td-groups">
    <div v-for="group in groups" :key="group.status" class="td-group">
      <button class="td-gh" @click="toggleCollapse(group.status)">
        <span class="td-arrow">{{ collapsed[group.status] ? '\u25B6' : '\u25BC' }}</span>
        <span class="td-gl">{{ group.label }}</span>
        <span class="td-gc">{{ group.items.length }}</span>
      </button>
      <div v-if="!collapsed[group.status]" class="td-list">
        <TodoRow
          v-for="todo in group.items"
          :key="todo.id"
          :todo="todo"
          @toggle="toggleStatus"
          @click="openEdit"
        />
        <div v-if="group.items.length === 0" class="td-empty">no items</div>
      </div>
    </div>
  </div>

  <TodoForm
    :open="formOpen"
    :todo="editingTodo"
    @save="handleSave"
    @delete="handleDelete"
    @close="formOpen = false"
  />
</template>

<style scoped>
.td-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.td-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.td-filter {
  display: flex;
  align-items: center;
  gap: 4px;
}

.td-fl {
  font-family: var(--mono);
  font-size: 0.58rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.td-sel {
  font-family: var(--mono);
  font-size: 0.72rem;
  padding: 3px 6px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  outline: none;
  cursor: pointer;
}

.td-sel:focus {
  border-color: var(--accent);
}

.td-new {
  font-family: var(--mono);
  font-size: 0.72rem;
  padding: 5px 14px;
  border: 1px solid var(--accent);
  background: var(--accent-dim);
  color: var(--accent);
  cursor: pointer;
  transition: all var(--dur-base) var(--ease);
}

.td-new:hover {
  background: var(--accent);
  color: var(--bg);
}

.td-groups {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.td-group {
  border: 1px solid var(--border);
  background: var(--bg-card);
}

.td-gh {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--mono);
  text-align: left;
}

.td-gh:hover {
  background: var(--bg-hover);
}

.td-arrow {
  font-size: 0.55rem;
  color: var(--text-dim);
  width: 10px;
}

.td-gl {
  font-size: 0.72rem;
  color: var(--text);
  text-transform: lowercase;
}

.td-gc {
  font-size: 0.6rem;
  color: var(--text-dim);
  margin-left: auto;
}

.td-list {
  border-top: 1px solid var(--border);
}

.td-empty {
  padding: 12px 10px;
  font-family: var(--mono);
  font-size: 0.68rem;
  color: var(--text-dim);
}
</style>
