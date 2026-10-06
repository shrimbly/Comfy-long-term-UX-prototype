import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { defineComponent, markRaw } from 'vue'

import { useSidebarTabStore } from '@/stores/workspace/sidebarTabStore'

import ProjectWorkflowsSidebarTab from '../components/sidebar/ProjectWorkflowsSidebarTab.vue'
import { useProjectWorkflowsSidebarTab } from './useProjectWorkflowsSidebarTab'

const panel = (name: string) =>
  markRaw(defineComponent({ name, render: () => null }))

describe('useProjectWorkflowsSidebarTab', () => {
  it('shows the project panel in the Workflows tab’s place while the editor is mounted, and upstream’s again after', () => {
    const sidebarTabStore = useSidebarTabStore()
    const upstreamPanel = panel('UpstreamWorkflows')
    sidebarTabStore.registerSidebarTab({
      id: 'node-library',
      title: 'Node library',
      type: 'vue',
      component: panel('NodeLibrary')
    })
    sidebarTabStore.registerSidebarTab({
      id: 'workflows',
      icon: 'icon-[comfy--workflow]',
      title: 'sideToolbar.workflows',
      type: 'vue',
      component: upstreamPanel
    })
    sidebarTabStore.registerSidebarTab({
      id: 'apps',
      title: 'Apps',
      type: 'vue',
      component: panel('Apps')
    })
    const workflowsTab = () =>
      sidebarTabStore.sidebarTabs.find((t) => t.id === 'workflows')
    const workflowsPanel = () => {
      const tab = workflowsTab()
      return tab?.type === 'vue' ? tab.component : undefined
    }

    const { unmount } = render(
      defineComponent({
        setup() {
          useProjectWorkflowsSidebarTab()
          return () => null
        }
      })
    )

    expect(sidebarTabStore.sidebarTabs.map((t) => t.id)).toEqual([
      'node-library',
      'workflows',
      'apps'
    ])
    expect(workflowsTab()).toMatchObject({
      icon: 'icon-[comfy--workflow]',
      title: 'sideToolbar.workflows'
    })
    expect(workflowsPanel()).toBe(ProjectWorkflowsSidebarTab)

    unmount()

    expect(workflowsPanel()).toBe(upstreamPanel)
  })
})
