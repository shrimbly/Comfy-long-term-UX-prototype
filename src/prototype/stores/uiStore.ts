// Implements:
//   prototype scaffolding — local UI state for the active body view + the
//   filter state for the Library page.

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { usePrototypePersonaStore } from './personaStore'
import type { AssetStorage, LibrarySection } from '../types'

type StorageFilter = 'all' | AssetStorage

export type ProjectTab = 'workflows' | 'review' | 'settings' | 'usage'

type ActiveView =
  | { kind: 'explore' }
  | { kind: 'drafts' }
  | { kind: 'projects' }
  | { kind: 'project'; projectId: string; tab?: ProjectTab }
  | { kind: 'workflow'; workflowId: string }
  | { kind: 'library'; section: LibrarySection }
  | { kind: 'recents' }
  | { kind: 'hub' }
  | { kind: 'members' }
  | { kind: 'settings' }

export const usePrototypeUiStore = defineStore('prototype-ui', () => {
  // Explore is the dashboard home — every dashboard mount lands here
  // regardless of where the user navigated previously.
  const activeView = ref<ActiveView>({ kind: 'explore' })

  // Library page filters. 'all' = no filter applied. Click the active
  // project/folder again to deselect (toggle back to 'all').
  const projectFilter = ref<string>('all')
  const tagFilter = ref<Set<string>>(new Set())
  const folderFilter = ref<string>('all')
  const storageFilter = ref<StorageFilter>('all')
  const searchQuery = ref<string>('')

  function go(view: ActiveView) {
    activeView.value = view
  }

  function goHome() {
    activeView.value = { kind: 'explore' }
  }

  function selectProject(id: string) {
    projectFilter.value = projectFilter.value === id ? 'all' : id
  }

  function setProjectFilter(id: string) {
    projectFilter.value = id
  }

  function selectFolder(name: string) {
    folderFilter.value = folderFilter.value === name ? 'all' : name
  }

  function toggleTagFilter(tag: string) {
    const next = new Set(tagFilter.value)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    tagFilter.value = next
  }

  function clearTagFilter() {
    tagFilter.value = new Set()
  }

  function setSearchQuery(value: string) {
    searchQuery.value = value
  }

  function setStorageFilter(value: StorageFilter) {
    storageFilter.value = value
  }

  function resetLibraryFilters() {
    projectFilter.value = 'all'
    tagFilter.value = new Set()
    folderFilter.value = 'all'
    storageFilter.value = 'all'
    searchQuery.value = ''
  }

  const personaStore = usePrototypePersonaStore()
  watch(
    () => personaStore.currentPersonaId,
    () => {
      activeView.value = { kind: 'explore' }
      resetLibraryFilters()
    }
  )
  watch(
    () => personaStore.fixture.currentWorkspaceId,
    () => {
      activeView.value = { kind: 'explore' }
      resetLibraryFilters()
    }
  )

  return {
    activeView,
    projectFilter,
    tagFilter,
    folderFilter,
    storageFilter,
    searchQuery,
    go,
    goHome,
    selectProject,
    setProjectFilter,
    selectFolder,
    toggleTagFilter,
    clearTagFilter,
    setSearchQuery,
    setStorageFilter,
    resetLibraryFilters
  }
})
