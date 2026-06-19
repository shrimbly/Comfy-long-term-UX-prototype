// Implements:
//   concept: ../IA_Plan/wiki/concepts/personas.md
//   matrix:  ../IA_Plan/wiki/concepts/prototype-test-coverage.md
//
// Persona registry. Each persona has a tailored fixture matching the
// test-coverage matrix; see fixtures/<persona>.ts for the concrete shape.

import { adminFixture } from './admin'
import { soloCloudActiveFixture } from './solo-cloud-active'
import { soloLocalActiveFixture } from './solo-local-active'
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
    label: 'New solo creator — Cloud',
    description:
      'Default for every new account. One workspace, no team, no guests — and no workflows yet (first-run empty state).',
    fixture: soloFixture
  },
  {
    id: 'solo-cloud-active',
    label: 'Solo creator — Cloud',
    description:
      'Established cloud solo creator: one workspace, a full My Workflows of cloud-stored workflows.',
    fixture: soloCloudActiveFixture
  },
  {
    id: 'solo-local',
    label: 'New solo creator — Local only',
    description:
      'Persona 1b — desktop install, no cloud. No projects, no workspace switcher, filesystem-driven library, no workflows yet.',
    fixture: soloLocalFixture
  },
  {
    id: 'solo-local-active',
    label: 'Solo creator — Local only',
    description:
      'Established local-only solo creator: a full My Workflows of local-stored workflows.',
    fixture: soloLocalActiveFixture
  },
  {
    id: 'workspace-member',
    label: 'Workspace Member',
    description:
      'Invited team collaborator. Sees the same workspace as Admin but cannot edit the permissions matrix.',
    fixture: workspaceMemberFixture
  }
]
