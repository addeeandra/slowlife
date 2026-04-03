import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '../../__mocks__/@tauri-apps/plugin-sql'
import type {
  Account,
  Category,
  Event,
  FinanceSettings,
  JournalEntry,
  Project,
  Space,
  Todo,
  Transaction,
} from '../../core/types'

const searchMocks = vi.hoisted(() => ({
  searchJournalEntries: vi.fn().mockResolvedValue([]),
  searchEvents: vi.fn().mockResolvedValue([]),
  searchTransactions: vi.fn().mockResolvedValue([]),
  searchTodos: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../core/search', () => searchMocks)

describe('useCommandPalette', () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.resetModules()
  })

  async function setupData(options?: {
    spaces?: Space[]
    categories?: Category[]
    projects?: Project[]
    entries?: JournalEntry[]
    events?: Event[]
    accounts?: Account[]
    transactions?: Transaction[]
    todos?: Todo[]
  }) {
    const spaces = options?.spaces || [
      { id: 'casual', label: 'Casual', color: '#aaa' },
      { id: 'work', label: 'Work', color: '#bbb' },
    ]
    const categories = options?.categories || [
      { id: 'personal', space_id: 'casual', label: 'Personal', sort_order: 0 },
      { id: 'studio', space_id: 'work', label: 'Studio', sort_order: 0 },
    ]
    const projects = options?.projects || [
      { id: 'alpha', category_id: 'studio', space_id: 'work', label: 'Alpha', sort_order: 0 },
    ]
    const entries = options?.entries || []
    const events = options?.events || []
    const accounts = options?.accounts || [
      { id: 1, name: 'BCA', initial_balance: 0, currency: 'IDR', created_at: '2026-01-01' },
    ]
    const transactions = options?.transactions || []
    const todos = options?.todos || []

    mockDb.select
      .mockResolvedValueOnce(spaces)
      .mockResolvedValueOnce(categories)
      .mockResolvedValueOnce(projects)
      .mockResolvedValueOnce(entries)
      .mockResolvedValueOnce(events)
      .mockResolvedValueOnce(accounts)
      .mockResolvedValueOnce(transactions)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 1, base_currency: 'IDR' } satisfies FinanceSettings])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(todos)

    const [{ useSpaces }, { useJournal }, { useEvents }, { useFinances }, { useTodos }, { useCommandPalette }] = await Promise.all([
      import('../useSpaces'),
      import('../useJournal'),
      import('../useEvents'),
      import('../useFinances'),
      import('../useTodos'),
      import('../useCommandPalette'),
    ])

    await useSpaces().load()
    await useJournal().load()
    await useEvents().load()
    await useFinances().load()
    await useTodos().load()

    return useCommandPalette()
  }

  it('shows navigation and recent open todos for empty query', async () => {
    const palette = await setupData({
      todos: [
        {
          id: 1,
          title: 'Ship search',
          description: null,
          status: 'open',
          priority: 'P0',
          complexity: 'C2',
          space_id: null,
          category_id: null,
          project_id: null,
          due_date: null,
          completed_at: null,
          created_at: '2026-04-01',
        },
        {
          id: 2,
          title: 'Done item',
          description: null,
          status: 'done',
          priority: 'P1',
          complexity: 'C2',
          space_id: null,
          category_id: null,
          project_id: null,
          due_date: null,
          completed_at: '2026-04-01',
          created_at: '2026-03-30',
        },
      ],
    })

    palette.open()

    expect(palette.results.value.navigation.length).toBeGreaterThan(0)
    expect(palette.results.value.todos).toHaveLength(1)
    expect(palette.results.value.todos[0].type).toBe('todo')
    expect(palette.results.value.todos[0].label).toBe('Ship search')
  })

  it('splits journal category/project targets from journal entries', async () => {
    searchMocks.searchJournalEntries.mockResolvedValueOnce([
      {
        id: 1,
        space: 'work',
        category: 'studio',
        item: 'alpha',
        text: 'Alpha launch retrospective',
        mood: 'good',
        tags: '["launch"]',
        created_at: '2026-04-01T10:00:00',
      },
    ])

    const palette = await setupData({
      entries: [],
    })

    palette.open()
    palette.setQuery('alpha')
    await vi.advanceTimersByTimeAsync(130)

    const journalResults = palette.results.value.journal
    expect(journalResults.some(result => result.type === 'journal_target')).toBe(true)
    expect(journalResults.some(result => result.type === 'journal_entry')).toBe(true)
  })

  it('includes transaction matches and exposes preview selection', async () => {
    searchMocks.searchTransactions.mockResolvedValueOnce([
      {
        id: 1,
        account_id: 1,
        description: 'Spotify family',
        amount: -89000,
        type: 'expense',
        date: '2026-04-02',
        category_id: null,
        entry_mode: 'manual',
        created_at: '2026-04-02',
        account_name: 'BCA',
        account_currency: 'IDR',
        category_label: null,
      },
    ])

    const palette = await setupData({
      transactions: [],
    })

    palette.open()
    palette.setQuery('spotify')
    await vi.advanceTimersByTimeAsync(130)

    expect(palette.results.value.transactions).toHaveLength(1)
    palette.setActive(0)
    expect(palette.selectedTransaction.value?.label).toBe('Spotify family')
  })

  it('only returns open and in-progress todos for search', async () => {
    searchMocks.searchTodos.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 1,
        title: 'Refine palette',
        description: 'ship it',
        status: 'in_progress',
        priority: 'P1',
        complexity: 'C2',
        space_id: null,
        category_id: null,
        project_id: null,
        due_date: null,
        completed_at: null,
        created_at: '2026-04-01',
      },
    ])

    const palette = await setupData({
      todos: [
        {
          id: 1,
          title: 'Refine palette',
          description: 'ship it',
          status: 'in_progress',
          priority: 'P1',
          complexity: 'C2',
          space_id: null,
          category_id: null,
          project_id: null,
          due_date: null,
          completed_at: null,
          created_at: '2026-04-01',
        },
        {
          id: 2,
          title: 'Archived task',
          description: 'ignore',
          status: 'cancelled',
          priority: 'P1',
          complexity: 'C2',
          space_id: null,
          category_id: null,
          project_id: null,
          due_date: null,
          completed_at: null,
          created_at: '2026-04-01',
        },
      ],
    })

    palette.open()
    palette.setQuery('task')
    await vi.advanceTimersByTimeAsync(130)

    expect(palette.results.value.todos).toHaveLength(0)
    palette.setQuery('refine')
    await vi.advanceTimersByTimeAsync(130)
    expect(palette.results.value.todos).toHaveLength(1)
    expect(palette.results.value.todos[0].label).toBe('Refine palette')
  })
})
