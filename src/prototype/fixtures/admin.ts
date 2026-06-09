// Implements:
//   persona:   ../IA_Plan/wiki/concepts/personas-and-flows.md — Tier 1, #2 Workspace Admin
//   concept:   ../IA_Plan/wiki/concepts/three-level-permissions.md
//   decision:  ../IA_Plan/wiki/decisions/drafts-as-default-private-project.md
//   working:   ../IA_Plan/wiki/prototype-log.md — Restricted tier; Library group
//   open-q:    ../IA_Plan/wiki/open-questions.md#delegation-surface-in-ui
//              — Permissions matrix is the proposed first-class surface
//   open-q:    ../IA_Plan/wiki/open-questions.md#publish-direct-link-admin-gate
//              — Member grants for publish-direct-link / submit-to-hub
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
  memberCount: 12,
  currentUserRole: 'admin' as const,
  description: 'Production workflows + shared assets for the Comfy team.',
  dataTrainingOptOut: true,
  // Workspace install registry per
  // ../IA_Plan/wiki/concepts/workspace-install-registry.md — the
  // Install Governor (Sasha) has blessed the team's VFX build. Locked
  // for the Q2 production crunch so artists can't mutate node
  // versions out from under in-flight shots.
  blessedInstalls: [
    // Current production build — pinned by Client X and other team
    // projects. Locked during the Q2 crunch so nodes / Comfy versions
    // don't shift under in-flight shots.
    {
      installId: 'install-vfx-team-q2-2026',
      canonicalDisplayName: 'VFX team Q2 2026',
      comfyUIVersion: '0.3.5',
      publishedByUserId: 'user-sasha',
      publishedAt: '2026-04-22',
      isLocked: true
    },
    // Candidate for the next bump (Journey 5). Sasha is validating it
    // and intentionally hasn't locked yet — locking happens after
    // canonical workflows have been re-run end-to-end.
    {
      installId: 'install-vfx-team-q3-2026-rc',
      canonicalDisplayName: 'VFX team Q3 2026 (RC)',
      comfyUIVersion: '0.3.6',
      publishedByUserId: 'user-sasha',
      publishedAt: '2026-05-12',
      isLocked: false
    },
    // Retired prior build — kept blessed so historical outputs'
    // attribution still resolves to a canonical name. No project
    // currently pins to it. Demonstrates the "blessed but not in any
    // active allowed-install set" state.
    {
      installId: 'install-vfx-team-q1-2026',
      canonicalDisplayName: 'VFX team Q1 2026',
      comfyUIVersion: '0.3.0',
      publishedByUserId: 'user-sasha',
      publishedAt: '2026-02-04',
      isLocked: false
    }
  ]
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

