import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSpaces } from './useSpaces'

export interface FocusTarget {
  kind: 'category' | 'project'
  spaceId: string
  categoryId: string
  projectId: string | null
}

const STORAGE_KEY = 'slowlife.focus-mode.last-target'

const isLauncherOpen = ref(false)
const activeTarget = ref<FocusTarget | null>(null)
const lastTarget = ref<FocusTarget | null>(readStoredTarget())

function isValidTarget(value: unknown): value is FocusTarget {
  if (!value || typeof value !== 'object') return false
  const target = value as Record<string, unknown>
  const validKind = target.kind === 'category' || target.kind === 'project'
  const validProjectId = typeof target.projectId === 'string' || target.projectId === null
  return validKind
    && typeof target.spaceId === 'string'
    && typeof target.categoryId === 'string'
    && validProjectId
}

function readStoredTarget(): FocusTarget | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    return isValidTarget(parsed) ? parsed : null
  } catch {
    return null
  }
}

watch(lastTarget, (value) => {
  if (typeof window === 'undefined') return
  if (!value) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
})

export function useFocusMode() {
  const router = useRouter()
  const { spaces, categories, projects } = useSpaces()

  const targetLabel = computed(() => {
    if (!activeTarget.value) return ''
    const target = activeTarget.value

    const space = spaces.value.find(item => item.id === target.spaceId)
    const category = categories.value.find(
      item => item.id === target.categoryId && item.space_id === target.spaceId
    )

    if (target.kind === 'project' && target.projectId) {
      const project = projects.value.find(
        item => item.id === target.projectId
          && item.category_id === target.categoryId
          && item.space_id === target.spaceId
      )
      return [space?.label, category?.label, project?.label].filter(Boolean).join(' / ')
    }

    return [space?.label, category?.label].filter(Boolean).join(' / ')
  })

  function openLauncher() {
    isLauncherOpen.value = true
  }

  function closeLauncher() {
    isLauncherOpen.value = false
  }

  async function enter(target: FocusTarget) {
    activeTarget.value = target
    lastTarget.value = target
    isLauncherOpen.value = false
    await router.push('/focus')
  }

  async function exit() {
    activeTarget.value = null
    isLauncherOpen.value = false
    await router.push('/')
  }

  function validateTarget(target: FocusTarget | null): FocusTarget | null {
    if (!target) return null
    const spaceExists = spaces.value.some(item => item.id === target.spaceId)
    const categoryExists = categories.value.some(
      item => item.id === target.categoryId && item.space_id === target.spaceId
    )
    const projectExists = target.kind === 'category' || (target.projectId
      && projects.value.some(
        item => item.id === target.projectId
          && item.category_id === target.categoryId
          && item.space_id === target.spaceId
      ))

    if (!spaceExists || !categoryExists || !projectExists) return null
    return target
  }

  function syncKnownTargets() {
    lastTarget.value = validateTarget(lastTarget.value)
    activeTarget.value = validateTarget(activeTarget.value)
  }

  return {
    isLauncherOpen,
    activeTarget,
    lastTarget,
    targetLabel,
    openLauncher,
    closeLauncher,
    enter,
    exit,
    syncKnownTargets,
  }
}
