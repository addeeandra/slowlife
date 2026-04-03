import { computed, ref } from 'vue'
import type {
  CommandPaletteResult,
  CommandPaletteTransactionResult,
  JournalEntry,
  Todo,
} from '../core/types'
import {
  searchEvents,
  searchJournalEntries,
  searchTodos,
  searchTransactions,
} from '../core/search'
import { useSpaces } from './useSpaces'
import { useTodos } from './useTodos'

const isOpen = ref(false)
const query = ref('')
const activeIndex = ref(0)
const selectedTransactionId = ref<string | null>(null)
const isSearching = ref(false)
const contentResults = ref<{
  journal: CommandPaletteResult[]
  events: CommandPaletteResult[]
  transactions: CommandPaletteTransactionResult[]
  todos: CommandPaletteResult[]
}>({
  journal: [],
  events: [],
  transactions: [],
  todos: [],
})

let searchTimer: number | null = null
let searchSeq = 0

function normalize(text: string) {
  return text.toLowerCase().trim()
}

function includesQuery(parts: Array<string | null | undefined>, normalizedQuery: string) {
  return parts.some(part => normalize(part || '').includes(normalizedQuery))
}

function recentOpenTodos(todos: Todo[]) {
  return [...todos]
    .sort((a, b) => a.priority.localeCompare(b.priority) || b.created_at.localeCompare(a.created_at))
    .slice(0, 5)
}

