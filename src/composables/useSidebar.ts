import { ref } from 'vue'

const DESKTOP_BREAKPOINT = 768

const isOpen = ref(typeof window !== 'undefined' ? window.innerWidth > DESKTOP_BREAKPOINT : false)

let resizeHandler: (() => void) | null = null

export function useSidebar() {
  function syncWithViewport() {
    if (typeof window === 'undefined') return
    isOpen.value = window.innerWidth > DESKTOP_BREAKPOINT
  }

  function init() {
    if (typeof window === 'undefined' || resizeHandler) return
    syncWithViewport()
    resizeHandler = syncWithViewport
    window.addEventListener('resize', resizeHandler)
  }

  function destroy() {
    if (!resizeHandler || typeof window === 'undefined') return
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }

  function toggle() {
    isOpen.value = !isOpen.value
  }

  function close() {
    isOpen.value = false
  }

  function closeIfMobile() {
    if (window.innerWidth <= DESKTOP_BREAKPOINT) close()
  }

  return { isOpen, init, destroy, toggle, close, closeIfMobile }
}
