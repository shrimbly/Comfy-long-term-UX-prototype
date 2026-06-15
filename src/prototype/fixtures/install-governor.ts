// Implements:
//   persona:  ../IA_Plan/wiki/concepts/personas.md — Tier 1, #2a Install Governor
//   concept:  ../IA_Plan/wiki/concepts/install-journeys.md
//             — Journey 1 (provisioning), Journey 5 (version upgrade)
//   decision: ../IA_Plan/wiki/decisions/team-locked-install.md
//             — allowed-install set as a hard lock
//
// VFX team lead. Same permission position as Workspace Admin — they
// live in admin surfaces. The only A1-relevant difference vs the
// canonical Admin persona is the install set + active install: they
// operate on the team-blessed VFX build by default. Allowed-install set
// authoring + version-bump UX lands in A3.

import { adminFixture } from './admin'
import type { PersonaFixture, Workspace } from '../types'

const sashaId = 'user-sasha'

// Lift Comfy Org to a workspace owned by Sasha for this persona's
// vantage. The other workspaces (Personal, Acme) stay as Willie's so the
// switcher still shows multi-workspace state.
const comfyOrgForSasha: Workspace = {
  ...(adminFixture.workspaces.find((w) => w.id === 'ws-comfy-org') ??
    adminFixture.workspaces[0]),
  currentUserRole: 'admin'
}

export const installGovernorFixture: PersonaFixture = {
  ...adminFixture,
  currentUser: {
    id: sashaId,
    name: 'Sasha Lin',
    email: 'sasha@comfy.org'
  },
  workspaces: [
    comfyOrgForSasha,
    ...adminFixture.workspaces.filter((w) => w.id !== 'ws-comfy-org')
  ],
  currentWorkspaceId: comfyOrgForSasha.id
}
