import { describe, expect, it } from 'vitest'

import type { NodePackDetails } from '../fixtures/nodePacks'
import type { PolicyItem } from '../fixtures/policyCatalog'
import type { Deployment } from '../types'
import {
  filterRows,
  formatCount,
  packRows,
  parseGithubRepo,
  pinsAfter,
  privatePack,
  sortRows
} from './customNodes'
import type { PackChange } from './customNodes'

function pack(id: string, installs: number): PolicyItem {
  return {
    id,
    kind: 'nodes',
    name: id,
    publisher: 'someone',
    license: 'MIT',
    version: '0.0.1',
    installs,
    allowed: true
  }
}

const catalog: PolicyItem[] = [
  pack('rmbg', 1_800_000),
  pack('impact', 3_400_000),
  pack('kj', 4_500_000),
  pack('blocked', 9_000_000),
  { ...pack('sdxl', 1), kind: 'models' }
]

const details: Record<string, NodePackDetails> = {
  impact: {
    repo: 'ltdrdata/ComfyUI-Impact-Pack',
    stars: 2600,
    releases: [
      { version: '8.29.1', date: '2026-10-04' },
      { version: '8.28.3', date: '2026-09-12' }
    ]
  },
  kj: {
    releases: [
      { version: '1.5.0', date: '2026-09-29' },
      { version: '1.4.2', date: '2026-09-08' }
    ]
  }
}

const deployment: Deployment = {
  id: 'dep',
  name: 'Acme Studio pipeline',
  kind: 'custom',
  release: 'v3',
  status: 'ready',
  nodePacks: ['rmbg', 'impact'],
  models: []
}

function rows(overrides: Partial<Parameters<typeof packRows>[0]> = {}) {
  return packRows({
    catalog,
    details,
    deployment,
    pins: { impact: '8.28.3' },
    drafts: {},
    isAllowed: (id) => id !== 'blocked',
    ...overrides
  })
}

describe('formatCount', () => {
  it.for([
    { count: undefined, expected: '—' },
    { count: 999, expected: '999' },
    { count: 1_950, expected: '1.9k' },
    { count: 2_000, expected: '2k' },
    { count: 4_560_000, expected: '4.5M' }
  ])('$count reads $expected', ({ count, expected }) => {
    expect(formatCount(count)).toBe(expected)
  })
})

describe('packRows', () => {
  it('lists every node pack with its state on the deployment', () => {
    expect(rows().map((r) => [r.id, r.state])).toEqual([
      ['rmbg', 'installed'],
      ['impact', 'installed'],
      ['kj', 'available'],
      ['blocked', 'blocked']
    ])
  })

  it('shows a pinned pack at its pin, with the newer release beside it', () => {
    expect(rows().find((r) => r.id === 'impact')).toMatchObject({
      version: '8.28.3',
      pinned: true,
      newer: '8.29.1',
      stars: 2600,
      repoUrl: 'https://github.com/ltdrdata/ComfyUI-Impact-Pack'
    })
  })

  it('shows an unpinned pack at its latest release', () => {
    const impact = rows({ pins: {} }).find((r) => r.id === 'impact')!
    expect(impact).toMatchObject({ version: '8.29.1', pinned: false })
    expect(impact.newer).toBeUndefined()
  })

  it('shows the version picked for a pack not installed yet', () => {
    const kj = rows({ drafts: { kj: '1.4.2' } }).find((r) => r.id === 'kj')
    expect(kj).toMatchObject({ version: '1.4.2', pinned: true })
  })

  it.for([
    {
      building: { kind: 'add', packId: 'kj', to: null },
      id: 'kj',
      state: 'adding'
    },
    {
      building: { kind: 'change', packId: 'impact', from: '8.28.3', to: null },
      id: 'impact',
      state: 'changing'
    }
  ] satisfies { building: PackChange; id: string; state: string }[])(
    'marks the pack the next release builds as $state',
    ({ building, id, state }) => {
      expect(
        rows({ building: [building] }).find((r) => r.id === id)?.state
      ).toBe(state)
    }
  )
})

