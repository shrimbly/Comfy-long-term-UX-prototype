import { describe, expect, it } from 'vitest'

import { formatBytes, mediaKind, projectIdOf } from './mediaAssets'

describe('mediaKind', () => {
  it.for([
    [{ kind: 'video' }, 'video'],
    [{ kind: 'audio' }, 'audio'],
    [{ kind: 'model3d' }, 'model3d'],
    [{ kind: 'image' }, 'image'],
    [{ kind: 'bogus' }, 'image'],
    [{}, 'image'],
    [undefined, 'image']
  ] as const)('reads %o as %s', ([metadata, kind]) => {
    expect(mediaKind({ user_metadata: metadata })).toBe(kind)
  })
})

describe('projectIdOf', () => {
  it('returns the id only when it is a string', () => {
    expect(projectIdOf({ user_metadata: { projectId: 'proj-a' } })).toBe(
      'proj-a'
    )
    expect(projectIdOf({ user_metadata: { projectId: 7 } })).toBeUndefined()
    expect(projectIdOf({ user_metadata: undefined })).toBeUndefined()
  })
})

describe('formatBytes', () => {
  it.for([
    [0, '0 B'],
    [900, '900 B'],
    [900_000, '900 KB'],
    [2_400_000, '2.4 MB'],
    [26_500_000, '26.5 MB'],
    [120_000_000, '120 MB'],
    [1_500_000_000, '1.5 GB']
  ] as const)('%d → %s', ([bytes, text]) => {
    expect(formatBytes(bytes)).toBe(text)
  })
})
