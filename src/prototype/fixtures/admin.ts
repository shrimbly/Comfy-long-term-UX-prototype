// Implements:
//   persona:   ../IA_Plan/wiki/concepts/personas-and-flows.md — Tier 1, #2 Workspace Admin
//   concept:   ../IA_Plan/wiki/concepts/three-level-permissions.md
//   decision:  ../IA_Plan/wiki/decisions/drafts-as-default-private-project.md
//   working:   ../IA_Plan/wiki/prototype-log.md — Restricted tier; Library group
//   open-q:    ../IA_Plan/wiki/open-questions.md#delegation-surface-in-ui
//              — Permissions matrix is the proposed first-class surface
//   open-q:    ../IA_Plan/wiki/open-questions.md#publish-direct-link-admin-gate
//              — Member grant for publish-direct-link
//   open-q:    ../IA_Plan/wiki/open-questions.md#single-admin-or-many
//              — proto stance: multiple Admins allowed

import type { PersonaFixture, RoleGrants } from '../types'

const user = {
  id: 'user-admin',
  name: 'Willie',
  email: 'willie@comfy.org'
}

const comfyOrg = {
  id: 'ws-comfy-org',
  name: 'Comfy Org',
  tier: 'team' as const,
  ownerUserId: user.id,
  plan: 'professional' as const,
  avatarColor: '#facc15',
  memberCount: 11,
  currentUserRole: 'admin' as const,
  description: 'Production workflows + shared assets for the Comfy team.',
  dataTrainingOptOut: true
}

const personal = {
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
  workspaceId: comfyOrg.id,
  name: 'My Workflows',
  tier: 'private' as const,
  ownerUserId: user.id,
  isDrafts: true,
  currentUserHasAccess: true
}

