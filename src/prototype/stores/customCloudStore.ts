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
// the incompatible matte_pass workflow, the fast demo build that locks the
// new project, and the cold-start note on the first run.

import { useIntervalFn, useTimeoutFn } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'

import {
  BUILD_PROJECT_COLOR,
  DEFAULT_BUILD_PROJECT_NAME,
  DEMO_BUILD_MS,
  MATTE_PASS,
  WARM_MINUTES
} from '../fixtures/customCloud'
import type { Deployment, PersonaFixture } from '../types'
import {
  buildProgress,
  missingFrom,
  resolveDeployment,
  runsWorkflow,
  simulatedSeconds
} from '../utils/deployment'
import { usePrototypePersonaStore } from './personaStore'
import { usePrototypeTabsStore } from './tabsStore'
import { usePrototypeUiStore } from './uiStore'

type DialogStep = 'choose' | 'review' | 'agent'
type RunState = 'idle' | 'starting' | 'running'

// A target in the dialog: an existing project id, or a new project on a new
// build.
export const NEW_BUILD_TARGET = 'new'

export const RELOAD_MS = 900
export const COLD_START_MS = 4000
const RUN_MS = 3000

// The build keeps the fixture it started in, so it still finishes there if
// the presenter flips persona mid-build.
interface ActiveBuild {
  projectId: string
  deploymentId: string
  startedAt: number
  fixture: PersonaFixture
}

