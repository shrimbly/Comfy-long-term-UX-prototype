// Implements:
//   concept: ../IA_Plan/wiki/concepts/three-level-permissions.md — project level
//
// Derives a project's access class for display/filtering:
//   everyone — workspace-wide (the whole workspace can access)
//   limited  — restricted to specific invited people
//   private  — restricted to just the owner (nobody else shared)
// Private is the natural endpoint of Limited with no one else added, mirroring
// how Drive treats a Restricted file shared with only you.

import type { Project } from '../types'

export type ProjectAccessLevel = 'everyone' | 'limited' | 'private'

export function projectAccessLevel(project: Project): ProjectAccessLevel {
  if (project.tier === 'workspace-wide') return 'everyone'
  if (project.tier === 'private') return 'private'
  const others = (project.members ?? []).filter(
    (m) => m.userId !== project.ownerUserId
  )
  return others.length > 0 ? 'limited' : 'private'
}
