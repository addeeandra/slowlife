import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatCurrency, renewalLabel, TAGS, MOODS, MONTH_ABBR, DAY_ABBR } from '../constants'

describe('formatCurrency', () => {
  it('formats millions', () => {
    expect(formatCurrency(1_500_000)).toBe('Rp1.5M')
    expect(formatCurrency(10_000_000)).toBe('Rp10.0M')
  })

  it('formats thousands', () => {
    expect(formatCurrency(1_500)).toBe('Rp2K')
    expect(formatCurrency(50_000)).toBe('Rp50K')
  })

  it('formats small numbers', () => {
    expect(formatCurrency(500)).toBe('Rp500')
    expect(formatCurrency(0)).toBe('Rp0')
  })

  it('formats negative millions', () => {
    expect(formatCurrency(-2_000_000)).toBe('-Rp2.0M')
  })

  it('formats negative thousands', () => {
    expect(formatCurrency(-5_000)).toBe('-Rp5K')
  })
})

describe('renewalLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-01T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "today" for today', () => {
    expect(renewalLabel('2026-04-01')).toBe('today')
  })

  it('returns "tomorrow" for next day', () => {
    expect(renewalLabel('2026-04-02')).toBe('tomorrow')
  })

  it('returns "in Xd" for future dates', () => {
    expect(renewalLabel('2026-04-08')).toBe('in 7d')
  })
})

describe('constants', () => {
  it('has casual and work tags', () => {
    expect(TAGS.casual).toBeInstanceOf(Array)
    expect(TAGS.work).toBeInstanceOf(Array)
    expect(TAGS.casual.length).toBeGreaterThan(0)
    expect(TAGS.work.length).toBeGreaterThan(0)
  })

  it('has all mood keys', () => {
    expect(Object.keys(MOODS)).toEqual(['great', 'good', 'okay', 'bad', 'awful'])
  })

  it('has 12 months and 7 days', () => {
    expect(MONTH_ABBR).toHaveLength(12)
    expect(DAY_ABBR).toHaveLength(7)
  })
})
