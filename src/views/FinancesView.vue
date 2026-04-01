<script setup lang="ts">
import PageHeader from '../components/PageHeader.vue'
import FinanceSummary from '../components/finances/FinanceSummary.vue'
import AccountRow from '../components/finances/AccountRow.vue'
import SubscriptionRow from '../components/finances/SubscriptionRow.vue'
import TransactionRow from '../components/finances/TransactionRow.vue'
import { useFinances } from '../composables/useFinances'
import { formatCurrency } from '../core/constants'

const { accounts, subscriptions, transactions, totalSubsMonthly } = useFinances()
</script>

<template>
  <div>
    <PageHeader title="finances" meta="accounts & subscriptions" />
    <div class="page-area">
      <FinanceSummary />

      <div class="c" style="margin-bottom: 10px">
        <div class="c-t">accounts</div>
        <AccountRow v-for="acct in accounts" :key="acct.id" :account="acct" />
      </div>

      <div class="c" style="margin-bottom: 10px">
        <div class="c-t">
          subscriptions
          <span class="sub-total">{{ formatCurrency(totalSubsMonthly) }}/mo</span>
        </div>
        <SubscriptionRow v-for="sub in subscriptions" :key="sub.id" :subscription="sub" />
      </div>

      <div class="c">
        <div class="c-t">recent transactions</div>
        <TransactionRow v-for="tx in transactions" :key="tx.id" :transaction="tx" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-area {
  max-width: 580px;
}

.c {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 10px 12px;
}

.c-t {
  font-size: 0.58rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sub-total {
  font-weight: 400;
  color: var(--text-dim);
}
</style>
