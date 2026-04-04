<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import Select from '../components/Select.vue'
import FinanceSummary from '../components/finances/FinanceSummary.vue'
import AccountRow from '../components/finances/AccountRow.vue'
import SubscriptionRow from '../components/finances/SubscriptionRow.vue'
import TransactionRow from '../components/finances/TransactionRow.vue'
import AccountForm from '../components/finances/AccountForm.vue'
import TransactionForm from '../components/finances/TransactionForm.vue'
import SubscriptionForm from '../components/finances/SubscriptionForm.vue'
import TransactionCategoryForm from '../components/finances/TransactionCategoryForm.vue'
import ExchangeRateForm from '../components/finances/ExchangeRateForm.vue'
import BudgetOverview from '../components/finances/BudgetOverview.vue'
import IncomeExpenseTrend from '../components/finances/IncomeExpenseTrend.vue'
import NetWorthTrend from '../components/finances/NetWorthTrend.vue'
import { useFinances } from '../composables/useFinances'
import { formatMoney } from '../core/constants'
import type { Account, ExchangeRate, Subscription, Transaction, TransactionCategory } from '../core/types'

type FinanceTab = 'main' | 'reports' | 'settings'

const {
  accountBalances,
  transactions,
  activeSubscriptions,
  cancelledSubscriptions,
  transactionCategories,
  exchangeRates,
  financeSettings,
  totalSubsMonthly,
  createAccount,
  updateAccount,
  adjustAccountBalance,
  deleteAccount,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  restoreSubscription,
  deleteSubscription,
  createTransactionCategory,
  updateTransactionCategory,
  deleteTransactionCategory,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate,
  setBaseCurrency,
  transactionCategoryLabel,
} = useFinances()

const monthKey = ref(new Date().toISOString().slice(0, 7))
const activeTab = ref<FinanceTab>('main')

const accountFormOpen = ref(false)
const transactionFormOpen = ref(false)
const subscriptionFormOpen = ref(false)
const categoryFormOpen = ref(false)
const rateFormOpen = ref(false)

const selectedAccount = ref<Account | null>(null)
const selectedTransaction = ref<Transaction | null>(null)
const selectedSubscription = ref<Subscription | null>(null)
const selectedCategory = ref<TransactionCategory | null>(null)
const selectedRate = ref<ExchangeRate | null>(null)
const selectedAccountIds = ref<number[]>([])
const baseCurrencyOptions = [
  { value: 'IDR', label: 'IDR' },
  { value: 'USD', label: 'USD' },
  { value: 'SGD', label: 'SGD' },
  { value: 'CNY', label: 'CNY' },
]

const groupedSubscriptions = computed(() => ({
  monthly: activeSubscriptions.value.filter(sub => sub.cycle === 'monthly'),
  quarterly: activeSubscriptions.value.filter(sub => sub.cycle === 'quarterly'),
  yearly: activeSubscriptions.value.filter(sub => sub.cycle === 'yearly'),
}))

const decoratedTransactions = computed(() =>
  transactions.value
    .filter(transaction => !selectedAccountIds.value.length || selectedAccountIds.value.includes(transaction.account_id))
    .map(transaction => {
    const account = accountBalances.value.find(item => item.id === transaction.account_id)
    return {
      ...transaction,
      account_currency: account?.currency || 'IDR',
      account_name: account?.name || 'unknown account',
      category_label: transactionCategoryLabel(transaction.category_id),
    }
    })
)

const selectedAccountCurrentBalance = computed(() =>
  selectedAccount.value
    ? accountBalances.value.find(item => item.id === selectedAccount.value?.id)?.current_balance ?? 0
    : 0
)

function closeAllForms() {
  accountFormOpen.value = false
  transactionFormOpen.value = false
  subscriptionFormOpen.value = false
  categoryFormOpen.value = false
  rateFormOpen.value = false
  selectedAccount.value = null
  selectedTransaction.value = null
  selectedSubscription.value = null
  selectedCategory.value = null
  selectedRate.value = null
}

async function saveAccount(data: { name: string; initial_balance: number; currency: string }) {
  if (selectedAccount.value) {
    await updateAccount(selectedAccount.value.id, data)
  } else {
    await createAccount(data)
  }
  closeAllForms()
}

async function adjustAccount(data: { target_balance: number; date: string; description: string | null }) {
  if (!selectedAccount.value) return
  await adjustAccountBalance(selectedAccount.value.id, data.target_balance, data.date, data.description || undefined)
  closeAllForms()
}

async function saveTransaction(data: {
  account_id: number
  description: string
  amount: number
  type: 'income' | 'expense'
  date: string
  category_id: number | null
}) {
  if (selectedTransaction.value) {
    await updateTransaction(selectedTransaction.value.id, data)
  } else {
    await createTransaction(data)
  }
  closeAllForms()
}

async function saveSubscription(data: { name: string; amount: number; currency: string; cycle: string; next_date: string; color: string }) {
  if (selectedSubscription.value) {
    await updateSubscription(selectedSubscription.value.id, data)
  } else {
    await createSubscription(data)
  }
  closeAllForms()
}

