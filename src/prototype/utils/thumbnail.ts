// Deterministic placeholder thumbnail colors keyed by an id. The prototype
// has no real thumbnail images yet; this keeps cards visually distinct so
// the grid reads like a board of artifacts, not a list with padding.

import type { Workflow } from '../types'

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

function hashSeed(seed: string): number {
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return Math.abs(hash)
}

export function thumbnailGradient(seed: string): string {
  const [from, to] = palette[hashSeed(seed) % palette.length]
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`
}

// Experimental: deterministically pick one of the example workflow thumbnail
// images (served from public/wf-thumbs) so the same workflow always shows the
// same image. Returns a CSS `background` shorthand value.
const WORKFLOW_THUMBNAIL_COUNT = 7

// CSS `background` shorthand for an image at any URL.
function imageThumbnail(url: string): string {
  return `url("${url}") center / cover no-repeat`
}

function thumbnailBackground(file: string): string {
  return imageThumbnail(`/wf-thumbs/${file}`)
}

function workflowThumbnailImage(seed: string): string {
  return thumbnailBackground(
    `${(hashSeed(seed) % WORKFLOW_THUMBNAIL_COUNT) + 1}.png`
  )
}

// App-mode workflows without an explicit thumbnail fall back to this capture.
function appThumbnailImage(): string {
  return thumbnailBackground('app.png')
}

// Resolve a workflow's thumbnail background: an explicit thumbnailUrl wins,
// then the App-mode capture for apps, otherwise a seeded example image.
export function workflowThumbnail(
  workflow: Pick<Workflow, 'id' | 'kind' | 'thumbnailUrl'>,
  seed: string = workflow.id
): string {
  if (workflow.thumbnailUrl) return imageThumbnail(workflow.thumbnailUrl)
  return workflow.kind === 'app'
    ? appThumbnailImage()
    : workflowThumbnailImage(seed)
}
