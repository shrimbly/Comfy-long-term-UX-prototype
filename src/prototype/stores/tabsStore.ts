import { defineStore } from 'pinia'
import { ref } from 'vue'

import { useWorkflowService } from '@/platform/workflow/core/services/workflowService'
import { useWorkflowStore } from '@/platform/workflow/management/stores/workflowStore'
import { blankGraph } from '@/scripts/defaultGraph'
import { usePrototypeNavigationStore } from './navigationStore'

interface OpenTab {
  id: string
  label: string
}

export const HOME_TAB_ID = 'home'
export const MEDIA_ASSETS_TAB_ID = 'media-assets'

export const usePrototypeTabsStore = defineStore('prototype-tabs', () => {
  const openTabs = ref<OpenTab[]>([])
  const activeTabId = ref<string>(HOME_TAB_ID)

  function select(id: string) {
    if (id === HOME_TAB_ID || openTabs.value.some((t) => t.id === id)) {
      activeTabId.value = id
    }
  }

  async function openWorkflow(label: string) {
    if (!(await usePrototypeNavigationStore().openEditor())) return
    const workflow = useWorkflowStore().createTemporary(
      `${label}.json`,
      structuredClone(blankGraph)
    )
    await useWorkflowService().openWorkflow(workflow)
  }

  function openMediaAssets(label: string) {
    const existing = openTabs.value.find((t) => t.id === MEDIA_ASSETS_TAB_ID)
    if (!existing) {
      openTabs.value.push({
        id: MEDIA_ASSETS_TAB_ID,
        label
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

  return {
    openTabs,
    activeTabId,
    select,
    openWorkflow,
    openMediaAssets,
    close
  }
})
