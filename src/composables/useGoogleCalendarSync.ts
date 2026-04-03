import { computed, ref } from 'vue'
import { getDb } from '../core/db'
import {
  createGoogleOAuthUrl,
  exchangeGoogleCode,
  refreshGoogleAccessToken,
  startGoogleOAuth,
} from '../core/googleAuth'
import {
  fetchGoogleCalendars,
  fetchGoogleEventsPage,
  normalizeGoogleEvent,
} from '../core/googleCalendarApi'
import { upsertEventSearchIndex } from '../core/search'
import type { GoogleAccount, GoogleCalendar, GoogleCalendarSyncState } from '../core/types'
import { useEvents } from './useEvents'

const account = ref<GoogleAccount | null>(null)
const calendars = ref<GoogleCalendar[]>([])
const syncState = ref<GoogleCalendarSyncState[]>([])
const isSyncing = ref(false)
const isConnecting = ref(false)
const lastError = ref<string | null>(null)

function isoNow(): string {
  return new Date().toISOString()
}

async function loadAccount() {
  const db = await getDb()
  const rows = await db.select<GoogleAccount[]>('SELECT * FROM google_account WHERE id = 1')
  account.value = rows[0] || null
}

async function loadCalendarsState() {
  const db = await getDb()
  calendars.value = await db.select<GoogleCalendar[]>('SELECT * FROM google_calendars ORDER BY "primary" DESC, summary')
  syncState.value = await db.select<GoogleCalendarSyncState[]>('SELECT * FROM google_calendar_sync_state')
}

async function upsertAccount(data: Partial<GoogleAccount>) {
  const db = await getDb()
  await db.execute(
    `INSERT INTO google_account (id, client_id, client_secret, email, access_token, refresh_token, expires_at, connected)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT(id) DO UPDATE SET
       client_id = excluded.client_id,
       client_secret = excluded.client_secret,
       email = excluded.email,
       access_token = excluded.access_token,
       refresh_token = excluded.refresh_token,
       expires_at = excluded.expires_at,
       connected = excluded.connected`,
    [
      data.client_id || null,
      data.client_secret || null,
      data.email || null,
      data.access_token || null,
      data.refresh_token || null,
      data.expires_at || null,
      data.connected ?? 0,
    ]
  )
  await loadAccount()
}

async function ensureValidAccessToken(): Promise<string> {
  if (!account.value?.access_token) {
    throw new Error('google account not connected')
  }

  const expiresAt = account.value.expires_at ? new Date(account.value.expires_at).getTime() : 0
  if (expiresAt > Date.now() + 60_000) {
    return account.value.access_token
  }

  const refreshed = await refreshGoogleAccessToken(account.value)
  await upsertAccount({
    ...account.value,
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token || account.value.refresh_token,
    expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    connected: 1,
  })

  return refreshed.access_token
}

async function persistCalendars(items: GoogleCalendar[]) {
  const db = await getDb()
  for (const cal of items) {
    const existing = calendars.value.find(c => c.calendar_id === cal.calendar_id)
    await db.execute(
      `INSERT INTO google_calendars (calendar_id, summary, "primary", selected, background_color, foreground_color, access_role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT(calendar_id) DO UPDATE SET
         summary = excluded.summary,
         "primary" = excluded."primary",
         selected = COALESCE(google_calendars.selected, excluded.selected),
         background_color = excluded.background_color,
         foreground_color = excluded.foreground_color,
         access_role = excluded.access_role`,
      [
        cal.calendar_id,
        cal.summary,
        cal.primary,
        existing?.selected || cal.selected,
        cal.background_color,
        cal.foreground_color,
        cal.access_role,
      ]
    )
  }
  await loadCalendarsState()
}

