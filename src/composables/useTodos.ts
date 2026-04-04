import { ref, computed } from 'vue'
import { getDb } from '../core/db'
import { deleteTodoSearchIndex, upsertTodoSearchIndex } from '../core/search'
import type { Todo, TodoStatus, TodoPriority, TodoComplexity } from '../core/types'
import { toISO } from '../core/constants'

const todos = ref<Todo[]>([])

export interface TodoInput {
  title: string
  description?: string | null
  priority?: TodoPriority
  complexity?: TodoComplexity
  space_id?: string | null
  category_id?: string | null
  project_id?: string | null
  due_date?: string | null
}

export function useTodos() {
  async function load() {
    const db = await getDb()
    todos.value = await db.select<Todo[]>('SELECT * FROM todos ORDER BY created_at DESC')
  }

  async function createTodo(input: TodoInput) {
    const db = await getDb()
    await db.execute(
      `INSERT INTO todos (title, description, priority, complexity, space_id, category_id, project_id, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        input.title,
        input.description ?? null,
        input.priority ?? 'P2',
        input.complexity ?? 'C2',
        input.space_id ?? null,
        input.category_id ?? null,
        input.project_id ?? null,
        input.due_date ?? null,
      ]
    )
    const rows = await db.select<{ id: number }[]>('SELECT last_insert_rowid() AS id')
    if (rows[0]?.id) {
      await upsertTodoSearchIndex(rows[0].id)
    }
    await load()
  }

  async function updateTodo(id: number, patch: Partial<Todo>) {
    const db = await getDb()
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    for (const [key, val] of Object.entries(patch)) {
      if (key === 'id' || key === 'created_at') continue
      fields.push(`${key} = $${idx}`)
      values.push(val)
      idx++
    }

    if (fields.length === 0) return

    values.push(id)
    await db.execute(`UPDATE todos SET ${fields.join(', ')} WHERE id = $${idx}`, values)
    await upsertTodoSearchIndex(id)
    await load()
  }

  async function deleteTodo(id: number) {
    const db = await getDb()
    await db.execute('DELETE FROM todos WHERE id = $1', [id])
    await deleteTodoSearchIndex(id)
    await load()
  }

  async function toggleStatus(id: number) {
    const todo = todos.value.find(t => t.id === id)
    if (!todo) return

    const next: Record<TodoStatus, TodoStatus> = {
      open: 'in_progress',
      in_progress: 'done',
      done: 'open',
      cancelled: 'open',
    }
    const newStatus = next[todo.status]
    const now = new Date()
    const completedAt = newStatus === 'done' ? now.toISOString().replace('T', ' ').slice(0, 19) : null

    let isInattentive = todo.is_inattentive
    if (newStatus === 'done') {
      const createdAt = new Date(todo.created_at.replace(' ', 'T') + 'Z')
      const elapsedSec = (now.getTime() - createdAt.getTime()) / 1000
      const isLowPriority = ['P2', 'P3', 'P4'].includes(todo.priority)
      isInattentive = elapsedSec <= 15 && isLowPriority ? 1 : 0
    } else if (newStatus === 'open') {
      isInattentive = 0
    }

    await updateTodo(id, { status: newStatus, completed_at: completedAt, is_inattentive: isInattentive })
  }

  const openTodos = computed(() =>
    todos.value.filter(t => t.status === 'open' || t.status === 'in_progress')
  )

  const openCount = computed(() => openTodos.value.length)

  const overdueTodos = computed(() => {
    const today = toISO(new Date())
    return openTodos.value.filter(t => t.due_date && t.due_date < today)
  })

  const highPriorityOpen = computed(() =>
    openTodos.value
      .filter(t => t.priority <= 'P1')
      .sort((a, b) => a.priority.localeCompare(b.priority) || (a.due_date || '9').localeCompare(b.due_date || '9'))
      .slice(0, 5)
  )

  function focusStatsForRange(from: string, to: string) {
    const { i, total } = todos.value.reduce(
      (acc, t) => {
        if (t.status !== 'done' || !t.completed_at) return acc
        const d = t.completed_at.slice(0, 10)
        if (d < from || d > to) return acc
        acc.total++
        if (t.is_inattentive === 1) acc.i++
        return acc
      },
      { i: 0, total: 0 }
    )
    return { i, a: total - i, rate: total > 0 ? i / total : 0 }
  }

  const focusToday = computed(() => {
    const today = toISO(new Date())
    return focusStatsForRange(today, today)
  })

  const focusThisWeek = computed(() => {
    const now = new Date()
    const from = new Date(now)
    from.setDate(now.getDate() - 6)
    return focusStatsForRange(toISO(from), toISO(now))
  })

  const focusHistory = computed(() => {
    const now = new Date()
    return Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(now)
      d.setDate(now.getDate() - (6 - idx))
      const ds = toISO(d)
      const stats = focusStatsForRange(ds, ds)
      return { date: ds, ...stats }
    })
  })

  function todosByStatus() {
    const groups: Record<TodoStatus, Todo[]> = { open: [], in_progress: [], done: [], cancelled: [] }
    for (const t of todos.value) {
      groups[t.status].push(t)
    }
    for (const key of Object.keys(groups) as TodoStatus[]) {
      groups[key].sort((a, b) => a.priority.localeCompare(b.priority))
    }
    return groups
  }

  return {
    todos,
    load,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleStatus,
    openTodos,
    openCount,
    overdueTodos,
    highPriorityOpen,
    todosByStatus,
    focusToday,
    focusThisWeek,
    focusHistory,
  }
}
