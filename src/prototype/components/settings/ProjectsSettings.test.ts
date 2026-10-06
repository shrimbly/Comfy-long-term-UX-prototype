import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { getActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'

import enMessages from '@/locales/en/main.json' with { type: 'json' }

import { usePrototypePersonaStore } from '../../stores/personaStore'
import { usePrototypeUiStore } from '../../stores/uiStore'
import ProjectsSettings from './ProjectsSettings.vue'

function setup() {
  const pinia = getActivePinia()!
  const personas = usePrototypePersonaStore()
  const ui = usePrototypeUiStore()
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: { en: enMessages }
  })
  render(ProjectsSettings, { global: { plugins: [pinia, i18n] } })
  return { personas, ui }
}

describe('ProjectsSettings', () => {
  it('opens the panel for the clicked project', async () => {
    const { personas, ui } = setup()
    const project = personas.visibleProjects[0]
    await userEvent
      .setup()
      .click(screen.getByRole('row', { name: new RegExp(project.name) }))
    expect(ui.settingsProjectId).toBe(project.id)
    expect(screen.getByRole('button', { name: 'Open project' })).toBeTruthy()
  })

  it('"Open project" leaves settings for that project page', async () => {
    const { personas, ui } = setup()
    const project = personas.visibleProjects[1]
    ui.openProjectSettings(project.id)
    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: 'Open project' }))
    expect(ui.activeView).toEqual({ kind: 'project', projectId: project.id })
  })
})
