// Seed for the local user's referenced media (Tier 1 of the linked-media
// exploration). NON-FINAL — see:
//   open-q:  ../IA_Plan/wiki/open-questions.md#local-media-as-references
//   log:     ../IA_Plan/wiki/prototype-log.md — Flow 03
//   concept: ../IA_Plan/wiki/concepts/local-dashboard-views.md
//
// Every file is `origin: 'referenced'` + `storage: 'local'`: Comfy points
// at the original on disk and never copies the bytes. `previewUrl` is the
// cached thumbnail the app keeps so the file still renders even after its
// original moves (the relink case). Paths span a few real-shaped folders
// (incl. one nested subfolder) so the folder grouping and batch "relink
// siblings" read. The mediaReferenceStore clones this on persona load and
// owns the mutable link state thereafter.

import type { LibraryAsset } from '../types'

interface SeedFile {
  dir: string
  file: string
  tags: string[]
  updatedAt: string
  // Seeds the file in the `missing` state (its original moved/was deleted)
  // so the relink flow is visible on load without a manual trigger.
  missing?: boolean
}

// Real bundled images stand in for cached thumbnails so the masonry renders
// like the upstream media browser (varied aspect ratios, real decode).
const PREVIEW_POOL = [
  '/prototype-fixtures/media/coca-cola/01.jpg',
  '/prototype-fixtures/media/coca-cola/05.jpg',
  '/prototype-fixtures/media/brand-system/02.jpg',
  '/prototype-fixtures/media/brand-system/06.jpg',
  '/prototype-fixtures/media/client-x-pitch/03.jpg',
  '/prototype-fixtures/media/client-x-pitch/07.jpg',
  '/prototype-fixtures/media/marketing-q3/04.jpg',
  '/prototype-fixtures/media/marketing-q3/08.jpg',
  '/prototype-fixtures/media/personal/01.jpg',
  '/prototype-fixtures/media/personal/05.jpg',
  '/prototype-fixtures/media/coca-cola/03.jpg',
  '/prototype-fixtures/media/brand-system/04.jpg'
]

const SEED: SeedFile[] = [
  {
    dir: '/Users/willie/Pictures/Shoots/2026-aurora',
    file: 'aurora_001.png',
    tags: ['photo', 'aurora'],
    updatedAt: '2026-05-30T18:12:00Z'
  },
  {
    dir: '/Users/willie/Pictures/Shoots/2026-aurora',
    file: 'aurora_002.png',
    tags: ['photo', 'aurora'],
    updatedAt: '2026-05-30T18:19:00Z'
  },
  {
    dir: '/Users/willie/Pictures/Shoots/2026-aurora',
    file: 'aurora_003.png',
    tags: ['photo', 'aurora'],
    updatedAt: '2026-05-30T18:24:00Z'
  },
  {
    dir: '/Users/willie/Pictures/Shoots/2026-aurora',
    file: 'aurora_004.png',
    tags: ['photo', 'aurora'],
    updatedAt: '2026-05-30T18:31:00Z'
  },
  {
    dir: '/Users/willie/Pictures/Shoots/2026-aurora/selects',
    file: 'hero_select.png',
    tags: ['photo', 'select'],
    updatedAt: '2026-06-01T09:02:00Z'
  },
  {
    dir: '/Users/willie/Pictures/Shoots/2026-aurora/selects',
    file: 'hero_select_b.png',
    tags: ['photo', 'select'],
    updatedAt: '2026-06-01T09:05:00Z'
  },
  // This whole folder moved on disk — seeded missing so the relink flow
  // (incl. batch "relink siblings") shows on load.
  {
    dir: '/Users/willie/Pictures/renders/cyber-city',
    file: 'cityscape_01.png',
    tags: ['render', 'cyber'],
    updatedAt: '2026-05-22T14:40:00Z',
    missing: true
  },
  {
    dir: '/Users/willie/Pictures/renders/cyber-city',
    file: 'cityscape_02.png',
    tags: ['render', 'cyber'],
    updatedAt: '2026-05-22T14:46:00Z',
    missing: true
  },
  {
    dir: '/Users/willie/Pictures/renders/cyber-city',
    file: 'drone_pass.png',
    tags: ['render', 'cyber'],
    updatedAt: '2026-05-22T15:02:00Z',
    missing: true
  },
  {
    dir: '/Users/willie/Desktop/refs',
    file: 'moodboard.jpg',
    tags: ['reference'],
    updatedAt: '2026-05-18T11:20:00Z'
  },
  {
    dir: '/Users/willie/Desktop/refs',
    file: 'palette.png',
    tags: ['reference'],
    updatedAt: '2026-05-18T11:24:00Z'
  },
  {
    dir: '/Users/willie/Desktop/refs',
    file: 'pose_ref.jpg',
    tags: ['reference'],
    updatedAt: '2026-05-18T11:31:00Z'
  }
]

function folderLabel(dir: string): string {
  const i = dir.lastIndexOf('/')
  return i < 0 ? dir : dir.slice(i + 1)
}

export function buildLocalMediaReferences(): LibraryAsset[] {
  return SEED.map(({ dir, file, tags, updatedAt, missing }, i) => {
    const sourcePath = `${dir}/${file}`
    return {
      id: `ref-${sourcePath}`,
      name: file,
      section: 'media',
      origin: 'referenced',
      storage: 'local',
      linkState: missing ? 'missing' : 'linked',
      sourcePath,
      folder: folderLabel(dir),
      contentHash: `sha-${file}`,
      previewUrl: PREVIEW_POOL[i % PREVIEW_POOL.length],
      tags,
      updatedAt
    }
  })
}
