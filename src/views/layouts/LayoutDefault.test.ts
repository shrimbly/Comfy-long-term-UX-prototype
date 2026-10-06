import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import LayoutDefault from './LayoutDefault.vue'

vi.mock('@/views/GraphView.vue', () => ({
  default: defineComponent({
    template: '<input aria-label="Workflow prompt" />'
  })
}))

vi.mock('@/prototype/components/PrototypeTabs.vue', () => ({
  default: defineComponent({ template: '<nav aria-label="Workspace tabs" />' })
}))

vi.mock('@/platform/workspace/auth/WorkspaceAuthGate.vue', () => ({
  default: defineComponent({ template: '<slot />' })
}))

describe('workspace layout', () => {
  it('keeps the editor and its edits alive while Home is open', async () => {
    const user = userEvent.setup()
    const home = defineComponent({ template: '<h1>Home</h1>' })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          component: LayoutDefault,
          children: [
            { path: '', name: 'GraphView', component: home },
            {
              path: 'prototype/dashboard',
              name: 'PrototypeDashboard',
              component: home
            }
          ]
        }
      ]
    })
    await router.push({ name: 'PrototypeDashboard' })
    render(defineComponent({ template: '<router-view />' }), {
      global: { plugins: [router] }
    })

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    await router.push({ name: 'GraphView' })
    const prompt = await screen.findByRole('textbox', {
      name: 'Workflow prompt'
    })
    await user.type(prompt, 'Keep this unsaved edit')

    await router.push({ name: 'PrototypeDashboard' })
    expect(screen.getByRole('heading', { name: 'Home' })).toBeVisible()
    expect(prompt).not.toBeVisible()
    expect(screen.getByRole('main', { hidden: true })).toHaveAttribute('inert')
    expect(screen.getAllByRole('navigation')).toHaveLength(1)

    await router.push({ name: 'GraphView' })
    expect(screen.getByRole('textbox')).toBe(prompt)
    expect(prompt).toHaveValue('Keep this unsaved edit')
    expect(prompt).toBeVisible()
  })
})
