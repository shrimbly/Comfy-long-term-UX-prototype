// Prototype tabs store. Mirrors the open-workflow tab strip from
// ComfyUI's workflow view, but holds plain fixture data so the
// prototype dashboard can demo tab switching without the real
// workflow plumbing.
//
// Tabs belong to the current project (Custom Comfy Cloud: the project
// switcher sits at the left of the tab strip). Switching project swaps in
// that project's remembered tabs — see `swapProject`.

import { defineStore } from 'pinia'
import { ref } from 'vue'

type TabKind = 'workflow' | 'app' | 'builder' | 'media-assets'

// Demo workflows the editor knows how to draw (see DemoEditorView).
type DemoWorkflowKey = 'matte_pass'

interface OpenTab {
  id: string
  label: string
  kind?: TabKind
  isDirty?: boolean
  workflowKey?: DemoWorkflowKey
}

interface TabSet {
  tabs: OpenTab[]
  activeTabId: string
}

export const HOME_TAB_ID = 'home'
export const MEDIA_ASSETS_TAB_ID = 'media-assets'

let counter = 0
const nextId = () => `tab-${++counter}`

export const usePrototypeTabsStore = defineStore('prototype-tabs', () => {
  const openTabs = ref<OpenTab[]>([])
  const activeTabId = ref<string>(HOME_TAB_ID)
  const tabsByProject = ref<Record<string, TabSet>>({})

  function select(id: string) {
    if (id === HOME_TAB_ID || openTabs.value.some((t) => t.id === id)) {
      activeTabId.value = id
    }
  }

  function addBlank() {
    const id = nextId()
    openTabs.value.push({
      id,
      label: `Untitled workflow ${counter}`,
      kind: 'workflow',
      isDirty: true
    })
    activeTabId.value = id
  }

  // Open a named workflow in a new tab and activate it (e.g. the project
  // page's "+ Workflow" simulating the editor opening the freshly-created
  // draft).
  function openWorkflow(label: string, workflowKey?: DemoWorkflowKey) {
    const id = nextId()
    openTabs.value.push({
      id,
      label,
      kind: 'workflow',
      isDirty: true,
      workflowKey
    })
    activeTabId.value = id
  }

  function openMediaAssets(label: string) {
    const existing = openTabs.value.find((t) => t.id === MEDIA_ASSETS_TAB_ID)
    if (!existing) {
      openTabs.value.push({
        id: MEDIA_ASSETS_TAB_ID,
        label,
        kind: 'media-assets'
      })
    } else if (existing.label !== label) {
      existing.label = label
    }
    activeTabId.value = MEDIA_ASSETS_TAB_ID
  }

  function close(id: string) {
    const idx = openTabs.value.findIndex((t) => t.id === id)
    if (idx < 0) return
    openTabs.value.splice(idx, 1)
    if (activeTabId.value !== id) return
    const next = openTabs.value[idx] ?? openTabs.value[idx - 1] ?? null
    activeTabId.value = next?.id ?? HOME_TAB_ID
  }

  // Remember the open tabs under the project being left, then restore the
  // tabs the next project had open (or a bare Home tab the first time).
  function swapProject(fromProjectId: string, toProjectId: string) {
    tabsByProject.value[fromProjectId] = {
      tabs: openTabs.value,
      activeTabId: activeTabId.value
    }
    const next = tabsByProject.value[toProjectId]
    openTabs.value = next?.tabs ?? []
    activeTabId.value = next?.activeTabId ?? HOME_TAB_ID
  }

  function reset() {
    openTabs.value = []
    activeTabId.value = HOME_TAB_ID
    tabsByProject.value = {}
  }

  return {
    openTabs,
    activeTabId,
    select,
    addBlank,
    openWorkflow,
    openMediaAssets,
    close,
    swapProject,
    reset
  }
})
