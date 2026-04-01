<script setup lang="ts">
import type { Todo } from '../../core/types'
import { TODO_PRIORITIES, TODO_COMPLEXITIES, toISO } from '../../core/constants'

defineProps<{
  todo: Todo
}>()

const emit = defineEmits<{
  toggle: [id: number]
  click: [todo: Todo]
}>()

const today = toISO(new Date())

function isOverdue(todo: Todo) {
  return todo.due_date && todo.due_date < today && todo.status !== 'done' && todo.status !== 'cancelled'
}

function dueLabel(dueDate: string) {
  const diff = Math.ceil((new Date(dueDate + 'T00:00:00').getTime() - new Date().getTime()) / 864e5)
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  return `in ${diff}d`
}
</script>

<template>
  <div class="tr" :class="{ done: todo.status === 'done', cancelled: todo.status === 'cancelled' }" @click="emit('click', todo)">
    <button class="tr-check" @click.stop="emit('toggle', todo.id)">
      <span v-if="todo.status === 'done'" class="check-mark">&#10003;</span>
      <span v-else-if="todo.status === 'in_progress'" class="check-prog">&#9679;</span>
    </button>
    <div class="tr-body">
      <span class="tr-title">{{ todo.title }}</span>
      <div class="tr-meta">
        <span
          class="tr-pill"
          :style="{ borderColor: TODO_PRIORITIES[todo.priority].color, color: TODO_PRIORITIES[todo.priority].color }"
        >
          {{ todo.priority }}
        </span>
        <span class="tr-badge">{{ TODO_COMPLEXITIES[todo.complexity].label }}</span>
        <span v-if="todo.due_date" class="tr-due" :class="{ overdue: isOverdue(todo) }">
          {{ dueLabel(todo.due_date) }}
        </span>
        <span v-if="todo.category_id" class="tr-proj">
          {{ todo.category_id }}<template v-if="todo.project_id">/{{ todo.project_id }}</template>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tr {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease);
}

.tr:hover {
  background: var(--bg-hover);
}

.tr.done .tr-title,
.tr.cancelled .tr-title {
  text-decoration: line-through;
  color: var(--text-dim);
}

.tr-check {
  width: 18px;
  height: 18px;
  min-width: 18px;
  border: 1px solid var(--border);
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
  font-size: 0.6rem;
  color: var(--text-dim);
  transition: border-color var(--dur-fast) var(--ease);
}

.tr-check:hover {
  border-color: var(--accent);
}

.check-mark {
  color: var(--green, #6aaa7a);
}

.check-prog {
  color: var(--accent);
  font-size: 0.5rem;
}

.tr-body {
  flex: 1;
  min-width: 0;
}

.tr-title {
  font-family: var(--mono);
  font-size: 0.78rem;
  color: var(--text);
  display: block;
}

.tr-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  flex-wrap: wrap;
}

.tr-pill {
  font-family: var(--mono);
  font-size: 0.58rem;
  padding: 1px 5px;
  border: 1px solid;
}

.tr-badge {
  font-family: var(--mono);
  font-size: 0.55rem;
  color: var(--text-dim);
}

.tr-due {
  font-family: var(--mono);
  font-size: 0.58rem;
  color: var(--text-mid);
}

.tr-due.overdue {
  color: var(--red, #c46a6a);
}

.tr-proj {
  font-family: var(--mono);
  font-size: 0.55rem;
  color: var(--text-dim);
  background: var(--bg-hover);
  padding: 1px 5px;
}
</style>
