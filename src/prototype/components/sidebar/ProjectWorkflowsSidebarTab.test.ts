import { render, screen, within } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'

import enMessages from '@/locales/en/main.json' with { type: 'json' }

import {
  RELOAD_MS,
  usePrototypeCustomCloudStore
} from '../../stores/customCloudStore'
import { usePrototypeTabsStore } from '../../stores/tabsStore'
import ProjectWorkflowsSidebarTab from './ProjectWorkflowsSidebarTab.vue'

// The panel shows whichever project the tab bar is in; start in `projectId`
// (the Workspace Admin persona's projects).
function setup(projectId?: string) {
  const customCloud = usePrototypeCustomCloudStore()
  const tabs = usePrototypeTabsStore()
  if (projectId) {
    customCloud.switchProject(projectId)
    vi.advanceTimersByTime(RELOAD_MS)
  }
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: { en: enMessages }
  })
  render(ProjectWorkflowsSidebarTab, {
    global: { plugins: [i18n], directives: { tooltip: {} } }
  })
  return {
    customCloud,
    tabs,
    user: userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  }
}

const itemNames = (container: HTMLElement) =>
  within(container)
    .getAllByRole('treeitem')
    .map((item) => item.getAttribute('aria-label'))

describe('ProjectWorkflowsSidebarTab', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('lists your drafts for the project as Workflows and its published workflows as Project templates', () => {
    setup('proj-cocacola')

    expect(
      itemNames(screen.getByRole('region', { name: 'Workflows' }))
    ).toEqual([
      'Coke can hero — bokeh test',
      'Product hero',
      'Coke can — top-down angle',
      'Coke can — retired variant'
    ])
    expect(
      itemNames(screen.getByRole('region', { name: 'Project templates' }))
    ).toEqual([
      'Bottle splash render',
      'Billboard composite',
      'Coke can hero',
      'Campaign upscale'
    ])
  })

  it('keeps a project’s template folders', () => {
    setup('proj-the-matrix')

    expect(
      itemNames(screen.getByRole('region', { name: 'Project templates' }))
    ).toEqual([
      'BUL',
      'LOB',
      'RUN',
      'MTX_SEN_0300_light',
      'MTX_LIB_greenKey',
      'MTX_CON_0010_dmp'
    ])
  })

  it('lists My Workflows’ own workflows, not the drafts another project claims, and no Project templates', () => {
    setup()

    const workflows = screen.getByRole('region', { name: 'Workflows' })
    expect(
      within(workflows).getByRole('treeitem', { name: 'Experiments' })
    ).toBeInTheDocument()
    expect(
      within(workflows).getByRole('treeitem', { name: 'SDXL base + refiner' })
    ).toBeInTheDocument()
    expect(
      within(workflows).getByRole('treeitem', {
        name: 'Moodboard explorer — Willie'
      })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('treeitem', { name: 'Moodboard explorer — rework' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Project templates' })
    ).not.toBeInTheDocument()
  })

  it('keeps other projects behind Other projects, grouped by project', async () => {
    const { user } = setup('proj-cocacola')
    const showHidden = screen.getByRole('button', { name: /Other projects/ })
    expect(showHidden).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByRole('treeitem', { name: 'The Matrix' })
    ).not.toBeInTheDocument()

    await user.click(showHidden)

    expect(
      screen.getByRole('button', { name: /Other projects/ })
    ).toHaveAttribute('aria-expanded', 'true')
    expect(
      itemNames(screen.getByRole('region', { name: 'Other projects' }))
    ).toEqual([
      'My Workflows',
      'Marketing 2026',
      'Brand Library',
      'Q3 Launch Site',
      'Client X',
      'Indie Short Film',
      'The Matrix',
      'Personal R&D'
    ])
  })

  it('searches this project and counts matches in other projects behind Other projects', async () => {
    const { user } = setup('proj-cocacola')

    await user.type(screen.getByRole('combobox'), 'mtx_lob')

    expect(screen.getByText('No matches in this project')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Other projects 2' })
    ).toBeInTheDocument()
  })

  it('starts fresh after a project switch: no search, other projects hidden', async () => {
    const { customCloud, user } = setup('proj-cocacola')
    await user.type(screen.getByRole('combobox'), 'mtx')
    await user.click(screen.getByRole('button', { name: /Other projects/ }))

    customCloud.switchProject('proj-the-matrix')
    vi.advanceTimersByTime(RELOAD_MS)
    await nextTick()

    expect(screen.getByRole('combobox')).toHaveValue('')
    expect(
      screen.getByRole('button', { name: /Other projects/ })
    ).toHaveAttribute('aria-expanded', 'false')
    expect(
      within(
        screen.getByRole('region', { name: 'Project templates' })
      ).getByRole('treeitem', { name: 'MTX_SEN_0300_light' })
    ).toBeInTheDocument()
  })

  it('opens a workflow from this project in its tab, reusing the tab once open', async () => {
    const { tabs, user } = setup('proj-cocacola')

    await user.click(screen.getByText('Campaign upscale'))
    await user.click(screen.getByText('Campaign upscale'))

    const open = tabs.openTabs.filter((t) => t.label === 'Campaign upscale')
    expect(open).toHaveLength(1)
    expect(tabs.activeTabId).toBe(open[0].id)
  })

  it('opens another project’s workflow in that project, after the reload', async () => {
    const { customCloud, tabs, user } = setup('proj-cocacola')
    await user.click(screen.getByRole('button', { name: /Other projects/ }))
    const others = within(
      screen.getByRole('region', { name: 'Other projects' })
    )
    await user.click(others.getByText('The Matrix'))
    await user.click(others.getByText('Project templates'))

    await user.click(others.getByText('MTX_SEN_0300_light'))
    expect(customCloud.currentProject?.id).toBe('proj-cocacola')
    vi.advanceTimersByTime(RELOAD_MS)

    expect(customCloud.currentProject?.id).toBe('proj-the-matrix')
    expect(tabs.openTabs.find((t) => t.id === tabs.activeTabId)?.label).toBe(
      'MTX_SEN_0300_light'
    )
  })
})