const acme = {
  id: 'ws-acme',
  name: 'Acme Studio',
  tier: 'team' as const,
  ownerUserId: 'user-someone-else',
  plan: 'professional' as const,
  avatarColor: '#3b82f6',
  memberCount: 4,
  currentUserRole: 'guest' as const
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
  workspaces: [comfyOrg, personal, acme],
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
      allowlists: {
        models: { override: false, entries: [] },
        customNodes: { override: false, entries: [] }
      },
      defaults: { filenamePrefix: 'marketing/{date}/' },
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
      allowlists: {
        models: { override: false, entries: [] },
        customNodes: { override: false, entries: [] }
      },
      defaults: { filenamePrefix: 'brand/' },
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
      allowlists: {
        models: { override: false, entries: [] },
        customNodes: { override: false, entries: [] }
      },
      defaults: {},
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
        { userId: 'user-mira', role: 'collaborator' }
      ],
      allowlists: {
        models: {
          override: true,
          entries: [
            {
              id: 'pmdl-clientx-sdxl',
              name: 'sd_xl_base_1.0.safetensors',
              addedAt: '2026-04-22',
              addedByUserId: user.id,
              note: 'Approved for Client X likeness work.'
            }
          ]
        },
        customNodes: { override: false, entries: [] }
      },
      defaults: { filenamePrefix: 'clients/client-x/{workflow}/' },
      creditsThisMonth: 2240,
      // Team-locked install per
      // ../IA_Plan/wiki/decisions/team-locked-install.md — hard lock by
      // install identity. The Install Governor named the lock at config
      // time; that workspace-canonical name is what the gate dialog
      // renders, regardless of what each user has named the same bundle
      // locally.
      allowedInstallIds: ['install-vfx-team-q2-2026'],
      installLockDisplayName: 'VFX team Q2 2026'
    },
    {
      // Restricted by membership, but NOT install-gated — no
      // allowedInstallIds. A collaborator (Mira) can open, work on a
      // copy, and submit it for publishing; she hits only the permission
      // gate, never an install gate. Contrast with Client X (restricted
      // AND install-locked) — this isolates the permission dimension.
      id: 'proj-indie-short',
      workspaceId: comfyOrg.id,
      name: 'Indie Short Film',
      tier: 'restricted',
      ownerUserId: user.id,
      isDrafts: false,
      currentUserHasAccess: true,
      members: [
        { userId: user.id, role: 'owner' },
        { userId: 'user-mira', role: 'collaborator' }
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
        { userId: 'user-alex', role: 'collaborator' },
        { userId: 'user-tomas', role: 'project-guest' }
      ],
      allowlists: {
        models: {
          override: true,
          entries: [
            {
              id: 'pmdl-cocacola-flux',
              name: 'flux1-dev.safetensors',
              addedAt: '2026-05-02',
              addedByUserId: user.id
            },
            {
              id: 'pmdl-cocacola-sdxl',
              name: 'sd_xl_base_1.0.safetensors',
              addedAt: '2026-05-02',
              addedByUserId: user.id
            }
          ]
        },
        customNodes: {
          override: true,
          entries: [
            {
              id: 'pcn-cocacola-controlnet',
              name: 'comfyui_controlnet_aux',
              addedAt: '2026-05-02',
              addedByUserId: 'user-alex',
              note: 'Required for the bottle-pose templates.'
            }
          ]
        }
      },
      defaults: { filenamePrefix: 'coca-cola/q3-campaign/' },
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
        { byUserId: 'user-mira', at: '2026-04-14' },
        { byUserId: 'user-jane', at: '2026-04-28' },
        { byUserId: 'user-mira', at: '2026-05-04' },
        { byUserId: 'user-alex', at: '2026-05-08' },
        { byUserId: user.id, at: '2026-05-11' }
      ]
    },
    {
      // Mira's fork of the Moodboard canonical (lives in her My Workflows;
      // surfaced on the canonical's detail page as a collaborator fork).
      id: 'wf-fork-mira-moodboard',
      projectId: 'proj-drafts',
      name: 'Moodboard explorer — Mira Voss',
      kind: 'workflow',
      ownerUserId: 'user-mira',
      updatedAt: '2026-05-12',
      storage: 'cloud',
      forkedFrom: {
        workflowId: 'wf-clientx-moodboard',
        atVersion: '2026-05-04'
      }
    },
    {
      id: 'wf-fork-alex-moodboard',
      projectId: 'proj-drafts',
      name: 'Moodboard explorer — Alex Carmoid',
      kind: 'workflow',
      ownerUserId: 'user-alex',
      updatedAt: '2026-05-12',
      storage: 'cloud',
      forkedFrom: {
        workflowId: 'wf-clientx-moodboard',
        atVersion: '2026-05-08'
      }
    },
    {
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
      access: [{ userId: 'user-mira', role: 'app-runner' }],
      updatedAt: '2026-05-09'
    },
    {
      // Canonical workflow in the restricted-but-unlocked project. Mira
      // (collaborator) opens → fork-on-open → can submit for publishing
      // but is permission-blocked (not owner/admin); no install gate.
      id: 'wf-indie-establishing',
      projectId: 'proj-indie-short',
      name: 'Establishing shot generator',
      description:
        'Builds wide cinematic establishing shots from a scene prompt and reference lighting.',
      kind: 'workflow',
      ownerUserId: user.id,
      access: [{ userId: 'user-mira', role: 'runner' }],
      updatedAt: '2026-05-11'
    },
    {
      id: 'wf-cocacola-hero',
      projectId: 'proj-cocacola',
      name: 'Coke can hero',
      description:
        'Hero product render for the can, with studio reflections and configurable background sweeps.',
      kind: 'workflow',
      ownerUserId: user.id,
      access: [
        { userId: 'user-alex', role: 'runner' },
        { userId: 'user-tomas', role: 'runner' }
      ],
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
    // Cross-workspace asset-level grants — workflows in Acme Studio
    // where Willie is a workspace Guest. No project membership, so they
    // don't surface anywhere except the Shared-with-me view.
    // Per concepts/three-level-permissions.md §"Asset level" and
    // concepts/personas-and-flows.md #4/#5.
    {
      id: 'wf-acme-titles',
      projectId: 'proj-acme-titles',
      name: 'Title-card composer',
      description:
        'Composes animated title cards from a script line, with typography and motion presets.',
      kind: 'workflow',
      ownerUserId: 'user-acme-anna',
      access: [{ userId: user.id, role: 'runner' }],
      updatedAt: '2026-05-11',
      storage: 'cloud'
    },
    {
      id: 'app-acme-poster',
      projectId: 'proj-acme-campaigns',
      name: 'Poster preview',
      description:
        'Generates quick poster mockups from a headline and key art for stakeholder previews.',
      kind: 'app',
      ownerUserId: 'user-acme-anna',
      access: [{ userId: user.id, role: 'app-runner' }],
      updatedAt: '2026-05-09',
      storage: 'cloud'
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
    },
    {
      id: 'user-mira',
      name: 'Mira Voss',
      email: 'mira@client-x.com',
      role: 'guest',
      avatarColor: '#64748b',
      joinedAt: '2026-04-19'
    },
    {
      id: 'user-tomas',
      name: 'Tomás Reyes',
      email: 'tomas@cocacola-creative.com',
      role: 'guest',
      avatarColor: '#94a3b8',
      joinedAt: '2026-05-02'
    }
  ],
  pendingInvites: [
    {
      id: 'invite-1',
      email: 'priya@studio-anon.com',
      role: 'member',
      invitedByUserId: user.id,
      invitedAt: '2026-05-10'
    },
    {
      id: 'invite-2',
      email: 'kai@cocacola-creative.com',
      role: 'guest',
      invitedByUserId: 'user-pablo',
      invitedAt: '2026-05-09'
    },
    {
      id: 'invite-3',
      email: 'jordan@client-x.com',
      role: 'guest',
      invitedByUserId: 'user-alex',
      invitedAt: '2026-05-06'
    }
  ],
  roleGrants: {
    'publish-direct-link': true,
    'submit-to-hub': true,
    'approve-hub-submissions': false,
    'edit-allowlists': false,
    'configure-workspace': false
  } satisfies RoleGrants,
  allowlists: {
    models: {
      enabled: true,
      entries: [
        {
          id: 'mdl-sdxl-base',
          name: 'sd_xl_base_1.0.safetensors',
          addedAt: '2026-04-12',
          addedByUserId: user.id
        },
        {
          id: 'mdl-sdxl-refiner',
          name: 'sd_xl_refiner_1.0.safetensors',
          addedAt: '2026-04-12',
          addedByUserId: user.id
        },
        {
          id: 'mdl-flux-dev',
          name: 'flux1-dev.safetensors',
          addedAt: '2026-04-29',
          addedByUserId: 'user-alex',
          note: 'Internal eval — not for client work yet.'
        }
      ]
    },
    customNodes: {
      enabled: true,
      entries: [
        {
          id: 'cn-comfyui-manager',
          name: 'ComfyUI-Manager',
          addedAt: '2026-04-12',
          addedByUserId: user.id
        },
        {
          id: 'cn-comfyui-controlnet-aux',
          name: 'comfyui_controlnet_aux',
          addedAt: '2026-04-18',
          addedByUserId: user.id
        }
      ]
    },
    partnerNodes: {
      enabled: true,
      entries: [
        {
          id: 'pn-runwayml',
          name: 'RunwayML / Gen-3 Alpha',
          addedAt: '2026-03-22',
          addedByUserId: user.id
        },
        {
          id: 'pn-luma',
          name: 'Luma / Dream Machine',
          addedAt: '2026-03-22',
          addedByUserId: user.id
        },
        {
          id: 'pn-bfl-flux',
          name: 'Black Forest Labs / FLUX Pro',
          addedAt: '2026-04-05',
          addedByUserId: 'user-pablo'
        }
      ]
    }
  },
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
  ],
  hubSubmissions: [
    {
      id: 'hub-sub-1',
      assetName: 'Cinematic upscaler v3',
      submittedByUserId: 'user-alex',
      submittedAt: '2026-05-09'
    },
    {
      id: 'hub-sub-2',
      assetName: 'Product photography pipeline',
      submittedByUserId: 'user-jane',
      submittedAt: '2026-05-11'
    },
    {
      id: 'hub-sub-3',
      assetName: 'Animated logo intro',
      submittedByUserId: 'user-marcus',
      submittedAt: '2026-05-12'
    }
  ],
  // Pending submission: Mira (project Collaborator on Indie Short Film,
  // a restricted-but-unlocked project) submitted her working copy of the
  // establishing-shot workflow for an owner to publish. Willie (owner)
  // sees it in the project Review tab + the workspace queue.
  workflowSubmissions: [
    {
      id: 'wfsub-indie-establishing',
      forkWorkflowId: 'wf-fork-mira-establishing',
      canonicalWorkflowId: 'wf-indie-establishing',
      workflowName: 'Establishing shot generator',
      projectId: 'proj-indie-short',
      submittedByUserId: 'user-mira',
      submittedAt: '2026-05-12',
      status: 'pending',
      note: 'Tweaked the sky gradient + added a depth pass.'
    }
  ],
  notifications: [
    {
      id: 'note-admin-sub-1',
      kind: 'submission-received',
      actorUserId: 'user-mira',
      target: {
        workspaceId: comfyOrg.id,
        projectId: 'proj-indie-short',
        assetId: 'wf-indie-establishing'
      },
      createdAt: '2026-05-12'
    }
  ],
  // Admin owns two installs — a personal dev sandbox and the team-blessed
  // VFX build referenced by Comfy Org's projects. Active is the personal
  // one (most-recent-used per open-q `default-active-install`).
  installs: [
    {
      id: 'install-willie-personal',
      displayName: 'Personal dev',
      comfyUIVersion: '0.4.0',
      registeredAt: '2026-02-14'
    },
    {
      id: 'install-vfx-team-q2-2026',
      displayName: 'VFX team Q2 2026',
      comfyUIVersion: '0.3.5',
      registeredAt: '2026-04-22'
    }
  ],
  activeInstallId: 'install-willie-personal'
}
