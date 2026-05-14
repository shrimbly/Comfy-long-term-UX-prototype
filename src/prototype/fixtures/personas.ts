// Implements:
//   concept: ../IA_Plan/wiki/concepts/personas.md
//   matrix:  ../IA_Plan/wiki/concepts/prototype-test-coverage.md
//
// Persona registry. Each persona has a tailored fixture matching the
// test-coverage matrix; see fixtures/<persona>.ts for the concrete shape.

import { adminFixture } from './admin'
import { assetOnlyGuestFixture } from './asset-only-guest'
import { projectCollaboratorFixture } from './project-collaborator'
import { soloLocalFixture } from './solo-local'
import { soloFixture } from './solo'
import { workspaceMemberFixture } from './workspace-member'
import type { PersonaDef } from '../types'

export const personas: PersonaDef[] = [
  {
    id: 'workspace-admin',
    label: 'Workspace Admin',
    description: 'Team workspace owner; full sidebar surface.',
    fixture: adminFixture
  },
  {
    id: 'solo',
    label: 'Solo creator (cloud)',
    description:
      'Default for every new account. One workspace, no team, no guests.',
    fixture: soloFixture
  },
  {
    id: 'solo-local',
    label: 'Solo creator (local-only)',
    description:
      'Persona 1b — desktop install, no cloud. No projects, no workspace switcher, filesystem-driven library.',
    fixture: soloLocalFixture
  },
  {
    id: 'workspace-member',
    label: 'Workspace Member',
    description:
      'Invited team collaborator. Sees the same workspace as Admin but cannot edit the permissions matrix.',
    fixture: workspaceMemberFixture
  },
  {
    id: 'project-collaborator',
    label: 'Project Collaborator',
    description:
      'Mira Voss (client-x.com). Workspace Guest + Collaborator on Client X. Narrow view: only Client X visible; no library, members, or billing.',
    fixture: projectCollaboratorFixture
  },
  {
    id: 'asset-only-guest',
    label: 'Asset-only Guest',
    description:
      'Tomás Reyes (cocacola-creative.com). Workspace Guest in Comfy Org + Studio Atlas with asset-only access. Runner on one workflow, App Runner on one app.',
    fixture: assetOnlyGuestFixture
  }
]
