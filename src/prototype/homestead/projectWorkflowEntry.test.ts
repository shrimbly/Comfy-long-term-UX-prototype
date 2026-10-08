import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import WorkflowCard from '../components/WorkflowCard.vue'
import { adminFixture } from '../fixtures/admin'

function setup(openOnClick: boolean) {
  const workflow = adminFixture.workflows.find(
    (w) => w.projectId === 'proj-cocacola'
  )!
  const result = render(WorkflowCard, {
    props: { workflow, actions: 'published', openOnClick, selectable: true },
    global: {
      plugins: [i18n],
      stubs: { WorkflowContextMenu: true, WorkflowVersionBadge: true }
    }
  })
  return {
    ...result,
    workflow,
    card: screen.getByRole('button', { name: new RegExp(workflow.name) })
  }
}
describe('project workflow entry', () => {
  it('opens a V3 published workflow on click while keeping modifier-click selection', async () => {
    const user = userEvent.setup()
    const { card, emitted, workflow } = setup(true)
    await user.keyboard('{Control>}')
    await user.click(card)
    await user.keyboard('{/Control}')
    expect(emitted().open).toBeUndefined()
    expect(emitted().select).toHaveLength(1)
    await user.click(card)
    expect(emitted().open).toEqual([[workflow.id]])
    await user.dblClick(card)
    expect(emitted().open).toEqual([[workflow.id], [workflow.id]])
  })
  it('retains the original published-card behavior outside the preview', async () => {
    const user = userEvent.setup()
    const { card, emitted } = setup(false)
    await user.click(card)
    await user.dblClick(card)
    expect(emitted().open).toBeUndefined()
  })
})