export function useCommandPalette() {
  const { openTodos } = useTodos()
  const { spaces, categories, projects } = useSpaces()

  const navigationResults = computed<CommandPaletteResult[]>(() => [
    { type: 'navigation', id: 'nav-dashboard', label: 'dashboard', meta: 'home', route: '/' },
    { type: 'navigation', id: 'nav-journal-casual', label: 'journal casual', meta: 'write and browse', route: '/journal/casual' },
    { type: 'navigation', id: 'nav-journal-work', label: 'journal work', meta: 'write and browse', route: '/journal/work' },
    { type: 'navigation', id: 'nav-events', label: 'events', meta: 'calendar and agenda', route: '/events' },
    { type: 'navigation', id: 'nav-finances', label: 'finances', meta: 'accounts and transactions', route: '/finances' },
    { type: 'navigation', id: 'nav-todos', label: 'todos', meta: 'active tasks', route: '/todos' },
  ])

  const journalTargetResults = computed<CommandPaletteResult[]>(() => {
    const categoryTargets = categories.value.map(category => {
      const space = spaces.value.find(item => item.id === category.space_id)
      return {
        type: 'journal_target' as const,
        id: `journal-category-${category.space_id}-${category.id}`,
        label: category.label,
        meta: `${space?.label || category.space_id} category`,
        route: `/journal/${category.space_id}/${category.id}`,
      }
    })

    const projectTargets = projects.value.map(project => {
      const space = spaces.value.find(item => item.id === project.space_id)
      const category = categories.value.find(item => item.id === project.category_id && item.space_id === project.space_id)
      return {
        type: 'journal_target' as const,
        id: `journal-project-${project.space_id}-${project.category_id}-${project.id}`,
        label: project.label,
        meta: `${space?.label || project.space_id} / ${category?.label || project.category_id}`,
        route: `/journal/${project.space_id}/${project.category_id}/${project.id}`,
      }
    })

    return [...categoryTargets, ...projectTargets]
  })

  const results = computed(() => {
    const normalizedQuery = normalize(query.value)
    if (!normalizedQuery) {
      return {
        navigation: navigationResults.value,
        journal: [] as CommandPaletteResult[],
        events: [] as CommandPaletteResult[],
        transactions: [] as CommandPaletteTransactionResult[],
        todos: recentOpenTodos(openTodos.value).map(todo => ({
          type: 'todo' as const,
          id: `todo-${todo.id}`,
          label: todo.title,
          meta: `${todo.priority} ${todo.status}${todo.due_date ? ` due ${todo.due_date}` : ''}`,
          todo,
        })),
      }
    }

    return {
      navigation: navigationResults.value.filter(result => includesQuery([result.label, result.meta], normalizedQuery)),
      journal: [
        ...journalTargetResults.value.filter(result => includesQuery([result.label, result.meta], normalizedQuery)),
        ...contentResults.value.journal,
      ],
      events: contentResults.value.events,
      transactions: contentResults.value.transactions,
      todos: contentResults.value.todos,
    }
  })

  const flatResults = computed(() => [
    ...results.value.navigation,
    ...results.value.journal,
    ...results.value.events,
    ...results.value.transactions,
    ...results.value.todos,
  ])

  const selectedTransaction = computed(() => {
    const selected = flatResults.value.find(result => result.id === selectedTransactionId.value)
    return selected?.type === 'transaction' ? selected : null
  })

  function syncTransactionPreview(result?: CommandPaletteResult) {
    if (result?.type === 'transaction') {
      selectedTransactionId.value = result.id
    }
  }

  function open() {
    isOpen.value = true
    setQuery('')
  }

  function close() {
    isOpen.value = false
    query.value = ''
    activeIndex.value = 0
    selectedTransactionId.value = null
  }

  async function runSearch(nextQuery: string) {
    const normalizedQuery = normalize(nextQuery)
    const currentSeq = ++searchSeq

    if (!normalizedQuery) {
      contentResults.value = { journal: [], events: [], transactions: [], todos: [] }
      isSearching.value = false
      return
    }

    isSearching.value = true
    const [journalEntries, events, transactions, todos] = await Promise.all([
      searchJournalEntries(normalizedQuery),
      searchEvents(normalizedQuery),
      searchTransactions(normalizedQuery),
      searchTodos(normalizedQuery),
    ])

    if (currentSeq !== searchSeq) return

    selectedTransactionId.value = null
    contentResults.value = {
      journal: journalEntries.map((entry: JournalEntry) => ({
        type: 'journal_entry' as const,
        id: `journal-entry-${entry.id}`,
        label: entry.text.split('\n')[0].slice(0, 80) || '(empty entry)',
        meta: `${entry.space} / ${entry.category}${entry.item ? ` / ${entry.item}` : ''}`,
        entry,
      })),
      events: events.map(event => ({
        type: 'event' as const,
        id: `event-${event.id}`,
        label: event.title,
        meta: `${event.date}${event.time ? ` ${event.time}` : ''}${event.source === 'google' ? ' google' : ''}`,
        event,
      })),
      transactions: transactions.map(transaction => ({
        type: 'transaction' as const,
        id: `transaction-${transaction.id}`,
        label: transaction.description,
        meta: `${transaction.date} ${transaction.account_name || 'unknown account'}`,
        transaction,
        detail: {
          account_name: transaction.account_name || 'unknown account',
          account_currency: transaction.account_currency || 'IDR',
          category_label: transaction.category_label,
        },
      })),
      todos: todos.map(todo => ({
        type: 'todo' as const,
        id: `todo-${todo.id}`,
        label: todo.title,
        meta: `${todo.priority} ${todo.status}${todo.due_date ? ` due ${todo.due_date}` : ''}`,
        todo,
      })),
    }
    isSearching.value = false

    const firstTransaction = [
      ...contentResults.value.transactions,
    ][0]
    selectedTransactionId.value = firstTransaction?.id || null
  }

  function moveActive(step: number) {
    if (!flatResults.value.length) return
    const next = (activeIndex.value + step + flatResults.value.length) % flatResults.value.length
    activeIndex.value = next
    syncTransactionPreview(flatResults.value[next])
  }

  function setActive(index: number) {
    activeIndex.value = index
    syncTransactionPreview(flatResults.value[index])
  }

  function setQuery(value: string) {
    query.value = value
    activeIndex.value = 0
    if (searchTimer) {
      window.clearTimeout(searchTimer)
      searchTimer = null
    }
    searchTimer = window.setTimeout(() => {
      void runSearch(value)
    }, 120)
  }

  function activeResult() {
    return flatResults.value[activeIndex.value] || null
  }

  return {
    isOpen,
    query,
    activeIndex,
    isSearching,
    results,
    flatResults,
    selectedTransaction,
    open,
    close,
    moveActive,
    setActive,
    setQuery,
    activeResult,
  }
}
