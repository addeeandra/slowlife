import { describe, it, expect } from 'vitest'
import { normalizeGoogleEvent } from '../googleCalendarApi'
import type { GoogleCalendar, GoogleCalendarEvent } from '../types'

const calendar: GoogleCalendar = {
  calendar_id: 'primary',
  summary: 'Primary',
  primary: 1,
  selected: 1,
  background_color: '#123456',
  foreground_color: '#ffffff',
  access_role: 'owner',
  created_at: '',
}

describe('googleCalendarApi', () => {
  it('normalizes timed google events into readonly local rows', () => {
    const event: GoogleCalendarEvent = {
      id: 'evt-1',
      summary: 'Design review',
      description: 'Discuss launch prep',
      htmlLink: 'https://calendar.google.com/event?eid=1',
      updated: '2026-04-02T01:02:03Z',
      start: { dateTime: '2026-04-10T09:30:00+07:00' },
      end: { dateTime: '2026-04-10T10:15:00+07:00' },
    }

    const normalized = normalizeGoogleEvent(calendar, event)

    expect(normalized.title).toBe('Design review')
    expect(normalized.date).toBe('2026-04-10')
    expect(normalized.time).toBe('09:30')
    expect(normalized.end_time).toBe('10:15')
    expect(normalized.type).toBe('meeting')
    expect(normalized.source).toBe('google')
    expect(normalized.is_readonly).toBe(1)
    expect(normalized.external_calendar_id).toBe('primary')
    expect(normalized.external_url).toBe('https://calendar.google.com/event?eid=1')
  })

  it('maps all-day google events to agenda', () => {
    const event: GoogleCalendarEvent = {
      id: 'evt-2',
      summary: 'Public holiday',
      start: { date: '2026-04-17' },
      end: { date: '2026-04-18' },
    }

    const normalized = normalizeGoogleEvent(calendar, event)

    expect(normalized.date).toBe('2026-04-17')
    expect(normalized.time).toBeNull()
    expect(normalized.end_time).toBeNull()
    expect(normalized.type).toBe('agenda')
  })

  it('maps out of office events to holiday', () => {
    const event: GoogleCalendarEvent = {
      id: 'evt-3',
      eventType: 'outOfOffice',
      start: { date: '2026-05-01' },
      end: { date: '2026-05-02' },
    }

    const normalized = normalizeGoogleEvent(calendar, event)

    expect(normalized.title).toBe('untitled')
    expect(normalized.type).toBe('holiday')
  })
})
