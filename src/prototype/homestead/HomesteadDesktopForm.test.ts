import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '@/i18n'
import HomesteadDesktopForm from './HomesteadDesktopForm.vue'
import HomesteadCloudButton from './HomesteadCloudButton.vue'
import { useHomesteadStore } from './store'

function setup() {
  const s = useHomesteadStore()
  s.entry = 'desktop'
  s.activeId = 'matte'
  s.dialog = 'desktop'
  return { s, global: { plugins: [i18n] } }
}

describe('Desktop cloud controls', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    window.history.replaceState({}, '', '/prototype/homestead?v=1')
    i18n.global.locale.value = 'en'
  })

  it('submits the edited build name, GPU, and instructions', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
      applyAccept: false
    })
    const { s, global } = setup()
    render(HomesteadDesktopForm, { global })
    expect(
      screen.getByRole('radio', { name: 'Create new build' })
    ).toBeChecked()
    expect(screen.getByRole('textbox', { name: 'Build name' })).toHaveValue(
      'Matte pass Cloud'
    )
    expect(
      screen.queryByRole('combobox', { name: /Existing build/ })
    ).not.toBeInTheDocument()
    await fireEvent.update(
      screen.getByRole('textbox', { name: 'Build name' }),
      ''
    )
    expect(screen.getByRole('button', { name: 'Send to agent' })).toBeDisabled()
    await fireEvent.update(
      screen.getByRole('textbox', { name: 'Build name' }),
      'My studio build'
    )
    await fireEvent.update(
      screen.getByRole('combobox', { name: 'GPU' }),
      'B200'
    )
    await fireEvent.update(
      screen.getByRole('textbox', { name: 'Instructions for the agent' }),
      'Preserve my models'
    )
    await user.click(screen.getByRole('button', { name: 'Send to agent' }))
    expect(s.agentRun?.request).toEqual({
      mode: 'create',
      name: 'My studio build',
      gpu: 'B200',
      instructions: 'Preserve my models'
    })
    expect(s.dialog).toBeNull()
    expect(s.agentOpen).toBe(true)
  })

  it('prefills an existing build and submits an update for that build', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
      applyAccept: false
    })
    const { s, global } = setup()
    render(HomesteadDesktopForm, { global })
    await user.click(
      screen.getByRole('radio', { name: 'Update existing build' })
    )
    const selector = screen.getByRole('combobox', { name: /Existing build/ })
    await fireEvent.update(selector, 'fast')
    expect(screen.getByRole('textbox', { name: 'Build name' })).toHaveValue(
      'Lightweight preview'
    )
    await user.click(screen.getByRole('button', { name: 'Send to agent' }))
    expect(s.agentRun?.request).toMatchObject({
      mode: 'update',
      sourceId: 'fast',
      name: 'Lightweight preview'
    })
    expect(s.environment.id).toBe('studio')
  })

  it('opens the same form from the secondary Run on cloud action', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
      applyAccept: false
    })
    const { s, global } = setup()
    s.dialog = null
    render(HomesteadCloudButton, { global })
    await user.click(screen.getByRole('button', { name: 'Run on cloud' }))
    expect(s.dialog).toBe('desktop')
  })
})
