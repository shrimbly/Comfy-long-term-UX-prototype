// Implements:
//   persona:  ../IA_Plan/wiki/concepts/personas-and-flows.md
//             — Tier 1, #1b Solo Creator — local-only
//   decision: ../IA_Plan/wiki/decisions/drafts-as-default-private-project.md
//   concept:  ../IA_Plan/wiki/concepts/local-dashboard-views.md
//
// Established local-only solo creator: the non-empty counterpart to
// solo-local.ts (the first-run empty state). A full My Workflows of
// local-stored workflows. Every workflow is storage: 'local' — a solo creator
// working entirely on local hardware (mirror of solo-cloud-active, all cloud).
//
// My Workflows is the on-disk workflow folder, modeled as the isDrafts
// "project" so the same Drafts / Recents / Home surfaces light up. It is NOT a
// shareable cloud Project (those stay cloud-only per projects-are-cloud-only.md;
// it is filtered out of every Projects listing by isDrafts) — see
// prototype/design-decisions.md 2026-06-20.

import { buildLocalMediaReferences } from './localMedia'
import type { PersonaFixture, Workflow } from '../types'

const user = {
  id: 'user-solo-local-active',
  name: 'Local user',
  email: ''
}

// Implicit personal-workspace-equivalent (see solo-local.ts). The local-only
// UI replaces the workspace switcher with a Create-a-workspace CTA; this entry
// exists only so shared types stay populated.
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

// The on-disk My Workflows store (see header). isDrafts keeps it out of every
// Projects listing while still feeding the Drafts view.
const myWorkflows = {
  id: 'proj-drafts',
  workspaceId: implicitWorkspace.id,
  name: 'My Workflows',
  tier: 'private' as const,
  ownerUserId: user.id,
  isDrafts: true,
  currentUserHasAccess: true
}

// All local-stored — the defining trait of this persona.
const workflows: Workflow[] = [
  {
    id: 'wf-sl-portrait-retouch',
    projectId: myWorkflows.id,
    name: 'Portrait retoucher',
    kind: 'app',
    thumbnailUrl: '/wf-thumbs/app.png',
    updatedAt: '2026-06-18',
    storage: 'local'
  },
  {
    id: 'wf-sl-product-batch',
    projectId: myWorkflows.id,
    name: 'Product shots — local batch',
    updatedAt: '2026-06-17',
    storage: 'local'
  },
  {
    id: 'wf-sl-upscale-4x',
    projectId: myWorkflows.id,
    name: 'Upscale 4x (ESRGAN)',
    updatedAt: '2026-06-16',
    storage: 'local'
  },
  {
    id: 'wf-sl-style-watercolor',
    projectId: myWorkflows.id,
    name: 'Style transfer — watercolor',
    updatedAt: '2026-06-15',
    storage: 'local'
  },
  {
    id: 'wf-sl-bg-remove',
    projectId: myWorkflows.id,
    name: 'Background remover',
    kind: 'app',
    thumbnailUrl: '/wf-thumbs/app2.png',
    updatedAt: '2026-06-14',
    storage: 'local'
  },
  {
    id: 'wf-sl-inpaint',
    projectId: myWorkflows.id,
    name: 'Inpaint cleanup',
    updatedAt: '2026-06-13',
    storage: 'local'
  },
  {
    id: 'wf-sl-sdxl-refiner',
    projectId: myWorkflows.id,
    name: 'SDXL base + refiner',
    updatedAt: '2026-06-12',
    storage: 'local'
  },
  {
    id: 'wf-sl-flux-portrait',
    projectId: myWorkflows.id,
    name: 'Flux dev portrait',
    kind: 'app',
    thumbnailUrl: '/wf-thumbs/app3.png',
    updatedAt: '2026-06-11',
    storage: 'local'
  },
  {
    id: 'wf-sl-controlnet-depth',
    projectId: myWorkflows.id,
    name: 'ControlNet depth test',
    updatedAt: '2026-06-10',
    storage: 'local'
  },
  {
    id: 'wf-sl-icon-raster',
    projectId: myWorkflows.id,
    name: 'Icon set rasterizer',
    updatedAt: '2026-06-08',
    storage: 'local'
  },
  {
    id: 'wf-sl-faceswap-batch',
    projectId: myWorkflows.id,
    name: 'Batch face swap',
    kind: 'app',
    thumbnailUrl: '/wf-thumbs/app4.png',
    updatedAt: '2026-06-06',
    storage: 'local'
  },
  {
    id: 'wf-sl-sketch-render',
    projectId: myWorkflows.id,
    name: 'Sketch → render',
    updatedAt: '2026-06-04',
    storage: 'local'
  },
  {
    id: 'wf-sl-frame-interp',
    projectId: myWorkflows.id,
    name: 'Frame interpolation',
    updatedAt: '2026-06-02',
    storage: 'local'
  },
  {
    id: 'wf-sl-depth-map',
    projectId: myWorkflows.id,
    name: 'Depth map generator',
    updatedAt: '2026-05-30',
    storage: 'local'
  },
  {
    id: 'wf-sl-outpaint-wide',
    projectId: myWorkflows.id,
    name: 'Outpaint wide',
    updatedAt: '2026-05-27',
    storage: 'local'
  },
  {
    id: 'wf-sl-tiling-texture',
    projectId: myWorkflows.id,
    name: 'Tiling texture maker',
    updatedAt: '2026-05-24',
    storage: 'local'
  },
  {
    id: 'wf-sl-color-grade',
    projectId: myWorkflows.id,
    name: 'Color grade LUT apply',
    updatedAt: '2026-05-20',
    storage: 'local'
  },
  {
    id: 'wf-sl-pixel-downscale',
    projectId: myWorkflows.id,
    name: 'Pixel-art downscaler',
    updatedAt: '2026-05-16',
    storage: 'local'
  }
]

export const soloLocalActiveFixture: PersonaFixture = {
  mode: 'local',
  currentUser: user,
  workspaces: [implicitWorkspace],
  currentWorkspaceId: implicitWorkspace.id,
  projects: [myWorkflows],
  workflows,
  // Referenced local media (same set as the empty local persona).
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
  memberCreditLimits: []
}
