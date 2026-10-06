import { render, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { getActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'

import enMessages from '@/locales/en/main.json' with { type: 'json' }

import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import ProjectSwitcher from './ProjectSwitcher.vue'

async function setup() {
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
  const customCloud = usePrototypeCustomCloudStore()
  render(ProjectSwitcher, {
    props: { project: customCloud.currentProject! },
    global: { plugins: [getActivePinia()!, router, i18n] }
  })
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Switch project' }))
  const search = screen.getByRole('textbox', { name: 'Search projects' })
  await waitFor(() => expect(search).toHaveFocus())
  return { customCloud, router, user }
}

const optionNames = () =>
  screen.queryAllByRole('option').map((o) => o.textContent.trim())

describe('ProjectSwitcher menu', () => {
  it('narrows the projects to names that match what you type', async () => {
    const { user } = await setup()
    expect(screen.getByRole('group', { name: 'Recent' })).toBeVisible()

    await user.keyboard('MA')
    expect(optionNames().toSorted()).toEqual(['Marketing 2026', 'The Matrix'])
    expect(screen.queryByRole('group', { name: 'Recent' })).toBeNull()

    await user.keyboard('zebra')
    expect(optionNames()).toEqual([])
    expect(screen.getByText('No projects match “MAzebra”')).toBeVisible()
  })

  it('switches to the project picked with the arrow keys and Enter', async () => {
    const { customCloud, router, user } = await setup()
    await user.keyboard('ma')
    const [, second] = screen.getAllByRole('option')
    await user.keyboard('{ArrowDown}{Enter}')

    const picked = customCloud.switchableProjects.find(
      (p) => p.name === second.textContent.trim()
    )
    expect(customCloud.switcherOpen).toBe(false)
    expect(router.currentRoute.value.name).toBe('PrototypeDashboard')
    expect(customCloud.currentProject?.id).toBe(picked?.id)
  })

  it('closes on Escape without switching', async () => {
    const { customCloud, user } = await setup()
    const startId = customCloud.currentProject?.id
    await user.keyboard('ma{Escape}')
    expect(customCloud.switcherOpen).toBe(false)
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(customCloud.currentProject?.id).toBe(startId)
  })
})
