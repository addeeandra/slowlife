import { beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn().mockResolvedValue(undefined)

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push,
  }),
}))

const spaces = { value: [{ id: 'work', label: 'work', color: '#000' }] }
const categories = { value: [{ id: 'company', space_id: 'work', label: 'company', sort_order: 0 }] }
const projects = { value: [{ id: 'alpha', category_id: 'company', space_id: 'work', label: 'alpha', sort_order: 0 }] }

vi.mock('../useSpaces', () => ({
  useSpaces: () => ({ spaces, categories, projects }),
}))

describe('useFocusMode', () => {
  beforeEach(() => {
    vi.resetModules()
    push.mockClear()
    localStorage.clear()
    spaces.value = [{ id: 'work', label: 'work', color: '#000' }]
    categories.value = [{ id: 'company', space_id: 'work', label: 'company', sort_order: 0 }]
    projects.value = [{ id: 'alpha', category_id: 'company', space_id: 'work', label: 'alpha', sort_order: 0 }]
  })

  it('enters focus mode and persists the last target', async () => {
    const { useFocusMode } = await import('../useFocusMode')
    const focus = useFocusMode()

    await focus.enter({
      kind: 'project',
      spaceId: 'work',
      categoryId: 'company',
      projectId: 'alpha',
    })

    expect(push).toHaveBeenCalledWith('/focus')
    expect(focus.activeTarget.value?.projectId).toBe('alpha')
    expect(focus.lastTarget.value?.projectId).toBe('alpha')
    expect(localStorage.getItem('slowlife.focus-mode.last-target')).toContain('alpha')
  })

  it('clears invalid stored targets after data changes', async () => {
    localStorage.setItem('slowlife.focus-mode.last-target', JSON.stringify({
      kind: 'project',
      spaceId: 'work',
      categoryId: 'company',
      projectId: 'alpha',
    }))

    const { useFocusMode } = await import('../useFocusMode')
    const focus = useFocusMode()

    projects.value = []
    focus.syncKnownTargets()

    expect(focus.lastTarget.value).toBe(null)
  })
})
