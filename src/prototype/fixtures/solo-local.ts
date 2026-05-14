// Implements:
//   persona:  ../IA_Plan/wiki/concepts/personas-and-flows.md
//             — Tier 1, #1b Solo Creator — local-only
//   decision: ../IA_Plan/wiki/decisions/projects-are-cloud-only.md
//             — local user has no projects
//   concept:  ../IA_Plan/wiki/concepts/local-dashboard-views.md
//             — filesystem-driven library (Media / Models / Custom Nodes / Outputs)

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
    }
  ],
  // No credits — local runs on local hardware.
  usage: null,
  members: [],
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
  billing: null,
  memberCreditLimits: [],
  hubSubmissions: [],
  notifications: []
}
