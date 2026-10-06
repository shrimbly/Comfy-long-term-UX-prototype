import userEvent from '@testing-library/user-event'
import { render, screen, within } from '@testing-library/vue'
import { getActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { toRaw } from 'vue'
import { createI18n } from 'vue-i18n'
import enMessages from '@/locales/en/main.json' with { type: 'json' }
import { usePrototypePersonaStore } from '../stores/personaStore'
import EnvironmentsView from './EnvironmentsView.vue'

beforeEach(() => {
  const fixture = usePrototypePersonaStore().fixture
  const snapshot = structuredClone(toRaw(fixture))
  return () => Object.assign(fixture, snapshot)
})

function renderView() {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: { en: enMessages }
  })
  render(EnvironmentsView, { global: { plugins: [getActivePinia()!, i18n] } })
  return userEvent.setup()
}

describe('environments page', () => {
  it('finds a deployment and saves its settings', async () => {
    const user = renderView()
    await user.type(
      screen.getByRole('textbox', { name: 'Search deployments…' }),
      'Matte'
    )
    expect(
      screen.queryByRole('button', { name: 'Open Acme Studio pipeline' })
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open Matte tests' }))
    const dialog = within(await screen.findByRole('dialog'))
    const name = dialog.getByRole('textbox', { name: 'Deployment name' })
    await user.clear(name)
    await user.type(name, 'Matte production')
    await user.clear(
      dialog.getByRole('spinbutton', { name: 'Keep warm (minutes)' })
    )
    await user.type(
      dialog.getByRole('spinbutton', { name: 'Keep warm (minutes)' }),
      '5'
    )
    await user.click(dialog.getByRole('button', { name: 'Save' }))
    expect(
      screen.getByRole('button', { name: 'Open Matte production' })
    ).toBeInTheDocument()
    expect(
      usePrototypePersonaStore().fixture.deployments?.find(
        (item) => item.id === 'dep-matte-tests'
      )?.warmMinutes
    ).toBe(5)
  })

  it('creates a deployment without assigning it to an unrelated project', async () => {
    const user = renderView()
    await user.click(screen.getByRole('button', { name: 'New deployment' }))
    const dialog = within(await screen.findByRole('dialog'))
    await user.type(
      dialog.getByRole('textbox', { name: 'Deployment name' }),
      'Product photos'
    )
    await user.click(dialog.getByRole('button', { name: 'Create deployment' }))
    const card = screen.getByRole('button', { name: 'Open Product photos' })
    expect(within(card).getByText('No projects')).toBeInTheDocument()
    expect(within(card).getByText('Sleeping')).toBeInTheDocument()
  })
})
