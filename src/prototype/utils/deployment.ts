// Implements:
//   concept: ../IA_Plan/wiki/concepts/custom-comfy-cloud.md
//
// Pure helpers for Custom Comfy Cloud: which deployment a project runs on,
// what a workflow lacks there, and how far a demo build has progressed.

import { BUILD_STAGES, COMFY_CLOUD } from '../fixtures/customCloud'
import type {
  BuildPhase,
  BuildStage,
  WorkflowNeeds
} from '../fixtures/customCloud'
import type { Deployment, Project } from '../types'

export function resolveDeployment(
  project: Project | undefined,
  deployments: Deployment[]
): Deployment {
  return deployments.find((d) => d.id === project?.deploymentId) ?? COMFY_CLOUD
}

export function missingFrom(deployment: Deployment, needs: WorkflowNeeds) {
  return {
    nodePacks: needs.nodePacks.filter((p) => !deployment.nodePacks.includes(p)),
    models: needs.models.filter((m) => !deployment.models.includes(m))
  }
}

// A deployment still building can't run anything yet, even if its build has
// every node and model.
export function runsWorkflow(
  deployment: Deployment,
  needs: WorkflowNeeds
): boolean {
  if (deployment.status === 'building') return false
  const missing = missingFrom(deployment, needs)
  return !missing.nodePacks.length && !missing.models.length
}

type StageState = 'done' | 'active' | 'pending'

interface StageProgress extends BuildStage {
  state: StageState
  // Simulated seconds spent in this stage so far.
  elapsed: number
}

interface PhaseProgress {
  fraction: number
  remainingSeconds: number
}

export interface BuildProgress {
  stages: StageProgress[]
  build: PhaseProgress
  deploy: PhaseProgress
  remainingSeconds: number
  done: boolean
}

const TOTAL_SECONDS = BUILD_STAGES.reduce((sum, s) => sum + s.seconds, 0)

// Map real elapsed time onto the simulated ~19 minute build so the demo
// finishes in `durationMs`.
export function simulatedSeconds(elapsedMs: number, durationMs: number) {
  return Math.min(
    TOTAL_SECONDS,
    (Math.max(0, elapsedMs) / durationMs) * TOTAL_SECONDS
  )
}

function phaseProgress(phase: BuildPhase, simSeconds: number): PhaseProgress {
  const stages = BUILD_STAGES.filter((s) => s.phase === phase)
  const start = BUILD_STAGES.indexOf(stages[0])
  const offset = BUILD_STAGES.slice(0, start).reduce((n, s) => n + s.seconds, 0)
  const total = stages.reduce((n, s) => n + s.seconds, 0)
  const elapsed = Math.min(total, Math.max(0, simSeconds - offset))
  return { fraction: elapsed / total, remainingSeconds: total - elapsed }
}

export function buildProgress(simSeconds: number): BuildProgress {
  let stageStart = 0
  const stages = BUILD_STAGES.map((stage) => {
    const stageEnd = stageStart + stage.seconds
    const state: StageState =
      simSeconds >= stageEnd
        ? 'done'
        : simSeconds >= stageStart
          ? 'active'
          : 'pending'
    const elapsed = Math.min(
      stage.seconds,
      Math.max(0, simSeconds - stageStart)
    )
    stageStart = stageEnd
    return { ...stage, state, elapsed }
  })
  return {
    stages,
    build: phaseProgress('build', simSeconds),
    deploy: phaseProgress('deploy', simSeconds),
    remainingSeconds: Math.max(0, TOTAL_SECONDS - simSeconds),
    done: simSeconds >= TOTAL_SECONDS
  }
}

// 'v3' → 'v4'. Anything else starts a new line of releases.
export function nextRelease(release: string | undefined): string {
  const match = /^v(\d+)$/.exec(release ?? '')
  return match ? `v${Number(match[1]) + 1}` : 'v1'
}
