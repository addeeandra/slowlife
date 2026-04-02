import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '../../__mocks__/@tauri-apps/plugin-sql'
import type { Account, Transaction, Subscription, TransactionCategory, FinanceSettings, ExchangeRate, NetWorthSnapshot } from '../../core/types'

describe('useFinances', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  async function loadFinances(
    accounts: Account[] = [],
    transactions: Transaction[] = [],
    subscriptions: Subscription[] = [],
    categories: TransactionCategory[] = [],
    settings: FinanceSettings[] = [{ id: 1, base_currency: 'IDR' }],
    rates: ExchangeRate[] = [],
    snapshots: NetWorthSnapshot[] = [],
  ) {
    mockDb.select
      .mockResolvedValueOnce(accounts)
      .mockResolvedValueOnce(transactions)
      .mockResolvedValueOnce(subscriptions)
      .mockResolvedValueOnce(categories)
      .mockResolvedValueOnce(settings)
      .mockResolvedValueOnce(rates)
      .mockResolvedValueOnce(snapshots)

    const { useFinances } = await import('../useFinances')
    const finances = useFinances()
    await finances.load()
    return finances
  }

  it('calculates net worth from accounts', async () => {
    const { netWorth } = await loadFinances([
      { id: 1, name: 'Bank A', initial_balance: 5_000_000, currency: 'IDR', created_at: '2026-01-01' },
      { id: 2, name: 'Bank B', initial_balance: 3_000_000, currency: 'IDR', created_at: '2026-01-01' },
    ])

    expect(netWorth.value).toBe(8_000_000)
  })

  it('calculates total income and expenses', async () => {
    const { totalIncome, totalExpenses } = await loadFinances(
      [],
      [
        { id: 1, account_id: 1, description: 'Salary', amount: 10_000_000, type: 'income', date: '2026-03-01', category_id: null, entry_mode: 'manual', created_at: '2026-03-01' },
        { id: 2, account_id: 1, description: 'Rent', amount: -2_000_000, type: 'expense', date: '2026-03-05', category_id: null, entry_mode: 'manual', created_at: '2026-03-05' },
        { id: 3, account_id: 1, description: 'Food', amount: -500_000, type: 'expense', date: '2026-03-10', category_id: null, entry_mode: 'manual', created_at: '2026-03-10' },
      ],
    )

    expect(totalIncome.value).toBe(10_000_000)
    expect(totalExpenses.value).toBe(2_500_000)
  })

  it('calculates total monthly subscriptions', async () => {
    const subs: Subscription[] = [
      { id: 1, name: 'Spotify', amount: 55_000, currency: 'IDR', cycle: 'monthly', next_date: '2026-04-15', color: '#fff', cancelled_at: null, created_at: '2026-01-01' },
      { id: 2, name: 'Netflix', amount: 120_000, currency: 'IDR', cycle: 'monthly', next_date: '2026-04-20', color: '#fff', cancelled_at: null, created_at: '2026-01-01' },
    ]

    const { totalSubsMonthly } = await loadFinances([], [], subs)

    expect(totalSubsMonthly.value).toBe(175_000)
  })

  it('sorts subscriptions by next_date', async () => {
    const subs: Subscription[] = [
      { id: 1, name: 'Netflix', amount: 120_000, currency: 'IDR', cycle: 'monthly', next_date: '2026-04-20', color: '#fff', cancelled_at: null, created_at: '2026-01-01' },
      { id: 2, name: 'Spotify', amount: 55_000, currency: 'IDR', cycle: 'monthly', next_date: '2026-04-10', color: '#fff', cancelled_at: null, created_at: '2026-01-01' },
    ]

    const { sortedSubscriptions } = await loadFinances([], [], subs)

    expect(sortedSubscriptions.value[0].name).toBe('Spotify')
    expect(sortedSubscriptions.value[1].name).toBe('Netflix')
  })

  it('creates an account and reloads finances', async () => {
    mockDb.select.mockResolvedValue([])

    const { useFinances } = await import('../useFinances')
    const finances = useFinances()

    await finances.createAccount({ name: 'Cash', initial_balance: 250_000, currency: 'IDR' })

    expect(mockDb.execute).toHaveBeenCalledWith(
      'INSERT INTO accounts (name, initial_balance, currency) VALUES ($1, $2, $3)',
      ['Cash', 250_000, 'IDR']
    )
    expect(mockDb.select).toHaveBeenCalledTimes(8)
  })

  it('updates an account and reloads finances', async () => {
    mockDb.select
      .mockResolvedValueOnce([
        { id: 1, name: 'Bank A', initial_balance: 5_000_000, currency: 'IDR', created_at: '2026-01-01' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 1, base_currency: 'IDR' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 1, base_currency: 'IDR' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const { useFinances } = await import('../useFinances')
    const finances = useFinances()
    await finances.load()
    await finances.updateAccount(1, { name: 'Main Bank', initial_balance: 6_000_000 })

    expect(mockDb.execute).toHaveBeenCalledWith(
      'UPDATE accounts SET name = $1, initial_balance = $2 WHERE id = $3',
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
      category_id: null,
    })

    expect(mockDb.execute).toHaveBeenCalledWith(
      `INSERT INTO transactions (account_id, description, amount, type, date, category_id, entry_mode)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [1, 'Lunch', -50_000, 'expense', '2026-04-02', null, 'manual']
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
      category_id: null,
    })

    expect(mockDb.execute).toHaveBeenCalledWith(
      `INSERT INTO transactions (account_id, description, amount, type, date, category_id, entry_mode)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [1, 'Salary', 5_000_000, 'income', '2026-04-02', null, 'manual']
    )
  })

  it('updates transactions with normalized amount based on type', async () => {
    mockDb.select
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 4, account_id: 1, description: 'Taxi', amount: -30_000, type: 'expense', date: '2026-04-01', category_id: null, entry_mode: 'manual', created_at: '2026-04-01' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 1, base_currency: 'IDR' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 1, base_currency: 'IDR' }])
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
    expect(mockDb.select).toHaveBeenCalledTimes(8)
  })

  it('derives account balances from initial balance and transactions', async () => {
    const { accountBalances } = await loadFinances(
      [{ id: 1, name: 'Wallet', initial_balance: 100_000, currency: 'IDR', created_at: '2026-01-01' }],
      [
        { id: 1, account_id: 1, description: 'Lunch', amount: -30_000, type: 'expense', date: '2026-04-01', category_id: null, entry_mode: 'manual', created_at: '2026-04-01' },
        { id: 2, account_id: 1, description: 'Refund', amount: 10_000, type: 'income', date: '2026-04-02', category_id: null, entry_mode: 'manual', created_at: '2026-04-02' },
      ]
    )

    expect(accountBalances.value[0].current_balance).toBe(80_000)
  })

  it('calculates budget rows by category', async () => {
    const { monthlyBudgetRows } = await loadFinances(
      [{ id: 1, name: 'Bank', initial_balance: 1_000_000, currency: 'IDR', created_at: '2026-01-01' }],
      [
        { id: 1, account_id: 1, description: 'Groceries', amount: -200_000, type: 'expense', date: '2026-04-02', category_id: 3, entry_mode: 'manual', created_at: '2026-04-02' },
      ],
      [],
      [
        { id: 3, label: 'food', kind: 'expense', color: '#c4956a', monthly_budget: 500_000, sort_order: 0, created_at: '2026-01-01' },
      ]
    )

    expect(monthlyBudgetRows('2026-04')[0].spent).toBe(200_000)
    expect(monthlyBudgetRows('2026-04')[0].remaining).toBe(300_000)
  })

  it('calculates income expense trend in base currency', async () => {
    const { incomeExpenseTrend } = await loadFinances(
      [{ id: 1, name: 'USD acct', initial_balance: 0, currency: 'USD', created_at: '2026-01-01' }],
      [
        { id: 1, account_id: 1, description: 'Pay', amount: 100, type: 'income', date: '2026-04-01', category_id: null, entry_mode: 'manual', created_at: '2026-04-01' },
        { id: 2, account_id: 1, description: 'Tool', amount: -20, type: 'expense', date: '2026-04-02', category_id: null, entry_mode: 'manual', created_at: '2026-04-02' },
      ],
      [],
      [],
      [{ id: 1, base_currency: 'IDR' }],
      [{ id: 1, from_currency: 'USD', to_currency: 'IDR', rate: 16_000, effective_date: '2026-04-01', created_at: '2026-04-01' }],
    )

    expect(incomeExpenseTrend(1)[0].income).toBe(1_600_000)
    expect(incomeExpenseTrend(1)[0].expenses).toBe(320_000)
  })

  it('ignores cancelled subscriptions from active totals', async () => {
    const subs: Subscription[] = [
      { id: 1, name: 'Spotify', amount: 55_000, currency: 'IDR', cycle: 'monthly', next_date: '2026-04-15', color: '#fff', cancelled_at: null, created_at: '2026-01-01' },
      { id: 2, name: 'Old service', amount: 120_000, currency: 'IDR', cycle: 'monthly', next_date: '2026-04-20', color: '#fff', cancelled_at: '2026-04-01', created_at: '2026-01-01' },
    ]

    const { totalSubsMonthly, activeSubscriptions, cancelledSubscriptions } = await loadFinances([], [], subs)

    expect(totalSubsMonthly.value).toBe(55_000)
    expect(activeSubscriptions.value).toHaveLength(1)
    expect(cancelledSubscriptions.value).toHaveLength(1)
  })
})
