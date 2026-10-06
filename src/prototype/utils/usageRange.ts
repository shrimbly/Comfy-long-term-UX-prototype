// Implements:
//   log: ../prototype/design-decisions.md (2026-10-07) — usage ranges on the
//        project page
//
// The sample usage only exists per month, so other ranges scale this
// month's records: a day is a thirtieth of the month, three and twelve
// months sum the project's monthly history.

import type { MonthlyUsage } from '../types'

export type UsageRange =
  | 'day'
  | 'week'
  | 'month30'
  | 'thisMonth'
  | 'quarter'
  | 'year'
  | 'custom'

export const USAGE_RANGES: UsageRange[] = [
  'day',
  'week',
  'month30',
  'thisMonth',
  'quarter',
  'year',
  'custom'
]

const DAYS_IN_MONTH = 30

function sumLast(history: MonthlyUsage[], months: number) {
  return history.slice(-months).reduce((sum, m) => sum + m.credits, 0)
}

// How much of this month's spend the range represents.
export function usageRangeFactor(
  range: UsageRange,
  thisMonth: number,
  history: MonthlyUsage[],
  customDays: number
): number {
  switch (range) {
    case 'day':
      return 1 / DAYS_IN_MONTH
    case 'week':
      return 7 / DAYS_IN_MONTH
    case 'month30':
    case 'thisMonth':
      return 1
    case 'quarter':
      return thisMonth ? sumLast(history, 3) / thisMonth : 0
    case 'year':
      return thisMonth ? sumLast(history, 12) / thisMonth : 0
    case 'custom':
      return Math.max(0, customDays) / DAYS_IN_MONTH
  }
}

export function daysBetween(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Number.isFinite(ms) ? Math.max(0, Math.round(ms / 86_400_000)) : 0
}
