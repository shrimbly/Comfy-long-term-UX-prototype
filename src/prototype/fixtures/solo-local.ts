// Implements:
//   persona:  ../IA_Plan/wiki/concepts/personas-and-flows.md
//             — Tier 1, #1b Solo Creator — local-only
//   decision: ../IA_Plan/wiki/decisions/projects-are-cloud-only.md
//             — local user has no projects
//   concept:  ../IA_Plan/wiki/concepts/local-dashboard-views.md
//             — filesystem-driven library (Media / Models / Custom Nodes / Outputs)

import { buildLocalMediaReferences } from './localMedia'
import type { PersonaFixture } from '../types'

const user = {
  id: 'user-solo-local',
  name: 'Local user',
  email: ''
}

// Implicit personal-workspace-equivalent. Local-only UI replaces the
// workspace switcher with a Create-a-workspace CTA in the same slot
// (see prototype/design-decisions.md 2026-05-14); this entry exists
// only so shared types stay populated (the IA wiki's "implicit
// workspace" framing).
const implicitWorkspace = {
  id: 'ws-local',
  name: 'Local',
  tier: 'personal' as const,
  ownerUserId: user.id,
  plan: 'free' as const,
  avatarColor: '#7c7c7c',
  memberCount: 1,
  currentUserRole: 'admin' as const
}

export const soloLocalFixture: PersonaFixture = {
  mode: 'local',
  currentUser: user,
  workspaces: [implicitWorkspace],
  currentWorkspaceId: implicitWorkspace.id,
  // No projects — Projects are cloud-only.
  projects: [],
  workflows: [],
  // Referenced local media (non-final linked-media exploration, Flow 03).
  // Comfy points at these files in place; it never copies the bytes.
  libraryAssets: buildLocalMediaReferences(),
  // No credits — local runs on local hardware.
  usage: null,
  members: [],
  pendingInvites: [],
  roleGrants: {
    'publish-direct-link': false,
    'configure-workspace': false
  },
  billing: null,
  memberCreditLimits: [],
  notifications: []
}
