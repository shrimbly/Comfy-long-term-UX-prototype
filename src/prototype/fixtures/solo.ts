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
  templates: [
    {
      id: 'tpl-txt2img',
      name: 'Text to image',
      description: 'A starter image-generation graph.'
    },
    {
      id: 'tpl-img2img',
      name: 'Image to image',
      description: 'Transform an input image with a prompt.'
    },
    {
      id: 'tpl-inpaint',
      name: 'Inpainting',
      description: 'Mask + regenerate a region.'
    },
    {
      id: 'tpl-upscale',
      name: 'Upscale',
      description: 'Increase resolution with a model pass.'
    },
    {
      id: 'tpl-controlnet',
      name: 'Pose to image',
      description: 'ControlNet-style pose conditioning.'
    },
    {
      id: 'tpl-vid',
      name: 'Image to video',
      description: 'Animate a still image.'
    }
  ],
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
  allowlists: {
    models: { enabled: false, entries: [] },
    customNodes: { enabled: false, entries: [] },
    partnerNodes: { enabled: false, entries: [] }
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
  hubSubmissions: [],
  notifications: []
}
