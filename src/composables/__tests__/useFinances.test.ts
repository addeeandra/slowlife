import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '../../__mocks__/@tauri-apps/plugin-sql'
import type { Account, Transaction, Subscription } from '../../core/types'

describe('useFinances', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  async function loadFinances(
    accounts: Account[] = [],
    transactions: Transaction[] = [],
    subscriptions: Subscription[] = [],
  ) {
    mockDb.select
      .mockResolvedValueOnce(accounts)
      .mockResolvedValueOnce(transactions)
      .mockResolvedValueOnce(subscriptions)

    const { useFinances } = await import('../useFinances')
    const finances = useFinances()
    await finances.load()
    return finances
  }

  it('calculates net worth from accounts', async () => {
    const { netWorth } = await loadFinances([
      { id: 1, name: 'Bank A', balance: 5_000_000, currency: 'IDR', created_at: '2026-01-01' },
      { id: 2, name: 'Bank B', balance: 3_000_000, currency: 'IDR', created_at: '2026-01-01' },
    ])

    expect(netWorth.value).toBe(8_000_000)
  })

  it('calculates total income and expenses', async () => {
    const { totalIncome, totalExpenses } = await loadFinances(
      [],
      [
        { id: 1, account_id: 1, description: 'Salary', amount: 10_000_000, type: 'income', date: '2026-03-01', created_at: '2026-03-01' },
        { id: 2, account_id: 1, description: 'Rent', amount: -2_000_000, type: 'expense', date: '2026-03-05', created_at: '2026-03-05' },
        { id: 3, account_id: 1, description: 'Food', amount: -500_000, type: 'expense', date: '2026-03-10', created_at: '2026-03-10' },
      ],
    )

    expect(totalIncome.value).toBe(10_000_000)
    expect(totalExpenses.value).toBe(2_500_000)
  })

  it('calculates total monthly subscriptions', async () => {
    const subs: Subscription[] = [
      { id: 1, name: 'Spotify', amount: 55_000, currency: 'IDR', cycle: 'monthly', next_date: '2026-04-15', color: '#fff', created_at: '2026-01-01' },
      { id: 2, name: 'Netflix', amount: 120_000, currency: 'IDR', cycle: 'monthly', next_date: '2026-04-20', color: '#fff', created_at: '2026-01-01' },
    ]

    const { totalSubsMonthly } = await loadFinances([], [], subs)

    expect(totalSubsMonthly.value).toBe(175_000)
  })

  it('sorts subscriptions by next_date', async () => {
    const subs: Subscription[] = [
      { id: 1, name: 'Netflix', amount: 120_000, currency: 'IDR', cycle: 'monthly', next_date: '2026-04-20', color: '#fff', created_at: '2026-01-01' },
      { id: 2, name: 'Spotify', amount: 55_000, currency: 'IDR', cycle: 'monthly', next_date: '2026-04-10', color: '#fff', created_at: '2026-01-01' },
    ]

    const { sortedSubscriptions } = await loadFinances([], [], subs)

    expect(sortedSubscriptions.value[0].name).toBe('Spotify')
    expect(sortedSubscriptions.value[1].name).toBe('Netflix')
  })
})
