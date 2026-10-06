import { beforeEach, describe, expect, it } from 'vitest'
import { toRaw } from 'vue'
import { usePrototypeEnvironmentStore } from './environmentStore'
import { usePrototypePersonaStore } from './personaStore'

beforeEach(() => {
  const personas = usePrototypePersonaStore()
  const fixture = personas.fixture
  const snapshot = structuredClone(toRaw(fixture))
  return () => Object.assign(fixture, snapshot)
})

describe('workspace environments', () => {
  it('creates a deployment from a build and keeps it in its workspace', () => {
    const store = usePrototypeEnvironmentStore()
    const personas = usePrototypePersonaStore()
    expect(
      store.create(' Product photos ', 'RTX 4090', 'dep-matte-tests')
    ).toBe(true)
    expect(
      store.deployments.find((item) => item.name === 'Product photos')
    ).toMatchObject({
      status: 'asleep',
      release: 'v7',
      gpu: 'RTX 4090',
      nodePacks: ['comfyui-rmbg']
    })
    personas.setCurrentWorkspace('ws-personal')
    expect(store.deployments).toEqual([])
    expect(store.update('dep-matte-tests', 'Another workspace', 5)).toBe(false)
    expect(store.create('Private render', 'RTX 5090', 'dep-comfy-cloud')).toBe(
      true
    )
    expect(store.deployments.map((item) => item.name)).toEqual([
      'Private render'
    ])
  })

  it('updates deployment settings without changing its build or project links', () => {
    const store = usePrototypeEnvironmentStore()
    const personas = usePrototypePersonaStore()
    const linked = personas.fixture.projects
      .filter((project) => project.deploymentId === 'dep-matte-tests')
      .map((project) => project.id)
    expect(store.update('dep-matte-tests', 'Matte production', 5)).toBe(true)
    expect(
      store.deployments.find((item) => item.id === 'dep-matte-tests')
    ).toMatchObject({ name: 'Matte production', warmMinutes: 5, release: 'v7' })
    expect(
      personas.fixture.projects
        .filter((project) => project.deploymentId === 'dep-matte-tests')
        .map((project) => project.id)
    ).toEqual(linked)
  })

  it('prevents members from changing deployments', () => {
    const personas = usePrototypePersonaStore()
    personas.currentWorkspace!.currentUserRole = 'member'
    const store = usePrototypeEnvironmentStore()
    expect(store.create('Not allowed', 'RTX 4090', 'dep-comfy-cloud')).toBe(
      false
    )
    expect(store.update('dep-matte-tests', 'Not allowed', 2)).toBe(false)
  })

  it.for([-1, 0.5, 61])(
    'rejects an invalid keep-warm value of %s',
    (warmMinutes) => {
      const store = usePrototypeEnvironmentStore()
      expect(store.update('dep-matte-tests', 'Matte tests', warmMinutes)).toBe(
        false
      )
    }
  )
})
