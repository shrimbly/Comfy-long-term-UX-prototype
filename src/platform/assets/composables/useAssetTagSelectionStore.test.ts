import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAssetTagSelectionStore } from './useAssetTagSelectionStore'

const STORAGE_KEY = 'Comfy.Assets.SelectedTags.v1'

function resetStorage() {
  localStorage.setItem(STORAGE_KEY, '[]')
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: '[]',
      storageArea: localStorage
    })
  )
}

describe('useAssetTagSelectionStore', () => {
  beforeEach(() => {
    resetStorage()
    setActivePinia(createPinia())
  })

  it('starts empty', () => {
    const store = useAssetTagSelectionStore()
    expect(store.hasSelection).toBe(false)
    expect(store.size).toBe(0)
    expect(store.asArray).toEqual([])
  })

  it('adds and reports membership', () => {
    const store = useAssetTagSelectionStore()
    store.add('hero')
    expect(store.isSelected('hero')).toBe(true)
    expect(store.hasSelection).toBe(true)
    expect(store.size).toBe(1)
  })

  it('does not duplicate adds', () => {
    const store = useAssetTagSelectionStore()
    store.add('hero')
    store.add('hero')
    store.add(' hero ')
    expect(store.asArray).toEqual(['hero'])
  })

  it('removes a tag', () => {
    const store = useAssetTagSelectionStore()
    store.add('hero')
    store.add('sidekick')
    store.remove('hero')
    expect(store.asArray).toEqual(['sidekick'])
  })

  it('toggles', () => {
    const store = useAssetTagSelectionStore()
    store.toggle('hero')
    expect(store.isSelected('hero')).toBe(true)
    store.toggle('hero')
    expect(store.isSelected('hero')).toBe(false)
  })

  it('setMany dedupes and trims', () => {
    const store = useAssetTagSelectionStore()
    store.setMany(['hero', ' hero ', 'sidekick', ''])
    expect(new Set(store.asArray)).toEqual(new Set(['hero', 'sidekick']))
  })

  it('clear empties selection', () => {
    const store = useAssetTagSelectionStore()
    store.setMany(['hero', 'sidekick'])
    store.clear()
    expect(store.hasSelection).toBe(false)
  })

  it('pruneMissing drops tags not in the existing set', () => {
    const store = useAssetTagSelectionStore()
    store.setMany(['hero', 'ghost', 'sidekick'])
    store.pruneMissing(new Set(['hero', 'sidekick']))
    expect(store.asArray.sort()).toEqual(['hero', 'sidekick'])
  })
})
