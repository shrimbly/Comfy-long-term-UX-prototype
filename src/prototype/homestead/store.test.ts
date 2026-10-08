import { getActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildPrompt,
  compatibility,
  environments,
  projectScan,
  seedWorkflows
} from './model'
import { useHomesteadStore } from './store'

describe('Homestead prototype safeguards', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    window.history.replaceState({}, '', '/prototype/homestead')
  })

  it('shows an out-of-memory handoff when Desktop Run fails, including repeat attempts', () => {
    const s = useHomesteadStore()
    s.openWorkflow('matte', 'desktop')
    s.active.prompt = 'Keep this edit'
    expect(s.run()).toBe(false)
    expect(s.dialog).toBe('outOfMemory')
    expect(s.oom).toBe(true)
    expect(s.jobs).toHaveLength(0)
    s.dialog = null
    s.run()
    expect(s.dialog).toBe('outOfMemory')
    expect(s.active.prompt).toBe('Keep this edit')
    expect(s.entry).toBe('desktop')
  })
  it('distinguishes unknown metadata from matched and missing dependencies', () => {
    const matte = seedWorkflows()[1]
    expect(compatibility(matte, environments[0]).status).toBe('compatible')
    expect(compatibility(matte, environments[1]).missing).toContain(
      'Impact Pack 8.8'
    )
    expect(compatibility(matte, environments[2]).status).toBe('unknown')
  })
  it('preserves edits through sleep/wake and does not interrupt running jobs', () => {
    const s = useHomesteadStore()
    s.openWorkflow('product')
    vi.advanceTimersByTime(1800)
    s.active.prompt = 'An edited prompt'
    s.run()
    expect(s.sleep()).toBe(false)
    vi.advanceTimersByTime(8200)
    expect(s.sleep()).toBe(true)
    s.run()
    expect(s.runtime).toBe('starting')
    vi.advanceTimersByTime(1800)
    expect(s.active.prompt).toBe('An edited prompt')
    expect(s.jobs).toHaveLength(2)
  })
  it('reopens saved work and environment association after a browser reload', () => {
    const s = useHomesteadStore()
    s.active.prompt = 'Saved revision'
    s.switchEnvironment('fast')
    expect(s.save()).toBe(true)
    s.active.prompt = 'Unsaved revision'
    s.$dispose()
    delete getActivePinia()!.state.value[s.$id]
    const restored = useHomesteadStore()
    expect(restored.active.prompt).toBe('Saved revision')
    expect(restored.environment.id).toBe('fast')
  })
  it.for(['build', 'deployment'] as const)(
    'preserves the working environment after a %s failure and successful retry',
    (failure) => {
      const s = useHomesteadStore()
      s.failure = failure
      s.startBuild('agent')
      vi.advanceTimersByTime(5000)
      expect(s.build.phase).toBe('failed')
      expect(s.environment.revision).toBe('v12')
      s.failure = 'none'
      s.startBuild('agent')
      vi.advanceTimersByTime(5000)
      expect(s.build.phase).toBe('ready')
      expect(s.environment.revision).toBe('v12')
      s.openBuilt()
      expect(s.environment.revision).toBe('v13')
    }
  )
  it('keeps active jobs on their original build during explicit switching', () => {
    const s = useHomesteadStore()
    s.openWorkflow('product')
    vi.advanceTimersByTime(1800)
    s.run()
    s.switchEnvironment('fast')
    expect(s.jobs[0]?.revision).toBe('v12')
    vi.advanceTimersByTime(8200)
    expect(s.jobs[0]?.status).toBe('completed')
  })
  it('requires project-wide confirmation and blocks incompatible workflows', () => {
    const s = useHomesteadStore()
    s.setVersion(3)
    s.switchEnvironment('fast')
    expect(s.projectEnvironmentId).toBe('studio')
    expect(
      projectScan(s.workflows, environments[1]).filter(
        (w) => w.status === 'incompatible'
      )
    ).toHaveLength(2)
    s.switchEnvironment('fast', true)
    s.openWorkflow('matte')
    vi.advanceTimersByTime(1800)
    s.run()
    expect(s.jobs).toHaveLength(0)
    expect(s.workflows).toHaveLength(3)
    s.openWorkflow('product')
    expect(s.environment.id).toBe('fast')
  })
  it.for(['outsider', 'signedout'] as const)(
    'blocks canvas startup and execution for %s',
    (role) => {
      const s = useHomesteadStore()
      s.access = role
      s.openWorkflow('product')
      s.run()
      vi.advanceTimersByTime(5000)
      expect(s.jobs).toHaveLength(0)
      expect(s.runtime).toBe('sleeping')
    }
  )
  it('lets a workspace member run but not create builds', () => {
    const s = useHomesteadStore()
    s.access = 'member'
    s.startBuild('manager')
    expect(s.build.phase).toBe('idle')
    s.openWorkflow('product')
    vi.advanceTimersByTime(1800)
    s.run()
    expect(s.jobs).toHaveLength(1)
  })
  it('automatically sleeps an open idle canvas and resets demo data safely', () => {
    const s = useHomesteadStore()
    s.openWorkflow('product')
    vi.advanceTimersByTime(181800)
    expect(s.runtime).toBe('sleeping')
    s.active.prompt = 'Changed'
    s.reset()
    expect(s.active.prompt).toBe(seedWorkflows()[0].prompt)
  })
  it('prepares repeated updates without mutating a previously selected build', () => {
    const s = useHomesteadStore()
    s.startBuild('agent')
    vi.advanceTimersByTime(5000)
    s.openBuilt()
    expect(s.environment.revision).toBe('v13')
    s.selectedPacks = ['Studio Matte Tools 0.3']
    s.startBuild('manager')
    vi.advanceTimersByTime(5000)
    expect(s.environment.revision).toBe('v13')
    expect(s.environment.packs).not.toContain('Studio Matte Tools 0.3')
    expect(s.updateEnvironment?.revision).toBe('v14')
    s.openBuilt()
    expect(s.environment.revision).toBe('v14')
  })
  it('editing another deployment does not switch the working workflow', () => {
    const s = useHomesteadStore()
    s.editBuildFor('fast')
    expect(s.environment.id).toBe('studio')
    expect(s.buildEnvironment.id).toBe('fast')
  })
  it('requests a local workflow location instead of inventing a filesystem path', () => {
    const prompt = buildPrompt(seedWorkflows()[0], 'build', 1)
    expect(prompt).toContain('Ask me to locate the workflow file')
    expect(prompt).toContain('no local path is known')
    expect(prompt).toContain('only after deployment readiness is confirmed')
  })
})