describe('filterRows', () => {
  const ids = (filter: Partial<Parameters<typeof filterRows>[1]>) =>
    filterRows(rows(), {
      query: '',
      status: 'all',
      license: 'all',
      ...filter
    }).map((r) => r.id)

  it.for([
    {
      case: 'everything',
      filter: {},
      expected: ['rmbg', 'impact', 'kj', 'blocked']
    },
    {
      case: 'installed',
      filter: { status: 'installed' },
      expected: ['rmbg', 'impact']
    },
    { case: 'available', filter: { status: 'available' }, expected: ['kj'] },
    {
      case: 'not allowed',
      filter: { status: 'blocked' },
      expected: ['blocked']
    },
    { case: 'a search', filter: { query: 'IMP' }, expected: ['impact'] }
  ] satisfies {
    case: string
    filter: Partial<Parameters<typeof filterRows>[1]>
    expected: string[]
  }[])('shows $case', ({ filter, expected }) => {
    expect(ids(filter)).toEqual(expected)
  })
})

describe('sortRows', () => {
  it.for([
    { sort: 'installs', expected: ['impact', 'rmbg', 'blocked', 'kj'] },
    { sort: 'stars', expected: ['impact', 'rmbg', 'kj', 'blocked'] },
    { sort: 'name', expected: ['impact', 'rmbg', 'blocked', 'kj'] }
  ] satisfies { sort: 'installs' | 'stars' | 'name'; expected: string[] }[])(
    'puts installed packs first, then sorts by $sort',
    ({ sort, expected }) => {
      expect(sortRows(rows(), sort).map((r) => r.id)).toEqual(expected)
    }
  )

  it('puts the workspace’s own private packs after installed ones', () => {
    const withPrivate = rows().map((row) =>
      row.id === 'kj' ? { ...row, private: true } : row
    )
    expect(sortRows(withPrivate, 'installs').map((r) => r.id)).toEqual([
      'impact',
      'rmbg',
      'kj',
      'blocked'
    ])
  })
})

describe('pinsAfter', () => {
  it.for([
    {
      case: 'pins a release',
      change: { kind: 'add', packId: 'kj', to: '1.4.2' },
      expected: { impact: '8.28.3', kj: '1.4.2' }
    },
    {
      case: 'drops the pin to follow latest',
      change: { kind: 'change', packId: 'impact', from: '8.28.3', to: null },
      expected: {}
    },
    {
      case: 'replaces an existing pin',
      change: {
        kind: 'change',
        packId: 'impact',
        from: '8.28.3',
        to: '8.29.1'
      },
      expected: { impact: '8.29.1' }
    }
  ] satisfies { case: string; change: PackChange; expected: object }[])(
    '$case',
    ({ change, expected }) => {
      expect(pinsAfter({ impact: '8.28.3' }, [change])).toEqual(expected)
    }
  )

  it('applies every change in one release', () => {
    expect(
      pinsAfter({ impact: '8.28.3' }, [
        { kind: 'add', packId: 'kj', to: '1.4.2' },
        { kind: 'add', packId: 'rg', to: null },
        { kind: 'change', packId: 'impact', from: '8.28.3', to: null }
      ])
    ).toEqual({ kj: '1.4.2' })
  })
})

describe('private packs', () => {
  it.for([
    ['https://github.com/acme/comfyui-matte', 'acme/comfyui-matte'],
    ['github.com/acme/comfyui-matte.git', 'acme/comfyui-matte'],
    ['https://www.github.com/acme/comfyui-matte/', 'acme/comfyui-matte'],
    ['https://gitlab.com/acme/comfyui-matte', undefined],
    ['https://github.com/acme', undefined]
  ] as const)('reads %s as %s', ([url, repo]) => {
    expect(parseGithubRepo(url)).toBe(repo)
  })

  const context = { workspace: 'Acme Studio', today: '2026-10-08' }

  it('imports a GitHub repository at its ref, published by its owner', () => {
    const pack = privatePack(
      { kind: 'github', url: 'github.com/acme/comfyui-matte', ref: 'v2.1' },
      context
    )
    expect(pack?.item).toMatchObject({
      id: 'private-comfyui-matte',
      name: 'comfyui-matte',
      publisher: 'acme',
      license: 'Private',
      version: 'v2.1'
    })
    expect(pack?.details.repo).toBe('acme/comfyui-matte')
  })

  it('imports a .zip as the workspace’s own, versioned by upload day', () => {
    const pack = privatePack(
      { kind: 'zip', fileName: 'Acme Grade Tools.zip' },
      context
    )
    expect(pack?.item).toMatchObject({
      id: 'private-acme-grade-tools',
      name: 'Acme Grade Tools',
      publisher: 'Acme Studio',
      version: '2026-10-08'
    })
    expect(pack?.details.repo).toBeUndefined()
  })

  it('refuses a URL that isn’t a GitHub repository', () => {
    expect(
      privatePack(
        { kind: 'github', url: 'https://example.com/x', ref: '' },
        context
      )
    ).toBeUndefined()
  })
})
