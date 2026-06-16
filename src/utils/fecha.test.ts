import { describe, expect, test } from 'vitest'
import { MONTH_NAMES, formatMonto, getUTCDay, getUTCMonthIndex } from './fecha'

describe('formatMonto', () => {
  test('prefixes with "$ " and uses es-AR grouping', () => {
    expect(formatMonto(1234)).toBe('$ 1.234')
  })

  test('keeps decimals when present', () => {
    expect(formatMonto(56501.85)).toBe('$ 56.501,85')
  })

  test('handles zero', () => {
    expect(formatMonto(0)).toBe('$ 0')
  })
})

describe('UTC date helpers', () => {
  test('getUTCDay reads the day-of-month in UTC', () => {
    expect(getUTCDay('2026-05-20T12:00:00.000Z')).toBe(20)
  })

  test('getUTCMonthIndex reads the 0-based month in UTC', () => {
    expect(getUTCMonthIndex('2026-05-20T12:00:00.000Z')).toBe(4)
  })
})

describe('MONTH_NAMES', () => {
  test('has 12 months starting at Enero', () => {
    expect(MONTH_NAMES).toHaveLength(12)
    expect(MONTH_NAMES[0]).toBe('Enero')
    expect(MONTH_NAMES[11]).toBe('Diciembre')
  })
})
