// Implements:
//   persona:  ../IA_Plan/wiki/concepts/personas.md — Tier 1, #3a Managed Artist
//   concept:  ../IA_Plan/wiki/concepts/install-journeys.md
//             — Journey 2 (first-day onboarding), Journey 3 (end-of-day sync)
//
// VFX team artist on a locked install. Same permission position as
// Workspace Member; the install is the differentiator — they default to
// the team-blessed VFX build, no compat machinery in their everyday
// flow (that's the success state per Journey 2).

import { workspaceMemberFixture } from './workspace-member'
import type { PersonaFixture } from '../types'

const jonahId = 'user-jonah'

export const managedArtistFixture: PersonaFixture = {
  ...workspaceMemberFixture,
  currentUser: {
    id: jonahId,
    name: 'Jonah Park',
    email: 'jonah@comfy.org'
  }
}
