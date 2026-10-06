import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { getActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import enMessages from '@/locales/en/main.json' with { type: 'json' }
import { HOME_TAB_ID, usePrototypeTabsStore } from '../../stores/tabsStore'
import { usePrototypeUiStore } from '../../stores/uiStore'
import EditorWorkspaceMenu from './EditorWorkspaceMenu.vue'

describe('editor workspace menu', () => {
  it.for(['GraphView', 'PrototypeDashboard'])(
    'opens account settings from %s and keeps the workflow tab',
    async (route) => {
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
      await router.push({ name: route })
      const tabs = usePrototypeTabsStore()
      const ui = usePrototypeUiStore()
      tabs.openWorkflow('My workflow')
      const i18n = createI18n({
        legacy: false,
        locale: 'en',
        messages: { en: enMessages }
      })
      render(EditorWorkspaceMenu, {
        global: { plugins: [getActivePinia()!, router, i18n] }
      })
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Workspace menu' }))
      await user.click(
        await screen.findByRole('menuitem', { name: 'Account settings' })
      )
      expect(router.currentRoute.value.name).toBe('PrototypeDashboard')
      expect(tabs.activeTabId).toBe(HOME_TAB_ID)
      expect(tabs.openTabs.map((tab) => tab.label)).toContain('My workflow')
      expect(ui.settingsPage).toBe('account')
      expect(ui.activeView.kind).toBe('settings')
    }
  )
})
