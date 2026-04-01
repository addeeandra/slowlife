import type {
  Event,
  EventType,
  GoogleCalendar,
  GoogleCalendarEvent,
  GoogleCalendarListEntry,
  GoogleCalendarListResponse,
  GoogleEventsListResponse,
} from './types'

const API_BASE = 'https://www.googleapis.com/calendar/v3'

function mapEventType(event: GoogleCalendarEvent): EventType {
  if (event.eventType === 'outOfOffice') return 'holiday'
  if (!event.start?.dateTime) return 'agenda'
  return 'meeting'
}

function toLocalDateTimeParts(value?: string): { date: string; time: string | null } {
  if (!value) return { date: '', time: null }
  const date = new Date(value)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return { date: `${y}-${m}-${d}`, time: `${hh}:${mm}` }
}

async function apiGet<T>(path: string, accessToken: string, params: Record<string, string | undefined> = {}): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value)
  })

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (response.status === 410) {
    throw new Error('sync-token-expired')
  }

  if (!response.ok) {
    throw new Error(`google calendar request failed (${response.status})`)
  }

  return response.json()
}

export async function fetchGoogleCalendars(accessToken: string): Promise<GoogleCalendar[]> {
  const calendars: GoogleCalendar[] = []
  let pageToken: string | undefined

  do {
    const response = await apiGet<GoogleCalendarListResponse>('/users/me/calendarList', accessToken, { pageToken })
    for (const item of response.items || []) {
      calendars.push(normalizeCalendar(item))
    }
    pageToken = response.nextPageToken
  } while (pageToken)

  return calendars
}

function normalizeCalendar(item: GoogleCalendarListEntry): GoogleCalendar {
  return {
    calendar_id: item.id,
    summary: item.summary || 'untitled calendar',
    primary: item.primary ? 1 : 0,
    selected: 0,
    background_color: item.backgroundColor || null,
    foreground_color: item.foregroundColor || null,
    access_role: item.accessRole || null,
    created_at: '',
  }
}

export async function fetchGoogleEventsPage(params: {
  accessToken: string
  calendarId: string
  syncToken?: string | null
  pageToken?: string
}): Promise<GoogleEventsListResponse> {
  return apiGet<GoogleEventsListResponse>(
    `/calendars/${encodeURIComponent(params.calendarId)}/events`,
    params.accessToken,
    {
      singleEvents: 'true',
      showDeleted: params.syncToken ? 'true' : 'false',
      syncToken: params.syncToken || undefined,
      pageToken: params.pageToken,
    }
  )
}

export function normalizeGoogleEvent(calendar: GoogleCalendar, item: GoogleCalendarEvent): Omit<Event, 'id' | 'created_at'> {
  const start = item.start?.date || toLocalDateTimeParts(item.start?.dateTime).date
  const time = item.start?.date ? null : toLocalDateTimeParts(item.start?.dateTime).time
  const endTime = item.end?.date ? null : toLocalDateTimeParts(item.end?.dateTime).time
  const type = mapEventType(item)

  return {
    title: item.summary?.trim() || 'untitled',
    date: start,
    time,
    end_time: endTime,
    type,
    color: calendar.background_color || '#6a9ec4',
    description: item.description || null,
    space_id: null,
    category_id: null,
    recurrence_rule: null,
    google_id: item.id,
    source: 'google',
    external_calendar_id: calendar.calendar_id,
    external_url: item.htmlLink || null,
    external_status: item.status || null,
    is_readonly: 1,
    sync_updated_at: item.updated || null,
    external_event_type: item.eventType || null,
  }
}
