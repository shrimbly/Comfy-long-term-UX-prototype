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
  // Size of the models the build pre-installs, for the storage estimate.
  modelsGb: number
  // Platform's estimate from deploy to ready, in minutes.
  readyMinutes: [number, number]
}

export const MATTE_PASS: WorkflowNeeds = {
  name: 'matte_pass',
  nodePacks: ['comfyui-rmbg', 'acme-matte-tools'],
  models: ['flux1-dev-fp8', 'acme_hero_lora_v5'],
  localOnlyModels: ['acme_hero_lora_v5'],
  modelsGb: 12.2,
  readyMinutes: [3, 6]
}

// What Platform suggests for a build made from a workflow. The demo build
// shows these on its summary; changing one happens on Platform.
export const BUILD_DEFAULTS = {
  comfyVersion: 'v0.39.1',
  runtime: 'CUDA 13.0 · Python 3.12 · Torch 2.12.1'
}

// Newest first; the first one is the latest stable.
export const COMFY_VERSIONS = ['v0.39.1', 'v0.38.4', 'v0.37.2']

export interface PlatformGpu {
  label: string
  vramGb: number
  pricePerHourUsd: number
}

// The GPUs Platform's deploy dialog offers, at its live prices (7 Oct 2026).
export const PLATFORM_GPUS: PlatformGpu[] = [
  { label: 'RTX PRO 6000', vramGb: 96, pricePerHourUsd: 4.54 },
  { label: 'H100 SXM', vramGb: 80, pricePerHourUsd: 6.23 },
  { label: 'H200 SXM', vramGb: 141, pricePerHourUsd: 7.71 },
  { label: 'B200', vramGb: 180, pricePerHourUsd: 11.23 }
]

export const STORAGE_USD_PER_GB_MONTH = 0.2
export const DEFAULT_MAX_WORKERS = 3
export const MAX_WORKERS = 20

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
