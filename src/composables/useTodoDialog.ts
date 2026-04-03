import { ref } from 'vue'
import type { Todo } from '../core/types'

const formOpen = ref(false)
const editingTodo = ref<Todo | null>(null)

export function useTodoDialog() {
  function openNew() {
    editingTodo.value = null
    formOpen.value = true
  }

  function openEdit(todo: Todo) {
    editingTodo.value = todo
    formOpen.value = true
  }

  function closeForm() {
    formOpen.value = false
    editingTodo.value = null
  }

  return {
    formOpen,
    editingTodo,
    openNew,
    openEdit,
    closeForm,
  }
}
