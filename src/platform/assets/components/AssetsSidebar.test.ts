import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'

vi.mock('primevue/contextmenu', async () => {
  const { defineComponent } = await import('vue')
  return {
    default: defineComponent({
      name: 'ContextMenu',
      setup(_props, { expose }) {
        expose({
          show: vi.fn<(event: MouseEvent) => void>(),
          hide: vi.fn<() => void>()
        })
        return () => null
      }
    })
  }
})

import AssetsSidebar from '@/platform/assets/components/AssetsSidebar.vue'
import { useAssetTagGroups } from '@/platform/assets/composables/useAssetTagGroups'
import { useAssetTagSelectionStore } from '@/platform/assets/composables/useAssetTagSelectionStore'
import type { TagWithCount } from '@/platform/assets/composables/useAssetTags'

const messages = {
  en: {
    sideToolbar: {
      mediaAssets: {
        tagsHeader: 'Tags',
        noTagsHint: 'No tags',
        renameTag: 'Rename tag',
        foldersSidebar: {
          recent: 'Recent',
          favorites: 'Favorites',
          generatedHeader: 'Generated',
          importedHeader: 'Imported'
        },
        tagContextMenu: {
          delete: 'Delete tag',
          deleteMulti: 'Delete {count} tags',
          group: 'Group...',
          rename: 'Rename'
        },
        tagGroup: {
          namePlaceholder: 'Group name',
          allHeader: 'All',
          collapseAriaLabel: 'Toggle group {name}',
          dropTargetAriaLabel: 'Drop tag here',
          deleteConfirmTitle: 'Delete tags',
          deleteConfirmMessage: 'Remove {count} tag(s)?'
        }
      }
    }
  }
}

function createI18nInstance() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages
  })
}

const STORAGE_KEYS = [
  'Comfy.Assets.UserTagGroups.v1',
  'Comfy.Assets.SelectedTags.v1',
  'Comfy.Assets.TagGroupCollapsed.v1',
  'Comfy.Assets.TagsSectionCollapsed.v1'
]

function fallbackForKey(key: string): string {
  if (key.endsWith('SelectedTags.v1')) return '[]'
  if (key.endsWith('TagsSectionCollapsed.v1')) return 'false'
  return '{}'
}

function resetStorage() {
  for (const key of STORAGE_KEYS) {
    const fallback = fallbackForKey(key)
    localStorage.setItem(key, fallback)
    window.dispatchEvent(
      new StorageEvent('storage', {
        key,
        newValue: fallback,
        storageArea: localStorage
      })
    )
  }
}

function makeTags(...names: string[]): TagWithCount[] {
  return names.map((name) => ({ name, count: 1 }))
}

function rowButton(name: string): HTMLElement {
  return screen.getByRole('button', { name: new RegExp(`^${name}\\b`) })
}

function mountSidebar(availableTags: TagWithCount[]) {
  const pinia = createPinia()
  const i18n = createI18nInstance()
  return render(AssetsSidebar, {
    global: { plugins: [pinia, i18n] },
    props: { availableTags }
  })
}

