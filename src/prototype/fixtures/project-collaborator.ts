// Implements:
//   persona: ../IA_Plan/wiki/concepts/personas.md — Tier 1, #4 Project Collaborator
//   concept: ../IA_Plan/wiki/concepts/three-level-permissions.md — dual scope
//   matrix:  ../IA_Plan/wiki/concepts/prototype-test-coverage.md
//            — Mira sees only Client X; all workspace-wide projects hidden;
//              Coca-Cola hidden; Workspace Library inaccessible.
//   open-q:  ../IA_Plan/wiki/open-questions.md#fork-destination-in-host-workspace
//            — Mira has an auto-created My Workflows in Comfy Org (host)

import { adminFixture } from './admin'
import type {
  PersonaFixture,
  Project,
  Workflow,
  WorkflowSubmission,
  Workspace
} from '../types'

// Reviewer feedback on Mira's declined submission — shown both in her
// notification popover and the workflow sidebar's "Changes requested"
// callout, so the two surfaces tell the same story.
const declineFeedback =
  'Love the depth pass — but the sky gradient is blowing out the highlights. Pull it back ~20% and resubmit.'

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

// Two restricted projects Mira collaborates on, chosen to isolate the
// two gate dimensions:
//   - Client X        — restricted AND install-locked (permission + install)
//   - Indie Short Film — restricted, NOT install-gated (permission only)
// Workspace-wide projects stay hidden (Mira is a workspace Guest, not a
// Member — auto-Owner / workspace-wide visibility require Member+).
const projectsForMira: Project[] = [
  miraDrafts,
  {
    ...(adminFixture.projects.find((p) => p.id === 'proj-client-x') ??
      adminFixture.projects[0]),
    currentUserHasAccess: true
  },
  {
    ...(adminFixture.projects.find((p) => p.id === 'proj-indie-short') ??
      adminFixture.projects[0]),
    currentUserHasAccess: true
  }
]

const workflowsForMira: Workflow[] = adminFixture.workflows.filter(
  (w) => w.projectId === 'proj-client-x' || w.projectId === 'proj-indie-short'
)

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
    },
    {
      // Submitter side, declined: Mira's latest submission of the
      // establishing-shot branch was declined with feedback. Clicking it
      // opens the canonical's sidebar where she can Revise & resubmit.
      id: 'note-mira-sub-rejected',
      kind: 'submission-rejected',
      actorUserId: 'user-admin',
      target: {
        workspaceId: 'ws-comfy-org',
        projectId: 'proj-indie-short',
        assetId: 'wf-indie-establishing'
      },
      createdAt: '2026-05-13',
      message: declineFeedback
    },
    {
      // Submitter side, approved: an earlier submission of Mira's was
      // published by an owner. Shows the other outcome the submitter sees
      // (the reviewer side is seeded in admin.ts).
      id: 'note-mira-sub-approved',
      kind: 'submission-approved',
      actorUserId: 'user-admin',
      target: {
        workspaceId: 'ws-comfy-org',
        projectId: 'proj-indie-short',
        assetId: 'wf-indie-establishing'
      },
      createdAt: '2026-05-11',
      readAt: '2026-05-11'
    }
  ],
  // Mira collaborates on Indie Short Film (restricted, not install-gated)
  // in addition to Client X — surfaced via projectsForMira/workflowsForMira.
  // Submitter side: her establishing-shot submission was declined with
  // feedback, so her workflow sidebar shows "Changes requested" + Revise &
  // resubmit. (The reviewer side is seeded pending in admin.ts so the
  // owner can decline it live too.)
  workflowSubmissions: adminFixture.workflowSubmissions.map(
    (s): WorkflowSubmission =>
      s.id === 'wfsub-indie-establishing'
        ? { ...s, status: 'rejected', reviewComment: declineFeedback }
        : s
  ),
  // Cloud-runtime collaborator — install-agnostic. The canonical §4
  // Project Collaborator in the wiki is defined purely by permission
  // position; the install dimension belongs to §4a Freelancer, which
  // owns the BYO-install + compat-gate story. The install chip stays
  // hidden for Mira so the persona switcher visibly differentiates
  // her from Reza.
  installs: [],
  activeInstallId: undefined
}