export const usePrototypeCustomCloudStore = defineStore(
  'prototype-custom-cloud',
  () => {
    const personaStore = usePrototypePersonaStore()
    const tabsStore = usePrototypeTabsStore()
    const uiStore = usePrototypeUiStore()

    const selectedProjectId = ref<string | null>(null)
    const reloadingToId = ref<string | null>(null)
    const switcherOpen = ref(false)
    const dialogStep = ref<DialogStep | null>(null)
    const runTarget = ref<string>(NEW_BUILD_TARGET)
    const newProjectName = ref(DEFAULT_BUILD_PROJECT_NAME)
    const build = shallowRef<ActiveBuild | null>(null)
    const now = ref(Date.now())
    const readyProjectId = ref<string | null>(null)
    const runState = ref<RunState>('idle')

    const isEnabled = computed(() => personaStore.fixture.mode === 'cloud')
    const deployments = computed(() => personaStore.fixture.deployments ?? [])

    // The personal project (My Workflows) first, then every project the
    // viewer can open.
    const switchableProjects = computed(() => [
      ...(personaStore.draftsProject ? [personaStore.draftsProject] : []),
      ...personaStore.visibleProjects
    ])

    const currentProject = computed(
      () =>
        switchableProjects.value.find(
          (p) => p.id === selectedProjectId.value
        ) ?? switchableProjects.value[0]
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
    const isLocked = computed(
      () => currentDeployment.value.status === 'building'
    )

    const activeTab = computed(() =>
      tabsStore.openTabs.find((t) => t.id === tabsStore.activeTabId)
    )
    const showsMissingNodes = computed(
      () =>
        activeTab.value?.workflowKey === 'matte_pass' &&
        !runsWorkflow(currentDeployment.value, MATTE_PASS)
    )

    // Projects that already run matte_pass first, then custom deployments,
    // then Comfy Cloud — each with what it lacks.
    const runTargets = computed(() =>
      switchableProjects.value
        .map((project) => {
          const deployment = deploymentOf(project.id)
          return {
            project,
            deployment,
            runs: runsWorkflow(deployment, MATTE_PASS),
            missing: missingFrom(deployment, MATTE_PASS)
          }
        })
        .toSorted(
          (a, b) =>
            Number(b.runs) - Number(a.runs) ||
            Number(b.deployment.kind === 'custom') -
              Number(a.deployment.kind === 'custom')
        )
    )

    const progress = computed(() => {
      const active = build.value
      if (!active) return null
      return buildProgress(
        simulatedSeconds(now.value - active.startedAt, DEMO_BUILD_MS)
      )
    })

    const finishRun = useTimeoutFn(
      () => {
        runState.value = 'idle'
      },
      RUN_MS,
      { immediate: false }
    )

    // A run on a custom deployment starts a worker first (the cold start).
    const coldStart = useTimeoutFn(
      () => {
        runState.value = 'running'
        finishRun.start()
      },
      COLD_START_MS,
      { immediate: false }
    )

    function stopRun() {
      coldStart.stop()
      finishRun.stop()
      runState.value = 'idle'
    }

    // A full reload lands on Home with that project's tabs and nothing
    // in flight.
    const reload = useTimeoutFn(
      (fromId: string, toId: string, afterSwitch?: () => void) => {
        tabsStore.swapProject(fromId, toId)
        selectedProjectId.value = toId
        reloadingToId.value = null
        uiStore.goHome()
        afterSwitch?.()
      },
      RELOAD_MS,
      { immediate: false }
    )

    // Projects can load different frontend extensions, so switching is a
    // full reload for now: a brief transition, then that project's tabs.
    function switchProject(projectId: string, afterSwitch?: () => void) {
      const fromId = currentProject.value?.id
      if (!fromId || projectId === fromId) {
        afterSwitch?.()
        return
      }
      dialogStep.value = null
      stopRun()
      reloadingToId.value = projectId
      reload.start(fromId, projectId, afterSwitch)
    }

    function openWorkflow(projectId: string, label: string) {
      switchProject(projectId, () => tabsStore.openWorkflow(label))
    }

    function openRunTargetDialog() {
      runTarget.value =
        runTargets.value.find((t) => t.runs)?.project.id ?? NEW_BUILD_TARGET
      newProjectName.value = DEFAULT_BUILD_PROJECT_NAME
      dialogStep.value = 'choose'
    }

    // The presenter drops any file (or uses the demo trigger): it always
    // opens as matte_pass.
    function dropIncompatibleWorkflow() {
      if (!isEnabled.value || isLocked.value) return
      const open = tabsStore.openTabs.find(
        (t) => t.workflowKey === 'matte_pass'
      )
      if (open) tabsStore.select(open.id)
      else tabsStore.openWorkflow(MATTE_PASS.name, 'matte_pass')
      if (runsWorkflow(currentDeployment.value, MATTE_PASS)) return
      openRunTargetDialog()
    }

    // Move matte_pass out of the current project and into another one.
    function openInProject(projectId: string) {
      const tab = tabsStore.openTabs.find((t) => t.workflowKey === 'matte_pass')
      if (tab) tabsStore.close(tab.id)
      dialogStep.value = null
      switchProject(projectId, () =>
        tabsStore.openWorkflow(MATTE_PASS.name, 'matte_pass')
      )
    }

    const ticker = useIntervalFn(tick, 200, { immediate: false })

    function tick() {
      now.value = Date.now()
      if (progress.value?.done) finishBuild()
    }

    function buildAndDeploy() {
      const fixture = personaStore.fixture
      const name = newProjectName.value.trim() || DEFAULT_BUILD_PROJECT_NAME
      const deploymentId = `dep-build-${Date.now()}`
      fixture.deployments = [
        ...deployments.value,
        {
          id: deploymentId,
          name,
          kind: 'custom',
          release: 'v1',
          status: 'building',
          gpu: MATTE_PASS.gpu,
          warmMinutes: WARM_MINUTES,
          nodePacks: [...MATTE_PASS.nodePacks],
          models: [...MATTE_PASS.models]
        }
      ]
      const projectId = personaStore.createProject(name, 'restricted', [], {
        deploymentId,
        color: BUILD_PROJECT_COLOR
      })
      build.value = { projectId, deploymentId, startedAt: Date.now(), fixture }
      now.value = Date.now()
      ticker.resume()
      openInProject(projectId)
    }

    function finishBuild() {
      const active = build.value
      if (!active) return
      ticker.pause()
      active.fixture.deployments = (active.fixture.deployments ?? []).map((d) =>
        d.id === active.deploymentId ? { ...d, status: 'ready' as const } : d
      )
      readyProjectId.value = active.projectId
      build.value = null
    }

    function run() {
      if (showsMissingNodes.value) {
        openRunTargetDialog()
        return
      }
      stopRun()
      if (currentDeployment.value.kind === 'custom') {
        runState.value = 'starting'
        coldStart.start()
        return
      }
      runState.value = 'running'
      finishRun.start()
    }

    function runReadyWorkflow() {
      const projectId = readyProjectId.value
      readyProjectId.value = null
      if (!projectId) return
      switchProject(projectId, () => {
        const tab = tabsStore.openTabs.find(
          (t) => t.workflowKey === 'matte_pass'
        )
        if (tab) tabsStore.select(tab.id)
        run()
      })
    }

    // Another persona is another account: start it on its personal project
    // with no tabs open.
    watch(
      () => personaStore.currentPersonaId,
      () => {
        reload.stop()
        stopRun()
        selectedProjectId.value = null
        reloadingToId.value = null
        switcherOpen.value = false
        dialogStep.value = null
        readyProjectId.value = null
        tabsStore.reset()
      }
    )

    return {
      isEnabled,
      switchableProjects,
      currentProject,
      currentDeployment,
      deploymentOf,
      isLocked,
      showsMissingNodes,
      reloadingToId,
      switcherOpen,
      dialogStep,
      runTarget,
      newProjectName,
      runTargets,
      progress,
      readyProjectId,
      runState,
      switchProject,
      openWorkflow,
      dropIncompatibleWorkflow,
      openInProject,
      buildAndDeploy,
      run,
      runReadyWorkflow
    }
  }
)
