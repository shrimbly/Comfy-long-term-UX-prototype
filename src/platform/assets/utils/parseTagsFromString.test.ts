import { describe, expect, it } from 'vitest'

import { parseTagsFromString } from './parseTagsFromString'

describe('parseTagsFromString', () => {
  it('returns an empty array for empty input', () => {
    expect(parseTagsFromString('')).toEqual([])
  })

  it('splits a comma-separated string into trimmed tags', () => {
    expect(parseTagsFromString('hero, sidekick, villain')).toEqual([
      'hero',
      'sidekick',
      'villain'
    ])
  })

  it('drops empty pieces produced by trailing or repeated commas', () => {
    expect(parseTagsFromString('hero,,sidekick,')).toEqual(['hero', 'sidekick'])
  })

  it('dedupes while preserving first occurrence order', () => {
    expect(parseTagsFromString('hero, sidekick, hero, villain')).toEqual([
      'hero',
      'sidekick',
      'villain'
    ])
  })

  it('drops invalid tag names (system + favorite-* + whitespace) silently', () => {
    expect(
      parseTagsFromString('hero, output, favorite-yellow,   , sidekick')
    ).toEqual(['hero', 'sidekick'])
  })

  it('does not split on delimiters other than comma', () => {
    expect(parseTagsFromString('hero;sidekick villain')).toEqual([
      'hero;sidekick villain'
    ])
  })
})
