import { ref } from 'vue'

const isOpen = ref(false)

export function useSidebar() {
  function toggle() {
    isOpen.value = !isOpen.value
  }

  function close() {
    isOpen.value = false
  }

  return { isOpen, toggle, close }
}
