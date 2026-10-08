// Implements the Homestead PRD V1 safeguards and V3 project compatibility.
export type Version = 1 | 2 | 3
export type Runtime = 'starting' | 'ready' | 'sleeping' | 'failed'
export type BuildState =
  | { phase: 'idle' }
  | { phase: 'building'; step: number }
  | { phase: 'failed'; stage: 'build' | 'deployment'; log: string }
  | { phase: 'ready'; environmentId: string }
export interface Environment {
  buildId?: string
  id: string
  name: string
  revision: string
  gpu: string
  packs: string[]
  models: string[]
  verified: boolean
}
export interface Workflow {
  projectId?: string
  id: string
  name: string
  description: string
  image: string
  packs: string[]
  models: string[]
  environmentId: string
  prompt: string
  steps: number
  seed: number
  saved: boolean
  positions: { x: number; y: number }[]
}
export interface Job {
  id: number
  workflow: string
  environmentId: string
  revision: string
  startedAt?: number
  status: 'cold-start' | 'running' | 'completed' | 'cancelled'
  image: string
}
export const environments: Environment[] = [
  {
    id: 'studio',
    name: 'Studio production',
    revision: 'v12',
    gpu: 'NVIDIA A100 · 80 GB',
    packs: ['ComfyUI Core', 'Impact Pack 8.8', 'WAS Suite 1.0'],
    models: ['FLUX.1 dev'],
    verified: true
  },
  {
    id: 'fast',
    name: 'Lightweight preview',
    revision: 'v4',
    gpu: 'NVIDIA L40S · 48 GB',
    packs: ['ComfyUI Core'],
    models: ['FLUX.1 dev'],
    verified: true
  },
  {
    id: 'lab',
    name: 'Research sandbox',
    revision: 'v2',
    gpu: 'NVIDIA A100 · 80 GB',
    packs: ['ComfyUI Core', 'Impact Pack 8.8'],
    models: ['FLUX.1 dev'],
    verified: false
  }
]
export function seedWorkflows(): Workflow[] {
  return [
    {
      id: 'product',
      name: 'Campaign portraits',
      description: 'Lighting and portrait exploration',
      image: '/prototype-fixtures/media/brand-system/01.jpg',
      packs: ['ComfyUI Core'],
      models: ['FLUX.1 dev'],
      environmentId: 'studio',
      prompt:
        'Editorial campaign portrait, neon city light, natural skin texture, cinematic composition',
      steps: 24,
      seed: 824019,
      saved: true,
      positions: [
        { x: 36, y: 64 },
        { x: 320, y: 112 },
        { x: 603, y: 72 },
        { x: 892, y: 120 }
      ]
    },
    {
      id: 'matte',
      name: 'Matte pass',
      description: 'Subject isolation with Impact Pack',
      image: '/prototype-fixtures/media/brand-system/02.jpg',
      packs: ['ComfyUI Core', 'Impact Pack 8.8'],
      models: ['FLUX.1 dev'],
      environmentId: 'studio',
      prompt:
        'Isolate the subject, preserve soft edges and natural shadows, clean production matte',
      steps: 28,
      seed: 293410,
      saved: true,
      positions: [
        { x: 36, y: 64 },
        { x: 320, y: 112 },
        { x: 603, y: 72 },
        { x: 892, y: 120 }
      ]
    },
    {
      id: 'finish',
      name: 'Campaign finishing',
      description: 'Color treatment and final delivery',
      image: '/prototype-fixtures/media/brand-system/03.jpg',
      packs: ['ComfyUI Core', 'WAS Suite 1.0'],
      models: ['FLUX.1 dev'],
      environmentId: 'studio',
      prompt:
        'Campaign finishing, balanced contrast, natural grain, warm highlights',
      steps: 20,
      seed: 982014,
      saved: true,
      positions: [
        { x: 36, y: 64 },
        { x: 320, y: 112 },
        { x: 603, y: 72 },
        { x: 892, y: 120 }
      ]
    }
  ]
}
export function compatibility(workflow: Workflow, environment: Environment) {
  if (!environment.verified)
    return { status: 'unknown' as const, missing: [] as string[] }
  const missing = [
    ...workflow.packs.filter((p) => !environment.packs.includes(p)),
    ...workflow.models.filter((m) => !environment.models.includes(m))
  ]
  return {
    status: missing.length
      ? ('incompatible' as const)
      : ('compatible' as const),
    missing
  }
}
export function projectScan(workflows: Workflow[], environment: Environment) {
  return workflows.map((workflow) => ({
    workflow,
    ...compatibility(workflow, environment)
  }))
}
export function canSleep(jobs: Job[]) {
  return jobs.every(
    (job) => job.status !== 'running' && job.status !== 'cold-start'
  )
}
export function transitionBuild(
  state: BuildState,
  event: 'start' | 'advance' | 'fail-build' | 'fail-deployment' | 'reset'
): BuildState {
  if (event === 'reset') return { phase: 'idle' }
  if (event === 'start' && state.phase !== 'building')
    return { phase: 'building', step: 0 }
  if (state.phase !== 'building') return state
  if (event === 'fail-build')
    return {
      phase: 'failed',
      stage: 'build',
      log: 'build_hs_013 · Dependency resolution failed\nImpact Pack requires segment-anything. Package was not found in the build manifest.\nWorking deployment dep_studio_012 remains available.'
    }
  if (event === 'fail-deployment')
    return {
      phase: 'failed',
      stage: 'deployment',
      log: 'dep_studio_013 · Health check failed\nModel FLUX.1 dev could not be loaded: source credentials are missing.\nWorking deployment dep_studio_012 remains available.'
    }
  if (event === 'advance')
    return state.step < 3
      ? { phase: 'building', step: state.step + 1 }
      : { phase: 'ready', environmentId: 'updated' }
  return state
}
export function buildPrompt(
  workflow: Workflow,
  kind: 'build' | 'repair' | 'local',
  version: Version,
  failure?: string,
  workspace = 'Northstar Studio'
) {
  const context = `Workspace: ${workspace}. Workflow: ${workflow.name}. Required node packs and known versions: ${workflow.packs.join(', ')}. Models: ${workflow.models.join(', ')}.`
  if (kind === 'repair')
    return `Use the Homestead build-and-deploy skill to diagnose and repair this failure. ${context}\n${failure}\nRead logs and status, preserve working deployment dep_studio_012, fix and retry within my existing permissions. Ask me for missing files or credentials. Return an authenticated Open UI link with the original workflow only after the deployment is ready.`
  if (kind === 'local')
    return `${version >= 2 ? 'Use the local custom-node build-and-test skill' : 'Help me develop a custom node locally'}, then hand off to the Homestead build-and-deploy skill. ${context} Ask me to locate my local workflow and custom-node source files. Test locally, package only required dependencies, preserve the working version and return Open UI only after readiness. Do not author nodes in Cloud.`
  return `Use the Homestead build-and-deploy skill. ${context} Ask me to locate the workflow file on my local filesystem; no local path is known. Collect the current workflow's local dependency versions, reuse supported model setup and existing authentication, and package only its required dependencies. Build and deploy into this workspace. Report progress and logs, diagnose recoverable failures, and ask for missing files or credentials. Preserve the working deployment and return an authenticated Open UI link with the original workflow loaded only after deployment readiness is confirmed.`
}
