// Prototype media-assets fixture set.
//
// Implements:
//   entity:   ../IA_Plan/wiki/entities/media-file.md
//   entity:   ../IA_Plan/wiki/entities/output.md (per the wiki, outputs inherit
//             project membership from their parent workflow)
//   entity:   ../IA_Plan/wiki/entities/project.md (project per piece of
//             creative work, "Coca-Cola ad" framing)
//
// The asset names embed a project-name prefix ("coca-cola/frame-01.png") so
// the upstream useFolderNavigation groups them into virtual folders, one per
// project. The same projectId is also stashed in user_metadata so a prototype
// chip filter could read it later without refactoring.
//
// Image bytes live under public/prototype-fixtures/media/<project>/ and were
// snapshotted from a local ComfyUI output dir for authenticity.

import type { AssetItem } from '@/platform/assets/schemas/assetSchema'

interface PrototypeMediaFixture {
  projectId: string
  projectName: string
  files: { filename: string; createdAt: string; tags: string[] }[]
}

const FIXTURES: PrototypeMediaFixture[] = [
  {
    projectId: 'proj-coca-cola',
    projectName: 'Coca-Cola Q3 Campaign',
    files: [
      {
        filename: 'frame-01.png',
        createdAt: '2026-05-10T14:32:00Z',
        tags: ['output', 'campaign', 'video']
      },
      {
        filename: 'frame-02.png',
        createdAt: '2026-05-10T15:01:00Z',
        tags: ['output', 'campaign', 'video']
      },
      {
        filename: 'frame-03.png',
        createdAt: '2026-05-10T15:18:00Z',
        tags: ['output', 'campaign', 'video']
      },
      {
        filename: 'frame-04.png',
        createdAt: '2026-05-11T09:42:00Z',
        tags: ['output', 'campaign', 'video', 'final']
      },
      {
        filename: 'frame-05.png',
        createdAt: '2026-05-11T10:14:00Z',
        tags: ['output', 'campaign', 'video', 'final']
      }
    ]
  },
  {
    projectId: 'proj-brand-system',
    projectName: 'Brand System Refresh',
    files: [
      {
        filename: 'render-01.png',
        createdAt: '2026-05-08T11:05:00Z',
        tags: ['output', 'brand', 'render']
      },
      {
        filename: 'render-02.png',
        createdAt: '2026-05-08T11:22:00Z',
        tags: ['output', 'brand', 'render']
      },
      {
        filename: 'render-03.png',
        createdAt: '2026-05-09T13:48:00Z',
        tags: ['output', 'brand', 'hero']
      },
      {
        filename: 'render-04.png',
        createdAt: '2026-05-09T14:11:00Z',
        tags: ['output', 'brand', 'hero']
      },
      {
        filename: 'render-05.png',
        createdAt: '2026-05-09T16:27:00Z',
        tags: ['output', 'brand', 'final']
      }
    ]
  },
  {
    projectId: 'proj-client-x-pitch',
    projectName: 'Client X Pitch',
    files: [
      {
        filename: 'concept-01.png',
        createdAt: '2026-05-05T10:11:00Z',
        tags: ['output', 'pitch', 'concept']
      },
      {
        filename: 'concept-02.png',
        createdAt: '2026-05-05T10:34:00Z',
        tags: ['output', 'pitch', 'concept']
      },
      {
        filename: 'concept-03.png',
        createdAt: '2026-05-05T11:02:00Z',
        tags: ['output', 'pitch', 'concept']
      },
      {
        filename: 'concept-04.png',
        createdAt: '2026-05-06T09:18:00Z',
        tags: ['output', 'pitch', 'exploration']
      },
      {
        filename: 'concept-05.png',
        createdAt: '2026-05-06T09:45:00Z',
        tags: ['output', 'pitch', 'exploration']
      }
    ]
  },
  {
    projectId: 'proj-marketing-q3',
    projectName: 'Marketing Q3',
    files: [
      {
        filename: 'banner-01.png',
        createdAt: '2026-05-03T08:22:00Z',
        tags: ['output', 'marketing', 'banner']
      },
      {
        filename: 'banner-02.png',
        createdAt: '2026-05-03T09:05:00Z',
        tags: ['output', 'marketing', 'banner']
      },
      {
        filename: 'banner-03.png',
        createdAt: '2026-05-04T12:41:00Z',
        tags: ['output', 'marketing', 'social']
      },
      {
        filename: 'banner-04.png',
        createdAt: '2026-05-04T13:17:00Z',
        tags: ['output', 'marketing', 'social']
      },
      {
        filename: 'banner-05.png',
        createdAt: '2026-05-04T14:02:00Z',
        tags: ['output', 'marketing', 'social', 'final']
      }
    ]
  },
  {
    projectId: 'proj-personal',
    projectName: 'Personal Sketches',
    files: [
      {
        filename: 'sketch-01.png',
        createdAt: '2026-04-28T19:11:00Z',
        tags: ['output', 'sketch']
      },
      {
        filename: 'sketch-02.png',
        createdAt: '2026-04-29T20:33:00Z',
        tags: ['output', 'sketch']
      },
      {
        filename: 'sketch-03.png',
        createdAt: '2026-04-30T18:04:00Z',
        tags: ['output', 'sketch', 'study']
      },
      {
        filename: 'sketch-04.png',
        createdAt: '2026-05-01T21:48:00Z',
        tags: ['output', 'sketch', 'study']
      },
      {
        filename: 'sketch-05.png',
        createdAt: '2026-05-02T22:15:00Z',
        tags: ['output', 'sketch', 'study']
      }
    ]
  }
]

const FIXTURE_BASE = '/prototype-fixtures/media'

export function buildPrototypeMediaAssets(): AssetItem[] {
  const assets: AssetItem[] = []
  for (const project of FIXTURES) {
    for (const file of project.files) {
      const url = `${FIXTURE_BASE}/${project.projectId.replace(/^proj-/, '')}/${file.filename}`
      assets.push({
        id: `media-${project.projectId}-${file.filename}`,
        name: `${project.projectId.replace(/^proj-/, '')}/${file.filename}`,
        display_name: file.filename,
        size: 0,
        created_at: file.createdAt,
        tags: file.tags,
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
  return FIXTURES.map((p) => ({ id: p.projectId, name: p.projectName }))
}
