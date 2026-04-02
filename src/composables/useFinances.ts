import { ref, computed } from 'vue'
import { getDb } from '../core/db'
import type { Account, Transaction, Subscription } from '../core/types'

const accounts = ref<Account[]>([])
const transactions = ref<Transaction[]>([])
const subscriptions = ref<Subscription[]>([])

export interface AccountInput {
  name: string
  balance?: number
  currency?: string
}

export interface TransactionInput {
  account_id: number
  description: string
  amount: number
  type: 'income' | 'expense'
  date: string
}

function normalizeTransactionAmount(amount: number, type: 'income' | 'expense') {
  const value = Math.abs(amount)
  return type === 'expense' ? -value : value
}

export function useFinances() {
  async function load() {
    const db = await getDb()
    accounts.value = await db.select<Account[]>('SELECT * FROM accounts')
    transactions.value = await db.select<Transaction[]>(
      'SELECT * FROM transactions ORDER BY date DESC'
    )
    subscriptions.value = await db.select<Subscription[]>(
      'SELECT * FROM subscriptions ORDER BY next_date'
    )
  }

  async function createAccount(input: AccountInput) {
    const db = await getDb()
    await db.execute(
      'INSERT INTO accounts (name, balance, currency) VALUES ($1, $2, $3)',
      [input.name, input.balance ?? 0, input.currency ?? 'IDR']
    )
    await load()
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
  }

  async function deleteAccount(id: number) {
    const db = await getDb()
    await db.execute('DELETE FROM transactions WHERE account_id = $1', [id])
    await db.execute('DELETE FROM accounts WHERE id = $1', [id])
    await load()
  }

  async function createTransaction(input: TransactionInput) {
    const db = await getDb()
    await db.execute(
      `INSERT INTO transactions (account_id, description, amount, type, date)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        input.account_id,
        input.description,
        normalizeTransactionAmount(input.amount, input.type),
        input.type,
        input.date,
      ]
    )
    await load()
  }

  async function updateTransaction(id: number, patch: Partial<Transaction>) {
    const db = await getDb()
    const existing = transactions.value.find(tx => tx.id === id)
    if (!existing) return

    const nextType = (patch.type ?? existing.type) as 'income' | 'expense'
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
    await load()
  }

  async function deleteTransaction(id: number) {
    const db = await getDb()
    await db.execute('DELETE FROM transactions WHERE id = $1', [id])
    await load()
  }

  const netWorth = computed(() => accounts.value.reduce((s, a) => s + a.balance, 0))

  const totalIncome = computed(() =>
    transactions.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  )

  const totalExpenses = computed(() =>
    transactions.value.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0)
  )

  const totalSubsMonthly = computed(() => subscriptions.value.reduce((s, x) => s + x.amount, 0))

  const sortedSubscriptions = computed(() =>
    [...subscriptions.value].sort((a, b) => a.next_date.localeCompare(b.next_date))
  )

  return {
    accounts,
    transactions,
    subscriptions,
    createAccount,
    updateAccount,
    deleteAccount,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    netWorth,
    totalIncome,
    totalExpenses,
    totalSubsMonthly,
    sortedSubscriptions,
    load,
  }
}
