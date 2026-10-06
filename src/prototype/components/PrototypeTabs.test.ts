import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'

import enMessages from '@/locales/en/main.json' with { type: 'json' }

import { usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import PrototypeTabs from './PrototypeTabs.vue'

vi.mock<unknown>(import('@/components/topbar/WorkflowTabs.vue'), () => ({
  default: defineComponent({ template: '<div />' })
}))
vi.mock<unknown>(import('@/components/topbar/TopbarBadges.vue'), () => ({
  default: defineComponent({ template: '<div />' })
}))
vi.mock<unknown>(
  import('@/components/topbar/TopbarSubscribeButton.vue'),
  () => ({
    default: defineComponent({ template: '<div />' })
  })
)

async function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        name: 'GraphView',
        component: defineComponent({ template: '<div />' })
      },
      {
        path: '/prototype/dashboard',
        name: 'PrototypeDashboard',
        component: defineComponent({ template: '<div />' })
      }
    ]
  })
  await router.push({ name: 'GraphView' })
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: { en: enMessages }
  })
  render(PrototypeTabs, { global: { plugins: [pinia, router, i18n] } })
  return {
    router,
    tabs: usePrototypeTabsStore(),
    ui: usePrototypeUiStore(),
    user: userEvent.setup()
  }
}

describe('shared prototype navigation', () => {
  it('returns from the editor to Home with the keyboard and reopens a demo workflow', async () => {
    const { router, tabs, ui, user } = await setup()
    tabs.openWorkflow('Matte pass', 'matte_pass')
    ui.go({ kind: 'projects' })

    const home = screen.getByRole('link', { name: 'Home' })
    home.focus()
    await user.keyboard('{Enter}')
    expect(router.currentRoute.value.name).toBe('PrototypeDashboard')
    expect(ui.activeView.kind).toBe('home')
    expect(home).toHaveAttribute('aria-current', 'page')

    await router.push({ name: 'GraphView' })
    const workflow = screen.getByRole('tab', { name: 'Matte pass' })
    await user.click(workflow)
    expect(router.currentRoute.value.name).toBe('PrototypeDashboard')
    expect(workflow).toHaveAttribute('aria-selected', 'true')
    expect(home).not.toHaveAttribute('aria-current')

    await user.click(screen.getByRole('button', { name: 'Close tab' }))
    expect(
      screen.queryByRole('tab', { name: 'Matte pass' })
    ).not.toBeInTheDocument()
    expect(home).toHaveAttribute('aria-current', 'page')
  })

  it('opens the project list from the editor through the project switcher', async () => {
    const { router, ui, user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Switch project' }))
    await user.click(screen.getByRole('button', { name: 'All projects' }))
    expect(router.currentRoute.value.name).toBe('PrototypeDashboard')
    expect(ui.activeView.kind).toBe('projects')
  })
})
