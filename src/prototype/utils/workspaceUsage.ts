import type { PersonaFixture } from '../types'

interface UsageRecord {
  month: string
  projectId: string
  memberId: string | null
  credits: number
  runs: number
}

export interface UsageRow {
  id: string
  name: string
  detail: string
  credits: number
  runs: number
}

export function sampleUsage(
  fixture: PersonaFixture,
  workspaceId: string
): UsageRecord[] {
  const members =
    fixture.workspaces.find((workspace) => workspace.id === workspaceId)
      ?.tier === 'personal' || !fixture.members.length
      ? [fixture.currentUser]
      : fixture.members
  return fixture.projects
    .filter((project) => project.workspaceId === workspaceId)
    .flatMap((project) => {
      const projectMembers = project.members?.length
        ? members.filter((member) =>
            project.members?.some((entry) => entry.userId === member.id)
          )
        : members
      const actors = [...projectMembers.map((member) => member.id), null]
      const weight = actors.reduce(
        (sum, _, index) => sum + actors.length - index,
        0
      )
      return ['2026-09', '2026-10'].flatMap((month, period) => {
        const total = period
          ? (project.creditsThisMonth ?? 0)
          : (project.monthlyUsage?.at(-2)?.credits ?? 0)
        let remaining = total
        return actors.map((memberId, index) => {
          const credits =
            index === actors.length - 1
              ? remaining
              : Math.floor((total * (actors.length - index)) / weight)
          remaining -= credits
          return {
            month,
            projectId: project.id,
            memberId,
            credits,
            runs: Math.ceil(credits / 110)
          }
        })
      })
    })
}

export function summarizeUsage(
  records: UsageRecord[],
  group: 'members' | 'projects',
  fixture: PersonaFixture,
  workspaceId: string,
  unattributed: string
): UsageRow[] {
  const people =
    fixture.workspaces.find((workspace) => workspace.id === workspaceId)
      ?.tier === 'personal' || !fixture.members.length
      ? [fixture.currentUser]
      : fixture.members
  const rows: UsageRow[] =
    group === 'members'
      ? [
          ...people.map((person) => ({
            id: person.id,
            name: person.name,
            detail: person.email,
            credits: 0,
            runs: 0
          })),
          {
            id: 'unattributed',
            name: unattributed,
            detail: '',
            credits: 0,
            runs: 0
          }
        ]
      : fixture.projects
          .filter((project) => project.workspaceId === workspaceId)
          .map((project) => ({
            id: project.id,
            name: project.name,
            detail: '',
            credits: 0,
            runs: 0
          }))
  for (const record of records) {
    const id =
      group === 'projects'
        ? record.projectId
        : (record.memberId ?? 'unattributed')
    const row = rows.find((item) => item.id === id)
    if (row) {
      row.credits += record.credits
      row.runs += record.runs
    }
  }
  return rows.sort(
    (a, b) => b.credits - a.credits || a.name.localeCompare(b.name)
  )
}

export function usageCsv(headers: string[], rows: UsageRow[], total: number) {
  const cells = [
    headers,
    ...rows.map((row) => [
      row.name,
      row.detail,
      String(row.runs),
      String(row.credits),
      `${total ? ((row.credits / total) * 100).toFixed(1) : 0}%`
    ])
  ]
  return cells
    .map((row) =>
      row
        .map(
          (cell) =>
            `"${(/^[=+@-]/.test(cell) ? `'${cell}` : cell).replaceAll('"', '""')}"`
        )
        .join(',')
    )
    .join('\r\n')
}
