import { ref } from 'vue'
import type { Todo } from '../core/types'

const formOpen = ref(false)
const editingTodo = ref<Todo | null>(null)
const draftTodoContext = ref<{
  space_id: string | null
  category_id: string | null
  project_id: string | null
} | null>(null)

export function useTodoDialog() {
  function openNew() {
    editingTodo.value = null
    draftTodoContext.value = null
    formOpen.value = true
  }

  function openNewWithContext(context: {
    space_id: string | null
    category_id: string | null
    project_id: string | null
  }) {
    editingTodo.value = null
    draftTodoContext.value = context
    formOpen.value = true
  }

  function openEdit(todo: Todo) {
    editingTodo.value = todo
    draftTodoContext.value = null
    formOpen.value = true
  }

  function closeForm() {
    formOpen.value = false
    editingTodo.value = null
    draftTodoContext.value = null
  }

  return {
    formOpen,
    editingTodo,
    draftTodoContext,
    openNew,
    openNewWithContext,
    openEdit,
    closeForm,
  }
}
