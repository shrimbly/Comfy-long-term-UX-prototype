import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  parentFolder,
  relocatedPathFor,
  useMediaReferenceStore
} from './mediaReferenceStore'
import type { LibraryAsset } from '../types'

function setup() {
  const store = useMediaReferenceStore()
  // Start from a clean slate, independent of the active persona's seed.
  store.references = []
  return store
}

function byId(store: ReturnType<typeof setup>, id: string): LibraryAsset {
  const found = store.references.find((a) => a.id === id)
  if (!found) throw new Error(`reference ${id} not found`)
  return found
}

describe('mediaReferenceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds a file as a linked local reference, parsing name and folder', () => {
    const store = setup()
    store.addReference('/Users/me/Pictures/trip/sunset.png', ['photo'])

    const asset = byId(store, 'ref-/Users/me/Pictures/trip/sunset.png')
    expect(asset.name).toBe('sunset.png')
    expect(asset.origin).toBe('referenced')
    expect(asset.storage).toBe('local')
    expect(asset.linkState).toBe('linked')
    expect(asset.folder).toBe('trip')
    expect(asset.tags).toEqual(['photo'])
  })

  it('does not add the same path twice', () => {
    const store = setup()
    store.addReference('/a/b/one.png')
    store.addReference('/a/b/one.png')
    expect(store.references).toHaveLength(1)
  })

  it('relinks a missing file to a new path and clears the missing state', () => {
    const store = setup()
    store.addReference('/old/dir/clip.mov')
    const id = 'ref-/old/dir/clip.mov'

    store.simulateMissing(id)
    expect(byId(store, id).linkState).toBe('missing')
    expect(store.missingCount).toBe(1)

    store.relink(id, '/new/place/clip.mov')
    const asset = byId(store, id)
    expect(asset.linkState).toBe('linked')
    expect(asset.sourcePath).toBe('/new/place/clip.mov')
    expect(asset.folder).toBe('place')
    expect(store.missingCount).toBe(0)
  })

  it('counts and batch-relinks missing siblings sharing a folder', () => {
    const store = setup()
    store.addReference('/shoot/raw/a.png')
    store.addReference('/shoot/raw/b.png')
    store.addReference('/shoot/raw/c.png')
    store.addReference('/other/d.png')

    store.simulateFolderMissing('/shoot/raw')
    expect(store.missingCount).toBe(3)

    const a = byId(store, 'ref-/shoot/raw/a.png')
    // The picked file is excluded from its own sibling count.
    expect(store.missingSiblingCount(a)).toBe(2)

    // LibraryView relinks the picked file, then its siblings.
    store.relink(a.id, '/moved/raw/a.png')
    store.relinkSiblings('/shoot/raw', '/moved/raw')

    expect(store.missingCount).toBe(0)
    expect(byId(store, 'ref-/shoot/raw/b.png').sourcePath).toBe(
      '/moved/raw/b.png'
    )
    expect(byId(store, 'ref-/shoot/raw/c.png').linkState).toBe('linked')
    // A file in a different folder is untouched.
    expect(byId(store, 'ref-/other/d.png').linkState).toBe('linked')
  })

  it('removes a reference without affecting others (remove ≠ delete)', () => {
    const store = setup()
    store.addReference('/a/keep.png')
    store.addReference('/a/drop.png')

    store.removeFromComfy('ref-/a/drop.png')

    expect(store.references).toHaveLength(1)
    expect(store.references[0].id).toBe('ref-/a/keep.png')
  })

  it('derives a relocated path under the archive volume', () => {
    const asset: LibraryAsset = {
      id: 'x',
      name: 'shot.png',
      section: 'media',
      origin: 'referenced',
      sourcePath: '/Users/me/Pictures/trip/shot.png',
      updatedAt: '2026-06-10T00:00:00Z'
    }
    expect(relocatedPathFor(asset)).toBe('/Volumes/Archive/trip/shot.png')
    expect(parentFolder('/Users/me/Pictures/trip/shot.png')).toBe(
      '/Users/me/Pictures/trip'
    )
  })
})
