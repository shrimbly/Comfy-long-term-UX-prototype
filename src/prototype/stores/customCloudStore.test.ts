import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEMO_BUILD_MS } from '../fixtures/customCloud'
import { NEW_BUILD_TARGET, RELOAD_MS } from './customCloudStore'
import { HOME_TAB_ID } from './tabsStore'

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
  store.openWorkflow(projectId, { id: 'wf-new', name: 'Untitled workflow' })
  vi.advanceTimersByTime(RELOAD_MS)
}

describe('customCloudStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('switches project after the reload into its drafts, and remembers each project’s tabs', async () => {
    const { store, tabs } = await setup()
    openWorkflowIn(store, 'proj-marketing')
    expect(store.currentProject?.id).toBe('proj-marketing')
    expect(tabs.openTabs.map((t) => t.label)).toEqual(['Untitled workflow'])

    tabs.select(HOME_TAB_ID)
    store.switchProject('proj-cocacola')
    expect(store.reloadingToId).toBe('proj-cocacola')
    expect(store.currentProject?.id).toBe('proj-marketing')
    vi.advanceTimersByTime(RELOAD_MS)
    expect(store.reloadingToId).toBeNull()
    expect(tabs.openTabs.map((t) => t.label)).toEqual([
      'Coke can hero — bokeh test',
      'Product hero',
      'Coke can — top-down angle',
      'Coke can — retired variant'
    ])
    expect(tabs.activeTabId).toBe(tabs.openTabs[0].id)

    store.switchProject('proj-marketing')
    vi.advanceTimersByTime(RELOAD_MS)
    expect(tabs.openTabs.map((t) => t.label)).toEqual(['Untitled workflow'])
    expect(tabs.activeTabId).toBe(tabs.openTabs[0].id)
  })

  it('opens a blank workflow in a project with no drafts', async () => {
    const { store, tabs } = await setup()
    store.switchProject('proj-brand')
    vi.advanceTimersByTime(RELOAD_MS)
    expect(tabs.openTabs.map((t) => t.kind)).toEqual(['workflow'])
    expect(tabs.activeTabId).toBe(tabs.openTabs[0].id)
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

  it('opens the dialog instead of running while nodes are missing', async () => {
    const { store } = await setup()
    openWorkflowIn(store, 'proj-marketing')
    store.dropIncompatibleWorkflow()
    store.dialogStep = null

    store.requestRun()

    expect(store.runRequested).toBe(false)
    expect(store.dialogStep).toBe('choose')
  })

  it('asks the editor to run once the project runs the workflow', async () => {
    const { store } = await setup()
    openWorkflowIn(store, 'proj-cocacola')
    store.dropIncompatibleWorkflow()

    store.requestRun()

    expect(store.runRequested).toBe(true)
    expect(store.dialogStep).toBeNull()
  })
})
