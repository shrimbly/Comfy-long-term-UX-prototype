// Prototype media-assets fixture set.
//
// Implements:
//   entity:   ../IA_Plan/wiki/entities/media-file.md
//   entity:   ../IA_Plan/wiki/entities/output.md (per the wiki, outputs inherit
//             project membership from their parent workflow)
//   entity:   ../IA_Plan/wiki/entities/project.md (project per piece of
//             creative work, "Coca-Cola ad" framing)
//
// The asset names embed a project-slug prefix ("coca-cola/01.jpg") so the
// upstream useFolderNavigation groups them into virtual folders, one per
// project. The projectId matches the workspace's projects in admin.ts, and
// `kind` says which modality a card is.
//
// Image bytes live under public/prototype-fixtures/media/<project>/ and were
// snapshotted (and downscaled to 1024px max edge as JPEG) from a local
// ComfyUI output dir for authenticity. Videos reuse a still as their poster;
// audio and 3D have no preview.

import type { AssetItem } from '@/platform/assets/schemas/assetSchema'

export type MediaKind = 'image' | 'video' | 'audio' | 'model3d'

interface PrototypeProject {
  slug: string
  projectId: string
  fileTags: string[]
  startDate: string // ISO date; each file is offset N hours after this
}

const PROJECTS: PrototypeProject[] = [
  {
    slug: 'coca-cola',
    projectId: 'proj-cocacola',
    fileTags: ['output', 'campaign'],
    startDate: '2026-10-05T09:00:00Z'
  },
  {
    slug: 'brand-system',
    projectId: 'proj-brand',
    fileTags: ['output', 'brand'],
    startDate: '2026-10-01T10:00:00Z'
  },
  {
    slug: 'client-x-pitch',
    projectId: 'proj-client-x',
    fileTags: ['output', 'pitch'],
    startDate: '2026-09-22T11:00:00Z'
  },
  {
    slug: 'marketing-q3',
    projectId: 'proj-marketing',
    fileTags: ['output', 'marketing'],
    startDate: '2026-09-10T08:00:00Z'
  },
  {
    slug: 'personal',
    projectId: 'proj-personal-rnd',
    fileTags: ['output', 'sketch'],
    startDate: '2026-08-28T19:00:00Z'
  }
]

interface ExtraAsset {
  slug: string
  file: string
  kind: Exclude<MediaKind, 'image'>
  size: number
  hoursAfterStart: number
}

// A few non-image outputs so the modality filter has something to show.
const EXTRA_ASSETS: ExtraAsset[] = [
  {
    slug: 'coca-cola',
    file: 'hero_spin_00011.mp4',
    kind: 'video',
    size: 26_500_000,
    hoursAfterStart: 9
  },
  {
    slug: 'coca-cola',
    file: 'voiceover_take3.mp3',
    kind: 'audio',
    size: 900_000,
    hoursAfterStart: 7
  },
  {
    slug: 'brand-system',
    file: 'logo_reveal_00004.mp4',
    kind: 'video',
    size: 18_200_000,
    hoursAfterStart: 12
  },
  {
    slug: 'client-x-pitch',
    file: 'bottle_prop.glb',
    kind: 'model3d',
    size: 4_100_000,
    hoursAfterStart: 5
  },
  {
    slug: 'marketing-q3',
    file: 'jingle_v2.wav',
    kind: 'audio',
    size: 3_300_000,
    hoursAfterStart: 3
  },
  {
    slug: 'personal',
    file: 'walk_cycle_00002.mp4',
    kind: 'video',
    size: 12_700_000,
    hoursAfterStart: 2
  }
]

const FILES_PER_PROJECT = 8
const FIXTURE_BASE = '/prototype-fixtures/media'

function fileTimestamp(startIso: string, indexInProject: number): string {
  const start = new Date(startIso).getTime()
  const offsetMs = indexInProject * 47 * 60 * 1000 // ~47 minutes between captures
  return new Date(start + offsetMs).toISOString()
}

function hoursAfter(startIso: string, hours: number): string {
  return new Date(
    new Date(startIso).getTime() + hours * 3_600_000
  ).toISOString()
}

// Deterministic sizes in the 1.2–4.8 MB range so the cards read as real.
function imageSize(indexInProject: number, projectIndex: number): number {
  return 1_200_000 + ((indexInProject * 7 + projectIndex * 3) % 12) * 300_000
}

export function buildPrototypeMediaAssets(_personaId?: string): AssetItem[] {
  const assets: AssetItem[] = []
  PROJECTS.forEach((project, projectIndex) => {
    for (let i = 0; i < FILES_PER_PROJECT; i++) {
      const slot = String(i + 1).padStart(2, '0')
      const filename = `${slot}.jpg`
      const url = `${FIXTURE_BASE}/${project.slug}/${filename}`
      assets.push({
        id: `media-${project.projectId}-${filename}`,
        name: `${project.slug}/${filename}`,
        display_name: filename,
        size: imageSize(i, projectIndex),
        created_at: fileTimestamp(project.startDate, i),
        updated_at: fileTimestamp(project.startDate, i),
        tags: project.fileTags,
        thumbnail_url: url,
        preview_url: url,
        user_metadata: { projectId: project.projectId, kind: 'image' }
      })
    }
  })
  for (const extra of EXTRA_ASSETS) {
    const project = PROJECTS.find((p) => p.slug === extra.slug)
    if (!project) continue
    const poster =
      extra.kind === 'video'
        ? `${FIXTURE_BASE}/${project.slug}/03.jpg`
        : undefined
    const at = hoursAfter(project.startDate, extra.hoursAfterStart)
    assets.push({
      id: `media-${project.projectId}-${extra.file}`,
      name: `${project.slug}/${extra.file}`,
      display_name: extra.file,
      size: extra.size,
      created_at: at,
      updated_at: at,
      tags: project.fileTags,
      thumbnail_url: poster,
      preview_url: poster,
      user_metadata: { projectId: project.projectId, kind: extra.kind }
    })
  }
  return assets
}

// TEMP shim to restore loadability over the interrupted WIP migration
// (the real cloud-promotion impl is in backup/wip-pre-port). No-op for
// now so the dev server boots for review; replace when the WIP lands.
export function promotePrototypeAssetsToCloud(_ids: string[]): void {}