export const adminFixture: PersonaFixture = {
  mode: 'cloud',
  currentUser: user,
  workspaces: [comfyOrg, personal],
  currentWorkspaceId: comfyOrg.id,
  projects: [
    myWorkflows,
    {
      id: 'proj-marketing',
      workspaceId: comfyOrg.id,
      name: 'Marketing 2026',
      tier: 'workspace-wide',
      ownerUserId: user.id,
      isDrafts: false,
      currentUserHasAccess: true,
      creditsThisMonth: 1840
    },
    {
      id: 'proj-brand',
      workspaceId: comfyOrg.id,
      name: 'Brand Library',
      tier: 'workspace-wide',
      ownerUserId: user.id,
      isDrafts: false,
      currentUserHasAccess: true,
      creditsThisMonth: 420
    },
    {
      id: 'proj-launch',
      workspaceId: comfyOrg.id,
      name: 'Q3 Launch Site',
      tier: 'workspace-wide',
      // Member-owned + workspace-wide: validates auto-Owner-on-tier rule
      // (Admin auto-owns regardless of who created it).
      ownerUserId: 'user-jane',
      isDrafts: false,
      currentUserHasAccess: true,
      creditsThisMonth: 980
    },
    {
      id: 'proj-client-x',
      workspaceId: comfyOrg.id,
      name: 'Client X',
      tier: 'restricted',
      ownerUserId: user.id,
      isDrafts: false,
      currentUserHasAccess: true,
      members: [
        { userId: user.id, role: 'owner' },
        { userId: 'user-jane', role: 'collaborator' }
      ],
      creditsThisMonth: 2240
    },
    {
      // Restricted by membership. A collaborator (Jane) can open, work on
      // a copy in her My Workflows, and publish it back to the project.
      id: 'proj-indie-short',
      workspaceId: comfyOrg.id,
      name: 'Indie Short Film',
      tier: 'restricted',
      ownerUserId: user.id,
      isDrafts: false,
      currentUserHasAccess: true,
      members: [
        { userId: user.id, role: 'owner' },
        { userId: 'user-jane', role: 'collaborator' }
      ]
    },
    {
      id: 'proj-cocacola',
      workspaceId: comfyOrg.id,
      name: 'Coca-Cola Ad',
      tier: 'restricted',
      ownerUserId: user.id,
      isDrafts: false,
      currentUserHasAccess: true,
      members: [
        { userId: user.id, role: 'owner' },
        { userId: 'user-alex', role: 'collaborator' }
      ],
      creditsThisMonth: 3620
    }
  ],
  workflows: [
    {
      id: 'wf-1',
      projectId: myWorkflows.id,
      name: 'Untitled workflow 1',
      updatedAt: '2026-05-10',
      storage: 'local'
    },
    {
      id: 'wf-2',
      projectId: myWorkflows.id,
      name: 'Untitled workflow 2',
      updatedAt: '2026-05-09',
      storage: 'cloud'
    },
    {
      id: 'wf-3',
      projectId: myWorkflows.id,
      name: 'Untitled workflow 3',
      updatedAt: '2026-05-08',
      storage: 'local'
    },
    // A fuller My Workflows set — exercises the list density, search, the
    // storage filter (cloud/local), and the Copy badge (forkedFrom).
    {
      id: 'wf-mw-portrait-retouch',
      projectId: myWorkflows.id,
      name: 'Portrait retoucher',
      kind: 'app',
      updatedAt: '2026-06-15',
      storage: 'cloud'
    },
    {
      id: 'wf-mw-product-hero',
      projectId: myWorkflows.id,
      name: 'Product hero v3',
      updatedAt: '2026-06-14',
      storage: 'local',
      forkedFrom: { workflowId: 'wf-cocacola-hero' }
    },
    {
      id: 'wf-mw-upscale-4x',
      projectId: myWorkflows.id,
      name: 'Upscale 4x (ESRGAN)',
      updatedAt: '2026-06-13',
      storage: 'cloud'
    },
    {
      id: 'wf-mw-style-ghibli',
      projectId: myWorkflows.id,
      name: 'Style transfer — Ghibli',
      updatedAt: '2026-06-12',
      storage: 'local'
    },
    {
      id: 'wf-mw-bg-remove',
      projectId: myWorkflows.id,
      name: 'Background remover',
      kind: 'app',
      updatedAt: '2026-06-11',
      storage: 'cloud'
    },
    {
      id: 'wf-mw-inpaint',
      projectId: myWorkflows.id,
      name: 'Inpaint cleanup',
      updatedAt: '2026-06-09',
      storage: 'local'
    },
    {
      id: 'wf-mw-sdxl-refiner',
      projectId: myWorkflows.id,
      name: 'SDXL base + refiner',
      updatedAt: '2026-06-07',
      storage: 'cloud'
    },
    {
      id: 'wf-mw-flux-portrait',
      projectId: myWorkflows.id,
      name: 'Flux dev portrait',
      kind: 'app',
      updatedAt: '2026-06-05',
      storage: 'cloud'
    },
    {
      id: 'wf-mw-controlnet-pose',
      projectId: myWorkflows.id,
      name: 'ControlNet pose test',
      updatedAt: '2026-06-03',
      storage: 'local'
    },
    {
      id: 'wf-mw-moodboard-copy',
      projectId: myWorkflows.id,
      name: 'Moodboard explorer — rework',
      updatedAt: '2026-06-01',
      storage: 'cloud',
      forkedFrom: {
        workflowId: 'wf-clientx-moodboard',
        atVersion: '2026-05-11'
      }
    },
    {
      id: 'wf-mw-faceswap-batch',
      projectId: myWorkflows.id,
      name: 'Batch face swap',
      kind: 'app',
      updatedAt: '2026-05-28',
      storage: 'cloud'
    },
    {
      id: 'wf-mw-sketch-render',
      projectId: myWorkflows.id,
      name: 'Sketch → render',
      updatedAt: '2026-05-25',
      storage: 'local'
    },
    {
      id: 'wf-mw-frame-interp',
      projectId: myWorkflows.id,
      name: 'Video frame interpolation',
      updatedAt: '2026-05-22',
      storage: 'cloud'
    },
    {
      id: 'wf-mw-depth-map',
      projectId: myWorkflows.id,
      name: 'Depth map generator',
      updatedAt: '2026-05-19',
      storage: 'local'
    },
    {
      id: 'wf-mw-establishing-copy',
      projectId: myWorkflows.id,
      name: 'Establishing shot — my cut',
      updatedAt: '2026-05-16',
      storage: 'cloud',
      forkedFrom: { workflowId: 'wf-indie-establishing' }
    },
    {
      id: 'wf-mw-outpaint-wide',
      projectId: myWorkflows.id,
      name: 'Outpaint wide',
      updatedAt: '2026-05-13',
      storage: 'local'
    },
    {
      id: 'wf-mw-thumbnail-ab',
      projectId: myWorkflows.id,
      name: 'Thumbnail A/B set',
      updatedAt: '2026-04-30'
    },
    {
      id: 'wf-mw-color-grade',
      projectId: myWorkflows.id,
      name: 'Color grade LUT apply',
      updatedAt: '2026-04-22',
      storage: 'cloud'
    },
    // Project-scoped workflows + apps. Owner roles + per-user access
    // grants drive the asset-role test coverage from
    // ../IA_Plan/wiki/concepts/prototype-test-coverage.md.
    {
      id: 'wf-clientx-moodboard',
      projectId: 'proj-client-x',
      name: 'Moodboard explorer',
      description:
        'Generates style-consistent moodboard tiles from a brand brief, then upscales the picks for client review.',
      kind: 'workflow',
      ownerUserId: user.id,
      updatedAt: '2026-05-11',
      storage: 'cloud',
      // Busy history to exercise the version-history graph.
      publishedVersions: [
        { byUserId: user.id, at: '2026-03-02' },
        { byUserId: 'user-jane', at: '2026-03-18' },
        { byUserId: user.id, at: '2026-04-06' },
        { byUserId: 'user-alex', at: '2026-04-14' },
        { byUserId: 'user-jane', at: '2026-04-28' },
        { byUserId: 'user-alex', at: '2026-05-04' },
        { byUserId: 'user-alex', at: '2026-05-08' },
        { byUserId: user.id, at: '2026-05-11' }
      ]
    },
    {
      // Willie's own branch of the Moodboard canonical — drives the
      // workflow sidebar's "Open branch" state (vs "Create a branch").
      id: 'wf-fork-admin-moodboard',
      projectId: 'proj-drafts',
      name: 'Moodboard explorer — Willie',
      kind: 'workflow',
      ownerUserId: user.id,
      updatedAt: '2026-05-13',
      storage: 'cloud',
      forkedFrom: {
        workflowId: 'wf-clientx-moodboard',
        atVersion: '2026-05-11'
      }
    },
    {
      id: 'app-clientx-colorize',
      projectId: 'proj-client-x',
      name: 'Brand-safe colorize',
      description:
        'Recolors line art to the approved brand palette, with guardrails that reject out-of-gamut results.',
      kind: 'app',
      ownerUserId: user.id,
      access: [{ userId: 'user-jane', role: 'runner' }],
      updatedAt: '2026-05-09'
    },
    {
      // Canonical workflow in the restricted-but-unlocked project. Jane
      // (collaborator) opens → fork-on-open → can submit for publishing
      // but is permission-blocked (not owner/admin); no install gate.
      id: 'wf-indie-establishing',
      projectId: 'proj-indie-short',
      name: 'Establishing shot generator',
      description:
        'Builds wide cinematic establishing shots from a scene prompt and reference lighting.',
      kind: 'workflow',
      ownerUserId: user.id,
      access: [{ userId: 'user-jane', role: 'runner' }],
      updatedAt: '2026-05-11'
    },
    {
      // Jane's working copy of the establishing-shot canonical (carries
      // copy lineage; could be published back over the canonical).
      id: 'wf-fork-jane-establishing',
      projectId: 'proj-indie-short',
      name: 'Establishing shot generator — Jane Park',
      kind: 'workflow',
      ownerUserId: 'user-jane',
      updatedAt: '2026-05-12',
      forkedFrom: { workflowId: 'wf-indie-establishing' }
    },
    {
      id: 'wf-cocacola-hero',
      projectId: 'proj-cocacola',
      name: 'Coke can hero',
      description:
        'Hero product render for the can, with studio reflections and configurable background sweeps.',
      kind: 'workflow',
      ownerUserId: user.id,
      access: [{ userId: 'user-alex', role: 'runner' }],
      updatedAt: '2026-05-10'
    },
    {
      id: 'wf-cocacola-upscale',
      projectId: 'proj-cocacola',
      name: 'Campaign upscale',
      description:
        'Upscales approved campaign frames to print resolution with detail-preserving refinement passes.',
      kind: 'workflow',
      // Member-owned asset visible to Admin — validates ownership and
      // workspace role are independent.
      ownerUserId: 'user-alex',
      access: [{ userId: user.id, role: 'runner' }],
      updatedAt: '2026-05-07'
    },
    {
      id: 'wf-marketing-banner',
      projectId: 'proj-marketing',
      name: 'Banner v3 pipeline',
      description:
        'Produces the full banner ad set across placements and aspect ratios from one source layout.',
      kind: 'workflow',
      ownerUserId: 'user-jane',
      updatedAt: '2026-05-06'
    },
    {
      id: 'wf-brand-logo',
      projectId: 'proj-brand',
      name: 'Logo variation generator',
      description:
        'Explores logo variations across colorways and lockups while keeping the mark on-brand.',
      kind: 'workflow',
      ownerUserId: 'user-pablo',
      updatedAt: '2026-05-04'
    },
    {
      id: 'wf-launch-hero',
      projectId: 'proj-launch',
      name: 'Landing hero render',
      description:
        'Renders the landing-page hero image from the campaign concept, sized for web and retina.',
      kind: 'workflow',
      ownerUserId: 'user-jane',
      updatedAt: '2026-05-03'
    },
    // Extra project canonicals so most projects carry 4+ workflows.
    // proj-launch (3) and proj-indie-short (2) stay under 4 on purpose,
    // to exercise the count-matched thumbnail mosaic on the project cards.
    {
      id: 'wf-marketing-email',
      projectId: 'proj-marketing',
      name: 'Email header generator',
      kind: 'workflow',
      ownerUserId: user.id,
      updatedAt: '2026-06-08',
      storage: 'cloud'
    },
    {
      id: 'wf-marketing-carousel',
      projectId: 'proj-marketing',
      name: 'Social carousel set',
      kind: 'workflow',
      ownerUserId: 'user-jane',
      updatedAt: '2026-05-30',
      storage: 'cloud'
    },
    {
      id: 'wf-marketing-promo',
      projectId: 'proj-marketing',
      name: 'Promo video stills',
      kind: 'workflow',
      ownerUserId: user.id,
      updatedAt: '2026-05-18',
      storage: 'local'
    },
    {
      id: 'wf-brand-icons',
      projectId: 'proj-brand',
      name: 'Icon set rasterizer',
      kind: 'workflow',
      ownerUserId: 'user-pablo',
      updatedAt: '2026-06-02',
      storage: 'cloud'
    },
    {
      id: 'wf-brand-pattern',
      projectId: 'proj-brand',
      name: 'Brand pattern weaver',
      kind: 'workflow',
      ownerUserId: user.id,
      updatedAt: '2026-05-20',
      storage: 'cloud'
    },
    {
      id: 'wf-brand-type',
      projectId: 'proj-brand',
      name: 'Typography poster',
      kind: 'workflow',
      ownerUserId: 'user-jane',
      updatedAt: '2026-05-01',
      storage: 'local'
    },
    {
      id: 'wf-launch-tiles',
      projectId: 'proj-launch',
      name: 'Feature tile set',
      kind: 'workflow',
      ownerUserId: user.id,
      updatedAt: '2026-06-04',
      storage: 'cloud'
    },
    {
      id: 'wf-launch-og',
      projectId: 'proj-launch',
      name: 'OG image generator',
      kind: 'workflow',
      ownerUserId: 'user-jane',
      updatedAt: '2026-05-21',
      storage: 'cloud'
    },
    {
      id: 'wf-clientx-lookbook',
      projectId: 'proj-client-x',
      name: 'Lookbook layouts',
      kind: 'workflow',
      ownerUserId: user.id,
      updatedAt: '2026-05-29',
      storage: 'cloud'
    },
    {
      id: 'wf-clientx-packaging',
      projectId: 'proj-client-x',
      name: 'Packaging mockups',
      kind: 'workflow',
      ownerUserId: user.id,
      updatedAt: '2026-05-15',
      storage: 'cloud'
    },
    {
      id: 'wf-cocacola-splash',
      projectId: 'proj-cocacola',
      name: 'Bottle splash render',
      kind: 'workflow',
      ownerUserId: user.id,
      updatedAt: '2026-06-06',
      storage: 'cloud'
    },
    {
      id: 'wf-cocacola-billboard',
      projectId: 'proj-cocacola',
      name: 'Billboard composite',
      kind: 'workflow',
      ownerUserId: 'user-alex',
      updatedAt: '2026-05-12',
      storage: 'local'
    }
  ],
  libraryAssets: [
    {
      id: 'media-1',
      name: 'Brand hero render',
      section: 'media',
      projectId: 'proj-brand',
      updatedAt: '2026-05-10',
      tags: ['hero', 'brand'],
      folder: 'finals',
      storage: 'cloud'
    },
    {
      id: 'media-2',
      name: 'Marketing banner v3',
      section: 'media',
      projectId: 'proj-marketing',
      updatedAt: '2026-05-09',
      tags: ['banner', 'campaign'],
      folder: 'finals',
      storage: 'cloud'
    },
    {
      id: 'media-3',
      name: 'Coke can hero',
      section: 'media',
      projectId: 'proj-cocacola',
      updatedAt: '2026-05-08',
      tags: ['hero', 'product'],
      folder: 'finals',
      storage: 'local'
    },
    {
      id: 'media-4',
      name: 'Launch site screenshot',
      section: 'media',
      projectId: 'proj-launch',
      updatedAt: '2026-05-07',
      tags: ['screenshot'],
      folder: 'my-workflows',
      storage: 'local'
    },
    {
      id: 'media-5',
      name: 'Client X moodboard',
      section: 'media',
      projectId: 'proj-client-x',
      updatedAt: '2026-05-06',
      tags: ['moodboard'],
      folder: 'my-workflows',
      storage: 'cloud'
    },
    {
      id: 'media-6',
      name: 'Brand poster v2',
      section: 'media',
      projectId: 'proj-brand',
      updatedAt: '2026-05-04',
      tags: ['poster', 'brand'],
      folder: 'finals'
    },
    {
      id: 'media-7',
      name: 'Banner exploration',
      section: 'media',
      projectId: 'proj-marketing',
      updatedAt: '2026-05-03',
      tags: ['banner', 'exploration'],
      folder: 'my-workflows'
    },
    {
      id: 'media-8',
      name: 'Coca campaign frame',
      section: 'media',
      projectId: 'proj-cocacola',
      updatedAt: '2026-05-02',
      tags: ['campaign', 'frame'],
      folder: 'finals'
    },
    {
      id: 'model-1',
      name: 'SDXL base',
      section: 'models',
      projectId: 'proj-marketing',
      updatedAt: '2026-04-01',
      tags: ['base', 'sdxl'],
      folder: 'base'
    },
    {
      id: 'model-2',
      name: 'Brand LoRA v3',
      section: 'models',
      projectId: 'proj-brand',
      updatedAt: '2026-05-01',
      tags: ['lora', 'brand'],
      folder: 'loras'
    },
    {
      id: 'model-3',
      name: 'Coca palette LoRA',
      section: 'models',
      projectId: 'proj-cocacola',
      updatedAt: '2026-05-05',
      tags: ['lora', 'palette'],
      folder: 'loras'
    },
    {
      id: 'node-1',
      name: 'BrandColorCorrect',
      section: 'nodes',
      projectId: 'proj-brand',
      updatedAt: '2026-04-15',
      tags: ['color'],
      folder: 'utility'
    },
    {
      id: 'node-2',
      name: 'CocaCanRotate',
      section: 'nodes',
      projectId: 'proj-cocacola',
      updatedAt: '2026-05-02',
      tags: ['geometry'],
      folder: 'utility'
    },
    {
      id: 'node-3',
      name: 'UpscaleHandoff',
      section: 'nodes',
      projectId: 'proj-marketing',
      updatedAt: '2026-04-22',
      tags: ['upscale'],
      folder: 'core'
    },
    {
      id: 'prompt-1',
      name: 'Brand voice prompt',
      section: 'prompts',
      projectId: 'proj-brand',
      updatedAt: '2026-04-20',
      tags: ['brand', 'voice'],
      folder: 'campaigns'
    },
    {
      id: 'prompt-2',
      name: 'Coca campaign prompt',
      section: 'prompts',
      projectId: 'proj-cocacola',
      updatedAt: '2026-05-03',
      tags: ['campaign'],
      folder: 'campaigns'
    }
  ],
  usage: {
    creditsRemainingPct: 77,
    showUpgrade: true
  },
  members: [
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'admin',
      avatarColor: '#facc15',
      joinedAt: '2025-09-01'
    },
    {
      id: 'user-pablo',
      name: 'Pablo Schaffner',
      email: 'pablo@comfy.org',
      role: 'admin',
      avatarColor: '#f97316',
      joinedAt: '2025-09-01'
    },
    {
      id: 'user-alex',
      name: 'Alex Carmoid',
      email: 'alex@comfy.org',
      role: 'member',
      avatarColor: '#10b981',
      joinedAt: '2025-10-12'
    },
    {
      id: 'user-jane',
      name: 'Jane Park',
      email: 'jane@comfy.org',
      role: 'member',
      avatarColor: '#06b6d4',
      joinedAt: '2025-11-03'
    },
    {
      id: 'user-marcus',
      name: 'Marcus Lin',
      email: 'marcus@comfy.org',
      role: 'member',
      avatarColor: '#a855f7',
      joinedAt: '2025-11-20'
    },
    {
      id: 'user-rina',
      name: 'Rina Okafor',
      email: 'rina@comfy.org',
      role: 'member',
      avatarColor: '#ef4444',
      joinedAt: '2026-01-15'
    },
    {
      id: 'user-sam',
      name: 'Sam Toledo',
      email: 'sam@comfy.org',
      role: 'member',
      avatarColor: '#0ea5e9',
      joinedAt: '2026-02-04'
    },
    {
      id: 'user-noor',
      name: 'Noor Hassan',
      email: 'noor@comfy.org',
      role: 'member',
      avatarColor: '#eab308',
      joinedAt: '2026-02-22'
    },
    {
      id: 'user-yuki',
      name: 'Yuki Tanaka',
      email: 'yuki@comfy.org',
      role: 'member',
      avatarColor: '#8b5cf6',
      joinedAt: '2026-03-10'
    },
    {
      id: 'user-ben',
      name: 'Ben Castro',
      email: 'ben@comfy.org',
      role: 'member',
      avatarColor: '#14b8a6',
      joinedAt: '2026-03-28'
    }
  ],
  pendingInvites: [
    {
      id: 'invite-1',
      email: 'priya@comfy.org',
      role: 'member',
      invitedByUserId: user.id,
      invitedAt: '2026-05-10'
    }
  ],
  roleGrants: {
    'publish-direct-link': true,
    'configure-workspace': false
  } satisfies RoleGrants,
  billing: {
    subscription: {
      plan: 'professional',
      status: 'active',
      renewsAt: '2026-06-15',
      seatsIncluded: 20
    },
    paymentMethod: {
      kind: 'card',
      brand: 'Visa',
      last4: '4242',
      expiresMonth: 12,
      expiresYear: 2027,
      billingEmail: 'billing@comfy.org'
    },
    creditBalance: {
      remaining: 5840,
      monthlyAllowance: 10000,
      resetsAt: '2026-06-01'
    },
    invoices: [
      {
        id: 'inv-2026-05',
        issuedAt: '2026-05-01',
        amountUsd: 240,
        status: 'paid'
      },
      {
        id: 'inv-2026-04',
        issuedAt: '2026-04-01',
        amountUsd: 240,
        status: 'paid'
      },
      {
        id: 'inv-2026-03',
        issuedAt: '2026-03-01',
        amountUsd: 240,
        status: 'paid'
      }
    ]
  },
  memberCreditLimits: [
    {
      memberId: 'user-alex',
      limit: 500,
      period: 'monthly',
      used: 124,
      resetsAt: '2026-06-01'
    },
    {
      memberId: 'user-rina',
      limit: 2000,
      period: 'monthly',
      used: 1640,
      resetsAt: '2026-06-01'
    }
  ]
}
