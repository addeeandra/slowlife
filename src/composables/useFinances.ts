import { ref, computed } from 'vue'
import { getDb } from '../core/db'
import {
  deleteTransactionSearchIndex,
  rebuildTransactionsSearchIndex,
  upsertTransactionSearchIndex,
} from '../core/search'
import type {
  Account,
  Transaction,
  Subscription,
  TransactionCategory,
  FinanceSettings,
  ExchangeRate,
  NetWorthSnapshot,
  TransactionType,
  TransactionEntryMode,
} from '../core/types'
import { MONTH_ABBR, toISO } from '../core/constants'

const accounts = ref<Account[]>([])
const transactions = ref<Transaction[]>([])
const subscriptions = ref<Subscription[]>([])
const transactionCategories = ref<TransactionCategory[]>([])
const financeSettings = ref<FinanceSettings>({ id: 1, base_currency: 'IDR' })
const exchangeRates = ref<ExchangeRate[]>([])
const netWorthSnapshots = ref<NetWorthSnapshot[]>([])

export interface AccountInput {
  name: string
  initial_balance?: number
  currency?: string
}

export interface TransactionInput {
  account_id: number
  description: string
  amount: number
  type: TransactionType
  date: string
  category_id?: number | null
  entry_mode?: TransactionEntryMode
}

export interface TransferInput {
  from_account_id: number
  to_account_id: number
  amount: number
  date: string
}

export interface TransactionCategoryInput {
  label: string
  kind: 'income' | 'expense'
  color?: string
  monthly_budget?: number | null
}

export interface SubscriptionInput {
  name: string
  amount: number
  currency?: string
  cycle?: string
  next_date: string
  color?: string
}

export interface ExchangeRateInput {
  from_currency: string
  to_currency?: string
  rate: number
  effective_date: string
}

function normalizeTransactionAmount(amount: number, type: TransactionType) {
  const value = Math.abs(amount)
  return type === 'expense' ? -value : value
}

function monthKey(date: string) {
  return date.slice(0, 7)
}

function monthLabel(key: string) {
  const [year, month] = key.split('-')
  return `${MONTH_ABBR[Number(month) - 1]} ${year.slice(2)}`
}

function sortExchangeRates(a: ExchangeRate, b: ExchangeRate) {
  return b.effective_date.localeCompare(a.effective_date) || b.id - a.id
}

