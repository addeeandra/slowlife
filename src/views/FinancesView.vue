<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import FinanceSummary from '../components/finances/FinanceSummary.vue'
import AccountRow from '../components/finances/AccountRow.vue'
import SubscriptionRow from '../components/finances/SubscriptionRow.vue'
import TransactionRow from '../components/finances/TransactionRow.vue'
import AccountForm from '../components/finances/AccountForm.vue'
import TransactionForm from '../components/finances/TransactionForm.vue'
import { useFinances } from '../composables/useFinances'
import { formatCurrency } from '../core/constants'
import type { Account, Transaction } from '../core/types'

const {
  accounts,
  subscriptions,
  transactions,
  totalSubsMonthly,
  createAccount,
  updateAccount,
  deleteAccount,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = useFinances()

const accountFormOpen = ref(false)
const transactionFormOpen = ref(false)
const selectedAccount = ref<Account | null>(null)
const selectedTransaction = ref<Transaction | null>(null)

function openNewAccount() {
  selectedAccount.value = null
  accountFormOpen.value = true
}

function openEditAccount(account: Account) {
  selectedAccount.value = account
  accountFormOpen.value = true
}

function closeAccountForm() {
  accountFormOpen.value = false
  selectedAccount.value = null
}

async function saveAccount(data: { name: string; balance: number; currency: string }) {
  if (selectedAccount.value) {
    await updateAccount(selectedAccount.value.id, data)
  } else {
    await createAccount(data)
  }
  closeAccountForm()
}

async function removeAccount(id: number) {
  await deleteAccount(id)
  closeAccountForm()
}

function openNewTransaction() {
  selectedTransaction.value = null
  transactionFormOpen.value = true
}

function openEditTransaction(transaction: Transaction) {
  selectedTransaction.value = transaction
  transactionFormOpen.value = true
}

function closeTransactionForm() {
  transactionFormOpen.value = false
  selectedTransaction.value = null
}

async function saveTransaction(data: {
  account_id: number
  description: string
  amount: number
  type: 'income' | 'expense'
  date: string
}) {
  if (selectedTransaction.value) {
    await updateTransaction(selectedTransaction.value.id, data)
  } else {
    await createTransaction(data)
  }
  closeTransactionForm()
}

async function removeTransaction(id: number) {
  await deleteTransaction(id)
  closeTransactionForm()
}
</script>

<template>
  <div>
    <PageHeader title="finances" meta="accounts & subscriptions" />
    <div class="page-area">
      <FinanceSummary />

      <div class="c" style="margin-bottom: 10px">
        <div class="c-t c-head">
          <span>accounts</span>
          <button class="mini-btn" @click="openNewAccount">new</button>
        </div>
        <AccountRow v-for="acct in accounts" :key="acct.id" :account="acct" @edit="openEditAccount" />
      </div>

      <div class="c" style="margin-bottom: 10px">
        <div class="c-t">
          subscriptions
          <span class="sub-total">{{ formatCurrency(totalSubsMonthly) }}/mo</span>
        </div>
        <SubscriptionRow v-for="sub in subscriptions" :key="sub.id" :subscription="sub" />
      </div>

      <div class="c">
        <div class="c-t c-head">
          <span>recent transactions</span>
          <button class="mini-btn" @click="openNewTransaction">new</button>
        </div>
        <TransactionRow v-for="tx in transactions" :key="tx.id" :transaction="tx" @edit="openEditTransaction" />
      </div>

      <AccountForm
        :open="accountFormOpen"
        :account="selectedAccount"
        @save="saveAccount"
        @delete="removeAccount"
        @close="closeAccountForm"
      />

      <TransactionForm
        :open="transactionFormOpen"
        :transaction="selectedTransaction"
        @save="saveTransaction"
        @delete="removeTransaction"
        @close="closeTransactionForm"
      />
    </div>
  </div>
</template>

<style scoped>
.page-area {
  max-width: 580px;
}

.sub-total {
  font-weight: 400;
  color: var(--text-dim);
}

.c-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mini-btn {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 0.64rem;
  padding: 3px 6px;
  text-transform: lowercase;
}

.mini-btn:hover {
  color: var(--text);
  border-color: var(--text);
}
</style>