async function saveCategory(data: { label: string; kind: 'income' | 'expense'; color: string; monthly_budget: number | null }) {
  if (selectedCategory.value) {
    await updateTransactionCategory(selectedCategory.value.id, data)
  } else {
    await createTransactionCategory(data)
  }
  closeAllForms()
}

async function saveRate(data: { from_currency: string; to_currency: string; rate: number; effective_date: string }) {
  if (selectedRate.value) {
    await updateExchangeRate(selectedRate.value.id, data)
  } else {
    await createExchangeRate(data)
  }
  closeAllForms()
}

async function removeSelectedAccount() {
  if (!selectedAccount.value) return
  await deleteAccount(selectedAccount.value.id)
  closeAllForms()
}

function toggleAccountFilter(account: Account) {
  if (selectedAccountIds.value.includes(account.id)) {
    selectedAccountIds.value = selectedAccountIds.value.filter(id => id !== account.id)
    return
  }
  selectedAccountIds.value = [...selectedAccountIds.value, account.id]
}

function updateBaseCurrency(value: string | number | null) {
  if (typeof value !== 'string') return
  setBaseCurrency(value)
}
</script>

<template>
  <div>
    <PageHeader title="finances" :meta="`base ${financeSettings.base_currency}`" />
    <div class="page-area">
      <FinanceSummary />

      <div class="fin-tabs" role="tablist" aria-label="finance sections">
        <button type="button" class="fin-tab" :class="{ active: activeTab === 'main' }" @click="activeTab = 'main'">main</button>
        <button type="button" class="fin-tab" :class="{ active: activeTab === 'reports' }" @click="activeTab = 'reports'">reports</button>
        <button type="button" class="fin-tab" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">settings</button>
      </div>

      <template v-if="activeTab === 'main'">
        <div class="c" style="margin-bottom: 10px">
          <div class="c-t c-head">
            <span>accounts & transactions</span>
            <div class="head-actions">
              <span v-if="selectedAccountIds.length" class="simple-sub">{{ selectedAccountIds.length }} selected</span>
              <button class="mini-btn" @click="selectedAccount = null; accountFormOpen = true">new account</button>
              <button class="mini-btn" @click="selectedTransaction = null; transactionFormOpen = true">new tx</button>
            </div>
          </div>
          <div class="accounts-grid">
            <AccountRow
              v-for="acct in accountBalances"
              :key="acct.id"
              :account="acct"
              :base-currency="financeSettings.base_currency"
              :selected="selectedAccountIds.includes(acct.id)"
              @edit="selectedAccount = acct; accountFormOpen = true"
              @toggle="toggleAccountFilter"
            />
          </div>
          <div class="tx-head">
            <span>recent transactions</span>
            <router-link v-if="selectedAccountIds.length" @click="selectedAccountIds = []" to="#">[x] clear filters</router-link>
          </div>
          <TransactionRow v-for="tx in decoratedTransactions" :key="tx.id" :transaction="tx" @edit="selectedTransaction = tx; transactionFormOpen = true" />
          <div class="empty" v-if="decoratedTransactions.length === 0">no transactions</div>
        </div>

        <div class="c" style="margin-bottom: 10px">
          <div class="c-t c-head">
            <span>subscriptions</span>
            <span class="sub-total">{{ formatMoney(totalSubsMonthly, financeSettings.base_currency) }}/mo</span>
            <button class="mini-btn" @click="selectedSubscription = null; subscriptionFormOpen = true">new</button>
          </div>
          <template v-if="groupedSubscriptions.monthly.length">
            <div class="archive-head">monthly</div>
            <SubscriptionRow v-for="sub in groupedSubscriptions.monthly" :key="sub.id" :subscription="sub" @edit="selectedSubscription = sub; subscriptionFormOpen = true" />
          </template>
          <template v-if="groupedSubscriptions.quarterly.length">
            <div class="archive-head">quarterly</div>
            <SubscriptionRow v-for="sub in groupedSubscriptions.quarterly" :key="sub.id" :subscription="sub" @edit="selectedSubscription = sub; subscriptionFormOpen = true" />
          </template>
          <template v-if="groupedSubscriptions.yearly.length">
            <div class="archive-head">yearly</div>
            <SubscriptionRow v-for="sub in groupedSubscriptions.yearly" :key="sub.id" :subscription="sub" @edit="selectedSubscription = sub; subscriptionFormOpen = true" />
          </template>
          <div v-if="cancelledSubscriptions.length" class="archive-head">cancelled</div>
          <SubscriptionRow v-for="sub in cancelledSubscriptions" :key="`cancelled-${sub.id}`" :subscription="sub" @edit="selectedSubscription = sub; subscriptionFormOpen = true" />
        </div>
      </template>

      <template v-else-if="activeTab === 'reports'">
        <div class="month-bar">
          <label class="setting-label">month</label>
          <input v-model="monthKey" type="month" class="setting-select month-input" />
        </div>

        <BudgetOverview :month-key="monthKey" />
        <IncomeExpenseTrend />
        <NetWorthTrend />
      </template>

      <template v-else>
        <div class="c settings-card" style="margin-bottom: 10px">
          <div class="c-t c-head">
            <span>finance settings</span>
            <button class="mini-btn" @click="rateFormOpen = true">new rate</button>
          </div>
          <div class="setting-row">
            <label class="setting-label">base currency</label>
            <div class="setting-select-wrap">
              <Select
                compact
                :model-value="financeSettings.base_currency"
                :options="baseCurrencyOptions"
                @update:model-value="updateBaseCurrency"
              />
            </div>
          </div>
          <div class="rate-list">
            <button v-for="rate in exchangeRates" :key="rate.id" type="button" class="rate-row" @click="selectedRate = rate; rateFormOpen = true">
              <span>{{ rate.from_currency }}/{{ rate.to_currency }}</span>
              <span>{{ rate.rate }} <span class="rate-date">{{ rate.effective_date }}</span></span>
            </button>
          </div>
        </div>

        <div class="c" style="margin-bottom: 10px">
          <div class="c-t c-head">
            <span>transaction categories</span>
            <button class="mini-btn" @click="selectedCategory = null; categoryFormOpen = true">new</button>
          </div>
          <button v-for="category in transactionCategories" :key="category.id" type="button" class="simple-row" @click="selectedCategory = category; categoryFormOpen = true">
            <span>
              <span class="cat-dot" :style="{ background: category.color }"></span>
              {{ category.label }}
              <span class="simple-sub">{{ category.kind }}</span>
            </span>
            <span class="simple-sub">{{ category.monthly_budget === null ? 'no budget' : formatMoney(category.monthly_budget, financeSettings.base_currency) }}</span>
          </button>
        </div>
      </template>

      <AccountForm
        :open="accountFormOpen"
        :account="selectedAccount"
        :current-balance="selectedAccountCurrentBalance"
        @save="saveAccount"
        @adjust="adjustAccount"
        @delete="removeSelectedAccount"
        @close="closeAllForms"
      />

      <TransactionForm
        :open="transactionFormOpen"
        :transaction="selectedTransaction"
        @save="saveTransaction"
        @delete="id => deleteTransaction(id).then(closeAllForms)"
        @close="closeAllForms"
      />

      <SubscriptionForm
        :open="subscriptionFormOpen"
        :subscription="selectedSubscription"
        @save="saveSubscription"
        @cancel="id => cancelSubscription(id).then(closeAllForms)"
        @restore="id => restoreSubscription(id).then(closeAllForms)"
        @delete="id => deleteSubscription(id).then(closeAllForms)"
        @close="closeAllForms"
      />

      <TransactionCategoryForm
        :open="categoryFormOpen"
        :category="selectedCategory"
        @save="saveCategory"
        @delete="id => deleteTransactionCategory(id).then(closeAllForms)"
        @close="closeAllForms"
      />

      <ExchangeRateForm
        :open="rateFormOpen"
        :rate="selectedRate"
        :base-currency="financeSettings.base_currency"
        @save="saveRate"
        @delete="id => deleteExchangeRate(id).then(closeAllForms)"
        @close="closeAllForms"
      />
    </div>
  </div>
