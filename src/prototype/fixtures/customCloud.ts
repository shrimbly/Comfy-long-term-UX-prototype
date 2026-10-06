// Implements:
//   concept: ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
//   flow:    ../prototype/flows/07-custom-cloud-happy-path.md
//
// Seed data for the Custom Comfy Cloud (Project Homestead) demo: the shared
// Comfy Cloud default, the incompatible `matte_pass` workflow the presenter
// drops in, and the build/deploy stages the locked-project modal plays back.

import type { Deployment } from '../types'

export const COMFY_CLOUD: Deployment = {
  id: 'dep-comfy-cloud',
  name: 'Comfy Cloud',
  kind: 'comfy-cloud',
  status: 'ready',
  nodePacks: [],
  models: []
}

export interface WorkflowNeeds {
  name: string
  nodePacks: string[]
  models: string[]
  // Models Platform can't fetch itself — the build uploads them.
  localOnlyModels: string[]
  gpu: string
  hourlyCostUsd: number
  monthlyStorageUsd: number
}

export const MATTE_PASS: WorkflowNeeds = {
  name: 'matte_pass',
  nodePacks: ['comfyui-rmbg', 'acme-matte-tools'],
  models: ['flux1-dev-fp8', 'acme_hero_lora_v5'],
  localOnlyModels: ['acme_hero_lora_v5'],
  gpu: 'RTX 5090',
  hourlyCostUsd: 0.89,
  monthlyStorageUsd: 0.81
}

export const DEFAULT_BUILD_PROJECT_NAME = 'Matte R&D'
export const BUILD_PROJECT_COLOR = '#2f9e8f'
export const WARM_MINUTES = 2

export type BuildPhase = 'build' | 'deploy'

export interface BuildStage {
  id: 'resolve' | 'upload' | 'install' | 'bake' | 'worker' | 'models'
  phase: BuildPhase
  // Simulated duration on Platform. About 15 minutes to build, 4 to deploy.
  seconds: number
}

export const BUILD_STAGES: BuildStage[] = [
  { id: 'resolve', phase: 'build', seconds: 40 },
  { id: 'upload', phase: 'build', seconds: 90 },
  { id: 'install', phase: 'build', seconds: 300 },
  { id: 'bake', phase: 'build', seconds: 470 },
  { id: 'worker', phase: 'deploy', seconds: 90 },
  { id: 'models', phase: 'deploy', seconds: 150 }
]

// The demo plays the ~19 simulated minutes back in this much real time.
export const DEMO_BUILD_MS = 18_000
