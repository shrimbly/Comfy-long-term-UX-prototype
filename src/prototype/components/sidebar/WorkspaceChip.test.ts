import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { getActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import enMessages from '@/locales/en/main.json' with { type: 'json' }
import { usePrototypePersonaStore } from '../../stores/personaStore'
import { usePrototypeUiStore } from '../../stores/uiStore'
import WorkspaceChip from './WorkspaceChip.vue'

describe('workspace menu settings', () => {
  it.for([
    ['Workspace settings', 'general'],
    ['Account settings', 'account'],
    ['Manage plan & credits', 'billing']
  ] as const)('opens %s in the settings layout', async ([label, section]) => {
    const pinia = getActivePinia()!
    const personas = usePrototypePersonaStore()
    const ui = usePrototypeUiStore()
    const i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: { en: enMessages }
    })
    render(WorkspaceChip, {
      props: {
        workspace: personas.currentWorkspace!,
        workspaces: personas.fixture.workspaces,
        currentUser: personas.fixture.currentUser
      },
      global: { plugins: [pinia, i18n] }
    })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Workspace menu' }))
    await user.click(await screen.findByRole('menuitem', { name: label }))
    expect(ui.activeView.kind).toBe('settings')
    expect(ui.settingsPage).toBe(section)
  })
})
