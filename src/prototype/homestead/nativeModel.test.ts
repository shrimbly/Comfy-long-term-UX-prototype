import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminFixture } from '../fixtures/admin'
import { compatibility } from './model'
import { nativeDeployment, nativeFixtures } from './nativeModel'
import { useHomesteadStore } from './store'

describe('Homestead on repository fixtures', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    window.history.replaceState({}, '', '/prototype/homestead')
  })

  it('uses the original workflow identities and scopes environments to the current workspace', () => {
    const { workflows, environments } = nativeFixtures(adminFixture)
    const original = adminFixture.workflows.find((w) =>
      workflows.some((mapped) => mapped.id === w.id)
    )!
    expect(workflows.find((w) => w.id === original.id)).toMatchObject({
      name: original.name,
      image: original.thumbnailUrl ?? '',
      projectId: original.projectId
    })
    const workspace = { ...adminFixture, currentWorkspaceId: 'ws-personal' }
    expect(nativeFixtures(workspace).environments.map((e) => e.id)).toEqual([
      'dep-comfy-cloud'
    ])
    expect(
      environments.find((e) => e.id === 'dep-acme-studio')?.packs
    ).toContain('acme-matte-tools')
  })

  it('resolves matte_pass against actual node pack and model identifiers', () => {
    const { workflows, environments } = nativeFixtures(adminFixture)
    const matte = workflows.find((w) => w.id === 'matte')!
    expect(
      compatibility(
        matte,
        environments.find((e) => e.id === 'dep-acme-studio')!
      ).status
    ).toBe('compatible')
    expect(compatibility(matte, environments[0]).status).toBe('incompatible')
  })

  it('builds a separate revision usable by the real editor and keeps the old deployment selected', () => {
    const s = useHomesteadStore()
    const fixtures = nativeFixtures(adminFixture)
    s.workflows = fixtures.workflows
    s.availableEnvironments = fixtures.environments
    s.activeId = 'matte'
    const previous = s.environment.id
    s.startBuild('agent')
    vi.advanceTimersByTime(5000)
    expect(s.environment.id).toBe(previous)
    expect(s.updateEnvironment).toBeDefined()
    const deployment = nativeDeployment(s.updateEnvironment!)
    expect(deployment.nodePacks).toContain('acme-matte-tools')
    expect(deployment.models).toContain('acme_hero_lora_v5')
    s.openBuilt()
    expect(s.environment.id).toBe(deployment.id)
    expect(s.compatible.status).toBe('compatible')
    expect(s.openRequest).toBe(1)
  })

  it('scans only the current project and records its confirmed environment', () => {
    const s = useHomesteadStore()
    const fixtures = nativeFixtures(adminFixture)
    s.workflows = fixtures.workflows
    s.availableEnvironments = fixtures.environments
    s.projectId = 'proj-drafts'
    s.setVersion(3)
    expect(s.projectWorkflows.every((w) => w.projectId === 'proj-drafts')).toBe(
      true
    )
    expect(s.projectWorkflows.length).toBeGreaterThan(1)
    s.switchEnvironment('dep-acme-studio')
    expect(s.projectEnvironments['proj-drafts']).toBeUndefined()
    s.switchEnvironment('dep-acme-studio', true)
    expect(s.projectEnvironments['proj-drafts']).toBe('dep-acme-studio')
  })
})
