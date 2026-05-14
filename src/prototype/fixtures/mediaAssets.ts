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
// project. The same projectId is also stashed in user_metadata so a
// prototype chip filter could read it later without refactoring.
//
// Image bytes live under public/prototype-fixtures/media/<project>/ and were
// snapshotted (and downscaled to 1024px max edge as JPEG) from a local
// ComfyUI output dir for authenticity.

import type { AssetItem } from '@/platform/assets/schemas/assetSchema'

interface PrototypeProject {
  slug: string
  projectId: string
  projectName: string
  fileTags: string[]
  startDate: string // ISO date; each file is offset N hours after this
}

const PROJECTS: PrototypeProject[] = [
  {
    slug: 'coca-cola',
    projectId: 'proj-coca-cola',
    projectName: 'Coca-Cola Q3 Campaign',
    fileTags: ['output', 'campaign'],
    startDate: '2026-05-10T09:00:00Z'
  },
  {
    slug: 'brand-system',
    projectId: 'proj-brand-system',
    projectName: 'Brand System Refresh',
    fileTags: ['output', 'brand'],
    startDate: '2026-05-08T10:00:00Z'
  },
  {
    slug: 'client-x-pitch',
    projectId: 'proj-client-x-pitch',
    projectName: 'Client X Pitch',
    fileTags: ['output', 'pitch'],
    startDate: '2026-05-05T11:00:00Z'
  },
  {
    slug: 'marketing-q3',
    projectId: 'proj-marketing-q3',
    projectName: 'Marketing Q3',
    fileTags: ['output', 'marketing'],
    startDate: '2026-05-03T08:00:00Z'
  },
  {
    slug: 'personal',
    projectId: 'proj-personal',
    projectName: 'Personal Sketches',
    fileTags: ['output', 'sketch'],
    startDate: '2026-04-28T19:00:00Z'
  }
]

const FILES_PER_PROJECT = 8
const FIXTURE_BASE = '/prototype-fixtures/media'

function fileTimestamp(startIso: string, indexInProject: number): string {
  const start = new Date(startIso).getTime()
  const offsetMs = indexInProject * 47 * 60 * 1000 // ~47 minutes between captures
  return new Date(start + offsetMs).toISOString()
}

export function buildPrototypeMediaAssets(): AssetItem[] {
  const assets: AssetItem[] = []
  for (const project of PROJECTS) {
    for (let i = 0; i < FILES_PER_PROJECT; i++) {
      const slot = String(i + 1).padStart(2, '0')
      const filename = `${slot}.jpg`
      const url = `${FIXTURE_BASE}/${project.slug}/${filename}`
      assets.push({
        id: `media-${project.projectId}-${filename}`,
        name: `${project.slug}/${filename}`,
        display_name: filename,
        size: 0,
        created_at: fileTimestamp(project.startDate, i),
        tags: project.fileTags,
        thumbnail_url: url,
        preview_url: url,
        user_metadata: {
          projectId: project.projectId,
          projectName: project.projectName
        }
      })
    }
  }
  return assets
}

export function listPrototypeProjects(): {
  id: string
  name: string
}[] {
  return PROJECTS.map((p) => ({ id: p.projectId, name: p.projectName }))
}
