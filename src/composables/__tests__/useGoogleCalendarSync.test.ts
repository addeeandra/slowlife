import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDb } from '../../__mocks__/@tauri-apps/plugin-sql'

vi.mock('../../core/googleAuth', () => ({
  createGoogleOAuthUrl: vi.fn(),
  exchangeGoogleCode: vi.fn(),
  refreshGoogleAccessToken: vi.fn(),
  startGoogleOAuth: vi.fn(),
}))

vi.mock('../../core/googleCalendarApi', () => ({
  fetchGoogleCalendars: vi.fn(),
  fetchGoogleEventsPage: vi.fn(),
  normalizeGoogleEvent: vi.fn(),
}))

vi.mock('../useEvents', () => ({
  useEvents: () => ({
    load: vi.fn().mockResolvedValue(undefined),
  }),
}))

describe('useGoogleCalendarSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    mockDb.select.mockReset()
    mockDb.execute.mockReset().mockResolvedValue({ rowsAffected: 0 })
  })

  it('loads saved account, calendars, and sync state', async () => {
    mockDb.select
      .mockResolvedValueOnce([{ id: 1, client_id: 'cid', email: 'me@example.com', access_token: 'token', refresh_token: 'refresh', expires_at: '2099-01-01T00:00:00Z', connected: 1, created_at: '' }])
      .mockResolvedValueOnce([{ calendar_id: 'primary', summary: 'Primary', primary: 1, selected: 1, background_color: '#123', foreground_color: '#fff', access_role: 'owner', created_at: '' }])
      .mockResolvedValueOnce([{ calendar_id: 'primary', next_sync_token: 'sync-1', last_synced_at: '2026-04-02T00:00:00Z', last_error: null }])

    const { useGoogleCalendarSync } = await import('../useGoogleCalendarSync')
    const sync = useGoogleCalendarSync()
    await sync.load()

    expect(sync.account.value?.email).toBe('me@example.com')
    expect(sync.calendars.value).toHaveLength(1)
    expect(sync.syncState.value[0].next_sync_token).toBe('sync-1')
  })

  it('removes deselected calendar events before syncing remaining calendars', async () => {
    const auth = await import('../../core/googleAuth')
    const api = await import('../../core/googleCalendarApi')

    vi.mocked(auth.refreshGoogleAccessToken).mockResolvedValue({
      access_token: 'fresh-token',
      expires_in: 3600,
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      token_type: 'Bearer',
    })

    vi.mocked(api.fetchGoogleEventsPage).mockResolvedValue({
      items: [],
      nextSyncToken: 'next-sync',
    })

    mockDb.select
      .mockResolvedValueOnce([{ id: 1, client_id: 'cid', email: 'me@example.com', access_token: 'expired-token', refresh_token: 'refresh', expires_at: '2000-01-01T00:00:00Z', connected: 1, created_at: '' }])
      .mockResolvedValueOnce([
        { calendar_id: 'primary', summary: 'Primary', primary: 1, selected: 1, background_color: '#123', foreground_color: '#fff', access_role: 'owner', created_at: '' },
        { calendar_id: 'team', summary: 'Team', primary: 0, selected: 1, background_color: '#456', foreground_color: '#fff', access_role: 'reader', created_at: '' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { calendar_id: 'primary', summary: 'Primary', primary: 1, selected: 1, background_color: '#123', foreground_color: '#fff', access_role: 'owner', created_at: '' },
        { calendar_id: 'team', summary: 'Team', primary: 0, selected: 0, background_color: '#456', foreground_color: '#fff', access_role: 'reader', created_at: '' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const { useGoogleCalendarSync } = await import('../useGoogleCalendarSync')
    const sync = useGoogleCalendarSync()
    await sync.load()
    await sync.saveCalendarSelection(['primary'])

    expect(mockDb.execute).toHaveBeenCalledWith('DELETE FROM events WHERE source = $1 AND external_calendar_id = $2', ['google', 'team'])
    expect(mockDb.execute).toHaveBeenCalledWith('DELETE FROM google_calendar_sync_state WHERE calendar_id = $1', ['team'])
  })
})
