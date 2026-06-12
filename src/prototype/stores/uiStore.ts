// Implements:
//   prototype scaffolding — local UI state for the active body view + the
//   filter state for the Library page.

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { usePrototypePersonaStore } from './personaStore'
import type { AssetStorage, LibrarySection } from '../types'

type StorageFilter = 'all' | AssetStorage

type ActiveView =
  | { kind: 'explore' }
  | { kind: 'drafts' }
  | { kind: 'projects' }
  | { kind: 'project'; projectId: string }
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

  // Projects whose install-access notice the user has already dismissed
  // this session — so re-entering a project (e.g. after visiting a
  // workflow) doesn't show the gate again. Reset on persona/workspace
  // switch, where the install picture changes.
  const acknowledgedInstallNotices = ref<Set<string>>(new Set())

  // One-shot intent: a project freshly created via promotion wants its
  // share settings opened on arrival. ProjectDetailView consumes it once.
  const shareIntentProjectId = ref<string | null>(null)

  function requestShareSettings(id: string) {
    shareIntentProjectId.value = id
  }

  function consumeShareIntent(id: string): boolean {
    if (shareIntentProjectId.value !== id) return false
    shareIntentProjectId.value = null
    return true
  }

  // One-shot intent: a submission notification wants the project's Review
  // tab opened on arrival. ProjectDetailView consumes it once.
  const reviewIntentProjectId = ref<string | null>(null)

  function requestReviewTab(id: string) {
    reviewIntentProjectId.value = id
  }

  function consumeReviewIntent(id: string): boolean {
    if (reviewIntentProjectId.value !== id) return false
    reviewIntentProjectId.value = null
    return true
  }

  // One-shot intent: a submission-outcome notification wants a specific
  // workflow selected (its sidebar open) on arrival. ProjectDetailView
  // consumes it once.
  const selectWorkflowIntent = ref<{
    projectId: string
    workflowId: string
  } | null>(null)

  function requestSelectWorkflow(projectId: string, workflowId: string) {
    selectWorkflowIntent.value = { projectId, workflowId }
  }

  function consumeSelectWorkflow(projectId: string): string | null {
    const intent = selectWorkflowIntent.value
    if (!intent || intent.projectId !== projectId) return null
    selectWorkflowIntent.value = null
    return intent.workflowId
  }

  function acknowledgeInstallNotice(id: string) {
    acknowledgedInstallNotices.value = new Set([
      ...acknowledgedInstallNotices.value,
      id
    ])
  }

  function isInstallNoticeAcknowledged(id: string) {
    return acknowledgedInstallNotices.value.has(id)
  }

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
      acknowledgedInstallNotices.value = new Set()
    }
  )
  watch(
    () => personaStore.fixture.currentWorkspaceId,
    () => {
      activeView.value = { kind: 'explore' }
      resetLibraryFilters()
      acknowledgedInstallNotices.value = new Set()
    }
  )

  return {
    activeView,
    projectFilter,
    tagFilter,
    folderFilter,
    storageFilter,
    searchQuery,
    acknowledgeInstallNotice,
    isInstallNoticeAcknowledged,
    requestShareSettings,
    consumeShareIntent,
    requestReviewTab,
    consumeReviewIntent,
    requestSelectWorkflow,
    consumeSelectWorkflow,
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
