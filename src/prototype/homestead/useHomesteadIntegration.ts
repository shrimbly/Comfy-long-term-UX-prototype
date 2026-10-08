import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { HOME_TAB_ID, usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import { nativeFixtures } from './nativeModel'
import { useHomesteadStore } from './store'

export function useHomesteadIntegration() {
  const s = useHomesteadStore()
  const route = useRoute()
  const personas = usePrototypePersonaStore()
  const tabs = usePrototypeTabsStore()
  const cloud = usePrototypeCustomCloudStore()
  const ui = usePrototypeUiStore()
  const activeTab = computed(() =>
    tabs.openTabs.find(
      (t) => t.id === tabs.activeTabId && t.kind === 'workflow'
    )
  )

  function initialize() {
    if (!s.enabled) return
    const fixtures = nativeFixtures(personas.fixture)
    s.availableEnvironments = fixtures.environments
    s.workflows = fixtures.workflows
    s.activeId = fixtures.workflows[0].id
    s.workspaceName = personas.currentWorkspace?.name ?? ''
    s.projectEnvironments = Object.fromEntries(
      personas.fixture.projects.map((p) => [
        p.id,
        p.deploymentId ?? 'dep-comfy-cloud'
      ])
    )
    s.projectId = cloud.currentProject?.id ?? null
    s.projectEnvironmentId = s.projectId
      ? s.projectEnvironments[s.projectId]
      : 'dep-comfy-cloud'
    s.entry = personas.fixture.mode === 'local' ? 'desktop' : 'cloud'
  }
  watch(
    () => route.name,
    (name) => {
      s.enabled = name === 'HomesteadPrototype'
      initialize()
    },
    { immediate: true }
  )
  watch(
    () => [personas.currentPersonaId, personas.fixture.currentWorkspaceId],
    initialize
  )
  watch(
    () => s.version,
    (version) => {
      if (version === 3) showProjects()
      if (version < 3 && ['projects', 'project'].includes(ui.activeView.kind))
        ui.goHome()
    }
  )
  watch(
    () => cloud.currentProject?.id,
    (id) => {
      if (!s.enabled || !id) return
      s.projectId = id
      s.projectEnvironmentId = s.projectEnvironments[id] ?? 'dep-comfy-cloud'
    }
  )
  watch(
    () => activeTab.value?.id,
    () => {
      if (!s.enabled) return
      const tab = activeTab.value
      if (!tab) {
        s.view = 'home'
        return
      }
      const id =
        tab.workflowKey === 'matte_pass' ? 'matte' : (tab.workflowId ?? tab.id)
      if (!s.workflows.some((w) => w.id === id))
        s.workflows.push({
          ...s.active,
          id,
          name: tab.label,
          projectId: s.projectId ?? undefined,
          saved: false
        })
      s.activeId = id
      s.view = 'canvas'
      if (s.entry === 'cloud' && s.runtime !== 'failed') s.wake()
    }
  )
  watch(
    () => s.openRequest,
    () => {
      if (!s.enabled) return
      const workflow = s.active
      if (workflow.id === 'matte') {
        const existing = tabs.openTabs.find(
          (t) => t.workflowKey === 'matte_pass'
        )
        if (existing) tabs.select(existing.id)
        else tabs.openWorkflow(workflow.name, 'matte_pass')
      } else tabs.openSaved([workflow])
    }
  )
  function showProjects() {
    s.entry = 'cloud'
    tabs.select(HOME_TAB_ID)
    ui.go({ kind: 'projects' })
    s.view = 'projects'
  }
  onMounted(() => {
    if (!s.enabled) return
    s.restoreDeploymentLink()
    if (s.view !== 'canvas' && !s.pendingEnvironmentId) {
      if (s.version === 3) showProjects()
      else s.openWorkflow('matte', 'desktop')
    }
  })
  return s
}
