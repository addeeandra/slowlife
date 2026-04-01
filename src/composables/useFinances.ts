import { ref, computed } from 'vue'
import { getDb } from '../core/db'
import type { Account, Transaction, Subscription } from '../core/types'

const accounts = ref<Account[]>([])
const transactions = ref<Transaction[]>([])
const subscriptions = ref<Subscription[]>([])

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
    netWorth,
    totalIncome,
    totalExpenses,
    totalSubsMonthly,
    sortedSubscriptions,
    load,
  }
}
