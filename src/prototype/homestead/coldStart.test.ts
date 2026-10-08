import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { i18n } from '@/i18n'
import HomesteadJobStatus from './HomesteadJobStatus.vue'
import { useHomesteadStore } from './store'

function setup() {
  const s = useHomesteadStore()
  s.openWorkflow('product')
  vi.advanceTimersByTime(1800)
  return { s, global: { plugins: [i18n] } }
}
describe('job cold starts', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    window.history.replaceState({}, '', '/prototype/homestead')
    i18n.global.locale.value = 'en'
  })

  it('shows preparation only during cold start and removes it when normal execution begins', async () => {
    const { s, global } = setup()
    render(HomesteadJobStatus, { global })
    expect(
      screen.queryByRole('complementary', { name: 'Job status' })
    ).not.toBeInTheDocument()
    expect(s.runtime).toBe('ready')
    expect(s.run()).toBe(true)
    expect(s.run()).toBe(false)
    await nextTick()
    expect(s.jobs).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('Preparing your job')
    expect(screen.getByRole('status')).toHaveTextContent(
      '20 seconds to 4–5 minutes'
    )
    expect(s.runtime).toBe('ready')
    s.active.prompt = 'Edited while preparing'
    vi.advanceTimersByTime(4000)
    await nextTick()
    expect(screen.getByText('0:04 elapsed')).toBeVisible()
    expect(s.activeJob?.status).toBe('cold-start')
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(s.activeJob?.status).toBe('running')
    expect(
      screen.queryByRole('complementary', { name: 'Job status' })
    ).not.toBeInTheDocument()
    expect(s.active.prompt).toBe('Edited while preparing')
    vi.advanceTimersByTime(3200)
    await nextTick()
    expect(s.jobs.at(-1)?.status).toBe('completed')
    expect(s.activeJob).toBeUndefined()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('keeps warm jobs fast and repeats the cold start after sleep', () => {
    const { s } = setup()
    s.run()
    vi.advanceTimersByTime(8200)
    s.run()
    expect(s.activeJob?.status).toBe('running')
    vi.advanceTimersByTime(3200)
    expect(s.sleep()).toBe(true)
    s.run()
    vi.advanceTimersByTime(1800)
    expect(s.activeJob?.status).toBe('cold-start')
  })

  it('prevents idle sleep during the accelerated cold start', () => {
    const { s } = setup()
    s.idleMinutes = 1 / 60
    s.resetIdle()
    s.run()
    vi.advanceTimersByTime(4000)
    expect(s.activeJob?.status).toBe('cold-start')
    expect(s.sleep()).toBe(false)
    expect(s.runtime).toBe('ready')
    vi.advanceTimersByTime(1000)
    expect(s.activeJob?.status).toBe('running')
  })

  it('cancels a waiting job without letting its timer restart or complete it', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
      applyAccept: false
    })
    const { s, global } = setup()
    render(HomesteadJobStatus, { global })
    s.run()
    await nextTick()
    await user.click(screen.getByRole('button', { name: 'Cancel job' }))
    expect(s.jobs[0]?.status).toBe('cancelled')
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    s.run()
    expect(s.jobs[0]?.id).not.toBe(s.jobs[1]?.id)
    vi.advanceTimersByTime(8200)
    expect(s.jobs.map((job) => job.status)).toEqual(['cancelled', 'completed'])
  })
})
