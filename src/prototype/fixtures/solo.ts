// Implements:
//   persona: ../IA_Plan/wiki/concepts/personas-and-flows.md — Tier 1, #1 Solo Creator
//   decision: ../IA_Plan/wiki/decisions/drafts-as-default-private-project.md

import type { PersonaFixture } from '../types'

const user = {
  id: 'user-solo',
  name: 'Willie',
  email: 'willie@example.com'
}

const personalWorkspace = {
  id: 'ws-personal',
  name: 'Personal',
  tier: 'personal' as const,
  ownerUserId: user.id,
  plan: 'free' as const,
  avatarColor: '#7c7c7c',
  memberCount: 1,
  currentUserRole: 'admin' as const
}

const myWorkflows = {
  id: 'proj-drafts',
  workspaceId: personalWorkspace.id,
  name: 'My Workflows',
  tier: 'private' as const,
  ownerUserId: user.id,
  isDrafts: true,
  currentUserHasAccess: true
}

export const soloFixture: PersonaFixture = {
  mode: 'cloud',
  currentUser: user,
  workspaces: [personalWorkspace],
  currentWorkspaceId: personalWorkspace.id,
  projects: [myWorkflows],
  workflows: [],
  libraryAssets: [],
  usage: {
    creditsRemainingPct: 0,
    showUpgrade: true
  },
  members: [
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'admin',
      avatarColor: personalWorkspace.avatarColor,
      joinedAt: '2026-05-01'
    }
  ],
  pendingInvites: [],
  roleGrants: {
    'publish-direct-link': false,
    'submit-to-hub': false,
    'approve-hub-submissions': false,
    'edit-allowlists': false,
    'configure-workspace': false
  },
  billing: {
    subscription: {
      plan: 'free',
      status: 'active',
      renewsAt: '2026-06-01',
      seatsIncluded: 1
    },
    paymentMethod: {
      kind: 'card'
    },
    creditBalance: {
      remaining: 0,
      monthlyAllowance: 100,
      resetsAt: '2026-06-01'
    },
    invoices: []
  },
  memberCreditLimits: [],
  notifications: []
}
