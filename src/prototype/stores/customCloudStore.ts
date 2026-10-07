// Implements:
//   concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
//   decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
//   decision: ../IA_Plan/wiki/decisions/project-switcher-in-tab-bar.md
//   decision: ../IA_Plan/wiki/decisions/build-locks-project-until-ready.md
//   decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
//   flow:     ../prototype/flows/07-custom-cloud-happy-path.md
//
// Drives the Custom Comfy Cloud demo: which project the tab strip belongs
// to, the reload when it switches, the "choose where it runs" dialog for
// the incompatible matte_pass workflow (where it runs, the build summary,
// the deploy settings), the fast demo build that locks the new project,
// and the hand-off to the user's own coding agent. Runs go through the real
// editor's queue; the in-browser backend reports the run state, including
// the cold start.

import { useIntervalFn, useTimeoutFn } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'

import {
  BUILD_PROJECT_COLOR,
  COMFY_CLOUD,
  DEFAULT_BUILD_PROJECT_NAME,
  DEFAULT_PACKS_BUILD_NAME,
  DEMO_BUILD_MS,
  MATTE_PASS,
  PLATFORM_GPUS,
  WARM_MINUTES
} from '../fixtures/customCloud'
import type { PlatformGpu, WorkflowNeeds } from '../fixtures/customCloud'
import { onMockRunStateChange } from '../mockBackend'
import type { MockRunState } from '../mockBackend'
import type {
  Deployment,
  PersonaFixture,
  Project,
  ProjectTier,
  Workflow
} from '../types'
import {
  buildProgress,
  missingFrom,
  nextRelease,
  resolveDeployment,
  runsWorkflow,
  simulatedSeconds
} from '../utils/deployment'
import { rankRecentProjectIds } from '../utils/projectSwitcher'
import { usePrototypePersonaStore } from './personaStore'
import { HOME_TAB_ID, usePrototypeTabsStore } from './tabsStore'
import { usePrototypeUiStore } from './uiStore'

type DialogStep =
  | 'choose'
  | 'project'
  | 'build'
  | 'agent'
  | 'agent-done'
  | 'deploy'
  | 'building'

// Where a new project runs: an existing deployment's id, or a new deployment.
export const NEW_BUILD_TARGET = 'new'

// Long enough for the loading screen's wave to rise through the logo.
export const RELOAD_MS = 2400

// The build keeps the fixture it started in, so it still finishes there if
// the presenter flips persona mid-build.
interface ActiveBuild {
  deploymentId: string
  startedAt: number
  fixture: PersonaFixture
  // A rebuild of an existing deployment ends quietly; a new one goes on to
  // name its project.
  rebuild: boolean
}

// The agent builds and deploys on the user's machine, out of Comfy Cloud's
// sight: no progress, no lock, no failures here. Only its finish arrives.
interface AgentHandoff {
  // The deployment it adds a release to, or null for a new deployment.
  updatesDeploymentId: string | null
  projectId: string | undefined
  name: string
  fixture: PersonaFixture
}

