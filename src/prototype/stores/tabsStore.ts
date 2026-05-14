// Prototype tabs store. Mirrors the open-workflow tab strip from
// ComfyUI's workflow view, but holds plain fixture data so the
// prototype dashboard can demo tab switching without the real
// workflow plumbing.

import { defineStore } from 'pinia'
import { ref } from 'vue'

type TabKind = 'workflow' | 'app' | 'builder'

interface OpenTab {
  id: string
  label: string
  kind?: TabKind
  isDirty?: boolean
}

export const HOME_TAB_ID = 'home'

let counter = 0
const nextId = () => `tab-${++counter}`

export const usePrototypeTabsStore = defineStore('prototype-tabs', () => {
  const openTabs = ref<OpenTab[]>([])
  const activeTabId = ref<string>(HOME_TAB_ID)

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

  function close(id: string) {
    const idx = openTabs.value.findIndex((t) => t.id === id)
    if (idx < 0) return
    openTabs.value.splice(idx, 1)
    if (activeTabId.value !== id) return
    const next = openTabs.value[idx] ?? openTabs.value[idx - 1] ?? null
    activeTabId.value = next?.id ?? HOME_TAB_ID
  }

  return { openTabs, activeTabId, select, addBlank, close }
})
