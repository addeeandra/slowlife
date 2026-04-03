import { computed, ref } from 'vue'
import type { Event, EventOccurrence } from '../core/types'

const formOpen = ref(false)
const editingEvent = ref<Event | null>(null)
const prefillDate = ref<string | null>(null)
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
    formOpen.value = true
  }

  function openCreate(date: string | null = null) {
    editingEvent.value = null
    prefillDate.value = date
    formOpen.value = true
  }

  function closeForm() {
    formOpen.value = false
    editingEvent.value = null
    prefillDate.value = null
  }

  function closeGoogleDetail() {
    googleEvent.value = null
  }

  const isGoogleDetailOpen = computed(() => !!googleEvent.value)

  return {
    formOpen,
    editingEvent,
    prefillDate,
    googleEvent,
    isGoogleDetailOpen,
    openEvent,
    openCreate,
    closeForm,
    closeGoogleDetail,
  }
}
