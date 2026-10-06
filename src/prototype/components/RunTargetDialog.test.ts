import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { getActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'

import enMessages from '@/locales/en/main.json' with { type: 'json' }

// The persona fixtures are module state the store mutates, so each test
// loads fresh copies and opens matte_pass in `projectId`.
async function setup(projectId: string, options?: { nothingRuns: boolean }) {
  vi.resetModules()
  const pinia = getActivePinia()
  if (!pinia) throw new Error('Expected the global testing Pinia')
  const { usePrototypeCustomCloudStore, RELOAD_MS } =
    await import('../stores/customCloudStore')
  const { default: RunTargetDialog } = await import('./RunTargetDialog.vue')
  const store = usePrototypeCustomCloudStore()

  vi.useFakeTimers()
  store.switchProject(projectId)
  vi.advanceTimersByTime(RELOAD_MS)
  vi.useRealTimers()
  store.dropIncompatibleWorkflow(options)

  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: { en: enMessages }
  })
  render(RunTargetDialog, { global: { plugins: [pinia, i18n] } })
  return { store, user: userEvent.setup() }
}

describe('RunTargetDialog', () => {
  it('offers a new project on the deployment that runs the workflow, or a new deployment', async () => {
    const { store, user } = await setup('proj-marketing')

    expect(
      screen.getByRole('heading', {
        name: "This workflow can't run on Comfy Cloud"
      })
    ).toBeInTheDocument()
    expect(screen.getByText('2 missing node packs')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveTextContent(
      'Acme Studio pipeline'
    )

    await user.click(screen.getByRole('combobox'))
    expect(screen.getByText('Missing 1 node pack')).toBeInTheDocument()
    await user.click(
      screen.getByRole('option', { name: /Create a new deployment/ })
    )
    await user.click(screen.getByRole('button', { name: 'Create deployment' }))

    expect(store.dialogStep).toBe('build')
    expect(
      screen.getByRole('heading', { name: 'Create a deployment' })
    ).toBeInTheDocument()
  })

  it('names a project on the deployment that runs it, and shares it with the people added', async () => {
    const { store, user } = await setup('proj-marketing')

    await user.click(screen.getByRole('button', { name: 'Create project' }))
    expect(screen.getByText('Runs on Acme Studio pipeline')).toBeInTheDocument()

    store.newProjectTier = 'restricted'
    expect(
      await screen.findByPlaceholderText('Add people by name or email')
    ).toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText('e.g. Summer Campaign'))
    await user.type(
      screen.getByPlaceholderText('e.g. Summer Campaign'),
      'Matte finals'
    )
    await user.click(screen.getByRole('button', { name: 'Create project' }))

    expect(store.dialogStep).toBeNull()
    expect(store.reloadingToId).not.toBeNull()
  })

  it.for([
    {
      projectId: 'proj-marketing',
      heading: "This workflow can't run on Comfy Cloud",
      primary: 'Create deployment',
      quiet: 'Update an existing deployment'
    },
    {
      projectId: 'proj-personal-rnd',
      heading: "This workflow can't run on Matte tests",
      primary: 'Update on Platform',
      quiet: 'Create a new deployment instead'
    }
  ])(
    'when nothing runs it, from $projectId, leads with "$primary"',
    async ({ projectId, heading, primary, quiet }) => {
      await setup(projectId, { nothingRuns: true })

      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: primary })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: quiet })).toBeInTheDocument()
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    }
  )

  it('asks before sending a build setting to Platform', async () => {
    const { store, user } = await setup('proj-marketing')
    store.dialogStep = 'build'

    await user.click(await screen.findByRole('button', { name: /Runtime/ }))

    expect(
      screen.getByRole('alertdialog', { name: 'Change Runtime on Platform?' })
    ).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(store.dialogStep).toBe('build')
  })

  it('deploys on the GPU picked, then shows the build without leaving the project', async () => {
    const { store, user } = await setup('proj-marketing')
    store.dialogStep = 'deploy'

    const create = await screen.findByRole('button', {
      name: 'Create deployment'
    })
    expect(create).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: /RTX PRO 6000/ }))
    expect(screen.getByText('$13.62')).toBeInTheDocument()

    await user.click(create)
    expect(
      await screen.findByRole('heading', { name: 'Building Matte R&D' })
    ).toBeInTheDocument()
    expect(store.reloadingToId).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Keep working' }))
    expect(store.dialogStep).toBeNull()
    expect(store.buildingDeployment?.name).toBe('Matte R&D')
  })
})