</template>

<style scoped>
.page-area {
  max-width: 720px;
  margin: 0 auto;
}

.fin-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.fin-tab {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 0.66rem;
  padding: 6px 10px;
  text-transform: lowercase;
  cursor: pointer;
}

.fin-tab:hover {
  color: var(--text);
  border-color: var(--text);
}

.fin-tab.active {
  color: var(--text);
  border-color: var(--text);
  background: var(--bg-hover);
}

.c-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.sub-total,
.archive-head,
.simple-sub,
.rate-date {
  font-size: 0.58rem;
  color: var(--text-dim);
}

.archive-head {
  margin-top: 8px;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.simple-row,
.rate-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 0;
  border: none;
  border-bottom: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.7rem;
  text-align: left;
}

.simple-row:hover,
.rate-row:hover {
  cursor: pointer;
  background: var(--bg-hover);
}

.simple-row:last-child,
.rate-row:last-child {
  border-bottom: none;
}

.cat-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 6px;
}

.settings-card {
  display: grid;
  gap: 8px;
}

.setting-row,
.month-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.setting-label {
  font-size: 0.58rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.setting-select,
.month-input {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.72rem;
  padding: 6px 8px;
}

.setting-select-wrap {
  width: 110px;
}

.rate-list {
  display: grid;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tx-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 0.68rem;
  color: var(--text-dim);
}

.tx-head a {
  color: var(--text-dim);
  text-decoration: none;
  font-size: 0.55rem;
}

.tx-head a:hover {
  color: var(--accent);
}

.empty {
  margin-top: 6px;
  font-size: 0.55rem;
  color: var(--text-dim);
}

@media (max-width: 768px) {
  .setting-row,
  .month-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .accounts-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
