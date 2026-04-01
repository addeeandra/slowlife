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

  it('updates an entry', async () => {
    const journal = await loadJournal([makeEntry({ id: 1, text: 'original', mood: 'good', tags: '["a"]' })])
    mockDb.select.mockResolvedValueOnce([makeEntry({ id: 1, text: 'updated', mood: 'great', tags: '["b"]' })])
    await journal.updateEntry(1, { text: 'updated', mood: 'great', tags: ['b'] })
    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE journal_entries SET text = $1, mood = $2, tags = $3 WHERE id = $4',
      ['updated', 'great', '["b"]', 1]
    )
  })

  it('deletes an entry', async () => {
    const journal = await loadJournal([makeEntry({ id: 1 }), makeEntry({ id: 2 })])
    mockDb.select.mockResolvedValueOnce([makeEntry({ id: 2 })])
    await journal.deleteEntry(1)
    expect(mockDb.execute).toHaveBeenCalledWith('DELETE FROM journal_entries WHERE id = $1', [1])
    expect(journal.entries.value).toHaveLength(1)
  })

  describe('heatmapData', () => {
    // Fake time: Wednesday 2026-04-01 (getDay() = 3, daysFromMonday = 2)
    // start = 2026-04-01 - 135 days = 2025-11-17 (Monday)
    // range: 2025-11-17 → 2026-04-05 (140 cells, 4 future days)

    it('returns exactly 140 cells', async () => {
      const { heatmapData } = await loadJournal([])
      expect(heatmapData()).toHaveLength(140)
    })

    it('marks today (cell 135) as isToday', async () => {
      const { heatmapData } = await loadJournal([])
      const cells = heatmapData()
      expect(cells[135].isToday).toBe(true)
    })

    it('marks 4 trailing cells as isFuture (Thu–Sun of current week)', async () => {
      const { heatmapData } = await loadJournal([])
      const cells = heatmapData()
      const futureCells = cells.filter(c => c.isFuture)
      expect(futureCells).toHaveLength(4)
    })

    it('assigns correct activity level for an entry logged today', async () => {
      const { heatmapData } = await loadJournal([
        makeEntry({ created_at: '2026-04-01T10:00:00' }),
      ])
      const cells = heatmapData()
      expect(cells[135].level).toBe(1)
    })

    it('assigns level 4 for 4+ entries on the same day', async () => {
      const { heatmapData } = await loadJournal([
        makeEntry({ created_at: '2026-04-01T08:00:00' }),
        makeEntry({ created_at: '2026-04-01T10:00:00' }),
        makeEntry({ created_at: '2026-04-01T12:00:00' }),
        makeEntry({ created_at: '2026-04-01T14:00:00' }),
      ])
      expect(heatmapData()[135].level).toBe(4)
    })

    it('gives level 0 to past days with no entries', async () => {
      const { heatmapData } = await loadJournal([])
      const cells = heatmapData()
      // All past cells (0–134) should be level 0
      expect(cells.slice(0, 135).every(c => c.level === 0)).toBe(true)
    })

    it('gives level 0 to future cells regardless of entries', async () => {
      const { heatmapData } = await loadJournal([
        makeEntry({ created_at: '2026-04-03T10:00:00' }), // Friday (future)
      ])
      const cells = heatmapData()
      const futureCells = cells.slice(136)
      expect(futureCells.every(c => c.level === 0)).toBe(true)
    })
  })

  describe('heatmapMonths', () => {
    it('returns an array of month abbreviation strings', async () => {
      const { heatmapMonths } = await loadJournal([])
      const months = heatmapMonths()
      expect(Array.isArray(months)).toBe(true)
      expect(months.length).toBeGreaterThan(0)
      months.forEach(m => expect(typeof m).toBe('string'))
    })

    it('contains nov and apr given the 2026-04-01 fake time window', async () => {
      const { heatmapMonths } = await loadJournal([])
      const months = heatmapMonths()
      expect(months).toContain('nov')
      expect(months).toContain('apr')
    })
  })
})

