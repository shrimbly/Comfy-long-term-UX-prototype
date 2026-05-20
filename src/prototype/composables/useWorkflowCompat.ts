// Implements:
//   concept: ../IA_Plan/wiki/concepts/install-switcher.md
//            §"Workflow version compatibility", §"Project install constraints"
//   entity:  ../IA_Plan/wiki/entities/workflow.md §"Runtime compatibility"
//   entity:  ../IA_Plan/wiki/entities/project.md  §"Install constraints"
//   journey: ../IA_Plan/wiki/concepts/install-journeys.md §6 — freelancer gate
//   log:     ../prototype/design-decisions.md 2026-05-19 — install gate is
//            identity-based; recommended-version is soft / advisory.
//
// Two layers:
//
//   1. Project allowed-install set — hard, by install identity. The
//      project carries a list of install IDs that may run its workflows.
//      `activeInstall.id ∈ allowedInstallIds` → pass.
//   2. Workflow recommended-minimum ComfyUI version — soft, advisory
//      only. Surfaces a labeling badge but never blocks.

import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { usePrototypePersonaStore } from '../stores/personaStore'
import type { Install, Project, Workflow } from '../types'

export type WorkflowCompatStatus =
  | 'compatible'
  | 'recommended-mismatch'
  | 'blocked'
  | 'no-install'

export interface WorkflowCompatResult {
  status: WorkflowCompatStatus
  // For blocked: the project-canonical name of the required install
  // (set by the Install Governor when they configured the lock).
  requiredInstallName?: string
  // For recommended-mismatch: the version string the workflow author
  // advised. Soft signal only.
  recommendedComfyUIVersion?: string
  // The active install's display name + version, for both blocked and
  // recommended-mismatch cases.
  current?: { displayName: string; comfyUIVersion: string }
}

// Compare two dotted version strings. Returns -1 / 0 / 1.
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map((n) => parseInt(n, 10) || 0)
  const partsB = b.split('.').map((n) => parseInt(n, 10) || 0)
  const length = Math.max(partsA.length, partsB.length)
  for (let i = 0; i < length; i++) {
    const av = partsA[i] ?? 0
    const bv = partsB[i] ?? 0
    if (av !== bv) return av < bv ? -1 : 1
  }
  return 0
}

function evaluateCompat(
  workflow: Workflow,
  project: Project | undefined,
  activeInstall: Install | undefined
): WorkflowCompatResult {
  if (!activeInstall) {
    // Cloud-runtime / no local install. The install gate is out of
    // scope here — cloud BE handles its own runtime story.
    return { status: 'no-install' }
  }

  const current = {
    displayName: activeInstall.displayName,
    comfyUIVersion: activeInstall.comfyUIVersion
  }

  const allowed = project?.allowedInstallIds
  if (allowed && allowed.length > 0 && !allowed.includes(activeInstall.id)) {
    return {
      status: 'blocked',
      requiredInstallName: project?.installLockDisplayName,
      current
    }
  }

  if (
    workflow.recommendedComfyUIVersion &&
    compareVersions(
      activeInstall.comfyUIVersion,
      workflow.recommendedComfyUIVersion
    ) < 0
  ) {
    return {
      status: 'recommended-mismatch',
      recommendedComfyUIVersion: workflow.recommendedComfyUIVersion,
      current
    }
  }

  return { status: 'compatible' }
}

export function useWorkflowCompat() {
  const personaStore = usePrototypePersonaStore()
  const { fixture, activeInstall } = storeToRefs(personaStore)

  function resolve(workflow: Workflow): WorkflowCompatResult {
    const project = fixture.value.projects.find(
      (p) => p.id === workflow.projectId
    )
    return evaluateCompat(workflow, project, activeInstall.value)
  }

  const isBlocked = (workflow: Workflow) =>
    computed(() => resolve(workflow).status === 'blocked')

  return { resolve, isBlocked }
}
