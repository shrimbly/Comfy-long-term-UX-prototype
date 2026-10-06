// Implements:
//   decision: ../IA_Plan/wiki/decisions/project-switcher-in-tab-bar.md
//             — the project is "the parent of all"
//   decision: prototype/design-decisions.md — 2026-10-07 "Editor Workflows
//             sidebar is about the current project"
//
// Inside /prototype the editor's Workflows sidebar tab shows the current
// project's workflows. Call from the component that mounts GraphView: the
// upstream tab is registered in GraphView's setup, so it exists by the time
// this component mounts. The swap keeps the tab's id and place in the
// toolbar, and the upstream tab comes back when the component unmounts.

import { markRaw, onBeforeUnmount, onMounted } from 'vue'

import { useSidebarTabStore } from '@/stores/workspace/sidebarTabStore'
import type { SidebarTabExtension } from '@/types/extensionTypes'

import ProjectWorkflowsSidebarTab from '../components/sidebar/ProjectWorkflowsSidebarTab.vue'

const WORKFLOWS_TAB_ID = 'workflows'

export function useProjectWorkflowsSidebarTab() {
  const sidebarTabStore = useSidebarTabStore()
  let upstreamTab: SidebarTabExtension | undefined

  function putInPlace(tab: SidebarTabExtension) {
    sidebarTabStore.sidebarTabs = sidebarTabStore.sidebarTabs.map((t) =>
      t.id === WORKFLOWS_TAB_ID ? tab : t
    )
  }

  onMounted(() => {
    upstreamTab = sidebarTabStore.sidebarTabs.find(
      (t) => t.id === WORKFLOWS_TAB_ID
    )
    if (!upstreamTab) return
    putInPlace({
      id: WORKFLOWS_TAB_ID,
      icon: upstreamTab.icon,
      title: upstreamTab.title,
      tooltip: upstreamTab.tooltip,
      label: upstreamTab.label,
      type: 'vue',
      component: markRaw(ProjectWorkflowsSidebarTab)
    })
  })

  onBeforeUnmount(() => {
    if (upstreamTab) putInPlace(upstreamTab)
  })
}
