import { beforeEach, describe, expect, it } from 'vitest'

import { useAssetTagGroups } from './useAssetTagGroups'

const STORAGE_KEY = 'Comfy.Assets.UserTagGroups.v1'

function resetGroupStorage() {
  localStorage.setItem(STORAGE_KEY, '{}')
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: '{}',
      storageArea: localStorage
    })
  )
}

describe('useAssetTagGroups', () => {
  beforeEach(() => {
    resetGroupStorage()
  })

  describe('assignTagsToGroup', () => {
    it('creates a new group with the given tags', () => {
      const { assignTagsToGroup, getTagsInGroup, allGroups } =
        useAssetTagGroups()
      assignTagsToGroup(['hero', 'sidekick'], 'characters')
      expect(getTagsInGroup('characters')).toEqual(['hero', 'sidekick'])
      expect(allGroups.value).toEqual([
        { name: 'characters', tags: ['hero', 'sidekick'] }
      ])
    })

    it('moves tags out of any prior group (one group per tag)', () => {
      const { assignTagsToGroup, getGroupOf, getTagsInGroup } =
        useAssetTagGroups()
      assignTagsToGroup(['hero'], 'a')
      assignTagsToGroup(['hero'], 'b')
      expect(getGroupOf('hero')).toBe('b')
      expect(getTagsInGroup('a')).toEqual([])
    })

    it('auto-prunes groups that become empty after a move', () => {
      const { assignTagsToGroup, allGroups } = useAssetTagGroups()
      assignTagsToGroup(['hero'], 'a')
      assignTagsToGroup(['hero'], 'b')
      expect(allGroups.value.map((g) => g.name)).toEqual(['b'])
    })

    it('trims, dedupes, and ignores invalid tags', () => {
      const { assignTagsToGroup, getTagsInGroup } = useAssetTagGroups()
      assignTagsToGroup(
        [' hero ', 'hero', '', 'output', 'favorite-yellow', 'sidekick'],
        'characters'
      )
      expect(getTagsInGroup('characters')).toEqual(['hero', 'sidekick'])
    })

    it('rejects empty / whitespace group names', () => {
      const { assignTagsToGroup, allGroups } = useAssetTagGroups()
      assignTagsToGroup(['hero'], '')
      assignTagsToGroup(['hero'], '   ')
      expect(allGroups.value).toEqual([])
    })

    it('merges into an existing group without duplicating', () => {
      const { assignTagsToGroup, getTagsInGroup } = useAssetTagGroups()
      assignTagsToGroup(['hero'], 'characters')
      assignTagsToGroup(['hero', 'sidekick'], 'characters')
      expect(getTagsInGroup('characters')).toEqual(['hero', 'sidekick'])
    })
  })

  describe('removeTagsFromGroups', () => {
    it('removes the tags from any group they belong to', () => {
      const { assignTagsToGroup, removeTagsFromGroups, getGroupOf } =
        useAssetTagGroups()
      assignTagsToGroup(['hero', 'sidekick'], 'a')
      removeTagsFromGroups(['hero'])
      expect(getGroupOf('hero')).toBeNull()
      expect(getGroupOf('sidekick')).toBe('a')
    })

    it('auto-prunes groups that become empty', () => {
      const { assignTagsToGroup, removeTagsFromGroups, allGroups } =
        useAssetTagGroups()
      assignTagsToGroup(['hero'], 'a')
      removeTagsFromGroups(['hero'])
      expect(allGroups.value).toEqual([])
    })

    it('is idempotent on missing tags', () => {
      const { assignTagsToGroup, removeTagsFromGroups, allGroups } =
        useAssetTagGroups()
      assignTagsToGroup(['hero'], 'a')
      removeTagsFromGroups(['ghost'])
      expect(allGroups.value).toEqual([{ name: 'a', tags: ['hero'] }])
    })
  })

  describe('renameGroup', () => {
    it('renames the group, preserving tags', () => {
      const { assignTagsToGroup, renameGroup, getTagsInGroup } =
        useAssetTagGroups()
      assignTagsToGroup(['hero'], 'a')
      expect(renameGroup('a', 'b')).toBe(true)
      expect(getTagsInGroup('a')).toEqual([])
      expect(getTagsInGroup('b')).toEqual(['hero'])
    })

    it('returns false on collision', () => {
      const { assignTagsToGroup, renameGroup, getTagsInGroup } =
        useAssetTagGroups()
      assignTagsToGroup(['hero'], 'a')
      assignTagsToGroup(['sidekick'], 'b')
      expect(renameGroup('a', 'b')).toBe(false)
      expect(getTagsInGroup('a')).toEqual(['hero'])
      expect(getTagsInGroup('b')).toEqual(['sidekick'])
    })

    it('returns false when source group does not exist', () => {
      const { renameGroup } = useAssetTagGroups()
      expect(renameGroup('missing', 'newname')).toBe(false)
    })

    it('rejects empty target', () => {
      const { assignTagsToGroup, renameGroup } = useAssetTagGroups()
      assignTagsToGroup(['hero'], 'a')
      expect(renameGroup('a', '   ')).toBe(false)
    })
  })

  describe('renameTagInGroups', () => {
    it('replaces the tag name in every group it belongs to', () => {
      const { assignTagsToGroup, renameTagInGroups, getTagsInGroup } =
        useAssetTagGroups()
      assignTagsToGroup(['hero', 'sidekick'], 'a')
      renameTagInGroups('hero', 'protagonist')
      expect(getTagsInGroup('a')).toEqual(['protagonist', 'sidekick'])
    })

    it('does nothing for invalid new names', () => {
      const { assignTagsToGroup, renameTagInGroups, getTagsInGroup } =
        useAssetTagGroups()
      assignTagsToGroup(['hero'], 'a')
      renameTagInGroups('hero', 'output')
      renameTagInGroups('hero', '')
      expect(getTagsInGroup('a')).toEqual(['hero'])
    })
  })

  describe('groupedTagSet', () => {
    it('reports membership across all groups', () => {
      const { assignTagsToGroup, groupedTagSet } = useAssetTagGroups()
      assignTagsToGroup(['hero'], 'a')
      assignTagsToGroup(['sidekick'], 'b')
      const set = groupedTagSet.value
      expect(set.has('hero')).toBe(true)
      expect(set.has('sidekick')).toBe(true)
      expect(set.has('villain')).toBe(false)
    })
  })
})
