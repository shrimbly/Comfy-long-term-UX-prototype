import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEMO_BUILD_MS, PLATFORM_GPUS } from '../fixtures/customCloud'
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

  it('switches between projects on the same deployment without a reload', async () => {
    const { store, tabs } = await setup()
    openWorkflowIn(store, 'proj-marketing')
    store.switchProject('proj-brand')
    expect(store.reloadingToId).toBeNull()
    expect(store.currentProject?.id).toBe('proj-brand')
    expect(tabs.openTabs.map((t) => t.kind)).toEqual(['workflow'])
  })

  it('opens a blank workflow in a project with no drafts', async () => {
    const { store, tabs } = await setup()
    store.switchProject('proj-brand')
    vi.advanceTimersByTime(RELOAD_MS)
    expect(tabs.openTabs.map((t) => t.kind)).toEqual(['workflow'])
    expect(tabs.activeTabId).toBe(tabs.openTabs[0].id)
  })

  it('ranks the current project first in Recent, then the ones switched away from', async () => {
    const { store } = await setup()
    const startId = store.currentProject?.id
    openWorkflowIn(store, 'proj-marketing')
    openWorkflowIn(store, 'proj-cocacola')
    expect(store.recentProjectIds).toEqual([
      'proj-cocacola',
      'proj-marketing',
      startId
    ])
  })

  it('opens the run-target dialog for matte_pass on Comfy Cloud, preselecting the deployment that runs it', async () => {
    const { store } = await setup()
    openWorkflowIn(store, 'proj-marketing')
    store.dropIncompatibleWorkflow()

    expect(store.showsMissingNodes).toBe(true)
    expect(store.dialogStep).toBe('choose')
    expect(store.chooseMode).toBe('existing')
    expect(store.deploymentTarget).toBe('dep-acme-studio')
    expect(store.deploymentTargets[0]).toMatchObject({
      deployment: { id: 'dep-acme-studio' },
      runs: true
    })
    expect(store.projectTargets[0]).toMatchObject({
      project: { id: 'proj-cocacola' },
      runs: true
    })
  })

  it.for([
    { from: 'proj-marketing', mode: 'new' },
    { from: 'proj-personal-rnd', mode: 'update' }
  ])(
    'offers $mode when nothing runs matte_pass, from $from',
    async ({ from, mode }) => {
      const { store } = await setup()
      openWorkflowIn(store, from)
      store.dropIncompatibleWorkflow({ nothingRuns: true })

      expect(store.chooseMode).toBe(mode)
      expect(store.deploymentTarget).toBe(NEW_BUILD_TARGET)
      expect(store.projectTargets.some((target) => target.runs)).toBe(false)
    }
  )

  it('creates a project on the deployment that runs matte_pass, with no build', async () => {
    const { store } = await setup()
    openWorkflowIn(store, 'proj-marketing')
    store.dropIncompatibleWorkflow()
    store.newProjectName = 'Matte finals'
    store.newProjectTier = 'restricted'
    store.newProjectCollaborators = ['user-alex']
    store.createProjectOn(store.deploymentTarget)
    vi.advanceTimersByTime(RELOAD_MS)

    expect(store.currentProject).toMatchObject({
      name: 'Matte finals',
      tier: 'restricted'
    })
    expect(store.currentProject?.members?.map((m) => m.userId)).toContain(
      'user-alex'
    )
    expect(store.currentDeployment.id).toBe('dep-acme-studio')
    expect(store.showsMissingNodes).toBe(false)
  })

  it('runs matte_pass without a dialog where the deployment already has it', async () => {
    const { store } = await setup()
    openWorkflowIn(store, 'proj-cocacola')
    store.dropIncompatibleWorkflow()

    expect(store.showsMissingNodes).toBe(false)
    expect(store.dialogStep).toBeNull()
  })

  it('builds a deployment in the background, then names its project and opens it with the missing nodes gone', async () => {
    const { store } = await setup()
    openWorkflowIn(store, 'proj-marketing')
    store.dropIncompatibleWorkflow()
    store.deploymentTarget = NEW_BUILD_TARGET
    store.newDeploymentName = 'Matte R&D'
    store.buildAndDeploy(PLATFORM_GPUS[0])

    expect(store.dialogStep).toBe('building')
    expect(store.currentProject?.id).toBe('proj-marketing')
    expect(store.buildingDeployment).toMatchObject({
      name: 'Matte R&D',
      gpu: 'RTX PRO 6000'
    })
    expect(store.progress?.stages.map((s) => s.state)).toEqual([
      'active',
      'pending',
      'pending',
      'pending',
      'pending',
      'pending'
    ])

    store.dialogStep = null
    vi.advanceTimersByTime(DEMO_BUILD_MS + 400)
    expect(store.buildingDeployment).toBeUndefined()
    expect(store.dialogStep).toBe('project')
    expect(store.newProjectName).toBe('Matte R&D')
    expect(store.currentProject?.id).toBe('proj-marketing')

    store.createProjectOn(store.deploymentTarget)
    vi.advanceTimersByTime(RELOAD_MS)
    expect(store.currentProject?.name).toBe('Matte R&D')
    expect(store.currentDeployment.status).toBe('ready')
    expect(store.showsMissingNodes).toBe(false)
    expect(store.readyProjectId).toBe(store.currentProject?.id)
  })

  it('waits on the coding agent out of sight, then asks for a project on its new deployment', async () => {
    const { store } = await setup()
    openWorkflowIn(store, 'proj-marketing')
    store.dropIncompatibleWorkflow({ nothingRuns: true })
    store.handOffToAgent()
    store.dialogStep = null

    vi.advanceTimersByTime(DEMO_BUILD_MS - 1)
    expect(store.dialogStep).toBeNull()
    expect(store.buildingDeployment).toBeUndefined()

    vi.advanceTimersByTime(1)
    expect(store.agentWorking).toBe(false)
    expect(store.dialogStep).toBe('agent-done')
    const built = store.deploymentTargets.find(
      (target) => target.deployment.id === store.deploymentTarget
    )
    expect(built).toMatchObject({
      runs: true,
      deployment: { name: 'Matte R&D', status: 'ready' }
    })

    store.createProjectOn(store.deploymentTarget)
    vi.advanceTimersByTime(RELOAD_MS)
    expect(store.currentProject?.name).toBe('Matte R&D')
    expect(store.showsMissingNodes).toBe(false)
  })

  it('takes the next release of the project’s deployment from the coding agent, then runs the workflow there', async () => {
    const { store } = await setup()
    openWorkflowIn(store, 'proj-personal-rnd')
    store.dropIncompatibleWorkflow({ nothingRuns: true })
    expect(store.chooseMode).toBe('update')
    store.handOffToAgent()
    store.dialogStep = null

    store.finishAgentBuild()

    expect(store.dialogStep).toBeNull()
    expect(store.currentDeployment).toMatchObject({
      name: 'Matte tests',
      release: 'v8'
    })
    expect(store.showsMissingNodes).toBe(false)
    expect(store.readyProjectId).toBe('proj-personal-rnd')
  })

  it('drops the agent hand-off when the deployment is built here instead', async () => {
    const { store } = await setup()
    openWorkflowIn(store, 'proj-marketing')
    store.dropIncompatibleWorkflow({ nothingRuns: true })
    store.handOffToAgent()

    store.buildAndDeploy(PLATFORM_GPUS[0])
    vi.advanceTimersByTime(DEMO_BUILD_MS + 400)

    expect(store.agentWorking).toBe(false)
    expect(store.dialogStep).toBe('project')
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
  it('keeps project tabs when switching workspaces and cancels a pending project reload', async () => {
    const { store, personas, tabs, ui } = await setup()
    tabs.openWorkflow('Keep my workflow')
    const workspaceId = personas.fixture.currentWorkspaceId
    store.switchProject('proj-marketing')
    store.switchWorkspace('ws-personal')
    vi.advanceTimersByTime(RELOAD_MS)
    expect(personas.fixture.currentWorkspaceId).toBe('ws-personal')
    expect(store.reloadingToId).toBeNull()
    expect(tabs.openTabs).toEqual([])
    expect(ui.activeView.kind).toBe('home')
    store.switchWorkspace(workspaceId)
    expect(tabs.openTabs.map((tab) => tab.label)).toEqual(['Keep my workflow'])
    expect(tabs.activeTabId).toBe('home')
  })
})
