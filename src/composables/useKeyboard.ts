import { useRouter } from 'vue-router'
import { useCommandPalette } from './useCommandPalette'
import { useSidebar } from './useSidebar'
import { useQuickCapture } from './useQuickCapture'
import { useFocusMode } from './useFocusMode'

let handler: ((e: KeyboardEvent) => void) | null = null

function isEditableTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable
}

export function useKeyboard() {
  const router = useRouter()
  const { toggle } = useSidebar()
  const { open } = useQuickCapture()
  const { open: openPalette } = useCommandPalette()
  const { openLauncher, exit } = useFocusMode()

  function init() {
    if (handler) return
    handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && router.currentRoute.value.name === 'focus') {
        e.preventDefault()
        void exit()
        return
      }

      if (!e.ctrlKey) return
      if (isEditableTarget(e.target) && e.key.toLowerCase() !== 'k') return

      if (e.key === 'k' && !e.shiftKey) {
        e.preventDefault()
        openPalette()
        return
      }

      switch (e.key) {
        case '0':
          e.preventDefault()
          openLauncher()
          break
        case '1':
          e.preventDefault()
          router.push('/')
          break
        case '2':
          e.preventDefault()
          router.push('/events')
          break
        case '3':
          e.preventDefault()
          router.push('/finances')
          break
        case '4':
          e.preventDefault()
          router.push('/todos')
          break
        case 'n':
          e.preventDefault()
          open()
          break
        case 's':
          e.preventDefault()
          toggle()
          break
      }
    }
    document.addEventListener('keydown', handler)
  }

  function destroy() {
    if (handler) {
      document.removeEventListener('keydown', handler)
      handler = null
    }
  }

  return { init, destroy }
}
