import { render, waitFor } from '@testing-library/vue'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { usePrototypeNavigationStore } from './navigationStore'

vi.mock('@/i18n', () => ({ t: (key: string) => key }))
vi.mock('@/platform/updates/common/toastStore', () => ({
  useToastStore: () => ({ add: vi.fn() })
}))

async function setupNavigation() {
  const page = defineComponent({ template: '<div />' })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'GraphView', component: page },
      {
        path: '/prototype/dashboard',
        name: 'PrototypeDashboard',
        component: page
      }
    ]
  })
  await router.push({ name: 'PrototypeDashboard' })
  let navigation: ReturnType<typeof usePrototypeNavigationStore> | undefined
  render(
    defineComponent({
      setup() {
        navigation = usePrototypeNavigationStore()
        return () => null
      }
    }),
    { global: { plugins: [createPinia(), router] } }
  )
  if (!navigation) throw new Error('Navigation store was not mounted')
  return { navigation, router }
}

describe('editor navigation', () => {
  it('waits for editor initialization before allowing workflow actions', async () => {
    const { navigation, router } = await setupNavigation()
    const opening = navigation.openEditor()
    await waitFor(() =>
      expect(router.currentRoute.value.name).toBe('GraphView')
    )
    expect(navigation.openingEditor).toBe(true)
    expect(await navigation.openEditor()).toBe(false)

    navigation.editorReady = true
    expect(await opening).toBe(true)
    expect(navigation.openingEditor).toBe(false)
  })

  it('does not open a workflow after the user returns Home during loading', async () => {
    const { navigation, router } = await setupNavigation()
    const opening = navigation.openEditor()
    await waitFor(() =>
      expect(router.currentRoute.value.name).toBe('GraphView')
    )
    await router.push({ name: 'PrototypeDashboard' })
    navigation.editorReady = true

    expect(await opening).toBe(false)
    expect(router.currentRoute.value.name).toBe('PrototypeDashboard')
  })

  it('does not wait for the editor when a route guard cancels navigation', async () => {
    const { navigation, router } = await setupNavigation()
    router.beforeEach(() => false)
    expect(await navigation.openEditor()).toBe(false)
    expect(navigation.openingEditor).toBe(false)
  })
})
