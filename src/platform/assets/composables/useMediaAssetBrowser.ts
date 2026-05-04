import { useStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

import { useMediaAssets } from '@/platform/assets/composables/media/useMediaAssets'
import { useOutputJobsAssets } from '@/platform/assets/composables/media/useOutputJobsAssets'
import { useAssetFavorites } from '@/platform/assets/composables/useAssetFavorites'
import { useAssetFilters } from '@/platform/assets/composables/useAssetFilters'
import { useAssetPromptMetadata } from '@/platform/assets/composables/useAssetPromptMetadata'
import { useAssetTagSelectionStore } from '@/platform/assets/composables/useAssetTagSelectionStore'
import { useAssetTags } from '@/platform/assets/composables/useAssetTags'
import { useMediaAssetFiltering } from '@/platform/assets/composables/useMediaAssetFiltering'
import type { AssetItem } from '@/platform/assets/schemas/assetSchema'
import type { MetadataFilter } from '@/platform/assets/types/metadataFilter'

type SourceId = 'output' | 'input'

/**
 * Wires the slice of asset-panel state the bigscreen modal needs:
 * source merging, sidebar nav (recents/favorites/source/tag), search +
 * metadata filters, date range, prompt-metadata extraction.
 *
 * Mirrors the relevant subset of AssetsSidebarTab.vue without the
 * tab/folder-view/custom-directory machinery.
 */
export function useMediaAssetBrowser() {
  const inputAssets = useMediaAssets('input')
  // Paginated jobs source mirrors the assets panel: first page lands quickly,
  // additional pages stream in as the user scrolls.
  const outputAssets = useOutputJobsAssets()

  const activeSources = ref<SourceId[]>(['output', 'input'])
  const favoritesActive = ref(false)
  const recentsOnly = ref(false)

  const tagSelection = useAssetTagSelectionStore()
  const userTags = useAssetTags()
  const favorites = useAssetFavorites()
  const metadataExtractor = useAssetPromptMetadata()

  const searchQuery = ref('')
  const metadataFilters = ref<MetadataFilter[]>([])
  const mediaTypeFilters = ref<string[]>([])
  const favoritesOnly = ref(false)

  function collect(useAll: boolean): AssetItem[] {
    const result: AssetItem[] = []
    if (activeSources.value.includes('output')) {
      const src = outputAssets
      result.push(...(useAll ? src.allMedia : src.media).value)
    }
    if (activeSources.value.includes('input')) {
      const src = inputAssets
      result.push(...(useAll ? src.allMedia : src.media).value)
    }
    return result
  }

  const mergedAssets = computed(() => collect(false))
  const allMergedAssets = computed(() => collect(true))

  const baseAssets = computed(() => {
    const pool = recentsOnly.value ? mergedAssets.value : allMergedAssets.value
    if (tagSelection.hasSelection) {
      return userTags.assetsWithAnyTag(pool, tagSelection.asArray)
    }
    if (favoritesActive.value || favoritesOnly.value) {
      const seen = new Set<string>()
      const unique: AssetItem[] = []
      for (const asset of pool) {
        if (seen.has(asset.id)) continue
        seen.add(asset.id)
        unique.push(asset)
      }
      return favorites.favoritedAssets(unique)
    }
    return pool
  })

  const availableTags = computed(() =>
    userTags.allTags.value.map((tag) => tag.name)
  )

  const availableValuesByField = computed(() => ({
    model: metadataExtractor.getAvailableValues('model'),
    lora: metadataExtractor.getAvailableValues('lora'),
    workflowTitle: metadataExtractor.getAvailableValues('workflowTitle')
  }))

  const { sortBy, filteredAssets } = useMediaAssetFiltering(baseAssets, {
    metadataExtractor,
    searchQuery,
    metadataFilters,
    mediaTypeFilters
  })

  watch(
    [metadataFilters, baseAssets],
    ([filters, assets]) => {
      if (filters.length > 0) metadataExtractor.extractBatch(assets)
    },
    { immediate: true }
  )

  const dateRangeFilter = useStorage<[Date, Date] | null>(
    'Comfy.Assets.Modal.DateRange',
    null
  )
  const assetFilters = useAssetFilters(filteredAssets)

  watch(
    dateRangeFilter,
    (value) => {
      assetFilters.dateRange.value = value
    },
    { immediate: true }
  )

  watch(
    () => assetFilters.dateRange.value,
    (value) => {
      dateRangeFilter.value = value
    }
  )

  const displayAssets = computed(() =>
    assetFilters.hasActiveFilters.value
      ? assetFilters.filteredByDate.value
      : filteredAssets.value
  )

  const isLoading = computed(() => {
    if (activeSources.value.includes('output') && outputAssets.loading.value)
      return true
    if (activeSources.value.includes('input') && inputAssets.loading.value)
      return true
    return false
  })

  function clearTagAndFavorites() {
    tagSelection.clear()
    favoritesActive.value = false
  }

  function selectRecents() {
    clearTagAndFavorites()
    recentsOnly.value = true
    activeSources.value = ['output', 'input']
  }

  function selectFavorites() {
    tagSelection.clear()
    favoritesActive.value = true
    recentsOnly.value = false
  }

  function selectGenerated() {
    clearTagAndFavorites()
    recentsOnly.value = false
    activeSources.value = ['output']
  }

  function selectImported() {
    clearTagAndFavorites()
    recentsOnly.value = false
    activeSources.value = ['input']
  }

  function onTagSelectionChanged() {
    if (!tagSelection.hasSelection) return
    favoritesActive.value = false
    recentsOnly.value = false
    activeSources.value = ['output', 'input']
  }

  watch(
    () => userTags.allTags.value,
    (list) => {
      tagSelection.pruneMissing(new Set(list.map((tag) => tag.name)))
    },
    { immediate: true }
  )

  async function refreshAssets() {
    const promises: Promise<unknown>[] = []
    if (activeSources.value.includes('output'))
      promises.push(outputAssets.fetchMediaList())
    if (activeSources.value.includes('input'))
      promises.push(inputAssets.fetchMediaList())
    await Promise.all(promises)
  }

  async function loadMore() {
    if (!activeSources.value.includes('output')) return
    if (!outputAssets.hasMore.value || outputAssets.isLoadingMore.value) return
    await outputAssets.loadMore()
  }

  const hasMore = computed(
    () => activeSources.value.includes('output') && outputAssets.hasMore.value
  )

  void refreshAssets()

  const hasTagFilter = computed(() => tagSelection.hasSelection)

  const sidebarFlags = computed(() => ({
    recentsActive:
      recentsOnly.value && !favoritesActive.value && !hasTagFilter.value,
    favoritesActive: favoritesActive.value && !hasTagFilter.value,
    generatedActive:
      !recentsOnly.value &&
      !favoritesActive.value &&
      !hasTagFilter.value &&
      activeSources.value.length === 1 &&
      activeSources.value[0] === 'output',
    importedActive:
      !recentsOnly.value &&
      !favoritesActive.value &&
      !hasTagFilter.value &&
      activeSources.value.length === 1 &&
      activeSources.value[0] === 'input'
  }))

  return {
    // data
    displayAssets,
    isLoading,
    availableTags,
    availableValuesByField,

    // filter state
    searchQuery,
    metadataFilters,
    mediaTypeFilters,
    favoritesOnly,
    sortBy,
    assetFilters,

    // sidebar state
    tagSelection,
    sidebarFlags,
    sidebarTags: computed(() => {
      const scoped = userTags.tagsForAssets(allMergedAssets.value)
      const present = new Set(scoped.map((tag) => tag.name))
      for (const name of tagSelection.asArray) {
        if (!present.has(name)) scoped.push({ name, count: 0 })
      }
      return scoped.sort((a, b) => a.name.localeCompare(b.name))
    }),

    // sidebar handlers
    selectRecents,
    selectFavorites,
    selectGenerated,
    selectImported,
    onTagSelectionChanged,

    // pagination
    loadMore,
    hasMore,

    refreshAssets
  }
}
