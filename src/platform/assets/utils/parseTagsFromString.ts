import { isUserTag } from '@/platform/assets/composables/useAssetTags'

export function parseTagsFromString(value: string): string[] {
  if (!value) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const piece of value.split(',')) {
    const trimmed = piece.trim()
    if (!isUserTag(trimmed)) continue
    if (seen.has(trimmed)) continue
    seen.add(trimmed)
    result.push(trimmed)
  }
  return result
}
