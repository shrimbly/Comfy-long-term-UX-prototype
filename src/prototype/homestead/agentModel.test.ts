import { getActivePinia } from 'pinia'
import { toRaw } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { latestBuilds } from './agentModel'
import { useHomesteadStore } from './store'

function setup() {
  const s = useHomesteadStore()
  s.entry = 'desktop'
  s.activeId = 'matte'
  return s
}

describe('Desktop build request and agent simulation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    window.history.replaceState({}, '', '/prototype/homestead?v=1')
  })

  it('captures edited inputs and publishes a URL only after all readiness checks', () => {
    const s = setup()
    s.startBuild('agent', {
      mode: 'create',
      name: 'Matte production',
      gpu: 'H100 SXM',
      instructions: 'Keep my model versions.'
    })
    expect(s.dialog).toBeNull()
    expect(s.agentOpen).toBe(true)
    expect(s.agentRun?.prompt).toContain('Matte production')
    expect(s.agentRun?.prompt).toContain('Keep my model versions.')
    expect(s.agentRun?.prompt).toContain('H100 SXM')
    expect(s.agentUrl).toBeNull()
    s.activeId = 'product'
    s.active.models = ['Changed after submission']
    vi.advanceTimersByTime(16000)
    expect(s.agentStep).toBe(8)
    expect(s.agentUrl).toBeNull()
    vi.advanceTimersByTime(2000)
    expect(s.updateEnvironment).toMatchObject({
      name: 'Matte production',
      gpu: 'H100 SXM',
      revision: 'v1',
      verified: true
    })
    expect(s.updateEnvironment?.models).not.toContain(
      'Changed after submission'
    )
    expect(s.agentUrl).toContain('deployment=build-')
    expect(s.agentUrl).toContain('workflow=matte')
    expect(s.entry).toBe('desktop')
    s.openBuilt()
    expect(s.activeId).toBe('matte')
    expect(s.environment.name).toBe('Matte production')
  })

  it('updates the selected build as a new revision without mutating or switching the working build', () => {
    const s = setup()
    const original = structuredClone(toRaw(s.availableEnvironments))
    s.startBuild('agent', {
      mode: 'update',
      sourceId: 'fast',
      name: 'Updated preview',
      gpu: 'B200',
      instructions: ''
    })
    vi.advanceTimersByTime(18000)
    expect(s.availableEnvironments.slice(0, 3)).toEqual(original)
    expect(s.environment.id).toBe('studio')
    expect(s.updateEnvironment).toMatchObject({
      name: 'Updated preview',
      revision: 'v5',
      buildId: 'fast',
      gpu: 'B200'
    })
    expect(
      latestBuilds(s.availableEnvironments).filter(
        (e) => (e.buildId ?? e.id) === 'fast'
      )
    ).toHaveLength(1)
  })

  it.for(['build', 'deployment'] as const)(
    'keeps the link hidden on %s failure and retries the submitted workflow',
    (failure) => {
      const s = setup()
      s.failure = failure
      s.startBuild('agent', {
        mode: 'update',
        sourceId: 'fast',
        name: 'Retry build',
        gpu: 'H100 SXM',
        instructions: 'Keep local versions'
      })
      vi.advanceTimersByTime(18000)
      expect(s.build.phase).toBe('failed')
      expect(s.agentUrl).toBeNull()
      expect(s.availableEnvironments).toHaveLength(3)
      s.activeId = 'product'
      s.retryBuild()
      expect(s.agentRun?.workflow.id).toBe('matte')
      vi.advanceTimersByTime(18000)
      expect(s.build.phase).toBe('ready')
      expect(s.updateEnvironment?.name).toBe('Retry build')
    }
  )

  it('opens a copied local URL in a fresh prototype session', () => {
    const s = setup()
    s.startBuild('agent', {
      mode: 'create',
      name: 'Linked build',
      gpu: 'H200 SXM',
      instructions: ''
    })
    vi.advanceTimersByTime(18000)
    const url = s.agentUrl!
    window.history.replaceState({}, '', url)
    s.$dispose()
    delete getActivePinia()!.state.value[s.$id]
    const restored = useHomesteadStore()
    restored.restoreDeploymentLink()
    expect(restored.activeId).toBe('matte')
    expect(restored.environment.name).toBe('Linked build')
    expect(restored.entry).toBe('cloud')
    expect(restored.openRequest).toBe(1)
  })

  it('rejects invalid or unauthorized requests and prevents duplicate submissions', () => {
    const s = setup()
    const create = {
      mode: 'create' as const,
      name: '',
      gpu: 'H100 SXM',
      instructions: ''
    }
    s.startBuild('agent', create)
    expect(s.build.phase).toBe('idle')
    s.startBuild('agent', {
      ...create,
      mode: 'update',
      sourceId: 'missing',
      name: 'Valid'
    })
    expect(s.build.phase).toBe('idle')
    s.access = 'member'
    s.startBuild('agent', { ...create, name: 'Valid' })
    expect(s.build.phase).toBe('idle')
    s.access = 'admin'
    s.startBuild('agent', { ...create, name: 'First request' })
    s.startBuild('agent', { ...create, name: 'Duplicate request' })
    vi.advanceTimersByTime(18000)
    expect(s.updateEnvironment?.name).toBe('First request')
    expect(s.availableEnvironments).toHaveLength(4)
  })
})
