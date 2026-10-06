import { describe, expect, it } from 'vitest'

import { daysBetween, usageRangeFactor } from './usageRange'

const history = [
  { month: '2026-04', credits: 7400 },
  { month: '2026-05', credits: 9200 },
  { month: '2026-06', credits: 9800 }
]

describe('usageRangeFactor', () => {
  it.for([
    ['day', 1 / 30],
    ['week', 7 / 30],
    ['month30', 1],
    ['thisMonth', 1],
    ['quarter', (7400 + 9200 + 9800) / 9800],
    ['year', (7400 + 9200 + 9800) / 9800]
  ] as const)('%s scales this month', ([range, factor]) => {
    expect(usageRangeFactor(range, 9800, history, 0)).toBeCloseTo(factor)
  })

  it('custom follows the number of days', () => {
    expect(usageRangeFactor('custom', 9800, history, 15)).toBeCloseTo(0.5)
  })

  it('is zero when this month is empty', () => {
    expect(usageRangeFactor('quarter', 0, history, 0)).toBe(0)
  })
})

describe('daysBetween', () => {
  it('counts whole days and never goes negative', () => {
    expect(daysBetween('2026-10-01', '2026-10-15')).toBe(14)
    expect(daysBetween('2026-10-15', '2026-10-01')).toBe(0)
    expect(daysBetween('', '2026-10-01')).toBe(0)
  })
})
