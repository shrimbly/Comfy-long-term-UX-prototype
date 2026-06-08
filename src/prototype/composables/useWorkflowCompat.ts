// Implements:
//   concept: ../IA_Plan/wiki/concepts/install-switcher.md
//   entity:  ../IA_Plan/wiki/entities/workflow.md §"Runtime compatibility"
//   entity:  ../IA_Plan/wiki/entities/project.md  §"Install constraints"
//   decision: ../IA_Plan/wiki/decisions/workspace-install-registry.md
//   journey: ../IA_Plan/wiki/concepts/install-journeys.md §6 — freelancer gate
//
// Resolves workflow runtime compatibility for the *currently active install*.
//
// Identity-based, per the retired-version-range decision: a project locks by
// install IDENTITY (`allowedInstallIds`), not a portable version predicate —
// an install is one indivisible bundle, so the only stable test is "is the
// active install's id in the allowed set?". The per-workflow
// `recommendedComfyUIVersion` survives as a SOFT advisory (a plain minimum
// version string) that surfaces a caution badge but never blocks.

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
  reason?: 'project-allowed-set' | 'recommended'
  // For `blocked`: the workspace-canonical name of the project's required
  // install (the lock display name).
  requiredInstallName?: string
  // For `recommended-mismatch`: the workflow's recommended minimum version.
  recommendedComfyUIVersion?: string
  // The active install, for the gate/badge "you're on …" line.
  current?: { displayName: string; comfyUIVersion: string }
}

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

export function evaluateCompat(
  workflow: Workflow,
  project: Project | undefined,
  activeInstall: Install | undefined
): WorkflowCompatResult {
  if (!activeInstall) {
    // Cloud-runtime / no local install — out of the install gate's scope.
    return { status: 'no-install' }
  }

  const current = {
    displayName: activeInstall.displayName,
    comfyUIVersion: activeInstall.comfyUIVersion
  }

  // Hard gate: project install identity lock.
  if (
    project?.allowedInstallIds?.length &&
    !project.allowedInstallIds.includes(activeInstall.id)
  ) {
    return {
      status: 'blocked',
      reason: 'project-allowed-set',
      requiredInstallName: project.installLockDisplayName,
      current
    }
  }

  // Soft advisory: workflow recommended minimum version.
  if (
    workflow.recommendedComfyUIVersion &&
    compareVersions(
      activeInstall.comfyUIVersion,
      workflow.recommendedComfyUIVersion
    ) < 0
  ) {
    return {
      status: 'recommended-mismatch',
      reason: 'recommended',
      recommendedComfyUIVersion: workflow.recommendedComfyUIVersion,
      current
    }
  }

  return { status: 'compatible', current }
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
