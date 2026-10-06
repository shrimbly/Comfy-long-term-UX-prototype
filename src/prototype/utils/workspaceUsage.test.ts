import { describe, expect, it } from 'vitest'
import { adminFixture } from '../fixtures/admin'
import { sampleUsage, summarizeUsage, usageCsv } from './workspaceUsage'

describe('workspace usage', () => {
  it.for([
    ['2026-09', 18410],
    ['2026-10', 19050]
  ] as const)(
    'reconciles member and project spend for %s',
    ([month, credits]) => {
      const records = sampleUsage(adminFixture, 'ws-comfy-org').filter(
        (record) => record.month === month
      )
      const byMember = summarizeUsage(
        records,
        'members',
        adminFixture,
        'ws-comfy-org',
        'Unattributed'
      )
      const byProject = summarizeUsage(
        records,
        'projects',
        adminFixture,
        'ws-comfy-org',
        'Unattributed'
      )
      expect(byMember.reduce((sum, row) => sum + row.credits, 0)).toBe(credits)
      expect(byProject.reduce((sum, row) => sum + row.credits, 0)).toBe(credits)
      expect(byMember.reduce((sum, row) => sum + row.runs, 0)).toBe(
        byProject.reduce((sum, row) => sum + row.runs, 0)
      )
    }
  )

  it('does not show another workspace’s members or spend in a personal workspace', () => {
    const records = sampleUsage(adminFixture, 'ws-personal')
    const rows = summarizeUsage(
      records,
      'members',
      adminFixture,
      'ws-personal',
      'Unattributed'
    )
    expect(records).toEqual([])
    expect(rows.map((row) => row.id).toSorted()).toEqual(
      ['unattributed', adminFixture.currentUser.id].toSorted()
    )
  })

  it('escapes CSV cells and prevents names from becoming formulas', () => {
    const csv = usageCsv(
      ['Name', 'Email', 'Runs', 'Credits', 'Share'],
      [{ id: '1', name: '=1+1', detail: 'A, "B"', credits: 25, runs: 1 }],
      100
    )
    expect(csv).toContain('"\'=1+1","A, ""B""","1","25","25.0%"')
  })
})
