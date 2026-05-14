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

import { ref } from 'vue'

import type { AssetItem } from '@/platform/assets/schemas/assetSchema'

import type { PersonaId } from '../types'

type AssetStorage = 'local' | 'cloud'

// In-memory "promoted to cloud" overrides. Mutating this triggers
// buildPrototypeMediaAssets() re-runs through Vue reactivity.
const promotedToCloudIds = ref<Set<string>>(new Set())

export function promotePrototypeAssetsToCloud(ids: string[]): void {
  const next = new Set(promotedToCloudIds.value)
  for (const id of ids) next.add(id)
  promotedToCloudIds.value = next
}

interface PrototypeProject {
  slug: string
  projectId: string
  projectName: string
  workflowName: string
  fileTags: string[]
  startDate: string // ISO date; each file is offset N hours after this
  storage: AssetStorage
  // Which personas have project-level access. Modeled per
  // ../IA_Plan/wiki/concepts/three-level-permissions.md.
  visibleToPersonas: PersonaId[]
}

const PROJECTS: PrototypeProject[] = [
  {
    slug: 'coca-cola',
    projectId: 'proj-coca-cola',
    projectName: 'Coca-Cola Q3 Campaign',
    workflowName: 'Hero shot v3',
    fileTags: ['output', 'campaign'],
    startDate: '2026-05-10T09:00:00Z',
    storage: 'cloud',
    visibleToPersonas: ['workspace-admin', 'workspace-member']
  },
  {
    slug: 'brand-system',
    projectId: 'proj-brand-system',
    projectName: 'Brand System Refresh',
    workflowName: 'Logo render',
    fileTags: ['output', 'brand'],
    startDate: '2026-05-08T10:00:00Z',
    storage: 'cloud',
    visibleToPersonas: ['workspace-admin', 'workspace-member', 'solo']
  },
  {
    slug: 'client-x-pitch',
    projectId: 'proj-client-x-pitch',
    projectName: 'Client X Pitch',
    workflowName: 'Concept board',
    fileTags: ['output', 'pitch'],
    startDate: '2026-05-05T11:00:00Z',
    storage: 'cloud',
    visibleToPersonas: ['workspace-admin', 'project-collaborator']
  },
  {
    slug: 'marketing-q3',
    projectId: 'proj-marketing-q3',
    projectName: 'Marketing Q3',
    workflowName: 'Banner sweep',
    fileTags: ['output', 'marketing'],
    startDate: '2026-05-03T08:00:00Z',
    storage: 'local',
    visibleToPersonas: ['workspace-admin', 'workspace-member']
  },
  {
    slug: 'personal',
    projectId: 'proj-personal',
    projectName: 'Personal Sketches',
    workflowName: 'Sketchbook',
    fileTags: ['output', 'sketch'],
    startDate: '2026-04-28T19:00:00Z',
    storage: 'local',
    visibleToPersonas: ['workspace-admin', 'solo', 'solo-local']
  }
]

// Asset-level grants (the asset tier in three-level-permissions). Used to
// model the asset-only-guest persona, who has been sent specific files
// outside of any project membership.
const ASSET_LEVEL_GRANTS: Record<PersonaId, string[] | undefined> = {
  solo: undefined,
  'solo-local': undefined,
  'workspace-admin': undefined,
  'workspace-member': undefined,
  'project-collaborator': undefined,
  'asset-only-guest': [
    'media-proj-coca-cola-01.jpg',
    'media-proj-coca-cola-02.jpg',
    'media-proj-coca-cola-03.jpg'
  ]
}

const FILES_PER_PROJECT = 8
const FIXTURE_BASE = '/prototype-fixtures/media'

function fileTimestamp(startIso: string, indexInProject: number): string {
  const start = new Date(startIso).getTime()
  const offsetMs = indexInProject * 47 * 60 * 1000 // ~47 minutes between captures
  return new Date(start + offsetMs).toISOString()
}

export function buildPrototypeMediaAssets(personaId?: PersonaId): AssetItem[] {
  const grantedAssetIds = personaId ? ASSET_LEVEL_GRANTS[personaId] : undefined
  const grantedSet = grantedAssetIds ? new Set(grantedAssetIds) : null
  const promoted = promotedToCloudIds.value

  const assets: AssetItem[] = []
  for (const project of PROJECTS) {
    const hasProjectAccess =
      !personaId || project.visibleToPersonas.includes(personaId)

    for (let i = 0; i < FILES_PER_PROJECT; i++) {
      const slot = String(i + 1).padStart(2, '0')
      const filename = `${slot}.jpg`
      const id = `media-${project.projectId}-${filename}`
      const grantedAtAssetLevel = grantedSet?.has(id) ?? false

      if (!hasProjectAccess && !grantedAtAssetLevel) continue

      const effectiveStorage: AssetStorage = promoted.has(id)
        ? 'cloud'
        : project.storage

      const url = `${FIXTURE_BASE}/${project.slug}/${filename}`
      assets.push({
        id,
        name: `${project.slug}/${filename}`,
        display_name: filename,
        size: 0,
        created_at: fileTimestamp(project.startDate, i),
        tags: project.fileTags,
        thumbnail_url: url,
        preview_url: url,
        user_metadata: {
          projectId: project.projectId,
          projectName: project.projectName,
          workflowName: project.workflowName,
          storage: effectiveStorage,
          originalStorage: project.storage
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
