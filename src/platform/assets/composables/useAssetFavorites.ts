import { ref } from 'vue'

import { useAssetsStore } from '@/stores/assetsStore'

import type { AssetItem } from '../schemas/assetSchema'

export const FAVORITE_TAG = 'favorite'

const FAVORITE_TAG_PREFIX = 'favorite-'

function isFavoriteTag(tag: string): boolean {
  return tag === FAVORITE_TAG || tag.startsWith(FAVORITE_TAG_PREFIX)
}

function tagsAreFavorited(tags: readonly string[] | undefined): boolean {
  if (!tags) return false
  return tags.some(isFavoriteTag)
}

const optimisticById = ref(new Map<string, boolean>())

function rememberOptimistic(assetId: string, value: boolean) {
  const next = new Map(optimisticById.value)
  next.set(assetId, value)
  optimisticById.value = next
}

function forgetOptimistic(assetId: string) {
  if (!optimisticById.value.has(assetId)) return
  const next = new Map(optimisticById.value)
  next.delete(assetId)
  optimisticById.value = next
}

export function useAssetFavorites() {
  const assetsStore = useAssetsStore()

  function isFavorited(asset: AssetItem): boolean {
    if (optimisticById.value.has(asset.id)) {
      return optimisticById.value.get(asset.id) ?? false
    }
    return tagsAreFavorited(asset.tags)
  }

  async function setFavorited(asset: AssetItem, value: boolean): Promise<void> {
    const current = isFavorited(asset)
    if (current === value) return

    const originalTags = asset.tags ?? []
    const tagsWithoutFavorite = originalTags.filter(
      (tag) => !isFavoriteTag(tag)
    )
    const newTags = value
      ? [...tagsWithoutFavorite, FAVORITE_TAG]
      : tagsWithoutFavorite

    rememberOptimistic(asset.id, value)
    asset.tags = newTags

    try {
      await assetsStore.updateAssetTags(asset, newTags)
    } catch (error) {
      asset.tags = originalTags
      if (current === tagsAreFavorited(originalTags)) {
        forgetOptimistic(asset.id)
      } else {
        rememberOptimistic(asset.id, current)
      }
      throw error
    }
  }

  async function toggleFavorite(asset: AssetItem): Promise<void> {
    await setFavorited(asset, !isFavorited(asset))
  }

  function favoritedAssets(assets: readonly AssetItem[]): AssetItem[] {
    return assets.filter(isFavorited)
  }

  return {
    isFavorited,
    setFavorited,
    toggleFavorite,
    favoritedAssets
  }
}
