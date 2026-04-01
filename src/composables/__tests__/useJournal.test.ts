import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockDb } from '../../__mocks__/@tauri-apps/plugin-sql'
import type { JournalEntry } from '../../core/types'

function makeEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: 1,
    space: 'casual',
    category: 'personal',
    item: null,
    text: 'test entry',
    mood: 'good',
    tags: '[]',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

async function loadJournal(entries: JournalEntry[] = []) {
  mockDb.select.mockResolvedValueOnce(entries)
  const { useJournal } = await import('../useJournal')
  const journal = useJournal()
  await journal.load()
  return journal
}

describe('useJournal', () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-01T12:00:00'))
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads entries from database', async () => {
    const { entries } = await loadJournal([makeEntry({ id: 1 }), makeEntry({ id: 2 })])
    expect(entries.value).toHaveLength(2)
  })

  it('filters entries by space, category, and item', async () => {
    const { filteredEntries } = await loadJournal([
      makeEntry({ id: 1, space: 'casual', category: 'personal', item: null }),
      makeEntry({ id: 2, space: 'work', category: 'acme', item: null }),
      makeEntry({ id: 3, space: 'casual', category: 'personal', item: 'project-a' }),
    ])

    expect(filteredEntries('casual', 'personal', null)).toHaveLength(2)
    expect(filteredEntries('work', 'acme', null)).toHaveLength(1)
    expect(filteredEntries('casual', 'personal', 'project-a')).toHaveLength(1)
  })

  it('counts entries correctly', async () => {
    const { countEntries } = await loadJournal([
      makeEntry({ id: 1, space: 'casual', category: 'personal' }),
      makeEntry({ id: 2, space: 'casual', category: 'personal' }),
      makeEntry({ id: 3, space: 'work', category: 'acme' }),
    ])

    expect(countEntries('casual', 'personal')).toBe(2)
    expect(countEntries('work', 'acme')).toBe(1)
    expect(countEntries('casual', 'nonexistent')).toBe(0)
  })

  it('calculates streak of consecutive days', async () => {
    const { streak } = await loadJournal([
      makeEntry({ id: 1, created_at: '2026-04-01T10:00:00' }),
      makeEntry({ id: 2, created_at: '2026-03-31T10:00:00' }),
      makeEntry({ id: 3, created_at: '2026-03-30T10:00:00' }),
    ])

    expect(streak.value).toBe(3)
  })

  it('returns streak of 0 when no entries today', async () => {
    const { streak } = await loadJournal([
      makeEntry({ id: 1, created_at: '2026-03-29T10:00:00' }),
    ])

    expect(streak.value).toBe(0)
  })

  it('calculates days active this week', async () => {
    const { daysActiveThisWeek } = await loadJournal([
      makeEntry({ id: 1, created_at: '2026-04-01T10:00:00' }),
      makeEntry({ id: 2, created_at: '2026-04-01T14:00:00' }),
      makeEntry({ id: 3, created_at: '2026-03-30T10:00:00' }),
    ])

    expect(daysActiveThisWeek.value).toBe(2)
  })

  it('finds dominant mood this week', async () => {
    const { dominantMoodThisWeek } = await loadJournal([
      makeEntry({ id: 1, mood: 'good', created_at: '2026-04-01T10:00:00' }),
      makeEntry({ id: 2, mood: 'good', created_at: '2026-03-31T10:00:00' }),
      makeEntry({ id: 3, mood: 'bad', created_at: '2026-03-30T10:00:00' }),
    ])

    expect(dominantMoodThisWeek.value).toBe('good')
  })

  it('returns null dominant mood when no entries with mood', async () => {
    const { dominantMoodThisWeek } = await loadJournal([])
    expect(dominantMoodThisWeek.value).toBeNull()
  })

  it('returns recent entries limited by count', async () => {
    const entries = Array.from({ length: 10 }, (_, i) => makeEntry({ id: i + 1 }))
    const { recentEntries } = await loadJournal(entries)

    expect(recentEntries(3)).toHaveLength(3)
    expect(recentEntries()).toHaveLength(4)
  })

  it('detects if there are entries today', async () => {
    const { hasEntriesToday } = await loadJournal([
      makeEntry({ created_at: '2026-04-01T10:00:00' }),
    ])

    expect(hasEntriesToday()).toBe(true)
  })

  it('detects no entries today', async () => {
    const { hasEntriesToday } = await loadJournal([
      makeEntry({ created_at: '2026-03-30T10:00:00' }),
    ])

    expect(hasEntriesToday()).toBe(false)
  })
})
