import { computed, ref } from 'vue'
import type { Event, EventOccurrence } from '../core/types'

const formOpen = ref(false)
const editingEvent = ref<Event | null>(null)
const prefillDate = ref<string | null>(null)
const draftContext = ref<{
  space_id: string | null
  category_id: string | null
} | null>(null)
const googleEvent = ref<EventOccurrence | null>(null)

export function useEventDialog() {
  function openEvent(event: Event | EventOccurrence) {
    if (event.id < 0) return
    if (event.source === 'google') {
      googleEvent.value = event as EventOccurrence
      return
    }

    editingEvent.value = event
    prefillDate.value = null
    draftContext.value = null
    formOpen.value = true
  }

  function openCreate(date: string | null = null) {
    editingEvent.value = null
    prefillDate.value = date
    draftContext.value = null
    formOpen.value = true
  }

  function openCreateWithContext(context: {
    date?: string | null
    space_id: string | null
    category_id: string | null
  }) {
    editingEvent.value = null
    prefillDate.value = context.date || null
    draftContext.value = {
      space_id: context.space_id,
      category_id: context.category_id,
    }
    formOpen.value = true
  }

  function closeForm() {
    formOpen.value = false
    editingEvent.value = null
    prefillDate.value = null
    draftContext.value = null
  }

  function closeGoogleDetail() {
    googleEvent.value = null
  }

  const isGoogleDetailOpen = computed(() => !!googleEvent.value)

  return {
    formOpen,
    editingEvent,
    prefillDate,
    draftContext,
    googleEvent,
    isGoogleDetailOpen,
    openEvent,
    openCreate,
    openCreateWithContext,
    closeForm,
    closeGoogleDetail,
  }
}
