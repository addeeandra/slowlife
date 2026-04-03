<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { formatMoney } from '../core/constants'
import { useCommandPalette } from '../composables/useCommandPalette'
import { useEventDialog } from '../composables/useEventDialog'
import { useJournalPreviewDialog } from '../composables/useJournalPreviewDialog'
import { useTodoDialog } from '../composables/useTodoDialog'

const router = useRouter()
const inputRef = ref<HTMLInputElement | null>(null)

const {
  isOpen,
  query,
  activeIndex,
  isSearching,
  results,
  flatResults,
  selectedTransaction,
  close,
  moveActive,
  setActive,
  setQuery,
  activeResult,
} = useCommandPalette()

const { openEvent } = useEventDialog()
const { openEntry } = useJournalPreviewDialog()
const { openEdit } = useTodoDialog()

const sections = computed(() => [
  { key: 'navigation', label: 'navigation', items: results.value.navigation },
  { key: 'journal', label: 'journal', items: results.value.journal },
  { key: 'events', label: 'events', items: results.value.events },
  { key: 'transactions', label: 'transactions', items: results.value.transactions },
  { key: 'todos', label: 'todos', items: results.value.todos },
].filter(section => section.items.length > 0))

watch(isOpen, async open => {
  if (!open) return
  await nextTick()
  inputRef.value?.focus()
})

function globalIndexFor(sectionKey: string, index: number) {
  let offset = 0
  for (const section of sections.value) {
    if (section.key === sectionKey) return offset + index
    offset += section.items.length
  }
  return 0
}

function isActive(index: number) {
  return activeIndex.value === index
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    moveActive(1)
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    moveActive(-1)
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    execute(activeResult())
    return
  }
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}

function execute(result = activeResult()) {
  if (!result) return

  switch (result.type) {
    case 'navigation':
    case 'journal_target':
      router.push(result.route)
      close()
      break
    case 'journal_entry':
      openEntry(result.entry)
      close()
      break
    case 'event':
      openEvent(result.event)
      close()
      break
    case 'todo':
      openEdit(result.todo)
      close()
      break
    case 'transaction':
      setActive(flatResults.value.findIndex(item => item.id === result.id))
      break
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="cp-backdrop" @click="close"></div>
    <div v-if="isOpen" class="cp-modal">
      <div class="cp-head">
        <input
          ref="inputRef"
          :value="query"
          type="text"
          class="cp-input"
          placeholder="search journal, events, transactions, todos"
          @input="setQuery(($event.target as HTMLInputElement).value)"
          @keydown="handleKeydown"
        />
        <button type="button" class="b-close" @click="close">esc</button>
      </div>

      <div class="cp-body" :class="{ preview: !!selectedTransaction }">
        <div class="cp-results">
          <template v-for="section in sections" :key="section.key">
            <div class="cp-section">{{ section.label }}</div>
            <button
              v-for="(item, sectionIndex) in section.items"
              :key="item.id"
              type="button"
              class="cp-row"
              :class="{ active: isActive(globalIndexFor(section.key, sectionIndex)), transaction: item.type === 'transaction' }"
              @mouseenter="setActive(globalIndexFor(section.key, sectionIndex))"
              @click="execute(item)"
            >
              <span class="cp-label">{{ item.label }}</span>
              <span class="cp-meta">{{ item.meta }}</span>
            </button>
          </template>
          <div v-if="isSearching" class="cp-empty">searching...</div>
          <div v-if="!flatResults.length" class="cp-empty">no results</div>
        </div>

        <div v-if="selectedTransaction" class="cp-preview">
          <div class="cp-preview-title">{{ selectedTransaction.label }}</div>
          <div class="cp-preview-meta">{{ selectedTransaction.meta }}</div>
          <div class="cp-preview-grid">
            <div class="cp-preview-label">amount</div>
            <div class="cp-preview-value">
              {{ selectedTransaction.transaction.type === 'income' ? '+' : '' }}{{ formatMoney(selectedTransaction.transaction.amount, selectedTransaction.detail.account_currency) }}
            </div>
            <div class="cp-preview-label">account</div>
            <div class="cp-preview-value">{{ selectedTransaction.detail.account_name }}</div>
            <div class="cp-preview-label">category</div>
            <div class="cp-preview-value">{{ selectedTransaction.detail.category_label || 'uncategorized' }}</div>
            <div class="cp-preview-label">mode</div>
            <div class="cp-preview-value">{{ selectedTransaction.transaction.entry_mode }}</div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.cp-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 120;
}

.cp-modal {
  position: fixed;
  top: 8%;
  left: 50%;
  transform: translateX(-50%);
  width: min(860px, 96vw);
  background: var(--bg);
  border: 1px solid var(--border);
  z-index: 130;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
}

.cp-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid var(--border);
}

.cp-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.82rem;
}

.cp-input::placeholder {
  color: var(--text-dim);
}

.cp-body {
  display: block;
  max-height: 70vh;
  overflow: hidden;
}

.cp-body.preview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
}

.cp-results {
  max-height: 70vh;
  overflow-y: auto;
  padding: 8px 12px 12px;
}

.cp-section {
  font-size: 0.56rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 10px 0 4px;
}

.cp-row {
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 12px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text);
  font-family: var(--mono);
  text-align: left;
  padding: 8px 10px;
  cursor: pointer;
}

.cp-row:hover,
.cp-row.active {
  background: var(--bg-hover);
  border-color: var(--border);
}

.cp-row.transaction.active {
  border-color: var(--accent);
}

.cp-label {
  font-size: 0.72rem;
  color: var(--text);
  min-width: 0;
}

.cp-meta {
  font-size: 0.58rem;
  color: var(--text-dim);
  flex-shrink: 0;
}

.cp-preview {
  border-left: 1px solid var(--border);
  background: var(--bg-card);
  padding: 12px;
}

.cp-preview-title {
  font-family: var(--mono);
  font-size: 0.8rem;
  color: var(--text);
}

.cp-preview-meta {
  font-size: 0.6rem;
  color: var(--text-dim);
  margin-top: 4px;
  margin-bottom: 12px;
}

.cp-preview-grid {
  display: grid;
  grid-template-columns: 70px 1fr;
  gap: 8px;
}

.cp-preview-label {
  font-size: 0.56rem;
  color: var(--text-dim);
  text-transform: uppercase;
}

.cp-preview-value {
  font-size: 0.7rem;
  color: var(--text);
}

.cp-empty {
  padding: 16px 10px;
  font-size: 0.68rem;
  color: var(--text-dim);
}

@media (max-width: 768px) {
  .cp-body.preview {
    grid-template-columns: 1fr;
  }

  .cp-preview {
    border-left: none;
    border-top: 1px solid var(--border);
  }
}
</style>