export const usePrototypeCustomCloudStore = defineStore(
  'prototype-custom-cloud',
  () => {
    const personaStore = usePrototypePersonaStore()
    const tabsStore = usePrototypeTabsStore()
    const uiStore = usePrototypeUiStore()

    const selectedProjectId = ref<string | null>(null)
    // Projects switched away from this session, newest first.
    const visitedProjectIds = ref<string[]>([])
    const reloadingToId = ref<string | null>(null)
    const switcherOpen = ref(false)
    const dialogStep = ref<DialogStep | null>(null)
    const deploymentTarget = ref<string>(NEW_BUILD_TARGET)
    // Presenter control: hide the deployments that run matte_pass, to show
    // the dialog for a workflow nothing runs yet.
    const nothingRunsIt = ref(false)
    // Packs picked in the Custom nodes modal of a Comfy Cloud project: the
    // dialog then builds a new deployment for them instead of matte_pass.
    const pickedPacks = ref<string[] | null>(null)
    const newProjectName = ref(DEFAULT_BUILD_PROJECT_NAME)
    const newProjectTier = ref<ProjectTier>('workspace-wide')
    const newProjectCollaborators = ref<string[]>([])
    const newDeploymentName = ref(DEFAULT_BUILD_PROJECT_NAME)
    // The deployment "Edit deployment" opened the build steps for.
    const editingDeploymentId = ref<string | null>(null)
    const build = shallowRef<ActiveBuild | null>(null)
    const agentHandoff = shallowRef<AgentHandoff | null>(null)
    // The deployment just built: its project, once named, opens with the
    // "ready" toast.
    const builtDeploymentId = ref<string | null>(null)
    const now = ref(Date.now())
    const readyProjectId = ref<string | null>(null)
    const runState = ref<MockRunState>('idle')
    // Set when something outside the editor (the ready toast) asks for a
    // run; the editor queues it once its graph is in sync.
    const runRequested = ref(false)
    // The real editor brings its own toast renderer once mounted.
    const editorMounted = ref(false)

    onMockRunStateChange((state) => {
      runState.value = state
    })

    const isEnabled = computed(() => personaStore.fixture.mode === 'cloud')
    const deployments = computed(() => personaStore.fixture.deployments ?? [])

    // The personal project (My Workflows) first, then every project the
    // viewer can open.
    const switchableProjects = computed(() => [
      ...(personaStore.draftsProject ? [personaStore.draftsProject] : []),
      ...personaStore.visibleProjects
    ])

    const currentProject = computed<Project | undefined>(
      () =>
        switchableProjects.value.find(
          (p) => p.id === selectedProjectId.value
        ) ?? switchableProjects.value[0]
    )

    // The switcher's Recent: the current project, the ones you switched
    // away from, then the projects of your latest workflow edits.
    const recentProjectIds = computed(() =>
      rankRecentProjectIds(
        [
          ...(currentProject.value ? [currentProject.value.id] : []),
          ...visitedProjectIds.value,
          ...personaStore.recentWorkflows.map(
            (w) => w.provenanceProjectId ?? w.projectId
          )
        ],
        switchableProjects.value.map((p) => p.id)
      )
    )

    function deploymentOf(projectId: string | undefined): Deployment {
      const project = personaStore.fixture.projects.find(
        (p) => p.id === projectId
      )
      return resolveDeployment(project, deployments.value)
    }

    const currentDeployment = computed(() =>
      deploymentOf(currentProject.value?.id)
    )

    const forPacks = computed(() => pickedPacks.value !== null)

    // What the dialog builds for: matte_pass, or the picked packs.
    const needs = computed<WorkflowNeeds>(() =>
      pickedPacks.value
        ? {
            name: currentProject.value?.name ?? '',
            nodePacks: pickedPacks.value,
            models: [],
            localOnlyModels: [],
            modelsGb: 0,
            readyMinutes: MATTE_PASS.readyMinutes
          }
        : MATTE_PASS
    )

    const activeTab = computed(() =>
      tabsStore.openTabs.find((t) => t.id === tabsStore.activeTabId)
    )
    const showsMissingNodes = computed(
      () =>
        activeTab.value?.workflowKey === 'matte_pass' &&
        !runsWorkflow(currentDeployment.value, MATTE_PASS)
    )

    function runsNeeds(deployment: Deployment) {
      return !nothingRunsIt.value && runsWorkflow(deployment, needs.value)
    }

    function byRunsThenCustom(
      a: { runs: boolean; deployment: Deployment },
      b: { runs: boolean; deployment: Deployment }
    ) {
      return (
        Number(b.runs) - Number(a.runs) ||
        Number(b.deployment.kind === 'custom') -
          Number(a.deployment.kind === 'custom')
      )
    }

    // Every deployment a new project could run on, those that already run
    // matte_pass first, each with what it lacks.
    const deploymentTargets = computed(() =>
      [COMFY_CLOUD, ...deployments.value]
        .filter((deployment) => deployment.status !== 'building')
        .map((deployment) => ({
          deployment,
          runs: runsNeeds(deployment),
          missing: missingFrom(deployment, needs.value)
        }))
        .sort(byRunsThenCustom)
    )

    // The projects matte_pass could open in, the same way round.
    const projectTargets = computed(() =>
      switchableProjects.value
        .map((project) => {
          const deployment = deploymentOf(project.id)
          return {
            project,
            deployment,
            runs: runsNeeds(deployment),
            missing: missingFrom(deployment, needs.value)
          }
        })
        .sort(byRunsThenCustom)
    )

    // Which first step the dialog shows: a deployment already runs it; or
    // none does, from a Comfy Cloud project (build one) or from a project on
    // its own deployment (update that deployment).
    const chooseMode = computed(() => {
      if (forPacks.value) return 'new'
      if (deploymentTargets.value.some((target) => target.runs)) {
        return 'existing'
      }
      return currentDeployment.value.kind === 'custom' ? 'update' : 'new'
    })

    const progress = computed(() => {
      const active = build.value
      if (!active) return null
      return buildProgress(
        simulatedSeconds(now.value - active.startedAt, DEMO_BUILD_MS)
      )
    })

    // The viewer's drafts for a project, newest first.
    function draftsOf(projectId: string) {
      const draftsId = personaStore.draftsProject?.id
      return personaStore.fixture.workflows
        .filter(
          (w) => w.projectId === draftsId && w.provenanceProjectId === projectId
        )
        .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }

    // Entering a project lands in the editor: its remembered tabs, or its
    // drafts the first time, or a blank workflow if it has none.
    function enterProject(
      fromId: string,
      toId: string,
      afterSwitch?: () => void
    ) {
      tabsStore.swapProject(fromId, toId)
      if (!tabsStore.openTabs.length) tabsStore.openSaved(draftsOf(toId))
      visitedProjectIds.value = [
        fromId,
        ...visitedProjectIds.value.filter((id) => id !== fromId)
      ]
      selectedProjectId.value = toId
      reloadingToId.value = null
      uiStore.goHome()
      afterSwitch?.()
      tabsStore.focusWorkflow()
    }

    const reload = useTimeoutFn(enterProject, RELOAD_MS, { immediate: false })

    // A deployment can load different frontend extensions, so moving to a
    // project on another deployment is a full reload for now: the loading
    // screen, then that project. Projects on the same deployment (every
    // Comfy Cloud project) switch at once.
    function switchProject(projectId: string, afterSwitch?: () => void) {
      const fromId = currentProject.value?.id
      if (!fromId || projectId === fromId) {
        afterSwitch?.()
        return
      }
      dialogStep.value = null
      runState.value = 'idle'
      if (deploymentOf(fromId).id === deploymentOf(projectId).id) {
        enterProject(fromId, projectId, afterSwitch)
        return
      }
      reloadingToId.value = projectId
      reload.start(fromId, projectId, afterSwitch)
    }

    function switchWorkspace(workspaceId: string) {
      if (
        workspaceId === personaStore.fixture.currentWorkspaceId ||
        !personaStore.fixture.workspaces.some(
          (workspace) => workspace.id === workspaceId
        )
      )
        return
      const fromId =
        currentProject.value?.id ?? personaStore.fixture.currentWorkspaceId
      const nextProject = personaStore.fixture.projects.find(
        (project) => project.workspaceId === workspaceId && project.isDrafts
      )
      reload.stop()
      tabsStore.swapProject(fromId, nextProject?.id ?? workspaceId)
      tabsStore.select(HOME_TAB_ID)
      selectedProjectId.value = nextProject?.id ?? null
      reloadingToId.value = null
      dialogStep.value = null
      switcherOpen.value = false
      runRequested.value = false
      runState.value = 'idle'
      personaStore.setCurrentWorkspace(workspaceId)
      uiStore.goHome()
    }

    // A saved workflow opens in its project, in its tab if already open.
    function openWorkflow(
      projectId: string,
      workflow: Pick<Workflow, 'id' | 'name'>
    ) {
      switchProject(projectId, () => tabsStore.openSaved([workflow]))
    }

    function openRunTargetDialog() {
      pickedPacks.value = null
      resetRunTarget()
    }

    // "Create a new deployment" from the Custom nodes modal of a project on
    // Comfy Cloud, which can't add packs: a new deployment that has them.
    function openNewDeploymentFor(packIds: string[]) {
      if (!packIds.length) return
      pickedPacks.value = [...packIds]
      resetRunTarget()
    }

    function resetRunTarget() {
      deploymentTarget.value =
        deploymentTargets.value.find((target) => target.runs)?.deployment.id ??
        NEW_BUILD_TARGET
      const name = forPacks.value
        ? DEFAULT_PACKS_BUILD_NAME
        : DEFAULT_BUILD_PROJECT_NAME
      newProjectName.value = name
      newDeploymentName.value = name
      newProjectTier.value = 'workspace-wide'
      newProjectCollaborators.value = []
      dialogStep.value = 'choose'
    }

    // The presenter drops any file (or uses the demo trigger): it always
    // opens as matte_pass.
    function dropIncompatibleWorkflow({
      nothingRuns = false
    }: { nothingRuns?: boolean } = {}) {
      if (!isEnabled.value) return
      nothingRunsIt.value = nothingRuns
      const open = tabsStore.openTabs.find(
        (t) => t.workflowKey === 'matte_pass'
      )
      if (open) tabsStore.select(open.id)
      else tabsStore.openWorkflow(MATTE_PASS.name, 'matte_pass')
      if (runsWorkflow(currentDeployment.value, MATTE_PASS)) return
      openRunTargetDialog()
    }

    // Move matte_pass, with its graph, out of the current project and into
    // another one.
    function openInProject(projectId: string) {
      if (forPacks.value) {
        dialogStep.value = null
        switchProject(projectId)
        return
      }
      const tab = tabsStore.openTabs.find((t) => t.workflowKey === 'matte_pass')
      if (tab) tabsStore.close(tab.id)
      dialogStep.value = null
      switchProject(projectId, () =>
        tabsStore.openWorkflow(MATTE_PASS.name, 'matte_pass', tab?.workflowPath)
      )
    }

    const ticker = useIntervalFn(tick, 200, { immediate: false })

    function tick() {
      now.value = Date.now()
      if (progress.value?.done) finishBuild()
    }

    // The project the dialog makes, with the name and access chosen in its
    // "New project" step.
    function createNewProject(deploymentId: string) {
      const name = newProjectName.value.trim() || DEFAULT_BUILD_PROJECT_NAME
      const restricted = newProjectTier.value === 'restricted'
      return personaStore.createProject(
        name,
        newProjectTier.value,
        restricted ? newProjectCollaborators.value : [],
        { deploymentId, color: BUILD_PROJECT_COLOR }
      )
    }

    // A new project on a deployment that already runs matte_pass: no build.
    function createProjectOn(deploymentId: string) {
      const projectId = createNewProject(deploymentId)
      if (deploymentId === builtDeploymentId.value) {
        builtDeploymentId.value = null
        readyProjectId.value = projectId
      }
      openInProject(projectId)
    }

    const editingDeployment = computed(() =>
      deployments.value.find((d) => d.id === editingDeploymentId.value)
    )

    // Edit deployment: Platform's build summary and deploy dialog for an
    // existing deployment, which rebuilds it as the next release.
    function openEditDeployment(deploymentId: string) {
      const target = deployments.value.find((d) => d.id === deploymentId)
      if (!target || build.value) return
      editingDeploymentId.value = deploymentId
      newDeploymentName.value = target.name
      dialogStep.value = 'build'
    }

    // The deployment being built, for the tab strip's "Building" chip.
    const buildingDeployment = computed(() =>
      build.value
        ? deployments.value.find((d) => d.id === build.value?.deploymentId)
        : undefined
    )

    function buildAndDeploy(gpu: PlatformGpu) {
      cancelAgentHandoff()
      const fixture = personaStore.fixture
      const name = newDeploymentName.value.trim() || DEFAULT_BUILD_PROJECT_NAME
      const editing = editingDeploymentId.value
      if (editing) {
        fixture.deployments = deployments.value.map((d) =>
          d.id === editing
            ? {
                ...d,
                name,
                gpu: gpu.label,
                release: nextRelease(d.release),
                status: 'building' as const
              }
            : d
        )
        build.value = {
          deploymentId: editing,
          startedAt: Date.now(),
          fixture,
          rebuild: true
        }
        now.value = Date.now()
        ticker.resume()
        dialogStep.value = 'building'
        return
      }
      const deploymentId = `dep-build-${Date.now()}`
      fixture.deployments = [
        ...deployments.value,
        {
          id: deploymentId,
          workspaceId: fixture.currentWorkspaceId,
          name,
          kind: 'custom',
          release: 'v1',
          status: 'building',
          gpu: gpu.label,
          warmMinutes: WARM_MINUTES,
          nodePacks: [...needs.value.nodePacks],
          models: [...needs.value.models]
        }
      ]
      build.value = {
        deploymentId,
        startedAt: Date.now(),
        fixture,
        rebuild: false
      }
      now.value = Date.now()
      ticker.resume()
      dialogStep.value = 'building'
    }

    function finishBuild() {
      const active = build.value
      if (!active) return
      ticker.pause()
      active.fixture.deployments = (active.fixture.deployments ?? []).map(
        (d) =>
          d.id === active.deploymentId ? { ...d, status: 'ready' as const } : d
      )
      build.value = null
      if (active.rebuild) {
        editingDeploymentId.value = null
        if (dialogStep.value === 'building') dialogStep.value = null
        return
      }
      // The project opens only once its deployment runs: name it now.
      builtDeploymentId.value = active.deploymentId
      deploymentTarget.value = active.deploymentId
      nothingRunsIt.value = false
      newProjectName.value =
        deployments.value.find((d) => d.id === active.deploymentId)?.name ??
        DEFAULT_BUILD_PROJECT_NAME
      newProjectTier.value = 'workspace-wide'
      newProjectCollaborators.value = []
      dialogStep.value = 'project'
    }

    const agentTimer = useTimeoutFn(finishAgentBuild, DEMO_BUILD_MS, {
      immediate: false
    })
    const agentWorking = computed(() => agentHandoff.value !== null)

    // The prompt is copied: the agent takes it from here.
    function handOffToAgent() {
      if (agentHandoff.value) return
      agentHandoff.value = {
        updatesDeploymentId:
          chooseMode.value === 'update' ? currentDeployment.value.id : null,
        projectId: currentProject.value?.id,
        name: newDeploymentName.value.trim() || DEFAULT_BUILD_PROJECT_NAME,
        fixture: personaStore.fixture
      }
      agentTimer.start()
    }

    function cancelAgentHandoff() {
      agentTimer.stop()
      agentHandoff.value = null
    }

    // An update lands as the next release with what matte_pass lacked; a new
    // deployment asks for a project to run on it.
    function finishAgentBuild() {
      const handoff = agentHandoff.value
      if (!handoff) return
      cancelAgentHandoff()
      const { fixture } = handoff
      const updatesId = handoff.updatesDeploymentId
      if (updatesId) {
        fixture.deployments = (fixture.deployments ?? []).map((d) =>
          d.id === updatesId
            ? {
                ...d,
                release: nextRelease(d.release),
                nodePacks: [
                  ...new Set([...d.nodePacks, ...needs.value.nodePacks])
                ],
                models: [...new Set([...d.models, ...needs.value.models])]
              }
            : d
        )
        readyProjectId.value = handoff.projectId ?? null
        return
      }
      const deploymentId = `dep-agent-${Date.now()}`
      fixture.deployments = [
        ...(fixture.deployments ?? []),
        {
          id: deploymentId,
          workspaceId: fixture.currentWorkspaceId,
          name: handoff.name,
          kind: 'custom',
          release: 'v1',
          status: 'ready',
          gpu: PLATFORM_GPUS[0].label,
          warmMinutes: WARM_MINUTES,
          nodePacks: [...needs.value.nodePacks],
          models: [...needs.value.models]
        }
      ]
      builtDeploymentId.value = deploymentId
      deploymentTarget.value = deploymentId
      nothingRunsIt.value = false
      newProjectName.value = handoff.name
      newProjectTier.value = 'workspace-wide'
      newProjectCollaborators.value = []
      dialogStep.value = 'agent-done'
    }

    // Run with missing nodes is another way into "choose where it runs".
    function requestRun() {
      if (showsMissingNodes.value) openRunTargetDialog()
      else runRequested.value = true
    }

    // Another persona is another account: start it on its personal project
    // with no tabs open.
    watch(
      () => personaStore.currentPersonaId,
      () => {
        reload.stop()
        selectedProjectId.value = null
        visitedProjectIds.value = []
        reloadingToId.value = null
        switcherOpen.value = false
        dialogStep.value = null
        nothingRunsIt.value = false
        pickedPacks.value = null
        readyProjectId.value = null
        builtDeploymentId.value = null
        editingDeploymentId.value = null
        cancelAgentHandoff()
        tabsStore.reset()
      }
    )

    return {
      isEnabled,
      switchableProjects,
      recentProjectIds,
      currentProject,
      currentDeployment,
      deploymentOf,
      showsMissingNodes,
      needs,
      forPacks,
      reloadingToId,
      switcherOpen,
      dialogStep,
      deploymentTarget,
      newProjectName,
      newProjectTier,
      newProjectCollaborators,
      newDeploymentName,
      editingDeployment,
      openEditDeployment,
      deploymentTargets,
      projectTargets,
      chooseMode,
      progress,
      buildingDeployment,
      builtDeploymentId,
      readyProjectId,
      runState,
      runRequested,
      editorMounted,
      switchProject,
      switchWorkspace,
      openWorkflow,
      openRunTargetDialog,
      openNewDeploymentFor,
      dropIncompatibleWorkflow,
      openInProject,
      createProjectOn,
      buildAndDeploy,
      agentWorking,
      handOffToAgent,
      cancelAgentHandoff,
      finishAgentBuild,
      requestRun
    }
  }
)
