import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEMO_BUILD_MS } from '../fixtures/customCloud'
import { COLD_START_MS, NEW_BUILD_TARGET, RELOAD_MS } from './customCloudStore'

// The persona fixtures are module state the store mutates, so each test
// loads fresh copies.
async function setup() {
  vi.resetModules()
  setActivePinia(createPinia())
  const { usePrototypeCustomCloudStore } = await import('./customCloudStore')
  const { usePrototypePersonaStore } = await import('./personaStore')
  const { usePrototypeTabsStore } = await import('./tabsStore')
  const { usePrototypeUiStore } = await import('./uiStore')
  return {
    store: usePrototypeCustomCloudStore(),
    personas: usePrototypePersonaStore(),
    tabs: usePrototypeTabsStore(),
    ui: usePrototypeUiStore()
  }
}

type Store = Awaited<ReturnType<typeof setup>>['store']

function openWorkflowIn(store: Store, projectId: string) {
  store.openWorkflow(projectId, 'Untitled workflow')
  vi.advanceTimersByTime(RELOAD_MS)
}

describe('customCloudStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('switches project after the reload, lands on Home and remembers each project’s tabs', async () => {
    const { store, tabs, ui } = await setup()
    openWorkflowIn(store, 'proj-marketing')
    expect(store.currentProject?.id).toBe('proj-marketing')
    expect(tabs.openTabs.map((t) => t.label)).toEqual(['Untitled workflow'])

    ui.go({ kind: 'project', projectId: 'proj-marketing' })
    store.switchProject('proj-cocacola')
    expect(store.reloadingToId).toBe('proj-cocacola')
    expect(store.currentProject?.id).toBe('proj-marketing')
    vi.advanceTimersByTime(RELOAD_MS)
    expect(store.reloadingToId).toBeNull()
    expect(ui.activeView.kind).toBe('home')
    expect(tabs.openTabs).toEqual([])

    store.switchProject('proj-marketing')
    vi.advanceTimersByTime(RELOAD_MS)
    expect(tabs.openTabs.map((t) => t.label)).toEqual(['Untitled workflow'])
  })

  it('opens the run-target dialog for matte_pass on Comfy Cloud, preselecting the project that runs it', async () => {
    const { store } = await setup()
    openWorkflowIn(store, 'proj-marketing')
    store.dropIncompatibleWorkflow()

    expect(store.showsMissingNodes).toBe(true)
    expect(store.dialogStep).toBe('choose')
    expect(store.runTarget).toBe('proj-cocacola')
    expect(store.runTargets[0]).toMatchObject({
      project: { id: 'proj-cocacola' },
      runs: true
    })
  })

  it('runs matte_pass without a dialog where the deployment already has it', async () => {
    const { store } = await setup()
    openWorkflowIn(store, 'proj-cocacola')
    store.dropIncompatibleWorkflow()

    expect(store.showsMissingNodes).toBe(false)
    expect(store.dialogStep).toBeNull()
  })

  it('builds a new project, locks it until the fast build finishes, then clears the missing nodes', async () => {
    const { store, personas } = await setup()
    openWorkflowIn(store, 'proj-marketing')
    store.dropIncompatibleWorkflow()
    store.runTarget = NEW_BUILD_TARGET
    store.newProjectName = 'Matte R&D'
    store.buildAndDeploy()
    vi.advanceTimersByTime(RELOAD_MS)

    const project = store.currentProject
    expect(project?.name).toBe('Matte R&D')
    expect(personas.visibleProjects.some((p) => p.id === project?.id)).toBe(
      true
    )
    expect(store.isLocked).toBe(true)
    expect(store.showsMissingNodes).toBe(true)
    expect(store.progress?.stages.map((s) => s.state)).toEqual([
      'done',
      'active',
      'pending',
      'pending',
      'pending',
      'pending'
    ])

    vi.advanceTimersByTime(DEMO_BUILD_MS / 2)
    expect(store.isLocked).toBe(true)
    expect(store.progress?.done).toBe(false)

    vi.advanceTimersByTime(DEMO_BUILD_MS / 2 + 400)
    expect(store.isLocked).toBe(false)
    expect(store.currentDeployment.status).toBe('ready')
    expect(store.showsMissingNodes).toBe(false)
    expect(store.readyProjectId).toBe(project?.id)
  })

  it('shows the cold-start note on the first run of a custom deployment', async () => {
    const { store } = await setup()
    openWorkflowIn(store, 'proj-personal-rnd')
    expect(store.currentDeployment.status).toBe('asleep')

    store.run()
    expect(store.runState).toBe('starting')
    vi.advanceTimersByTime(COLD_START_MS)
    expect(store.runState).toBe('running')
  })

  it('reopens the dialog instead of running while nodes are missing', async () => {
    const { store } = await setup()
    openWorkflowIn(store, 'proj-marketing')
    store.dropIncompatibleWorkflow()
    store.dialogStep = null

    store.run()

    expect(store.runState).toBe('idle')
    expect(store.dialogStep).toBe('choose')
  })
})
