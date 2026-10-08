import { z } from 'zod'
import type { Environment, Workflow } from './model'

export type DesktopBuildRequest = {
  name: string
  gpu: string
  instructions: string
} & ({ mode: 'create' } | { mode: 'update'; sourceId: string })

export interface AgentRun {
  request: DesktopBuildRequest
  workflow: Workflow
  workspace: string
  prompt: string
  sourceRevision?: string
}

export function desktopBuildPrompt(
  request: DesktopBuildRequest,
  workflow: Workflow,
  workspace: string
) {
  const target =
    request.mode === 'create'
      ? `Create a new build named "${request.name}".`
      : `Prepare a new revision of build "${request.name}" (build ID: ${request.sourceId}). Keep the working revision available until I switch.`
  return `Use the Homestead build-and-deploy skill.\n\n${target}\nWorkspace: ${workspace}\nGPU: ${request.gpu}\nWorkflow: ${workflow.name} (current Desktop canvas)\nNode packs: ${workflow.packs.join(', ') || 'ComfyUI core'}\nModels: ${workflow.models.join(', ') || 'Default models'}\n\nInspect the current workflow and local dependency versions. Package only required dependencies, reuse existing authentication and model setup, then build and deploy. Report progress and logs. Ask for missing files or credentials. Return the Open UI URL with this workflow loaded only after readiness checks pass.${request.instructions.trim() ? `\n\nAdditional instructions:\n${request.instructions.trim()}` : ''}`
}

export function latestBuilds(environments: Environment[]) {
  const families = new Map<string, Environment>()
  for (const environment of environments) {
    if (!environment.verified || environment.id === 'dep-comfy-cloud') continue
    const id = environment.buildId ?? environment.id
    const previous = families.get(id)
    if (
      !previous ||
      Number(environment.revision.slice(1)) > Number(previous.revision.slice(1))
    )
      families.set(id, environment)
  }
  return [...families.values()]
}

export const deploymentLinkSchema = z.object({
  environment: z.object({
    id: z.string(),
    buildId: z.string().optional(),
    name: z.string(),
    revision: z.string(),
    gpu: z.string(),
    packs: z.array(z.string()),
    models: z.array(z.string()),
    verified: z.literal(true)
  }),
  workflow: z.object({
    id: z.string(),
    projectId: z.string().optional(),
    name: z.string(),
    description: z.string(),
    image: z.string(),
    packs: z.array(z.string()),
    models: z.array(z.string()),
    environmentId: z.string(),
    prompt: z.string(),
    steps: z.number(),
    seed: z.number(),
    saved: z.boolean(),
    positions: z.array(z.object({ x: z.number(), y: z.number() }))
  })
})

export function agentActivities(run: AgentRun) {
  const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`
  const buildTarget =
    run.request.mode === 'update'
      ? `--build ${quote(run.request.sourceId)} --new-revision`
      : `--name ${quote(run.request.name)}`
  return [
    {
      kind: 'thinking',
      key: 'plan',
      input: '',
      output: `${run.workflow.name}\n${run.request.name} · ${run.request.gpu}`
    },
    {
      kind: 'skill',
      key: 'skill',
      input: 'read_skill("homestead/build-and-deploy")',
      output:
        'SKILL.md\ninspect → package → build → deploy → verify\npreserve_working_revision: true'
    },
    {
      kind: 'tool',
      key: 'inspect',
      input: `inspect_workflow({ source: "desktop.active_canvas", workflow: ${JSON.stringify(run.workflow.name)} })`,
      output: JSON.stringify(
        {
          node_packs: run.workflow.packs,
          models: run.workflow.models,
          scope: 'workflow_dependencies_only'
        },
        null,
        2
      )
    },
    {
      kind: 'tool',
      key: 'manifest',
      input: 'write_build_manifest({ preserve_local_versions: true })',
      output: `build: ${run.request.name}\ngpu: ${run.request.gpu}\nsource: current Desktop workflow\nmanifest: ready`
    },
    {
      kind: 'cli',
      key: 'package',
      input: 'comfy cloud package --manifest build.yaml',
      output:
        '[1/3] Resolving node-pack versions\n[2/3] Reusing model references\n[3/3] Packaging workflow dependencies\n✓ Upload complete'
    },
    {
      kind: 'cli',
      key: 'submit',
      input: `comfy cloud build ${run.request.mode === 'update' ? 'update' : 'create'} ${buildTarget} --manifest build.yaml`,
      output:
        '✓ Build accepted\n✓ Dependency resolution complete\n→ Container build queued'
    },
    {
      kind: 'cli',
      key: 'build',
      input: 'comfy cloud build logs --follow',
      output:
        '#1 Fetch base image                 CACHED\n#2 Install required node packs      DONE\n#3 Validate model references        DONE\n#4 Export image                     DONE\n✓ Build succeeded'
    },
    {
      kind: 'cli',
      key: 'deploy',
      input: `comfy cloud deploy --gpu ${quote(run.request.gpu)} --wait`,
      output:
        '→ Provisioning worker\n✓ Image pulled\n✓ ComfyUI started\n→ Waiting for readiness probe'
    },
    {
      kind: 'tool',
      key: 'health',
      input:
        'check_deployment({ readiness: true, workflow_dependencies: true })',
      output:
        'GET /system_stats → 200\nGET /object_info → 200\n✓ Required node packs registered\n✓ Workflow dependencies matched\n✓ Authenticated Open UI link ready'
    }
  ]
}
