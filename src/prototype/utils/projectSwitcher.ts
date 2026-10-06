// Implements:
//   decision: ../IA_Plan/wiki/decisions/project-switcher-in-tab-bar.md
//   decision: prototype/design-decisions.md — 2026-10-07 "Project switcher
//             menu: search, recent first"
//
// Pure helpers for the project switcher menu: which projects count as
// recent, and how a search narrows the list.

import { uniq } from 'es-toolkit'

const RECENT_PROJECT_LIMIT = 3

interface SwitcherProject {
  id: string
  name: string
}

export interface SwitcherSection<T extends SwitcherProject> {
  // No label while searching: the matches are one flat list.
  label?: 'recent' | 'others'
  projects: T[]
}

// Keeps the first sighting of each switchable project, up to the limit.
// Callers pass ids most relevant first.
export function rankRecentProjectIds(
  candidateIds: string[],
  switchableIds: string[]
): string[] {
  const switchable = new Set(switchableIds)
  return uniq(candidateIds)
    .filter((id) => switchable.has(id))
    .slice(0, RECENT_PROJECT_LIMIT)
}

// Recent projects in recency order, then the rest A–Z. A search keeps that
// order, drops the labels and matches names case-insensitively.
export function switcherSections<T extends SwitcherProject>(
  projects: T[],
  recentIds: string[],
  query: string
): SwitcherSection<T>[] {
  const recent = recentIds.flatMap((id) => projects.filter((p) => p.id === id))
  const others = projects
    .filter((p) => !recentIds.includes(p.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  const needle = query.trim().toLowerCase()
  if (needle) {
    const matches = [...recent, ...others].filter((p) =>
      p.name.toLowerCase().includes(needle)
    )
    return matches.length ? [{ projects: matches }] : []
  }

  const sections: SwitcherSection<T>[] = [
    { label: 'recent', projects: recent },
    { label: 'others', projects: others }
  ]
  return sections.filter((s) => s.projects.length > 0)
}
