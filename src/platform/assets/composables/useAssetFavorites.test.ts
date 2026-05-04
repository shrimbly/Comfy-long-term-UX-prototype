import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AssetItem } from '@/platform/assets/schemas/assetSchema'

const updateAssetTags = vi.fn(async () => {})

vi.mock('@/stores/assetsStore', () => ({
  useAssetsStore: () => ({
    updateAssetTags
  })
}))

import { FAVORITE_TAG, useAssetFavorites } from './useAssetFavorites'

function makeAsset(overrides: Partial<AssetItem> = {}): AssetItem {
  return {
    id: overrides.id ?? 'asset-1',
    name: overrides.name ?? 'image.png',
    tags: overrides.tags ?? [],
    user_metadata: overrides.user_metadata ?? {},
    ...overrides
  } as AssetItem
}

describe('useAssetFavorites', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    updateAssetTags.mockClear()
  })

  it('reads favorited state from a `favorite` tag', () => {
    const { isFavorited } = useAssetFavorites()
    const asset = makeAsset({ id: 'a', tags: ['output', FAVORITE_TAG] })

    expect(isFavorited(asset)).toBe(true)
  })

  it('treats legacy color tags as favorited', () => {
    const { isFavorited } = useAssetFavorites()
    const asset = makeAsset({ id: 'a2', tags: ['output', 'favorite-green'] })

    expect(isFavorited(asset)).toBe(true)
  })

  it('returns false when no favorite tag is present', () => {
    const { isFavorited } = useAssetFavorites()
    const asset = makeAsset({ id: 'b', tags: ['output'] })

    expect(isFavorited(asset)).toBe(false)
  })

  it('favoriting appends the favorite tag', async () => {
    const { setFavorited, isFavorited } = useAssetFavorites()
    const asset = makeAsset({ id: 'c', tags: ['output'] })

    await setFavorited(asset, true)

    expect(isFavorited(asset)).toBe(true)
    expect(updateAssetTags).toHaveBeenCalledWith(asset, [
      'output',
      FAVORITE_TAG
    ])
    expect(asset.tags).toEqual(['output', FAVORITE_TAG])
  })

  it('unfavoriting removes all favorite-prefix tags', async () => {
    const { setFavorited, isFavorited } = useAssetFavorites()
    const asset = makeAsset({
      id: 'e',
      tags: ['output', 'favorite-green', FAVORITE_TAG]
    })

    await setFavorited(asset, false)

    expect(isFavorited(asset)).toBe(false)
    expect(asset.tags).toEqual(['output'])
  })

  it('toggleFavorite flips state and back', async () => {
    const { toggleFavorite, isFavorited } = useAssetFavorites()
    const asset = makeAsset({ id: 'f', tags: ['output'] })

    await toggleFavorite(asset)
    expect(isFavorited(asset)).toBe(true)

    await toggleFavorite(asset)
    expect(isFavorited(asset)).toBe(false)
  })

  it('reverts optimistic state when the server call fails', async () => {
    updateAssetTags.mockRejectedValueOnce(new Error('boom'))

    const { setFavorited, isFavorited } = useAssetFavorites()
    const asset = makeAsset({ id: 'g', tags: ['output'] })

    await expect(setFavorited(asset, true)).rejects.toThrow('boom')
    expect(isFavorited(asset)).toBe(false)
    expect(asset.tags).toEqual(['output'])
  })
})
