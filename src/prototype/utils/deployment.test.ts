import { describe, expect, it } from 'vitest'

import { nextRelease } from './deployment'

describe('nextRelease', () => {
  it.for([
    ['v3', 'v4'],
    ['v9', 'v10'],
    [undefined, 'v1'],
    ['beta', 'v1']
  ] as const)('%s → %s', ([release, next]) => {
    expect(nextRelease(release)).toBe(next)
  })
})
