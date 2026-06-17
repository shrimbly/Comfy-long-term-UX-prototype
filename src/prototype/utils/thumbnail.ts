// Deterministic placeholder thumbnail colors keyed by an id. Workflows/projects
// have no real thumbnail images yet; this keeps cards visually distinct so the
// grid reads like a board of artifacts, not a list with padding. (Templates do
// have real media — see `templateThumbnailUrl` at the bottom of this file.)

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

// Real template thumbnail media, pulled from the upstream
// Comfy-Org/workflow_templates repo via the jsDelivr CDN. A template's `id` is
// its upstream slug; the convention is `<slug>-1.<ext>` and all current core
// templates ship animated `.webp` previews (1:1 square). Used by TemplateCard.
const TEMPLATE_MEDIA_BASE =
  'https://cdn.jsdelivr.net/gh/Comfy-Org/workflow_templates@main/templates'

export function templateThumbnailUrl(slug: string): string {
  return `${TEMPLATE_MEDIA_BASE}/${slug}-1.webp`
}

// The second/overlay frame (`-2`) used by the compare-slider "wipe" variant —
// the before/after counterpart to `templateThumbnailUrl`'s `-1` base.
export function templateOverlayThumbnailUrl(slug: string): string {
  return `${TEMPLATE_MEDIA_BASE}/${slug}-2.webp`
}

// Provider logos for the top-left badge (the prod LogoOverlay). Paths mirror
// the upstream templates repo's index_logo.json, resolved against the same CDN
// as the thumbnails. Only the providers the fixture uses are mapped — an
// unmapped provider yields '' so the badge renders nothing.
const PROVIDER_LOGO_PATHS: Record<string, string> = {
  Google: 'logo/google.png',
  Anthropic: 'logo/anthropic.webp',
  ElevenLabs: 'logo/elevenlabs.jpg',
  ByteDance: 'logo/bytedance.png',
  Tripo: 'logo/tripo.png',
  Grok: 'logo/grok.png',
  Sonilo: 'logo/sonilo.png',
  Rodin: 'logo/rodin.png'
}

export function templateProviderLogoUrl(provider: string): string {
  const path = PROVIDER_LOGO_PATHS[provider]
  return path ? `${TEMPLATE_MEDIA_BASE}/${path}` : ''
}