export function useFinances() {
  async function load() {
    const db = await getDb()
    accounts.value = await db.select<Account[]>(
      'SELECT id, name, initial_balance, currency, created_at FROM accounts ORDER BY created_at DESC'
    )
    transactions.value = await db.select<Transaction[]>(
      'SELECT id, account_id, description, amount, type, date, category_id, entry_mode, created_at FROM transactions ORDER BY date DESC, id DESC'
    )
    subscriptions.value = await db.select<Subscription[]>(
      'SELECT id, name, amount, currency, cycle, next_date, color, cancelled_at, created_at FROM subscriptions ORDER BY next_date, id DESC'
    )
    transactionCategories.value = await db.select<TransactionCategory[]>(
      'SELECT * FROM transaction_categories ORDER BY kind, sort_order, label'
    )
    const settings = await db.select<FinanceSettings[]>('SELECT * FROM finance_settings WHERE id = 1')
    financeSettings.value = settings[0] || { id: 1, base_currency: 'IDR' }
    exchangeRates.value = await db.select<ExchangeRate[]>(
      'SELECT * FROM exchange_rates ORDER BY effective_date DESC, id DESC'
    )
    netWorthSnapshots.value = await db.select<NetWorthSnapshot[]>(
      'SELECT * FROM net_worth_snapshots ORDER BY snapshot_date ASC, id ASC'
    )
  }

  function accountTransactions(accountId: number) {
    return transactions.value.filter(tx => tx.account_id === accountId)
  }

  function transactionCategoryLabel(id: number | null) {
    if (!id) return null
    return transactionCategories.value.find(category => category.id === id)?.label || null
  }

  function activeRate(fromCurrency: string, toCurrency: string, onDate?: string) {
    if (fromCurrency === toCurrency) return 1
    const candidates = exchangeRates.value
      .filter(rate => rate.from_currency === fromCurrency && rate.to_currency === toCurrency)
      .sort(sortExchangeRates)
    if (!candidates.length) return null
    if (!onDate) return candidates[0].rate
    const dated = candidates.find(rate => rate.effective_date <= onDate)
    return dated?.rate ?? candidates[candidates.length - 1].rate
  }

  function convertToBase(amount: number, fromCurrency: string, onDate?: string) {
    const base = financeSettings.value.base_currency
    if (fromCurrency === base) return amount
    const rate = activeRate(fromCurrency, base, onDate)
    return rate === null ? null : amount * rate
  }

  function accountBalance(accountId: number) {
    const account = accounts.value.find(item => item.id === accountId)
    if (!account) return 0
    const movement = accountTransactions(accountId).reduce((sum, tx) => sum + tx.amount, 0)
    return account.initial_balance + movement
  }

  function convertedAccountBalance(accountId: number) {
    const account = accounts.value.find(item => item.id === accountId)
    if (!account) return null
    return convertToBase(accountBalance(accountId), account.currency)
  }

  function transactionAmountInBase(transaction: Transaction) {
    const account = accounts.value.find(item => item.id === transaction.account_id)
    return convertToBase(transaction.amount, account?.currency || financeSettings.value.base_currency, transaction.date)
  }

  function subscriptionAmountInBase(subscription: Subscription) {
    return convertToBase(subscription.amount, subscription.currency, subscription.next_date)
  }

  async function refreshSnapshot(date: string = toISO(new Date())) {
    const db = await getDb()
    const total = accounts.value.reduce((sum, account) => {
      const converted = convertedAccountBalance(account.id)
      return sum + (converted ?? 0)
    }, 0)

    await db.execute(
      `INSERT INTO net_worth_snapshots (snapshot_date, net_worth, base_currency)
       VALUES ($1, $2, $3)
       ON CONFLICT(snapshot_date) DO UPDATE SET net_worth = excluded.net_worth, base_currency = excluded.base_currency`,
      [date, total, financeSettings.value.base_currency]
    )

    netWorthSnapshots.value = await db.select<NetWorthSnapshot[]>(
      'SELECT * FROM net_worth_snapshots ORDER BY snapshot_date ASC, id ASC'
    )
  }

  async function createAccount(input: AccountInput) {
    const db = await getDb()
    await db.execute(
      'INSERT INTO accounts (name, initial_balance, currency) VALUES ($1, $2, $3)',
      [input.name, input.initial_balance ?? 0, input.currency ?? 'IDR']
    )
    await load()
    await refreshSnapshot()
  }

  async function updateAccount(id: number, patch: Partial<Account>) {
    const db = await getDb()
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    for (const [key, val] of Object.entries(patch)) {
      if (key === 'id' || key === 'created_at') continue
      fields.push(`${key} = $${idx}`)
      values.push(val)
      idx++
    }

    if (!fields.length) return

    values.push(id)
    await db.execute(`UPDATE accounts SET ${fields.join(', ')} WHERE id = $${idx}`, values)
    await load()
    await rebuildTransactionsSearchIndex()
    await refreshSnapshot()
  }

  async function adjustAccountBalance(id: number, targetBalance: number, date: string, description?: string) {
    const current = accountBalance(id)
    const diff = targetBalance - current
    if (Math.abs(diff) < 0.000001) return

    await createTransaction({
      account_id: id,
      description: description?.trim() || 'balance adjustment',
      amount: Math.abs(diff),
      type: diff >= 0 ? 'income' : 'expense',
      date,
      category_id: null,
      entry_mode: 'adjustment',
    })
  }

  async function deleteAccount(id: number) {
    const db = await getDb()
    await db.execute('DELETE FROM transactions_fts WHERE rowid IN (SELECT id FROM transactions WHERE account_id = $1)', [id])
    await db.execute('DELETE FROM transactions WHERE account_id = $1', [id])
    await db.execute('DELETE FROM accounts WHERE id = $1', [id])
    await load()
    await refreshSnapshot()
  }

  async function createTransaction(input: TransactionInput) {
    const db = await getDb()
    await db.execute(
      `INSERT INTO transactions (account_id, description, amount, type, date, category_id, entry_mode)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        input.account_id,
        input.description,
        normalizeTransactionAmount(input.amount, input.type),
        input.type,
        input.date,
        input.category_id ?? null,
        input.entry_mode ?? 'manual',
      ]
    )
    const rows = await db.select<{ id: number }[]>('SELECT last_insert_rowid() AS id')
    if (rows[0]?.id) {
      await upsertTransactionSearchIndex(rows[0].id)
    }
    await load()
    await refreshSnapshot(input.date)
  }

  async function updateTransaction(id: number, patch: Partial<Transaction>) {
    const db = await getDb()
    const existing = transactions.value.find(tx => tx.id === id)
    if (!existing) return

    const nextType = (patch.type ?? existing.type) as TransactionType
    const nextAmount = patch.amount ?? existing.amount

    const normalizedPatch = {
      ...patch,
      ...(patch.amount !== undefined || patch.type !== undefined
        ? { amount: normalizeTransactionAmount(nextAmount, nextType) }
        : {}),
    }

    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    for (const [key, val] of Object.entries(normalizedPatch)) {
      if (key === 'id' || key === 'created_at') continue
      fields.push(`${key} = $${idx}`)
      values.push(val)
      idx++
    }

    if (!fields.length) return

    values.push(id)
    await db.execute(`UPDATE transactions SET ${fields.join(', ')} WHERE id = $${idx}`, values)
    await upsertTransactionSearchIndex(id)
    await load()
    await refreshSnapshot(patch.date || existing.date)
  }

  async function deleteTransaction(id: number) {
    const db = await getDb()
    const existing = transactions.value.find(tx => tx.id === id)
    await db.execute('DELETE FROM transactions WHERE id = $1', [id])
    await deleteTransactionSearchIndex(id)
    await load()
    await refreshSnapshot(existing?.date || toISO(new Date()))
  }

  async function createTransfer(input: TransferInput) {
    const fromAccount = accounts.value.find(a => a.id === input.from_account_id)
    const toAccount = accounts.value.find(a => a.id === input.to_account_id)
    await createTransaction({
      account_id: input.from_account_id,
      description: `transfer to ${toAccount?.name ?? 'account'}`,
      amount: input.amount,
      type: 'expense',
      date: input.date,
      category_id: null,
    })
    await createTransaction({
      account_id: input.to_account_id,
      description: `transfer from ${fromAccount?.name ?? 'account'}`,
      amount: input.amount,
      type: 'income',
      date: input.date,
      category_id: null,
    })
  }

  async function createTransactionCategory(input: TransactionCategoryInput) {
    const db = await getDb()
    const nextSort = transactionCategories.value.filter(category => category.kind === input.kind).length
    await db.execute(
      `INSERT INTO transaction_categories (label, kind, color, monthly_budget, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [input.label, input.kind, input.color || '#c4956a', input.monthly_budget ?? null, nextSort]
    )
    await load()
  }

  async function updateTransactionCategory(id: number, patch: Partial<TransactionCategory>) {
    const db = await getDb()
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    for (const [key, val] of Object.entries(patch)) {
      if (key === 'id' || key === 'created_at') continue
      fields.push(`${key} = $${idx}`)
      values.push(val)
      idx++
    }

    if (!fields.length) return

    values.push(id)
    await db.execute(`UPDATE transaction_categories SET ${fields.join(', ')} WHERE id = $${idx}`, values)
    await load()
    await rebuildTransactionsSearchIndex()
  }

  async function deleteTransactionCategory(id: number) {
    const db = await getDb()
    await db.execute('UPDATE transactions SET category_id = NULL WHERE category_id = $1', [id])
    await db.execute('DELETE FROM transaction_categories WHERE id = $1', [id])
    await load()
    await rebuildTransactionsSearchIndex()
  }

  async function createSubscription(input: SubscriptionInput) {
    const db = await getDb()
    await db.execute(
      `INSERT INTO subscriptions (name, amount, currency, cycle, next_date, color, cancelled_at)
       VALUES ($1, $2, $3, $4, $5, $6, NULL)`,
      [input.name, input.amount, input.currency ?? 'IDR', input.cycle ?? 'monthly', input.next_date, input.color || '#c4956a']
    )
    await load()
  }

  async function updateSubscription(id: number, patch: Partial<Subscription>) {
    const db = await getDb()
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    for (const [key, val] of Object.entries(patch)) {
      if (key === 'id' || key === 'created_at') continue
      fields.push(`${key} = $${idx}`)
      values.push(val)
      idx++
    }

    if (!fields.length) return

    values.push(id)
    await db.execute(`UPDATE subscriptions SET ${fields.join(', ')} WHERE id = $${idx}`, values)
    await load()
  }

  async function cancelSubscription(id: number, cancelledAt: string = toISO(new Date())) {
    await updateSubscription(id, { cancelled_at: cancelledAt })
  }

  async function restoreSubscription(id: number) {
    await updateSubscription(id, { cancelled_at: null })
  }

  async function deleteSubscription(id: number) {
    const db = await getDb()
    await db.execute('DELETE FROM subscriptions WHERE id = $1', [id])
    await load()
  }

  async function createExchangeRate(input: ExchangeRateInput) {
    const db = await getDb()
    await db.execute(
      `INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date)
       VALUES ($1, $2, $3, $4)`,
      [input.from_currency, input.to_currency ?? financeSettings.value.base_currency, input.rate, input.effective_date]
    )
    await load()
    await refreshSnapshot()
  }

  async function updateExchangeRate(id: number, patch: Partial<ExchangeRate>) {
    const db = await getDb()
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    for (const [key, val] of Object.entries(patch)) {
      if (key === 'id' || key === 'created_at') continue
      fields.push(`${key} = $${idx}`)
      values.push(val)
      idx++
    }

    if (!fields.length) return

    values.push(id)
    await db.execute(`UPDATE exchange_rates SET ${fields.join(', ')} WHERE id = $${idx}`, values)
    await load()
    await refreshSnapshot()
  }

  async function deleteExchangeRate(id: number) {
    const db = await getDb()
    await db.execute('DELETE FROM exchange_rates WHERE id = $1', [id])
    await load()
    await refreshSnapshot()
  }

  async function setBaseCurrency(currency: string) {
    const db = await getDb()
    await db.execute(
      `INSERT INTO finance_settings (id, base_currency)
       VALUES (1, $1)
       ON CONFLICT(id) DO UPDATE SET base_currency = excluded.base_currency`,
      [currency]
    )
    await load()
    await refreshSnapshot()
  }

  const accountBalances = computed(() =>
    accounts.value.map(account => ({
      ...account,
      current_balance: accountBalance(account.id),
      converted_balance: convertedAccountBalance(account.id),
    }))
  )

  const expenseCategories = computed(() =>
    transactionCategories.value.filter(category => category.kind === 'expense')
  )

  const incomeCategories = computed(() =>
    transactionCategories.value.filter(category => category.kind === 'income')
  )

  const activeSubscriptions = computed(() =>
    subscriptions.value.filter(subscription => !subscription.cancelled_at)
  )

  const cancelledSubscriptions = computed(() =>
    subscriptions.value.filter(subscription => !!subscription.cancelled_at)
  )

  const netWorth = computed(() =>
    accountBalances.value.reduce((sum, account) => sum + (account.converted_balance ?? 0), 0)
  )

  const totalIncome = computed(() =>
    transactions.value
      .filter(t => t.type === 'income')
      .reduce((sum, tx) => sum + (transactionAmountInBase(tx) ?? 0), 0)
  )

  const totalExpenses = computed(() =>
    transactions.value
      .filter(t => t.type === 'expense')
      .reduce((sum, tx) => sum + Math.abs(transactionAmountInBase(tx) ?? 0), 0)
  )

  const totalSubsMonthly = computed(() =>
    activeSubscriptions.value.reduce((sum, subscription) => {
      const base = subscriptionAmountInBase(subscription) ?? 0
      if (subscription.cycle === 'yearly') return sum + base / 12
      if (subscription.cycle === 'quarterly') return sum + base / 3
      return sum + base
    }, 0)
  )

  const sortedSubscriptions = computed(() =>
    [...activeSubscriptions.value].sort((a, b) => a.next_date.localeCompare(b.next_date))
  )

  function transactionsForMonth(key: string) {
    return transactions.value.filter(tx => monthKey(tx.date) === key)
  }

  function monthlyBudgetRows(key: string) {
    return expenseCategories.value
      .filter(category => category.monthly_budget !== null)
      .map(category => {
        const spent = transactionsForMonth(key)
          .filter(tx => tx.type === 'expense' && tx.category_id === category.id)
          .reduce((sum, tx) => sum + Math.abs(transactionAmountInBase(tx) ?? 0), 0)
        const budget = category.monthly_budget ?? 0
        return {
          id: category.id,
          label: category.label,
          color: category.color,
          spent,
          budget,
          remaining: budget - spent,
          percent: budget > 0 ? Math.min((spent / budget) * 100, 100) : 0,
          over: spent > budget,
        }
      })
      .sort((a, b) => b.spent - a.spent)
  }

  function incomeExpenseTrend(monthCount: number = 6) {
    const keys = [...new Set(transactions.value.map(tx => monthKey(tx.date)))].sort().slice(-monthCount)
    return keys.map(key => {
      const monthTransactions = transactionsForMonth(key)
      const income = monthTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + (transactionAmountInBase(tx) ?? 0), 0)
      const expenses = monthTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + Math.abs(transactionAmountInBase(tx) ?? 0), 0)
      return {
        key,
        label: monthLabel(key),
        income,
        expenses,
        net: income - expenses,
      }
    })
  }

  function netWorthTrend(dayCount: number = 30) {
    return netWorthSnapshots.value.slice(-dayCount).map(snapshot => ({
      ...snapshot,
      label: snapshot.snapshot_date.slice(5),
    }))
  }

  return {
    accounts,
    accountBalances,
    transactions,
    subscriptions,
    activeSubscriptions,
    cancelledSubscriptions,
    transactionCategories,
    expenseCategories,
    incomeCategories,
    financeSettings,
    exchangeRates,
    netWorthSnapshots,
    createAccount,
    updateAccount,
    adjustAccountBalance,
    deleteAccount,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createTransfer,
    createTransactionCategory,
    updateTransactionCategory,
    deleteTransactionCategory,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    restoreSubscription,
    deleteSubscription,
    createExchangeRate,
    updateExchangeRate,
    deleteExchangeRate,
    setBaseCurrency,
    accountBalance,
    convertedAccountBalance,
    convertToBase,
    transactionCategoryLabel,
    netWorth,
    totalIncome,
    totalExpenses,
    totalSubsMonthly,
    sortedSubscriptions,
    monthlyBudgetRows,
    incomeExpenseTrend,
    netWorthTrend,
    load,
    refreshSnapshot,
  }
}
