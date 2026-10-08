import { COMFY_CLOUD, MATTE_PASS } from '../fixtures/customCloud'
import type { Deployment, PersonaFixture } from '../types'
import type { Environment, Workflow } from './model'

export function nativeDeployment(environment: Environment): Deployment {
  return {
    id: environment.id,
    name: environment.name,
    kind: environment.id === COMFY_CLOUD.id ? 'comfy-cloud' : 'custom',
    release: environment.revision,
    status: 'ready',
    gpu: environment.gpu,
    nodePacks: environment.packs,
    models: environment.models
  }
}

export function nativeFixtures(fixture: PersonaFixture) {
  const projects = fixture.projects.filter(
    (p) =>
      p.workspaceId === fixture.currentWorkspaceId && p.currentUserHasAccess
  )
  const deployments = [
    COMFY_CLOUD,
    ...(fixture.deployments ?? []).filter(
      (d) =>
        d.workspaceId === fixture.currentWorkspaceId ||
        projects.some((p) => p.deploymentId === d.id)
    )
  ]
  const environments: Environment[] = deployments.map((d) => ({
    id: d.id,
    name: d.name,
    revision: d.release ?? 'v1',
    gpu: d.gpu ?? 'Comfy Cloud',
    packs: [...d.nodePacks],
    models: [...d.models],
    verified: d.status !== 'building'
  }))
  const workflows: Workflow[] = fixture.workflows
    .filter((w) => projects.some((p) => p.id === w.projectId))
    .map((w) => ({
      id: w.id,
      projectId: w.projectId,
      name: w.name,
      description: w.description ?? '',
      image: w.thumbnailUrl ?? '',
      environmentId:
        projects.find((p) => p.id === w.projectId)?.deploymentId ??
        COMFY_CLOUD.id,
      packs: [],
      models: [],
      prompt: '',
      steps: 20,
      seed: 0,
      positions: [],
      saved: true
    }))
  workflows.push({
    id: 'matte',
    projectId: projects[0]?.id,
    name: MATTE_PASS.name,
    description: '',
    image: '',
    environmentId: COMFY_CLOUD.id,
    packs: [...MATTE_PASS.nodePacks],
    models: [...MATTE_PASS.models],
    prompt: '',
    steps: 20,
    seed: 0,
    positions: [],
    saved: false
  })
  return { environments, workflows }
}
