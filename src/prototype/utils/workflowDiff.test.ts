import { describe, expect, it } from 'vitest'

import { semanticWorkflowDiff } from './workflowDiff'

interface TestNode {
  id: number
  type?: string
  pos?: number[]
  size?: number[]
  mode?: number
  title?: string
  widgets_values?: unknown[]
}

interface TestGraph {
  extra?: { ds?: { scale: number; offset: number[] } }
  nodes?: TestNode[]
  links?: unknown[]
  groups?: unknown[]
  definitions?: {
    subgraphs?: Array<{
      id: string
      name: string
      nodes: TestNode[]
      links?: unknown[]
    }>
  }
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

const PROMPT_A =
  'She stands holding a lit cigarette near her hip. Expression deadpan.\nStyle: 35mm film grain, muted color.'
const PROMPT_B =
  'She stands holding a lit cigarette. Expression deadpan.\nStyle: 35mm film grain, muted color.'

// Mirrors the real Contact Sheet pair: top-level nodes, a viewport, and a
// subgraph whose nodes carry the seed + prompt that actually changed.
const WORKFLOW: TestGraph = {
  extra: { ds: { scale: 0.108, offset: [-34, 958] } },
  nodes: [
    { id: 1, type: 'ResolutionSelector', pos: [100, 100] },
    { id: 2, type: 'SaveImage', pos: [200, 100] },
    { id: 3, type: 'SaveImage', pos: [300, 100] },
    { id: 4, type: 'FL_ImageSlicer', pos: [400, 100] },
    { id: 5, type: 'PreviewAny', pos: [500, 100] },
    { id: 6, type: 'GetNode', pos: [600, 100] }
  ],
  links: [[10, 1, 0, 2, 0, 'IMAGE']],
  groups: [],
  definitions: {
    subgraphs: [
      {
        id: 'sg-text-to-image',
        name: 'Text to Image (Ideogram v4)',
        nodes: [
          { id: 7, type: 'RandomNoise', widgets_values: [413917961119450] },
          { id: 9, type: 'CLIPTextEncode', widgets_values: [PROMPT_A] }
        ],
        links: [
          {
            id: 8,
            origin_id: 7,
            origin_slot: 0,
            target_id: 9,
            target_slot: 0,
            type: 'NOISE'
          }
        ]
      }
    ]
  }
}

describe('semanticWorkflowDiff', () => {
  it('summarizes the real-pair pattern: seed + prompt + moves, ignoring the viewport', () => {
    const before = clone(WORKFLOW)
    const after = clone(WORKFLOW)
    // Viewport pan/zoom — pure noise, must never surface.
    after.extra = { ds: { scale: 0.14, offset: [-2240, 114] } }
    // The whole left cluster dragged.
    for (const n of after.nodes ?? []) {
      n.pos = [(n.pos?.[0] ?? 0) - 317, (n.pos?.[1] ?? 0) + 8]
    }
    const sub = after.definitions?.subgraphs?.[0]
    if (sub) {
      sub.nodes[0].widgets_values = [413917961119451] // seed +1
      sub.nodes[1].widgets_values = [PROMPT_B] // prompt edit
    }

    const diff = semanticWorkflowDiff(before, after)

    expect(diff.headline).toEqual([
      'Prompt edited',
      'Seed changed',
      '6 nodes moved'
    ])
    expect(diff.counts).toMatchObject({ seeds: 1, prompts: 1, moved: 6 })
    // Viewport pan/zoom must not leak into the result.
    const serialized = JSON.stringify(diff)
    expect(serialized).not.toContain('scale')
    expect(serialized).not.toContain('offset')
  })

  it('reports a word delta on edited prompts', () => {
    const before = clone(WORKFLOW)
    const after = clone(WORKFLOW)
    const sub = after.definitions?.subgraphs?.[0]
    if (sub) sub.nodes[1].widgets_values = [PROMPT_B]

    const diff = semanticWorkflowDiff(before, after)
    const prompt = diff.details.find((d) => d.widgetKind === 'prompt')
    expect(prompt?.label).toBe('Prompt edited (+1 / −4 words)')
  })

  it('counts added and removed nodes', () => {
    const before = clone(WORKFLOW)
    const after = clone(WORKFLOW)
    after.nodes?.push({ id: 99, type: 'LoraLoader', pos: [700, 100] })
    after.nodes = after.nodes?.filter((n) => n.id !== 6)

    const diff = semanticWorkflowDiff(before, after)
    expect(diff.counts.added).toBe(1)
    expect(diff.counts.removed).toBe(1)
    expect(diff.headline).toContain('1 node added')
    expect(diff.headline).toContain('1 node removed')
  })

  it('detects rewired connections by endpoint, not link id', () => {
    const before = clone(WORKFLOW)
    const after = clone(WORKFLOW)
    // Same endpoints, different link id — NOT a change.
    after.links = [[77, 1, 0, 2, 0, 'IMAGE']]
    expect(semanticWorkflowDiff(before, after).counts.rewired).toBe(0)

    // New endpoint pair — a real topology change.
    after.links = [
      [10, 1, 0, 2, 0, 'IMAGE'],
      [11, 2, 0, 3, 0, 'IMAGE']
    ]
    const diff = semanticWorkflowDiff(before, after)
    expect(diff.counts.rewired).toBe(1)
    expect(diff.headline).toContain('1 connection changed')
  })

  it('names known widgets via the dictionary', () => {
    const a: TestGraph = {
      nodes: [
        {
          id: 1,
          type: 'KSampler',
          widgets_values: [123, 'fixed', 20, 8, 'euler', 'normal', 1]
        }
      ]
    }
    const b = clone(a)
    b.nodes![0].widgets_values = [123, 'fixed', 25, 8, 'euler', 'normal', 1]

    const diff = semanticWorkflowDiff(a, b)
    expect(diff.counts.params).toBe(1)
    expect(diff.headline[0]).toBe('steps 20 → 25')
  })

  it('detects bypassed nodes', () => {
    const before = clone(WORKFLOW)
    const after = clone(WORKFLOW)
    after.nodes![0].mode = 4

    const diff = semanticWorkflowDiff(before, after)
    expect(diff.counts.bypassed).toBe(1)
    expect(diff.headline).toContain('1 node bypassed')
  })

  it('does not confuse subgraphs that share a name', () => {
    const a: TestGraph = {
      definitions: {
        subgraphs: [
          {
            id: 'x',
            name: 'New Subgraph',
            nodes: [{ id: 1, type: 'A' }],
            links: [[1, 1, 0, 2, 0, 'X']]
          },
          {
            id: 'y',
            name: 'New Subgraph',
            nodes: [{ id: 1, type: 'A' }],
            links: [[1, 1, 0, 3, 0, 'X']]
          }
        ]
      }
    }
    const diff = semanticWorkflowDiff(a, clone(a))
    expect(diff.details).toEqual([])
  })

  it('never throws on malformed input', () => {
    expect(() => semanticWorkflowDiff(null, undefined)).not.toThrow()
    expect(() => semanticWorkflowDiff('garbage', 42)).not.toThrow()
    const empty = semanticWorkflowDiff({}, {})
    expect(empty.headline).toEqual([])
    expect(empty.details).toEqual([])
  })
})
