import { useStorage } from '@vueuse/core'
import { computed } from 'vue'

import type { AssetItem } from '@/platform/assets/schemas/assetSchema'

const STORAGE_KEY = 'Comfy.Assets.UserTags.v1'
const SYSTEM_TAGS = new Set(['output', 'input', 'temp'])
const FAVORITE_TAG_PREFIX = 'favorite-'

type TagsByKey = Record<string, string[]>

const tagsByKey = useStorage<TagsByKey>(STORAGE_KEY, {})

export function isUserTag(tag: string): boolean {
  const t = tag.trim()
  if (!t) return false
  if (SYSTEM_TAGS.has(t)) return false
  if (t.startsWith(FAVORITE_TAG_PREFIX)) return false
  return true
}

export function assetTagStorageKey(asset: AssetItem): string {
  const type = asset.tags?.[0] === 'output' ? 'output' : 'input'
  return `${type}:${asset.name}`
}

export interface TagWithCount {
  name: string
  count: number
}

export function useAssetTags() {
  function getTags(asset: AssetItem): string[] {
    return tagsByKey.value[assetTagStorageKey(asset)] ?? []
  }

  function setTags(asset: AssetItem, tags: readonly string[]): void {
    const key = assetTagStorageKey(asset)
    const cleaned = Array.from(
      new Set(tags.map((t) => t.trim()).filter(isUserTag))
    ).sort()
    const next: TagsByKey = { ...tagsByKey.value }
    if (cleaned.length === 0) {
      delete next[key]
    } else {
      next[key] = cleaned
    }
    tagsByKey.value = next
  }

  function addTag(asset: AssetItem, tag: string): void {
    const t = tag.trim()
    if (!isUserTag(t)) return
    const current = getTags(asset)
    if (current.includes(t)) return
    setTags(asset, [...current, t])
  }

  function removeTag(asset: AssetItem, tag: string): void {
    setTags(
      asset,
      getTags(asset).filter((x) => x !== tag)
    )
  }

  function renameTag(oldName: string, newName: string): string | null {
    const from = oldName.trim()
    const to = newName.trim()
    if (!from || !isUserTag(to)) return null
    if (from === to) return from
    const next: TagsByKey = {}
    let touched = false
    for (const [key, tags] of Object.entries(tagsByKey.value)) {
      if (!tags.includes(from)) {
        next[key] = tags
        continue
      }
      touched = true
      const replaced = tags.map((t) => (t === from ? to : t))
      next[key] = Array.from(new Set(replaced)).sort()
    }
    if (!touched) return null
    tagsByKey.value = next
    return to
  }

  function hasTag(asset: AssetItem, tag: string): boolean {
    return getTags(asset).includes(tag)
  }

  const allTags = computed<TagWithCount[]>(() => {
    const counts = new Map<string, number>()
    for (const tags of Object.values(tagsByKey.value)) {
      for (const t of tags) {
        counts.set(t, (counts.get(t) ?? 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  function assetsWithTag(
    assets: readonly AssetItem[],
    tag: string
  ): AssetItem[] {
    return assets.filter((a) => hasTag(a, tag))
  }

  return {
    getTags,
    setTags,
    addTag,
    removeTag,
    renameTag,
    hasTag,
    allTags,
    assetsWithTag
  }
}
