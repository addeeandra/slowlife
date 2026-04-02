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

  it('creates an account and reloads finances', async () => {
    mockDb.select.mockResolvedValue([])

    const { useFinances } = await import('../useFinances')
    const finances = useFinances()

    await finances.createAccount({ name: 'Cash', balance: 250_000, currency: 'IDR' })

    expect(mockDb.execute).toHaveBeenCalledWith(
      'INSERT INTO accounts (name, balance, currency) VALUES ($1, $2, $3)',
      ['Cash', 250_000, 'IDR']
    )
    expect(mockDb.select).toHaveBeenCalledTimes(3)
  })

  it('updates an account and reloads finances', async () => {
    mockDb.select
      .mockResolvedValueOnce([
        { id: 1, name: 'Bank A', balance: 5_000_000, currency: 'IDR', created_at: '2026-01-01' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const { useFinances } = await import('../useFinances')
    const finances = useFinances()
    await finances.load()
    await finances.updateAccount(1, { name: 'Main Bank', balance: 6_000_000 })

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE accounts SET name = $1, balance = $2 WHERE id = $3',
      ['Main Bank', 6_000_000, 1]
    )
  })

  it('deletes account transactions before deleting the account', async () => {
    mockDb.select.mockResolvedValue([])

    const { useFinances } = await import('../useFinances')
    const finances = useFinances()
    await finances.deleteAccount(3)

    expect(mockDb.execute).toHaveBeenNthCalledWith(1, 'DELETE FROM transactions WHERE account_id = $1', [3])
    expect(mockDb.execute).toHaveBeenNthCalledWith(2, 'DELETE FROM accounts WHERE id = $1', [3])
  })

  it('creates expense transactions as negative amounts', async () => {
    mockDb.select.mockResolvedValue([])

    const { useFinances } = await import('../useFinances')
    const finances = useFinances()
    await finances.createTransaction({
      account_id: 1,
      description: 'Lunch',
      amount: 50_000,
      type: 'expense',
      date: '2026-04-02',
    })

    expect(mockDb.execute).toHaveBeenCalledWith(
      `INSERT INTO transactions (account_id, description, amount, type, date)
       VALUES ($1, $2, $3, $4, $5)`,
      [1, 'Lunch', -50_000, 'expense', '2026-04-02']
    )
  })

  it('creates income transactions as positive amounts', async () => {
    mockDb.select.mockResolvedValue([])

    const { useFinances } = await import('../useFinances')
    const finances = useFinances()
    await finances.createTransaction({
      account_id: 1,
      description: 'Salary',
      amount: 5_000_000,
      type: 'income',
      date: '2026-04-02',
    })

    expect(mockDb.execute).toHaveBeenCalledWith(
      `INSERT INTO transactions (account_id, description, amount, type, date)
       VALUES ($1, $2, $3, $4, $5)`,
      [1, 'Salary', 5_000_000, 'income', '2026-04-02']
    )
  })

  it('updates transactions with normalized amount based on type', async () => {
    mockDb.select
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 4, account_id: 1, description: 'Taxi', amount: -30_000, type: 'expense', date: '2026-04-01', created_at: '2026-04-01' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const { useFinances } = await import('../useFinances')
    const finances = useFinances()
    await finances.load()
    await finances.updateTransaction(4, { amount: 45_000, type: 'expense' })

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE transactions SET amount = $1, type = $2 WHERE id = $3',
      [-45_000, 'expense', 4]
    )
  })

  it('deletes a transaction and reloads finances', async () => {
    mockDb.select.mockResolvedValue([])

    const { useFinances } = await import('../useFinances')
    const finances = useFinances()
    await finances.deleteTransaction(7)

    expect(mockDb.execute).toHaveBeenCalledWith('DELETE FROM transactions WHERE id = $1', [7])
    expect(mockDb.select).toHaveBeenCalledTimes(3)
  })
})
