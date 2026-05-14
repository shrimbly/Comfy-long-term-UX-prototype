// Prototype implementation of IAssetsProvider & IFolderNavigation.
//
// Replaces useAssetsApi (cloud) / useInternalFilesApi (local) when the
// prototype routes mount MediaAssetsView. Reads from a static fixture set
// rather than hitting any backend, so the prototype demo works offline.
//
// Wired in via the factory branch in
//   src/platform/assets/composables/media/useMediaAssets.ts

import { computed, ref } from 'vue'

import type { AssetItem } from '@/platform/assets/schemas/assetSchema'
import {
  filterFilesInFolder,
  parseFoldersFromFilenames
} from '@/platform/assets/utils/folderParser'
import type { FolderItem } from '@/utils/directoryPickerUtil'

import { buildPrototypeMediaAssets } from '../fixtures/mediaAssets'

const cachedOutputAssets = buildPrototypeMediaAssets()

export function usePrototypeAssetsProvider(directory: 'input' | 'output') {
  // The prototype only seeds output assets for now. Inputs return empty.
  const allMedia = computed<AssetItem[]>(() =>
    directory === 'output' ? cachedOutputAssets : []
  )

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
