// Implements:
//   entity: ../IA_Plan/wiki/entities/media-file.md
//
// Pure helpers for the media library: which modality an asset is, and a
// short human size.

import type { AssetItem } from '@/platform/assets/schemas/assetSchema'

import type { MediaKind } from '../fixtures/mediaAssets'

export const MEDIA_KINDS: MediaKind[] = ['image', 'video', 'model3d', 'audio']

const KINDS = new Set<string>(MEDIA_KINDS)

export function mediaKind(asset: Pick<AssetItem, 'user_metadata'>): MediaKind {
  const kind = asset.user_metadata?.kind
  return typeof kind === 'string' && KINDS.has(kind)
    ? (kind as MediaKind)
    : 'image'
}

export function projectIdOf(
  asset: Pick<AssetItem, 'user_metadata'>
): string | undefined {
  const id = asset.user_metadata?.projectId
  return typeof id === 'string' ? id : undefined
}

const UNITS = ['B', 'KB', 'MB', 'GB']

export function formatBytes(bytes: number): string {
  let value = Math.max(0, bytes)
  let unit = 0
  while (value >= 1000 && unit < UNITS.length - 1) {
    value /= 1000
    unit += 1
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1
  return `${value.toFixed(digits)} ${UNITS[unit]}`
}
