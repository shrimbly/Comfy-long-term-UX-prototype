import { beforeEach, describe, expect, it } from 'vitest'

import type { AssetItem } from '@/platform/assets/schemas/assetSchema'

import { assetTagStorageKey, isUserTag, useAssetTags } from './useAssetTags'

function makeAsset(overrides: Partial<AssetItem> = {}): AssetItem {
  return {
    id: overrides.id ?? 'asset-1',
    name: overrides.name ?? 'image.png',
    tags: overrides.tags ?? ['output'],
    user_metadata: overrides.user_metadata ?? {},
    ...overrides
  } as AssetItem
}

const STORAGE_KEY = 'Comfy.Assets.UserTags.v1'

function resetTagStorage() {
  localStorage.setItem(STORAGE_KEY, '{}')
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: '{}',
      storageArea: localStorage
    })
  )
}

describe('useAssetTags', () => {
  beforeEach(() => {
    resetTagStorage()
  })

  describe('isUserTag', () => {
    it('rejects system and favorite-* tags', () => {
      expect(isUserTag('output')).toBe(false)
      expect(isUserTag('input')).toBe(false)
      expect(isUserTag('temp')).toBe(false)
      expect(isUserTag('favorite-yellow')).toBe(false)
      expect(isUserTag('')).toBe(false)
      expect(isUserTag('   ')).toBe(false)
    })

    it('accepts arbitrary user tags', () => {
      expect(isUserTag('hero')).toBe(true)
      expect(isUserTag('client-work')).toBe(true)
    })
  })

  describe('assetTagStorageKey', () => {
    it('uses asset type and full path so subfolder files have unique keys', () => {
      const a = makeAsset({ name: 'a/file.png', tags: ['output'] })
      const b = makeAsset({ name: 'b/file.png', tags: ['output'] })
      expect(assetTagStorageKey(a)).toBe('output:a/file.png')
      expect(assetTagStorageKey(b)).toBe('output:b/file.png')
      expect(assetTagStorageKey(a)).not.toBe(assetTagStorageKey(b))
    })

    it('separates input and output namespaces', () => {
      const out = makeAsset({ name: 'x.png', tags: ['output'] })
      const inp = makeAsset({ name: 'x.png', tags: ['input'] })
      expect(assetTagStorageKey(out)).toBe('output:x.png')
      expect(assetTagStorageKey(inp)).toBe('input:x.png')
    })
  })

  describe('add / get / remove / hasTag', () => {
    it('persists tags across composable instances', () => {
      const asset = makeAsset()
      useAssetTags().addTag(asset, 'hero')
      expect(useAssetTags().getTags(asset)).toEqual(['hero'])
      expect(useAssetTags().hasTag(asset, 'hero')).toBe(true)
    })

    it('ignores duplicates and trims whitespace', () => {
      const { addTag, getTags } = useAssetTags()
      const asset = makeAsset()
      addTag(asset, 'hero')
      addTag(asset, ' hero ')
      expect(getTags(asset)).toEqual(['hero'])
    })

    it('refuses to add system or favorite tags', () => {
      const { addTag, getTags } = useAssetTags()
      const asset = makeAsset()
      addTag(asset, 'output')
      addTag(asset, 'favorite-yellow')
      expect(getTags(asset)).toEqual([])
    })

    it('removes a tag', () => {
      const { addTag, removeTag, getTags } = useAssetTags()
      const asset = makeAsset()
      addTag(asset, 'hero')
      addTag(asset, 'sidekick')
      removeTag(asset, 'hero')
      expect(getTags(asset)).toEqual(['sidekick'])
    })

    it('clears the storage entry when the last tag is removed', () => {
      const { addTag, removeTag } = useAssetTags()
      const asset = makeAsset()
      addTag(asset, 'hero')
      removeTag(asset, 'hero')
      const raw = JSON.parse(
        localStorage.getItem('Comfy.Assets.UserTags.v1') ?? '{}'
      ) as Record<string, string[]>
      expect(raw[assetTagStorageKey(asset)]).toBeUndefined()
    })
  })

  describe('setTags', () => {
    it('replaces, dedupes, sorts, and filters system tags', () => {
      const { setTags, getTags } = useAssetTags()
      const asset = makeAsset()
      setTags(asset, ['banana', 'apple', 'banana', 'output', '  cherry '])
      expect(getTags(asset)).toEqual(['apple', 'banana', 'cherry'])
    })
  })

  describe('allTags', () => {
    it('reports counts across assets, sorted by name', () => {
      const { addTag, allTags } = useAssetTags()
      const a = makeAsset({ name: 'a.png' })
      const b = makeAsset({ name: 'b.png' })
      addTag(a, 'zeta')
      addTag(a, 'alpha')
      addTag(b, 'alpha')
      expect(allTags.value).toEqual([
        { name: 'alpha', count: 2 },
        { name: 'zeta', count: 1 }
      ])
    })
  })

  describe('renameTag', () => {
    it('renames a tag across all assets', () => {
      const { addTag, renameTag, allTags, getTags } = useAssetTags()
      const a = makeAsset({ name: 'a.png' })
      const b = makeAsset({ name: 'b.png' })
      addTag(a, 'hero')
      addTag(b, 'hero')
      expect(renameTag('hero', 'protagonist')).toBe('protagonist')
      expect(getTags(a)).toEqual(['protagonist'])
      expect(getTags(b)).toEqual(['protagonist'])
      expect(allTags.value.map((t) => t.name)).toEqual(['protagonist'])
    })

    it('merges into an existing tag without duplicating', () => {
      const { addTag, renameTag, getTags, allTags } = useAssetTags()
      const a = makeAsset({ name: 'a.png' })
      const b = makeAsset({ name: 'b.png' })
      addTag(a, 'hero')
      addTag(a, 'sidekick')
      addTag(b, 'sidekick')
      expect(renameTag('hero', 'sidekick')).toBe('sidekick')
      expect(getTags(a)).toEqual(['sidekick'])
      expect(allTags.value).toEqual([{ name: 'sidekick', count: 2 }])
    })

    it('rejects empty / whitespace / system / favorite targets', () => {
      const { addTag, renameTag, getTags } = useAssetTags()
      const a = makeAsset()
      addTag(a, 'hero')
      expect(renameTag('hero', '')).toBeNull()
      expect(renameTag('hero', '   ')).toBeNull()
      expect(renameTag('hero', 'output')).toBeNull()
      expect(renameTag('hero', 'favorite-yellow')).toBeNull()
      expect(getTags(a)).toEqual(['hero'])
    })

    it('returns null and does nothing when oldName is not present', () => {
      const { addTag, renameTag, getTags } = useAssetTags()
      const a = makeAsset()
      addTag(a, 'hero')
      expect(renameTag('missing', 'newname')).toBeNull()
      expect(getTags(a)).toEqual(['hero'])
    })

    it('is a no-op when names are equal (after trim) and the tag exists', () => {
      const { addTag, renameTag, getTags } = useAssetTags()
      const a = makeAsset()
      addTag(a, 'hero')
      expect(renameTag('hero', 'hero')).toBe('hero')
      expect(getTags(a)).toEqual(['hero'])
    })
  })

  describe('assetsWithTag', () => {
    it('filters assets that carry the tag', () => {
      const { addTag, assetsWithTag } = useAssetTags()
      const a = makeAsset({ name: 'a.png' })
      const b = makeAsset({ name: 'b.png' })
      const c = makeAsset({ name: 'c.png' })
      addTag(a, 'hero')
      addTag(c, 'hero')
      const result = assetsWithTag([a, b, c], 'hero')
      expect(result.map((x) => x.name)).toEqual(['a.png', 'c.png'])
    })
  })

  describe('assetsWithAnyTag', () => {
    it('returns all assets when the tag list is empty', () => {
      const { assetsWithAnyTag } = useAssetTags()
      const a = makeAsset({ name: 'a.png' })
      const b = makeAsset({ name: 'b.png' })
      expect(assetsWithAnyTag([a, b], []).map((x) => x.name)).toEqual([
        'a.png',
        'b.png'
      ])
    })

    it('returns assets matching ANY of the supplied tags (OR semantics)', () => {
      const { addTag, assetsWithAnyTag } = useAssetTags()
      const a = makeAsset({ name: 'a.png' })
      const b = makeAsset({ name: 'b.png' })
      const c = makeAsset({ name: 'c.png' })
      addTag(a, 'hero')
      addTag(b, 'sidekick')
      const result = assetsWithAnyTag([a, b, c], ['hero', 'sidekick'])
      expect(result.map((x) => x.name)).toEqual(['a.png', 'b.png'])
    })

    it('does not double-count an asset that has multiple matching tags', () => {
      const { addTag, assetsWithAnyTag } = useAssetTags()
      const a = makeAsset({ name: 'a.png' })
      addTag(a, 'hero')
      addTag(a, 'sidekick')
      const result = assetsWithAnyTag([a], ['hero', 'sidekick'])
      expect(result).toHaveLength(1)
    })
  })

  describe('removeTagEverywhere', () => {
    it('strips the tag from every asset record', () => {
      const { addTag, removeTagEverywhere, getTags } = useAssetTags()
      const a = makeAsset({ name: 'a.png' })
      const b = makeAsset({ name: 'b.png' })
      addTag(a, 'hero')
      addTag(a, 'sidekick')
      addTag(b, 'hero')
      removeTagEverywhere('hero')
      expect(getTags(a)).toEqual(['sidekick'])
      expect(getTags(b)).toEqual([])
    })

    it('drops empty entries after the last tag is gone', () => {
      const { addTag, removeTagEverywhere } = useAssetTags()
      const a = makeAsset({ name: 'a.png' })
      addTag(a, 'hero')
      removeTagEverywhere('hero')
      const raw = JSON.parse(
        localStorage.getItem('Comfy.Assets.UserTags.v1') ?? '{}'
      ) as Record<string, string[]>
      expect(raw[assetTagStorageKey(a)]).toBeUndefined()
    })

    it('is a no-op when the tag is not present', () => {
      const { addTag, removeTagEverywhere, getTags } = useAssetTags()
      const a = makeAsset()
      addTag(a, 'hero')
      removeTagEverywhere('ghost')
      expect(getTags(a)).toEqual(['hero'])
    })
  })
})
