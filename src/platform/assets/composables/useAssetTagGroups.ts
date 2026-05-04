import { useStorage } from '@vueuse/core'
import { computed } from 'vue'

import { isUserTag } from './useAssetTags'

const STORAGE_KEY = 'Comfy.Assets.UserTagGroups.v1'

type GroupsByName = Record<string, string[]>

const groupsByName = useStorage<GroupsByName>(STORAGE_KEY, {})

export interface TagGroup {
  name: string
  tags: string[]
}

function isValidGroupName(name: string): boolean {
  return name.trim().length > 0
}

function normalizeTags(tags: readonly string[]): string[] {
  return Array.from(
    new Set(tags.map((t) => t.trim()).filter((t) => isUserTag(t)))
  ).sort()
}

function pruneEmptyGroups(record: GroupsByName): GroupsByName {
  const next: GroupsByName = {}
  for (const [name, tags] of Object.entries(record)) {
    if (tags.length > 0) next[name] = tags
  }
  return next
}

export function useAssetTagGroups() {
  function getGroupOf(tag: string): string | null {
    const trimmed = tag.trim()
    if (!trimmed) return null
    for (const [name, tags] of Object.entries(groupsByName.value)) {
      if (tags.includes(trimmed)) return name
    }
    return null
  }

  function getTagsInGroup(group: string): string[] {
    const tags = groupsByName.value[group.trim()]
    return tags ? [...tags] : []
  }

  const allGroups = computed<TagGroup[]>(() =>
    Object.entries(groupsByName.value)
      .map(([name, tags]) => ({ name, tags: [...tags] }))
      .sort((a, b) => a.name.localeCompare(b.name))
  )

  const groupedTagSet = computed<Set<string>>(() => {
    const set = new Set<string>()
    for (const tags of Object.values(groupsByName.value)) {
      for (const t of tags) set.add(t)
    }
    return set
  })

  function assignTagsToGroup(tags: readonly string[], group: string): void {
    const groupName = group.trim()
    if (!isValidGroupName(groupName)) return
    const incoming = normalizeTags(tags)
    if (incoming.length === 0) return

    const next: GroupsByName = {}
    for (const [name, existing] of Object.entries(groupsByName.value)) {
      if (name === groupName) continue
      next[name] = existing.filter((t) => !incoming.includes(t))
    }
    const target = groupsByName.value[groupName] ?? []
    next[groupName] = normalizeTags([...target, ...incoming])
    groupsByName.value = pruneEmptyGroups(next)
  }

  function removeTagsFromGroups(tags: readonly string[]): void {
    const targets = new Set(tags.map((t) => t.trim()).filter(Boolean))
    if (targets.size === 0) return
    const next: GroupsByName = {}
    for (const [name, existing] of Object.entries(groupsByName.value)) {
      next[name] = existing.filter((t) => !targets.has(t))
    }
    groupsByName.value = pruneEmptyGroups(next)
  }

  function renameGroup(oldName: string, newName: string): boolean {
    const from = oldName.trim()
    const to = newName.trim()
    if (!from || !isValidGroupName(to)) return false
    if (from === to) return true
    if (!(from in groupsByName.value)) return false
    if (to in groupsByName.value) return false
    const next: GroupsByName = {}
    for (const [name, tags] of Object.entries(groupsByName.value)) {
      next[name === from ? to : name] = tags
    }
    groupsByName.value = next
    return true
  }

  function removeTagFromAnyGroup(tag: string): void {
    removeTagsFromGroups([tag])
  }

  function renameTagInGroups(oldName: string, newName: string): void {
    const from = oldName.trim()
    const to = newName.trim()
    if (!from || !isUserTag(to) || from === to) return
    const next: GroupsByName = {}
    for (const [name, tags] of Object.entries(groupsByName.value)) {
      if (!tags.includes(from)) {
        next[name] = tags
        continue
      }
      next[name] = normalizeTags(tags.map((t) => (t === from ? to : t)))
    }
    groupsByName.value = pruneEmptyGroups(next)
  }

  return {
    getGroupOf,
    getTagsInGroup,
    allGroups,
    groupedTagSet,
    assignTagsToGroup,
    removeTagsFromGroups,
    renameGroup,
    removeTagFromAnyGroup,
    renameTagInGroups
  }
}
