import { shallowRef } from 'vue'

export interface AssetDimensions {
  width: number
  height: number
}

const STORAGE_KEY = 'Comfy.Assets.DimensionsCache.v1'
const MAX_ENTRIES = 5000

type CacheRecord = Record<string, [number, number]>

function readStorage(): Map<string, AssetDimensions> {
  if (typeof localStorage === 'undefined') return new Map()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Map()
    const parsed = JSON.parse(raw) as CacheRecord
    const map = new Map<string, AssetDimensions>()
    for (const [id, [w, h]] of Object.entries(parsed)) {
      if (typeof w === 'number' && typeof h === 'number' && w > 0 && h > 0) {
        map.set(id, { width: w, height: h })
      }
    }
    return map
  } catch {
    return new Map()
  }
}

const cache = shallowRef<Map<string, AssetDimensions>>(readStorage())

let pendingFlush: ReturnType<typeof setTimeout> | null = null

function scheduleFlush() {
  if (typeof localStorage === 'undefined') return
  if (pendingFlush !== null) return
  pendingFlush = setTimeout(() => {
    pendingFlush = null
    try {
      const record: CacheRecord = {}
      for (const [id, dims] of cache.value) {
        record[id] = [dims.width, dims.height]
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
    } catch {
      // Quota or serialization failure — drop silently; cache still works
      // in memory for this session.
    }
  }, 500)
}

function evictIfFull() {
  if (cache.value.size <= MAX_ENTRIES) return
  // Simple FIFO: drop the oldest 10% by insertion order.
  const overflow = cache.value.size - MAX_ENTRIES
  const dropCount = Math.max(overflow, Math.floor(MAX_ENTRIES * 0.1))
  const next = new Map(cache.value)
  let removed = 0
  for (const key of next.keys()) {
    if (removed >= dropCount) break
    next.delete(key)
    removed++
  }
  cache.value = next
}

/**
 * Cache image dimensions across modal opens so the masonry layout is stable
 * from first paint on subsequent visits — rather than popping as each image
 * decodes and reveals its real aspect ratio.
 */
export function useAssetDimensionsCache() {
  function getDimensions(assetId: string): AssetDimensions | null {
    return cache.value.get(assetId) ?? null
  }

  function setDimensions(assetId: string, width: number, height: number) {
    if (width <= 0 || height <= 0) return
    const existing = cache.value.get(assetId)
    if (
      existing &&
      Math.abs(existing.width - width) < 0.5 &&
      Math.abs(existing.height - height) < 0.5
    )
      return
    const next = new Map(cache.value)
    next.set(assetId, { width, height })
    cache.value = next
    evictIfFull()
    scheduleFlush()
  }

  return { getDimensions, setDimensions }
}
