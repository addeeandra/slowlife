import { computed, nextTick, ref, watch } from 'vue'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useSpaces } from './useSpaces'
import { useJournal } from './useJournal'
import type { MoodKey } from '../core/types'

const STORAGE_KEY = 'slowlife.quickcapture.defaults'

const isOpen = ref(false)
const text = ref('')
const selectedMood = ref<MoodKey | null>(null)
const selectedTags = ref<Set<string>>(new Set())
const selectedSpace = ref('casual')
const selectedCategory = ref<string | null>(null)
const selectedProject = ref<string | null>(null)
const isSaving = ref(false)

let tauriUnlisten: UnlistenFn | null = null
let handler: ((e: KeyboardEvent) => void) | null = null
let initialized = false
let currentWindowPromise: ReturnType<typeof getCurrentWindow> | null = null

function loadDefaults() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed.space) selectedSpace.value = parsed.space
    if (parsed.category) selectedCategory.value = parsed.category
  } catch {
    // ignore parse errors
  }
}

function persistDefaults() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      space: selectedSpace.value,
      category: selectedCategory.value,
    })
  )
}

export function useQuickCapture() {
  const { categories, projects } = useSpaces()
  const { saveEntry } = useJournal()

  const spaceCategories = computed(() =>
    categories.value.filter(c => c.space_id === selectedSpace.value)
  )

  const categoryProjects = computed(() => {
    if (!selectedCategory.value) return []
    return projects.value.filter(
      p => p.category_id === selectedCategory.value && p.space_id === selectedSpace.value
    )
  })

  function ensureCategory() {
    if (spaceCategories.value.length === 0) {
      selectedCategory.value = null
      selectedProject.value = null
      return
    }
    if (!selectedCategory.value || !spaceCategories.value.some(c => c.id === selectedCategory.value)) {
      selectedCategory.value = spaceCategories.value[0].id
    }
    if (
      selectedProject.value &&
      !categoryProjects.value.some(p => p.id === selectedProject.value)
    ) {
      selectedProject.value = null
    }
  }

  async function save() {
    if (isSaving.value || !selectedCategory.value || !text.value.trim()) return
    isSaving.value = true
    await saveEntry(
      selectedSpace.value,
      selectedCategory.value,
      selectedProject.value,
      text.value.trim(),
      selectedMood.value,
      [...selectedTags.value]
    )
    text.value = ''
    selectedMood.value = null
    selectedTags.value = new Set()
    isSaving.value = false
    isOpen.value = false
  }

  async function open(prefillText?: string) {
    ensureCategory()
    if (!selectedCategory.value) return
    isOpen.value = true
    if (prefillText) text.value = prefillText
    nextTick(() => {
      const el = document.querySelector<HTMLTextAreaElement>('#qc-editor')
      el?.focus()
    })
    if (!currentWindowPromise) currentWindowPromise = getCurrentWindow()
    try {
      const win = await currentWindowPromise
      await win.show()
      await win.setFocus()
    } catch {
      // ignore in web preview
    }
  }

  function close(e: Event) {
    e.preventDefault()

    isOpen.value = false
    text.value = ''
  }

  async function attachTauriListener() {
    if (tauriUnlisten) return
    try {
      tauriUnlisten = await listen('quick-capture', () => open())
    } catch {
      tauriUnlisten = null
    }
  }

  function attachKeyboardListener() {
    if (handler) return
    handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey || !e.shiftKey) return
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault()
        open()
      }
    }
    window.addEventListener('keydown', handler)
  }

  function init() {
    if (initialized) return
    initialized = true
    loadDefaults()
    ensureCategory()
    attachTauriListener()
    attachKeyboardListener()
  }

  function destroy() {
    if (tauriUnlisten) {
      tauriUnlisten()
      tauriUnlisten = null
    }
    if (handler) {
      window.removeEventListener('keydown', handler)
      handler = null
    }
    initialized = false
  }

  watch([selectedSpace, selectedCategory], ensureCategory)
  watch([selectedSpace, selectedCategory], persistDefaults)

  return {
    isOpen,
    text,
    selectedMood,
    selectedTags,
    selectedSpace,
    selectedCategory,
    selectedProject,
    isSaving,
    spaceCategories,
    categoryProjects,
    open,
    close,
    save,
    init,
    destroy,
  }
}
