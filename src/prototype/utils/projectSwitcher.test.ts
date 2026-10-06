import { describe, expect, it } from 'vitest'

import { rankRecentProjectIds, switcherSections } from './projectSwitcher'

const projects = [
  { id: 'mine', name: 'My Workflows' },
  { id: 'mkt', name: 'Marketing 2026' },
  { id: 'brand', name: 'Brand Library' },
  { id: 'coke', name: 'Coca-Cola Ad' },
  { id: 'matrix', name: 'The Matrix' }
]

const names = (sections: ReturnType<typeof switcherSections>) =>
  sections.map((s) => ({
    label: s.label,
    names: s.projects.map((p) => p.name)
  }))

describe('rankRecentProjectIds', () => {
  it.for([
    {
      case: 'keeps the first sighting of each id',
      candidates: ['coke', 'mkt', 'coke', 'matrix'],
      expected: ['coke', 'mkt', 'matrix']
    },
    {
      case: 'drops ids that are not switchable',
      candidates: ['gone', 'mkt'],
      expected: ['mkt']
    },
    {
      case: 'stops at three',
      candidates: ['mine', 'mkt', 'brand', 'coke'],
      expected: ['mine', 'mkt', 'brand']
    }
  ])('$case', ({ candidates, expected }) => {
    expect(
      rankRecentProjectIds(
        candidates,
        projects.map((p) => p.id)
      )
    ).toEqual(expected)
  })
})

describe('switcherSections', () => {
  it('lists recent projects in recency order, then the rest A–Z', () => {
    expect(names(switcherSections(projects, ['matrix', 'coke'], ''))).toEqual([
      { label: 'recent', names: ['The Matrix', 'Coca-Cola Ad'] },
      {
        label: 'others',
        names: ['Brand Library', 'Marketing 2026', 'My Workflows']
      }
    ])
  })

  it.for([
    {
      case: 'matches names case-insensitively, recent first, unlabelled',
      query: 'MA',
      expected: [{ label: undefined, names: ['The Matrix', 'Marketing 2026'] }]
    },
    {
      case: 'ignores surrounding spaces',
      query: '  coca ',
      expected: [{ label: undefined, names: ['Coca-Cola Ad'] }]
    },
    {
      case: 'returns nothing when no name matches',
      query: 'zebra',
      expected: []
    }
  ])('$case', ({ query, expected }) => {
    expect(names(switcherSections(projects, ['matrix'], query))).toEqual(
      expected
    )
  })

  it('leaves out an empty Recent section', () => {
    expect(switcherSections(projects, [], '').map((s) => s.label)).toEqual([
      'others'
    ])
  })
})