async function upsertSyncState(calendarId: string, patch: Partial<GoogleCalendarSyncState>) {
  const db = await getDb()
  const existing = syncState.value.find(s => s.calendar_id === calendarId)
  await db.execute(
    `INSERT INTO google_calendar_sync_state (calendar_id, next_sync_token, last_synced_at, last_error)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT(calendar_id) DO UPDATE SET
       next_sync_token = excluded.next_sync_token,
       last_synced_at = excluded.last_synced_at,
       last_error = excluded.last_error`,
    [
      calendarId,
      patch.next_sync_token ?? existing?.next_sync_token ?? null,
      patch.last_synced_at ?? existing?.last_synced_at ?? null,
      patch.last_error ?? existing?.last_error ?? null,
    ]
  )
  await loadCalendarsState()
}

async function deleteCalendarEvents(calendarIds: string[]) {
  if (!calendarIds.length) return
  const db = await getDb()
  for (const calendarId of calendarIds) {
    await db.execute('DELETE FROM events WHERE source = $1 AND external_calendar_id = $2', ['google', calendarId])
    await db.execute('DELETE FROM google_calendar_sync_state WHERE calendar_id = $1', [calendarId])
  }
  await useEvents().load()
  await loadCalendarsState()
}

async function upsertMirroredEvent(calendar: GoogleCalendar, payload: ReturnType<typeof normalizeGoogleEvent>) {
  const db = await getDb()
  const existing = await db.select<{ id: number }[]>(
    'SELECT id FROM events WHERE source = $1 AND external_calendar_id = $2 AND google_id = $3 LIMIT 1',
    ['google', calendar.calendar_id, payload.google_id]
  )

        if (existing[0]?.id) {
          await db.execute(
            `UPDATE events SET
         title = $1,
         date = $2,
         time = $3,
         end_time = $4,
         type = $5,
         color = $6,
         description = $7,
         external_url = $8,
         external_status = $9,
         is_readonly = $10,
         sync_updated_at = $11,
         external_event_type = $12
       WHERE id = $13`,
        [
        payload.title,
        payload.date,
        payload.time,
        payload.end_time,
        payload.type,
        payload.color,
        payload.description,
        payload.external_url,
        payload.external_status,
        payload.is_readonly,
        payload.sync_updated_at,
        payload.external_event_type,
        existing[0].id,
      ]
    )
    await upsertEventSearchIndex(existing[0].id)
    return
  }

  await db.execute(
    `INSERT INTO events (
      title, date, time, end_time, type, color, description, space_id, category_id, recurrence_rule,
      google_id, source, external_calendar_id, external_url, external_status, is_readonly,
      sync_updated_at, external_event_type
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
    [
      payload.title,
      payload.date,
      payload.time,
      payload.end_time,
      payload.type,
      payload.color,
      payload.description,
      payload.space_id,
      payload.category_id,
      payload.recurrence_rule,
      payload.google_id,
      payload.source,
      payload.external_calendar_id,
      payload.external_url,
      payload.external_status,
      payload.is_readonly,
      payload.sync_updated_at,
      payload.external_event_type,
    ]
  )
  const rows = await db.select<{ id: number }[]>('SELECT last_insert_rowid() AS id')
  if (rows[0]?.id) {
    await upsertEventSearchIndex(rows[0].id)
  }
}

async function syncCalendar(calendar: GoogleCalendar) {
  const accessToken = await ensureValidAccessToken()
  const state = syncState.value.find(s => s.calendar_id === calendar.calendar_id)
  let pageToken: string | undefined
  let nextSyncToken = state?.next_sync_token || null

  try {
    do {
      const response = await fetchGoogleEventsPage({
        accessToken,
        calendarId: calendar.calendar_id,
        syncToken: pageToken ? state?.next_sync_token || null : state?.next_sync_token || null,
        pageToken,
      })

      for (const item of response.items || []) {
        const db = await getDb()
        if (item.status === 'cancelled') {
          await db.execute(
            'DELETE FROM events_fts WHERE rowid IN (SELECT id FROM events WHERE source = $1 AND external_calendar_id = $2 AND google_id = $3)',
            ['google', calendar.calendar_id, item.id]
          )
          await db.execute(
            'DELETE FROM events WHERE source = $1 AND external_calendar_id = $2 AND google_id = $3',
            ['google', calendar.calendar_id, item.id]
          )
          continue
        }

        const normalized = normalizeGoogleEvent(calendar, item)
        await upsertMirroredEvent(calendar, normalized)
      }

      pageToken = response.nextPageToken
      if (response.nextSyncToken) nextSyncToken = response.nextSyncToken
    } while (pageToken)

    await upsertSyncState(calendar.calendar_id, {
      next_sync_token: nextSyncToken,
      last_synced_at: isoNow(),
      last_error: null,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'sync-token-expired') {
      await deleteCalendarEvents([calendar.calendar_id])
      await upsertSyncState(calendar.calendar_id, {
        next_sync_token: null,
        last_error: null,
      })
      await syncCalendar({ ...calendar, selected: 1 })
      return
    }

    await upsertSyncState(calendar.calendar_id, {
      last_error: error instanceof Error ? error.message : 'sync failed',
    })
    throw error
  }
}

export function useGoogleCalendarSync() {
  function resetTransientState() {
    isConnecting.value = false
    isSyncing.value = false
  }

  async function load() {
    await Promise.all([loadAccount(), loadCalendarsState()])
  }

  async function connect(clientId: string, clientSecret?: string | null) {
    isConnecting.value = true
    lastError.value = null
    try {
      const { authUrl, session } = await createGoogleOAuthUrl(clientId)
      const { code, redirectUri } = await startGoogleOAuth(authUrl)
      const token = await exchangeGoogleCode({
        clientId,
        clientSecret,
        code,
        codeVerifier: session.codeVerifier,
        redirectUri,
      })

      await upsertAccount({
        client_id: clientId,
        client_secret: clientSecret || null,
        access_token: token.access_token,
        refresh_token: token.refresh_token || null,
        expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(),
        connected: 1,
      })

      await refreshCalendars()
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : 'google connect failed'
      console.error(error)
      throw error
    } finally {
      isConnecting.value = false
    }
  }

  async function refreshCalendars() {
    const accessToken = await ensureValidAccessToken()
    const items = await fetchGoogleCalendars(accessToken)
    await persistCalendars(items)
  }

  async function saveCalendarSelection(selectedIds: string[]) {
    const db = await getDb()
    const deselected = calendars.value.filter(c => c.selected && !selectedIds.includes(c.calendar_id)).map(c => c.calendar_id)

    for (const calendar of calendars.value) {
      await db.execute('UPDATE google_calendars SET selected = $1 WHERE calendar_id = $2', [selectedIds.includes(calendar.calendar_id) ? 1 : 0, calendar.calendar_id])
    }

    await deleteCalendarEvents(deselected)
    await loadCalendarsState()
    await syncNow()
  }

  async function syncNow() {
    isSyncing.value = true
    lastError.value = null
    try {
      for (const calendar of calendars.value.filter(c => c.selected)) {
        await syncCalendar(calendar)
      }
      await useEvents().load()
      await loadCalendarsState()
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : 'sync failed'
      throw error
    } finally {
      isSyncing.value = false
    }
  }

  async function disconnect() {
    const db = await getDb()
    await db.execute('DELETE FROM events WHERE source = $1', ['google'])
    await db.execute('DELETE FROM google_calendar_sync_state')
    await db.execute('DELETE FROM google_calendars')
    await db.execute('DELETE FROM google_account')
    account.value = null
    calendars.value = []
    syncState.value = []
    lastError.value = null
    await useEvents().load()
  }

  const selectedCalendars = computed(() => calendars.value.filter(c => c.selected))
  const isConnected = computed(() => !!account.value?.connected)
  const lastSyncedAt = computed(() => {
    const latest = syncState.value
      .map(s => s.last_synced_at)
      .filter((value): value is string => !!value)
      .sort()
    return latest.length ? latest[latest.length - 1] : null
  })

  return {
    account,
    calendars,
    syncState,
    isSyncing,
    isConnecting,
    isConnected,
    selectedCalendars,
    lastSyncedAt,
    lastError,
    resetTransientState,
    load,
    connect,
    refreshCalendars,
    saveCalendarSelection,
    syncNow,
    disconnect,
  }
}
