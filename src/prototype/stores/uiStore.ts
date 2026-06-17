// Implements:
//   prototype scaffolding — local UI state for the active body view + the
//   filter state for the Media library page.

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { usePrototypePersonaStore } from './personaStore'
import type { AssetStorage } from '../types'

type StorageFilter = 'all' | AssetStorage

type ActiveView =
  | { kind: 'home' }
  | { kind: 'drafts' }
  | { kind: 'projects' }
  | { kind: 'project'; projectId: string }
  | { kind: 'recents' }
  | { kind: 'templates' }
  | { kind: 'members' }
  | { kind: 'settings' }

export const usePrototypeUiStore = defineStore('prototype-ui', () => {
  // Home is the dashboard landing — every dashboard mount lands here
  // regardless of where the user navigated previously.
  const activeView = ref<ActiveView>({ kind: 'home' })

  // Media library filters. 'all' = no filter applied. Click the active
  // project/folder again to deselect (toggle back to 'all').
  const projectFilter = ref<string>('all')
  const tagFilter = ref<Set<string>>(new Set())
  const folderFilter = ref<string>('all')
  const storageFilter = ref<StorageFilter>('all')
  const searchQuery = ref<string>('')

  // One-shot intent: a project freshly created via promotion wants its
  // share settings opened on arrival. ProjectDetailView consumes it once.
  const shareIntentProjectId = ref<string | null>(null)

  // Prototype toggle (Help button): swap every workflow thumbnail for a
  // branded custom thumbnail so we can compare custom vs. generated.
  const customThumbnails = ref(false)

  function toggleCustomThumbnails() {
    customThumbnails.value = !customThumbnails.value
  }

  function requestShareSettings(id: string) {
    shareIntentProjectId.value = id
  }

  function consumeShareIntent(id: string): boolean {
    if (shareIntentProjectId.value !== id) return false
    shareIntentProjectId.value = null
    return true
  }

  function go(view: ActiveView) {
    activeView.value = view
  }

  function goHome() {
    activeView.value = { kind: 'home' }
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
      activeView.value = { kind: 'home' }
      resetLibraryFilters()
    }
  )
  watch(
    () => personaStore.fixture.currentWorkspaceId,
    () => {
      activeView.value = { kind: 'home' }
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
    requestShareSettings,
    consumeShareIntent,
    go,
    goHome,
    selectProject,
    setProjectFilter,
    selectFolder,
    toggleTagFilter,
    clearTagFilter,
    setSearchQuery,
    setStorageFilter,
    resetLibraryFilters,
    customThumbnails,
    toggleCustomThumbnails
  }
})
