import { computed, ref } from 'vue'
import type { JournalEntry } from '../core/types'

const entry = ref<JournalEntry | null>(null)

export function useJournalPreviewDialog() {
  function openEntry(nextEntry: JournalEntry) {
    entry.value = nextEntry
  }

  function closeEntry() {
    entry.value = null
  }

  const isOpen = computed(() => !!entry.value)

  return {
    entry,
    isOpen,
    openEntry,
    closeEntry,
  }
}
