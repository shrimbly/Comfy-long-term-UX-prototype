// Deterministic placeholder thumbnail colors keyed by an id. The prototype
// has no real thumbnail images yet; this keeps cards visually distinct so
// the grid reads like a board of artifacts, not a list with padding.

const palette = [
  ['#fef3c7', '#fde68a'],
  ['#fed7aa', '#fecaca'],
  ['#fbcfe8', '#ddd6fe'],
  ['#bfdbfe', '#bae6fd'],
  ['#a7f3d0', '#bbf7d0'],
  ['#fde68a', '#fca5a5'],
  ['#c7d2fe', '#e9d5ff'],
  ['#fef08a', '#fdba74']
]

export function thumbnailGradient(seed: string): string {
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  const [from, to] = palette[Math.abs(hash) % palette.length]
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`
}