describe('AssetsSidebar', () => {
  beforeEach(() => {
    resetStorage()
  })

  afterEach(() => {
    resetStorage()
  })

  it('plain click replaces the tag selection and emits selectionChanged', async () => {
    const { emitted } = mountSidebar(makeTags('hero', 'sidekick'))
    const user = userEvent.setup()
    const tagSelection = useAssetTagSelectionStore()

    tagSelection.add('sidekick')
    await user.click(rowButton('hero'))

    expect(tagSelection.asArray).toEqual(['hero'])
    expect(emitted()['selectionChanged']).toBeTruthy()
  })

  it('cmd-click toggles a tag without clearing the rest of the selection', async () => {
    mountSidebar(makeTags('hero', 'sidekick', 'villain'))
    const user = userEvent.setup()
    const tagSelection = useAssetTagSelectionStore()

    tagSelection.add('hero')
    await user.keyboard('{Meta>}')
    await user.click(rowButton('sidekick'))
    await user.keyboard('{/Meta}')

    expect(tagSelection.asArray.sort()).toEqual(['hero', 'sidekick'])
  })

  it('shift-click selects the inclusive range from the last clicked tag', async () => {
    mountSidebar(makeTags('alpha', 'beta', 'gamma', 'delta'))
    const user = userEvent.setup()
    const tagSelection = useAssetTagSelectionStore()

    await user.click(rowButton('alpha'))
    await user.keyboard('{Shift>}')
    await user.click(rowButton('gamma'))
    await user.keyboard('{/Shift}')

    expect(tagSelection.asArray.sort()).toEqual(['alpha', 'beta', 'gamma'])
  })

  it('shift-click within a group only selects tags from that group', async () => {
    const pinia = createPinia()
    const i18n = createI18nInstance()
    render(AssetsSidebar, {
      global: { plugins: [pinia, i18n] },
      props: {
        availableTags: makeTags(
          'alpha',
          'beta',
          'cat',
          'delta',
          'dinosaur',
          'rabbit'
        )
      }
    })
    const groups = useAssetTagGroups()
    groups.assignTagsToGroup(['cat', 'dinosaur', 'rabbit'], 'Animals')
    await new Promise((resolve) => setTimeout(resolve, 0))

    const user = userEvent.setup()
    const tagSelection = useAssetTagSelectionStore()
    // Group rows render before "All" rows; index 0 = the in-group instance.
    const catRow = screen.getAllByRole('button', { name: /^cat\b/ })[0]
    const rabbitRow = screen.getAllByRole('button', { name: /^rabbit\b/ })[0]

    await user.click(catRow)
    await user.keyboard('{Shift>}')
    await user.click(rabbitRow)
    await user.keyboard('{/Shift}')

    expect(tagSelection.asArray.sort()).toEqual(['cat', 'dinosaur', 'rabbit'])
  })

  it('hides the All header when there are no groups', () => {
    mountSidebar(makeTags('hero', 'sidekick'))
    expect(screen.queryByText('All')).toBeNull()
  })

  it('renders group headers and shows the ungrouped header alongside them', async () => {
    const pinia = createPinia()
    const i18n = createI18nInstance()
    render(AssetsSidebar, {
      global: { plugins: [pinia, i18n] },
      props: { availableTags: makeTags('hero', 'sidekick', 'villain') }
    })

    const groups = useAssetTagGroups()
    groups.assignTagsToGroup(['hero'], 'characters')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(screen.getByText('characters')).toBeTruthy()
    expect(screen.getByText('All')).toBeTruthy()
  })

  it('drops a tag onto the ungrouped header to remove it from any group', async () => {
    const pinia = createPinia()
    const i18n = createI18nInstance()
    render(AssetsSidebar, {
      global: { plugins: [pinia, i18n] },
      props: { availableTags: makeTags('hero', 'sidekick') }
    })

    const groups = useAssetTagGroups()
    groups.assignTagsToGroup(['hero'], 'characters')
    await new Promise((resolve) => setTimeout(resolve, 0))

    const ungroupedHeader = screen.getByText('All')
    const data = JSON.stringify(['hero'])
    const event = new Event('drop', { bubbles: true }) as Event & {
      dataTransfer: DataTransfer
    }
    Object.defineProperty(event, 'dataTransfer', {
      value: {
        types: ['application/x-comfy-tag-names'],
        getData: (mime: string) =>
          mime === 'application/x-comfy-tag-names' ? data : '',
        setData: vi.fn<(format: string, data: string) => void>(),
        dropEffect: 'move',
        effectAllowed: 'move'
      }
    })
    ungroupedHeader.dispatchEvent(event)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(groups.getGroupOf('hero')).toBeNull()
  })

  it('marks selected rows with aria-pressed when selection is non-empty', async () => {
    const pinia = createPinia()
    const i18n = createI18nInstance()
    render(AssetsSidebar, {
      global: { plugins: [pinia, i18n] },
      props: { availableTags: makeTags('hero', 'sidekick') }
    })

    const tagSelection = useAssetTagSelectionStore()
    tagSelection.add('hero')
    await new Promise((resolve) => setTimeout(resolve, 0))

    const pressed = screen
      .getAllByRole('button', { pressed: true })
      .map((el) => el.textContent?.trim())
    expect(pressed.some((text) => text?.startsWith('hero'))).toBe(true)
  })
})
