// Implements:
//   prototype scaffolding — community feed fixture for the Explore
//   dashboard. Distinct from fixtures/mediaAssets.ts (which models
//   workspace-scoped output assets) because Explore is meant to feel
//   like a public discovery surface: every asset has a creator chip,
//   no workspace context, no persona filtering.
//
// Image bytes live under public/prototype-fixtures/explore/. Source
// images came from a civitai download set; they were downscaled to a
// 1024px long edge at JPEG quality 75 before being committed.

import type { AssetItem } from '@/platform/assets/schemas/assetSchema'

interface CreatorSeed {
  username: string
  avatarColor: string
}

// Fabricated community handles — enough variety that the masonry feed
// doesn't look like one creator's gallery. Colors picked to read well
// on the dark grid background.
const CREATORS: CreatorSeed[] = [
  { username: 'nocturne', avatarColor: '#7c3aed' },
  { username: 'pixelweaver', avatarColor: '#0ea5e9' },
  { username: 'chromatic', avatarColor: '#f97316' },
  { username: 'studio.kappa', avatarColor: '#facc15' },
  { username: 'vivian.s', avatarColor: '#ec4899' },
  { username: 'runwayward', avatarColor: '#10b981' },
  { username: 'ren.ai', avatarColor: '#ef4444' },
  { username: 'flux_focal', avatarColor: '#3b82f6' },
  { username: 'octopod', avatarColor: '#a855f7' },
  { username: 'inkwell', avatarColor: '#22d3ee' },
  { username: 'midnight_painter', avatarColor: '#f43f5e' },
  { username: 'silk.render', avatarColor: '#84cc16' }
]

const FIXTURE_BASE = '/prototype-fixtures/explore'
const FILE_COUNT = 31

// Per-file offset hours from the same base date. Spreads timestamps
// across about two weeks so the sort-by-recency ordering feels lived-in.
const BASE_TS = new Date('2026-05-04T08:00:00Z').getTime()
const HOURS_PER_FILE = 11

export function buildExploreAssets(): AssetItem[] {
  const assets: AssetItem[] = []
  for (let i = 0; i < FILE_COUNT; i++) {
    const slot = String(i + 1).padStart(2, '0')
    const filename = `${slot}.jpg`
    const url = `${FIXTURE_BASE}/${filename}`
    const creator = CREATORS[i % CREATORS.length]
    const createdAt = new Date(
      BASE_TS + i * HOURS_PER_FILE * 60 * 60 * 1000
    ).toISOString()
    assets.push({
      id: `explore-${slot}`,
      name: filename,
      display_name: filename,
      size: 0,
      created_at: createdAt,
      tags: ['explore', 'community'],
      thumbnail_url: url,
      preview_url: url,
      user_metadata: {
        creator
      }
    })
  }
  return assets
}
