import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '@/i18n'
import { usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import HomesteadToolbar from './HomesteadToolbar.vue'
import { useHomesteadStore } from './store'

function setup() {
  const s = useHomesteadStore()
  s.openWorkflow('matte', 'desktop')
  usePrototypeTabsStore().openWorkflow('Matte pass', 'matte_pass')
  render(HomesteadToolbar, { global: { plugins: [i18n] } })
  return s
}
describe('prototype preview navigation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    window.history.replaceState({}, '', '/prototype/homestead')
    i18n.global.locale.value = 'en'
  })
  it('switches between Local and a compatible Cloud build without changing the workflow', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const s = setup()
    s.active.environmentId = 'fast'
    expect(screen.getByRole('button', { name: 'Local' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await user.click(screen.getByRole('button', { name: 'Cloud' }))
    expect(s.entry).toBe('cloud')
    expect(s.compatible.status).toBe('compatible')
    expect(s.activeId).toBe('matte')
    expect(screen.getByRole('button', { name: 'Cloud' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await user.click(screen.getByRole('button', { name: 'Local' }))
    expect(s.entry).toBe('desktop')
    expect(s.activeId).toBe('matte')
  })
  it('opens the original Projects view for the V3 Cloud preview', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const s = setup()
    s.setVersion(3)
    await user.click(screen.getByRole('button', { name: 'Cloud' }))
    expect(s.entry).toBe('cloud')
    expect(usePrototypeUiStore().activeView.kind).toBe('projects')
    expect(usePrototypeTabsStore().activeTabId).toBe('home')
    await user.click(screen.getByRole('button', { name: 'Local' }))
    expect(s.entry).toBe('desktop')
    expect(s.activeId).toBe('matte')
  })
})
