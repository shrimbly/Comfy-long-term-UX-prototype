// Implements:
//   persona: ../IA_Plan/wiki/concepts/personas.md — Tier 1, #4 Project Collaborator
//   concept: ../IA_Plan/wiki/concepts/three-level-permissions.md — dual scope
//   matrix:  ../IA_Plan/wiki/concepts/prototype-test-coverage.md
//            — Mira sees only Client X; all workspace-wide projects hidden;
//              Coca-Cola hidden; Workspace Library inaccessible.
//   open-q:  ../IA_Plan/wiki/open-questions.md#fork-destination-in-host-workspace
//            — Mira has an auto-created My Workflows in Comfy Org (host)

import { adminFixture } from './admin'
import type { PersonaFixture, Project, Workflow, Workspace } from '../types'

const miraId = 'user-mira'

const miraMember = adminFixture.members.find((m) => m.id === miraId)

const miraUser = miraMember
  ? { id: miraMember.id, name: miraMember.name, email: miraMember.email }
  : { id: miraId, name: 'Mira Voss', email: 'mira@client-x.com' }

// Project Collaborator's workspace presence is narrow — only the host
// workspace where she's a Guest. No personal-workspace surface.
const comfyOrgForMira: Workspace = {
  ...(adminFixture.workspaces.find((w) => w.id === 'ws-comfy-org') ??
    adminFixture.workspaces[0]),
  currentUserRole: 'guest'
}

// Per fork-destination-in-host-workspace: forks land in the actor's My
// Workflows in the host workspace. Mira has an auto-created Drafts here.
const miraDrafts: Project = {
  id: 'proj-drafts-mira',
  workspaceId: comfyOrgForMira.id,
  name: 'My Workflows',
  tier: 'private',
  ownerUserId: miraId,
  isDrafts: true,
  currentUserHasAccess: true
}

// Only Client X is visible. Workspace-wide projects are hidden (Mira is a
// workspace-level Guest, not a Member — auto-Owner rule does not apply,
// and workspace-wide visibility requires Member+).
const projectsForMira: Project[] = [
  miraDrafts,
  {
    ...(adminFixture.projects.find((p) => p.id === 'proj-client-x') ??
      adminFixture.projects[0]),
    currentUserHasAccess: true
  }
]

const workflowsForMira: Workflow[] = adminFixture.workflows.filter((w) => {
  if (w.projectId === 'proj-client-x') return true
  return false
})

export const projectCollaboratorFixture: PersonaFixture = {
  ...adminFixture,
  currentUser: miraUser,
  workspaces: [comfyOrgForMira],
  currentWorkspaceId: comfyOrgForMira.id,
  projects: projectsForMira,
  workflows: workflowsForMira,
  // No personal billing / usage surfacing for a workspace Guest.
  usage: null,
  // Cross-workspace alerts. Mira's host workspace surfaces in-place via
  // the project list; the notifications popover is where she finds out
  // about activity she isn't currently looking at — including invites
  // into workspaces she hasn't been added to yet.
  notifications: [
    {
      id: 'note-mira-1',
      kind: 'workspace-invite',
      actorUserId: 'user-jane',
      target: { workspaceId: 'ws-acme-co' },
      createdAt: '2026-05-13'
    },
    {
      id: 'note-mira-2',
      kind: 'asset-update',
      actorUserId: 'user-pablo',
      target: {
        workspaceId: 'ws-comfy-org',
        projectId: 'proj-client-x',
        assetId: 'wf-clientx-moodboard'
      },
      createdAt: '2026-05-13'
    },
    {
      id: 'note-mira-3',
      kind: 'project-grant',
      actorUserId: 'user-jane',
      target: { workspaceId: 'ws-comfy-org', projectId: 'proj-client-x' },
      createdAt: '2026-05-09',
      readAt: '2026-05-10'
    }
  ]
}
