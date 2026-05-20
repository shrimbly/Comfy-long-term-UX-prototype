// Implements:
//   persona:  ../IA_Plan/wiki/concepts/personas.md — Tier 1, #4a Freelance contractor
//   concept:  ../IA_Plan/wiki/concepts/install-journeys.md
//             — Journey 6 (freelancer hits the install gate)
//
// External freelance contractor invited as Project Collaborator to a
// VFX-team project. Their personal install is intentionally outside the
// project's allowed-install set — Journey 6's load-bearing UX (the hard
// compat gate) lands in A2 and will use this persona as its primary
// fixture.

import { projectCollaboratorFixture } from './project-collaborator'
import type { PersonaFixture } from '../types'

const rezaId = 'user-reza'

export const freelancerFixture: PersonaFixture = {
  ...projectCollaboratorFixture,
  currentUser: {
    id: rezaId,
    name: 'Reza Khalid',
    email: 'reza@independent.studio'
  },
  // Personal install — newer than the team's blessed build and missing
  // the `vfx-team-q2-2026` package-set tag, so it deliberately falls
  // outside the project's allowed-install set. A2 surfaces the compat
  // gate against this.
  installs: [
    {
      id: 'install-reza-personal',
      displayName: 'Personal dev',
      comfyUIVersion: '0.4.0',
      registeredAt: '2026-05-02'
    }
  ],
  activeInstallId: 'install-reza-personal'
}
