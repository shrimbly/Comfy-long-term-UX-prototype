import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '@/i18n'
import { usePrototypeCustomNodesStore } from '../stores/customNodesStore'
import HomesteadCloudBuildOptions from './HomesteadCloudBuildOptions.vue'
import HomesteadBuild from './HomesteadBuild.vue'
import { useHomesteadStore } from './store'

function setup(version: 1 | 2 | 3 = 2) {
  const s = useHomesteadStore()
  s.setVersion(version)
  const nodes = usePrototypeCustomNodesStore()
  nodes.open()
  return { s, nodes, global: { plugins: [i18n] } }
}

describe('version-specific custom node flows', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    window.history.replaceState({}, '', '/prototype/homestead')
    i18n.global.locale.value = 'en'
  })

  it('opens an informational handoff in V1 and cannot start a catalog build', () => {
    const { s, nodes } = setup(1)
    expect(s.dialog).toBe('nodesInfo')
    expect(nodes.isOpen).toBe(false)
    nodes.selected = ['extra-pack']
    nodes.requestInstall()
    expect(s.build.phase).toBe('idle')
  })

  it('accepts private archives, rejects invalid files, and supports a named new build', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
      applyAccept: false
    })
    const { s, nodes, global } = setup()
    render(HomesteadCloudBuildOptions, { global })
    expect(
      screen.getByRole('radio', { name: 'Update current build' })
    ).toBeChecked()
    await user.upload(
      screen.getByLabelText('Private custom nodes'),
      new File(['source'], 'studio.zip')
    )
    expect(screen.getByText('studio.zip')).toBeVisible()
    await user.upload(
      screen.getByLabelText('Private custom nodes'),
      new File(['source'], 'invalid.txt')
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose a non-empty .zip or .tar.gz archive.'
    )
    expect(nodes.privateArchives).toEqual(['studio.zip'])
    nodes.requestInstall()
    expect(s.build.phase).toBe('idle')
    await user.upload(
      screen.getByLabelText('Private custom nodes'),
      new File(['source'], 'tools.tar.gz')
    )
    await user.click(screen.getByRole('radio', { name: 'Create new build' }))
    await fireEvent.update(
      screen.getByRole('textbox', { name: 'Build name' }),
      'Studio custom'
    )
    nodes.requestInstall()
    vi.advanceTimersByTime(4000)
    expect(s.updateEnvironment).toMatchObject({
      name: 'Studio custom',
      revision: 'v1'
    })
    expect(s.updateEnvironment?.packs).toContain('private:studio.zip')
    expect(s.updateEnvironment?.packs).toContain('private:tools.tar.gz')
    expect(s.updateEnvironment?.buildId).toBe(s.updateEnvironment?.id)
    expect(s.environment.id).toBe('studio')
    expect(s.agentRun).toBeNull()
  })

  it('asks before switching to an updated build and keeps the old revision intact', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
      applyAccept: false
    })
    const { s, nodes, global } = setup()
    nodes.selected = ['new-pack']
    nodes.requestInstall()
    render(HomesteadBuild, { global })
    vi.advanceTimersByTime(4000)
    expect(s.environment.revision).toBe('v12')
    expect(s.updateEnvironment).toMatchObject({
      revision: 'v13',
      buildId: 'studio'
    })
    expect(s.environment.packs).not.toContain('new-pack')
    await user.click(
      await screen.findByRole('button', { name: 'Switch to new build' })
    )
    expect(s.environment.revision).toBe('v13')
    expect(s.environment.packs).toContain('new-pack')
    expect(s.agentOpen).toBe(false)
  })

  it.for(['build', 'deployment'] as const)(
    'hands a %s failure and captured inputs to the agent for repair',
    async (failure) => {
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
        applyAccept: false
      })
      const { s, nodes, global } = setup()
      s.failure = failure
      nodes.selected = ['selected-pack']
      nodes.addArchives([new File(['source'], 'private.zip')])
      nodes.requestInstall()
      vi.advanceTimersByTime(4000)
      render(HomesteadBuild, { global })
      expect(screen.getByRole('alert')).toHaveTextContent('failed')
      expect(
        screen.queryByRole('button', { name: 'Switch to new build' })
      ).not.toBeInTheDocument()
      const originalWorkflow = s.activeId
      s.activeId = 'matte'
      await user.click(screen.getByRole('button', { name: 'Fix with agent' }))
      expect(s.agentRun?.workflow.id).toBe(originalWorkflow)
      expect(s.agentRun?.request.instructions).toContain('private:private.zip')
      expect(s.agentRun?.request.instructions).toContain('failed')
      expect(s.agentRun?.request.mode).toBe('update')
      vi.advanceTimersByTime(18000)
      expect(s.build.phase).toBe('ready')
      expect(s.environment.revision).toBe('v12')
      expect(s.updateEnvironment?.packs).toContain('selected-pack')
    }
  )

  it('switches only the confirmed project while all its workflows inherit the same build', () => {
    const { s, nodes } = setup(3)
    s.projectId = 'project-a'
    s.projectEnvironments = { 'project-a': 'studio', 'project-b': 'fast' }
    s.projectEnvironmentId = 'studio'
    s.workflows[0].projectId = 'project-a'
    s.workflows[1].projectId = 'project-a'
    nodes.selected = ['new-pack']
    nodes.requestInstall()
    vi.advanceTimersByTime(4000)
    const newId = s.updateEnvironment!.id
    s.openBuilt()
    expect(s.pendingEnvironmentId).toBe(newId)
    expect(s.projectEnvironments['project-a']).toBe('studio')
    s.switchEnvironment(newId, true)
    expect(s.projectEnvironments).toEqual({
      'project-a': newId,
      'project-b': 'fast'
    })
    s.openWorkflow('matte')
    expect(s.environment.id).toBe(newId)
    s.openWorkflow('product')
    expect(s.environment.id).toBe(newId)
  })
})
