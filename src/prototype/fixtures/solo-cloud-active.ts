// Implements:
//   persona:  ../IA_Plan/wiki/concepts/personas-and-flows.md — Tier 1, #1 Solo Creator
//   decision: ../IA_Plan/wiki/decisions/drafts-as-default-private-project.md
//
// Established cloud solo creator: one personal workspace, a full My Workflows
// of cloud-stored workflows. The non-empty counterpart to solo.ts (the
// first-run empty state). Every workflow is storage: 'cloud' — a solo creator
// working entirely in the cloud (mirror of solo-local-active, which is all
// local).

import type { PersonaFixture, Workflow } from '../types'

const user = {
  id: 'user-solo-cloud',
  name: 'Willie',
  email: 'willie@example.com'
}

const personalWorkspace = {
  id: 'ws-personal',
  name: 'Personal',
  tier: 'personal' as const,
  ownerUserId: user.id,
  plan: 'professional' as const,
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

// All cloud-stored — the defining trait of this persona. A few app-kind
// entries carry real thumbnails to exercise card density + the kind icon.
const workflows: Workflow[] = [
  {
    id: 'wf-sc-portrait-retouch',
    projectId: myWorkflows.id,
    name: 'Portrait retoucher',
    kind: 'app',
    thumbnailUrl: '/wf-thumbs/app.png',
    updatedAt: '2026-06-18',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-product-hero',
    projectId: myWorkflows.id,
    name: 'Product hero shots',
    updatedAt: '2026-06-17',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-upscale-4x',
    projectId: myWorkflows.id,
    name: 'Upscale 4x (ESRGAN)',
    updatedAt: '2026-06-16',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-style-ghibli',
    projectId: myWorkflows.id,
    name: 'Style transfer — Ghibli',
    updatedAt: '2026-06-15',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-bg-remove',
    projectId: myWorkflows.id,
    name: 'Background remover',
    kind: 'app',
    thumbnailUrl: '/wf-thumbs/app2.png',
    updatedAt: '2026-06-14',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-inpaint',
    projectId: myWorkflows.id,
    name: 'Inpaint cleanup',
    updatedAt: '2026-06-13',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-sdxl-refiner',
    projectId: myWorkflows.id,
    name: 'SDXL base + refiner',
    updatedAt: '2026-06-12',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-flux-portrait',
    projectId: myWorkflows.id,
    name: 'Flux dev portrait',
    kind: 'app',
    thumbnailUrl: '/wf-thumbs/app3.png',
    updatedAt: '2026-06-11',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-controlnet-pose',
    projectId: myWorkflows.id,
    name: 'ControlNet pose test',
    updatedAt: '2026-06-10',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-logo-explorer',
    projectId: myWorkflows.id,
    name: 'Logo explorer',
    updatedAt: '2026-06-08',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-faceswap-batch',
    projectId: myWorkflows.id,
    name: 'Batch face swap',
    kind: 'app',
    thumbnailUrl: '/wf-thumbs/app4.png',
    updatedAt: '2026-06-06',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-sketch-render',
    projectId: myWorkflows.id,
    name: 'Sketch → render',
    updatedAt: '2026-06-04',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-frame-interp',
    projectId: myWorkflows.id,
    name: 'Video frame interpolation',
    updatedAt: '2026-06-02',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-depth-map',
    projectId: myWorkflows.id,
    name: 'Depth map generator',
    updatedAt: '2026-05-30',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-outpaint-wide',
    projectId: myWorkflows.id,
    name: 'Outpaint wide',
    updatedAt: '2026-05-27',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-thumbnail-ab',
    projectId: myWorkflows.id,
    name: 'Thumbnail A/B set',
    updatedAt: '2026-05-24',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-color-grade',
    projectId: myWorkflows.id,
    name: 'Color grade LUT apply',
    updatedAt: '2026-05-20',
    storage: 'cloud'
  },
  {
    id: 'wf-sc-anime-colorize',
    projectId: myWorkflows.id,
    name: 'Anime line-art colorizer',
    updatedAt: '2026-05-16',
    storage: 'cloud'
  }
]

export const soloCloudActiveFixture: PersonaFixture = {
  mode: 'cloud',
  currentUser: user,
  workspaces: [personalWorkspace],
  currentWorkspaceId: personalWorkspace.id,
  projects: [myWorkflows],
  workflows,
  libraryAssets: [],
  usage: {
    creditsRemainingPct: 74,
    showUpgrade: true
  },
  members: [
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'admin',
      avatarColor: personalWorkspace.avatarColor,
      joinedAt: '2025-11-01'
    }
  ],
  pendingInvites: [],
  roleGrants: {
    'publish-direct-link': false,
    'configure-workspace': false
  },
  billing: {
    subscription: {
      plan: 'professional',
      status: 'active',
      renewsAt: '2026-07-01',
      seatsIncluded: 1
    },
    paymentMethod: {
      kind: 'card',
      brand: 'Visa',
      last4: '4242',
      expiresMonth: 8,
      expiresYear: 2028,
      billingEmail: user.email
    },
    creditBalance: {
      remaining: 740,
      monthlyAllowance: 1000,
      resetsAt: '2026-07-01'
    },
    invoices: [
      {
        id: 'inv-sc-2026-06',
        issuedAt: '2026-06-01',
        amountUsd: 20,
        status: 'paid'
      }
    ]
  },
  memberCreditLimits: []
}
