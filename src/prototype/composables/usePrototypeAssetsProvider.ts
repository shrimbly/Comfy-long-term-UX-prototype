// Prototype implementation of IAssetsProvider & IFolderNavigation.
//
// Replaces useAssetsApi (cloud) / useInternalFilesApi (local) when the
// prototype routes mount MediaAssetsView. Reads from a static fixture set
// rather than hitting any backend, so the prototype demo works offline.
//
// Wired in via the factory branch in
//   src/platform/assets/composables/media/useMediaAssets.ts

import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

import type { AssetItem } from '@/platform/assets/schemas/assetSchema'
import {
  filterFilesInFolder,
  parseFoldersFromFilenames
} from '@/platform/assets/utils/folderParser'
import type { FolderItem } from '@/utils/directoryPickerUtil'

import { buildPrototypeMediaAssets } from '../fixtures/mediaAssets'
import { useMediaReferenceStore } from '../stores/mediaReferenceStore'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { LibraryAsset } from '../types'

// Map a referenced local file (store shape) to the AssetItem the upstream
// media browser renders. `previewUrl` is the cached thumbnail; link state +
// source path ride along in user_metadata so the card overlay + context
// menu can surface the referenced-media affordances (Flow 03, non-final).
function referencedToAssetItem(a: LibraryAsset): AssetItem {
  return {
    id: a.id,
    name: a.name,
    display_name: a.name,
    size: 0,
    created_at: a.updatedAt,
    tags: a.tags ?? [],
    thumbnail_url: a.previewUrl,
    preview_url: a.previewUrl,
    user_metadata: {
      sourcePath: a.sourcePath,
      linkState: a.linkState ?? 'linked',
      // Local bytes → lights up the existing "Promote to cloud" context
      // action, which is how a reference materializes a cloud copy (Flow 03).
      storage: 'local'
    }
  }
}

// Shared filter state for the prototype project dropdown. Module-level so
// every consumer (provider + sidebar dropdown) sees the same ref.
const selectedProjectId = ref<string | null>(null)

interface ProjectFilterOption {
  id: string
  name: string
  count: number
}

export function usePrototypeProjectFilter() {
  const personaStore = usePrototypePersonaStore()
  const { currentPersonaId } = storeToRefs(personaStore)

  const availableProjects = computed<ProjectFilterOption[]>(() => {
    // Local users have no cloud projects — referenced media isn't grouped
    // by project, so the project dropdown stays empty.
    if (personaStore.fixture.mode === 'local') return []
    const assets = buildPrototypeMediaAssets(currentPersonaId.value)
    const byId = new Map<string, ProjectFilterOption>()
    for (const asset of assets) {
      const id = asset.user_metadata?.projectId as string | undefined
      const name = asset.user_metadata?.projectName as string | undefined
      if (!id || !name) continue
      const existing = byId.get(id)
      if (existing) existing.count += 1
      else byId.set(id, { id, name, count: 1 })
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
  })

  return { selectedProjectId, availableProjects }
}

export function usePrototypeAssetsProvider(directory: 'input' | 'output') {
  const personaStore = usePrototypePersonaStore()
  const { currentPersonaId } = storeToRefs(personaStore)
  const mediaRefs = useMediaReferenceStore()

  // Re-derives whenever the persona switcher OR the project dropdown changes.
  const allMedia = computed<AssetItem[]>(() => {
    if (directory !== 'output') return []
    // Local persona: serve the user's referenced media (linked files on
    // their own disk). Store mutations (relink / add / remove) propagate
    // through this computed to the grid automatically.
    if (personaStore.fixture.mode === 'local') {
      return mediaRefs.references.map(referencedToAssetItem)
    }
    const base = buildPrototypeMediaAssets(currentPersonaId.value)
    if (!selectedProjectId.value) return base
    return base.filter(
      (a) => a.user_metadata?.projectId === selectedProjectId.value
    )
  })

  const loading = ref(false)
  const error = ref<unknown>(null)
  const hasMore = ref(false)
  const isLoadingMore = ref(false)

  const currentPath = ref<string>('')
  const navigationHistory = ref<string[]>([])
  const historyIndex = ref(-1)

  const folders = computed<FolderItem[]>(() =>
    parseFoldersFromFilenames(
      allMedia.value.map((a) => a.name),
      currentPath.value
    )
  )

  const media = computed<AssetItem[]>(() => {
    const filenames = filterFilesInFolder(
      allMedia.value.map((a) => a.name),
      currentPath.value
    )
    const set = new Set(filenames)
    return allMedia.value.filter((a) => set.has(a.name))
  })

  const fetchMediaList = async (): Promise<AssetItem[]> => allMedia.value
  const refresh = fetchMediaList
  const loadMore = async (): Promise<void> => {}

  function navigateInto(folder: FolderItem) {
    if (historyIndex.value < navigationHistory.value.length - 1) {
      navigationHistory.value = navigationHistory.value.slice(
        0,
        historyIndex.value + 1
      )
    }
    navigationHistory.value.push(folder.path)
    historyIndex.value = navigationHistory.value.length - 1
    currentPath.value = folder.path
  }

  function navigateUp() {
    if (!currentPath.value) return
    const parts = currentPath.value.split('/')
    parts.pop()
    currentPath.value = parts.join('/')
  }

  function navigateToRoot() {
    currentPath.value = ''
  }

  function navigateToPath(path: string) {
    currentPath.value = path
  }

  const canNavigateUp = computed(() => currentPath.value !== '')
  const canNavigateBack = computed(() => historyIndex.value > 0)
  const canNavigateForward = computed(
    () => historyIndex.value < navigationHistory.value.length - 1
  )

  function navigateBack() {
    if (!canNavigateBack.value) return
    historyIndex.value -= 1
    currentPath.value = navigationHistory.value[historyIndex.value] ?? ''
  }

  function navigateForward() {
    if (!canNavigateForward.value) return
    historyIndex.value += 1
    currentPath.value = navigationHistory.value[historyIndex.value] ?? ''
  }

  return {
    media,
    allMedia,
    loading,
    error,
    fetchMediaList,
    refresh,
    loadMore,
    hasMore,
    isLoadingMore,
    folders,
    currentPath,
    navigateInto,
    navigateUp,
    navigateToRoot,
    navigateToPath,
    canNavigateUp,
    canNavigateBack,
    canNavigateForward,
    navigateBack,
    navigateForward
  }
}
