import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'

vi.mock('../../core/db', () => ({
  getDb: vi.fn(),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}))

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(() => ({
    show: vi.fn().mockResolvedValue(undefined),
    setFocus: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('../useJournal', () => ({
  useJournal: () => ({
    saveEntry: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('../useSpaces', () => {
  const spaces = [
    { id: 'casual', label: 'casual', color: '#111' },
    { id: 'work', label: 'work', color: '#222' },
  ]
  const categories = [
    { id: 'personal', space_id: 'casual', label: 'personal', sort_order: 0 },
    { id: 'company', space_id: 'work', label: 'company', sort_order: 0 },
  ]
  const projects = [
    { id: 'proj1', category_id: 'company', space_id: 'work', label: 'proj1', sort_order: 0 },
  ]
  return {
    useSpaces: () => ({
      spaces: { value: spaces },
      categories: { value: categories },
      projects: { value: projects },
    }),
  }
})

describe('useQuickCapture', async () => {
  const { useQuickCapture } = await import('../useQuickCapture')

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('opens with default category and saves entry', async () => {
    const qc = useQuickCapture()
    qc.init()
    qc.open()
    qc.selectedMood.value = 'good' as any
    qc.selectedTags.value = new Set(['tag'])
    qc.text.value = 'hello'
    await qc.save()
    expect(qc.text.value).toBe('')
    expect(qc.isOpen.value).toBe(false)
  })

  it('persists defaults', async () => {
    const qc = useQuickCapture()
    qc.init()
    qc.selectedSpace.value = 'work'
    qc.selectedCategory.value = 'company'
    await nextTick()
    const raw = localStorage.getItem('slowlife.quickcapture.defaults')
    expect(raw).toContain('work')
    expect(raw).toContain('company')
  })
})
