// Implements:
//   persona:  ../IA_Plan/wiki/concepts/personas.md — Tier 1, #3 Workspace Member
//   concept:  ../IA_Plan/wiki/concepts/three-level-permissions.md — workspace level
//   matrix:   ../IA_Plan/wiki/concepts/prototype-test-coverage.md
//             — Alex sees Coca-Cola Ad (Collaborator) but not Client X (hidden)
//
// Alex Carmoid's vantage on the Comfy Org workspace. Workspace-level data
// (members, pending invites, role grants) is shared with the admin fixture
// because it represents shared workspace state; project visibility and
// personal-workspace data diverge.

import { adminFixture } from './admin'
import type { PersonaFixture, Project, Workflow, Workspace } from '../types'

const alexId = 'user-alex'

const alexMember = adminFixture.members.find((m) => m.id === alexId)

const alexUser = alexMember
  ? { id: alexMember.id, name: alexMember.name, email: alexMember.email }
  : adminFixture.currentUser

// Alex's personal workspace (distinct from Willie's). Each fixture defines
// its own — they aren't shared.
const alexPersonal: Workspace = {
  id: 'ws-personal-alex',
  name: 'Personal',
  tier: 'personal',
  ownerUserId: alexId,
  plan: 'free',
  avatarColor: '#10b981',
  memberCount: 1,
  currentUserRole: 'admin'
}

// Comfy Org from Alex's vantage: same workspace id and member data, but
// her workspace role is 'member'.
const comfyOrgForAlex: Workspace = {
  ...(adminFixture.workspaces.find((w) => w.id === 'ws-comfy-org') ??
    adminFixture.workspaces[0]),
  currentUserRole: 'member'
}

// Alex's own Drafts in Comfy Org. Each user has their own My Workflows
// per workspace (per ../IA_Plan/wiki/open-questions.md#my-workflows-scope).
const alexDrafts: Project = {
  id: 'proj-drafts-alex',
  workspaceId: comfyOrgForAlex.id,
  name: 'My Workflows',
  tier: 'private',
  ownerUserId: alexId,
  isDrafts: true,
  currentUserHasAccess: true
}

// Visible-project filter: workspace-wide projects are always visible to
// Members; restricted projects are hidden unless explicitly invited.
// Alex is invited to Coca-Cola Ad (matrix), not to Client X.
const projectsForAlex: Project[] = [
  alexDrafts,
  ...adminFixture.projects
    .filter((p) => !p.isDrafts)
    .map((p) => {
      if (p.id === 'proj-client-x') {
        return { ...p, currentUserHasAccess: false }
      }
      // workspace-wide and Coca-Cola Ad: Alex has access.
      return { ...p, currentUserHasAccess: true }
    })
]

// Alex's accessible workflows. Owner === alex or her id appears in
// access[]. Plus her own drafts entries.
const workflowsForAlex: Workflow[] = [
  {
    id: 'wf-alex-draft-1',
    projectId: alexDrafts.id,
    name: 'Untitled workflow 1',
    ownerUserId: alexId,
    updatedAt: '2026-05-12'
  },
  ...adminFixture.workflows.filter((w) => {
    if (w.projectId === 'proj-drafts') return false
    if (w.projectId === 'proj-client-x') return false
    if (w.ownerUserId === alexId) return true
    return w.access?.some((a) => a.userId === alexId) ?? false
  })
]

export const workspaceMemberFixture: PersonaFixture = {
  ...adminFixture,
  currentUser: alexUser,
  workspaces: [comfyOrgForAlex, alexPersonal],
  currentWorkspaceId: comfyOrgForAlex.id,
  projects: projectsForAlex,
  workflows: workflowsForAlex
}
