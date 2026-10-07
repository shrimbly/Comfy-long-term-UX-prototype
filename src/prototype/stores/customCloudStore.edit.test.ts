import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEMO_BUILD_MS, PLATFORM_GPUS } from '../fixtures/customCloud'

// The persona fixtures are module state the store mutates, so each test
// loads fresh copies.
async function setup() {
  vi.resetModules()
  const { usePrototypeCustomCloudStore } = await import('./customCloudStore')
  const { usePrototypePersonaStore } = await import('./personaStore')
  return {
    store: usePrototypeCustomCloudStore(),
    personas: usePrototypePersonaStore()
  }
}

const ACME = 'dep-acme-studio'
const COKE = 'proj-cocacola'

describe('editing a deployment', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('opens the build summary with the deployment’s own settings', async () => {
    const { store } = await setup()
    store.openEditDeployment(ACME, COKE)
    expect(store.editStep).toBe('config')
    expect(store.editingChangeCount).toBe(0)
    expect(store.newDeploymentName).toBe('Acme Studio pipeline')
    expect(store.editingNodePacks).toEqual([
      'comfyui-rmbg',
      'acme-matte-tools',
      'impact-pack'
    ])
    expect(store.editingProjects.map((p) => p.id)).toEqual([COKE])
  })

  it('updates every project on it with the edits as the next release', async () => {
    const { store, personas } = await setup()
    store.openEditDeployment(ACME, COKE)
    store.editingNodePacks = ['comfyui-rmbg', 'acme-matte-tools']
    store.editingModels = [...store.editingModels, 'z-image']
    store.editingComfyVersion = 'v0.38.4'
    store.editingGpu = PLATFORM_GPUS[1]
    store.reviewEdit()
    expect(store.editStep).toBe('impact')
    expect(store.editingChangeCount).toBe(4)
    expect(store.editingChanges.removedPacks).toEqual(['impact-pack'])
    expect(store.editingChanges.addedModels).toEqual(['z-image'])

    store.confirmUpdate()
    const acme = personas.fixture.deployments?.find((d) => d.id === ACME)
    expect(acme).toMatchObject({
      release: 'v4',
      status: 'building',
      gpu: PLATFORM_GPUS[1].label,
      comfyVersion: 'v0.38.4',
      nodePacks: ['comfyui-rmbg', 'acme-matte-tools']
    })
    expect(store.dialogStep).toBe('building')

    vi.advanceTimersByTime(DEMO_BUILD_MS + 500)
    expect(
      personas.fixture.deployments?.find((d) => d.id === ACME)?.status
    ).toBe('ready')
    expect(store.dialogStep).toBeNull()
    expect(store.editingDeployment).toBeUndefined()
  })

  it('forks a new deployment for this project only', async () => {
    const { store, personas } = await setup()
    store.openEditDeployment(ACME, COKE)
    store.editingModels = [...store.editingModels, 'z-image']
    store.reviewEdit()
    store.forkDeployment()

    const coke = personas.fixture.projects.find((p) => p.id === COKE)
    const forked = personas.fixture.deployments?.find(
      (d) => d.id === coke?.deploymentId
    )
    expect(forked).toMatchObject({
      name: 'Acme Studio pipeline 2',
      release: 'v1',
      status: 'building',
      models: ['flux1-dev-fp8', 'acme_hero_lora_v5', 'sdxl', 'z-image']
    })
    expect(
      personas.fixture.deployments?.find((d) => d.id === ACME)
    ).toMatchObject({ release: 'v3', status: 'ready' })
    expect(store.dialogStep).toBe('building')
  })

  it('review needs a change; cancel leaves the deployment and closes the dialog', async () => {
    const { store, personas } = await setup()
    store.openEditDeployment(ACME, COKE)
    store.reviewEdit()
    expect(store.editStep).toBe('config')
    store.cancelEdit()
    expect(store.editStep).toBeNull()
    expect(
      personas.fixture.deployments?.find((d) => d.id === ACME)?.release
    ).toBe('v3')
  })

  it('switching to Comfy Cloud moves the project off the deployment and closes', async () => {
    const { store, personas } = await setup()
    store.openEditDeployment(ACME, COKE)
    store.moveEditingProjectToCloud()
    expect(
      personas.fixture.projects.find((p) => p.id === COKE)?.deploymentId
    ).toBeUndefined()
    expect(store.editStep).toBeNull()
    expect(
      personas.fixture.deployments?.find((d) => d.id === ACME)
    ).toMatchObject({ release: 'v3', status: 'ready' })
  })
})
