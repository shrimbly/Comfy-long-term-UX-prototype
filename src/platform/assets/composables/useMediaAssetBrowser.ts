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
  // Generated → full /files listing (every saved asset).
  // Temp     → queue-history jobs source (one preview per recent run).
  const outputAssets = useMediaAssets('output')
  const outputJobsAssets = useOutputJobsAssets()

  const activeSources = ref<SourceId[]>(['output'])
  const favoritesActive = ref(false)
  const tempActive = ref(false)

  const tagSelection = useAssetTagSelectionStore()
  const userTags = useAssetTags()
  const favorites = useAssetFavorites()
  const metadataExtractor = useAssetPromptMetadata()

  const searchQuery = ref('')
  const metadataFilters = ref<MetadataFilter[]>([])
  const mediaTypeFilters = ref<string[]>([])
  const favoritesOnly = ref(false)

  const allMergedAssets = computed<AssetItem[]>(() => {
    const result: AssetItem[] = []
    if (activeSources.value.includes('output')) {
      result.push(...outputAssets.allMedia.value)
    }
    if (activeSources.value.includes('input')) {
      result.push(...inputAssets.allMedia.value)
    }
    return result
  })

  const baseAssets = computed(() => {
    const pool = tempActive.value
      ? outputJobsAssets.media.value
      : allMergedAssets.value
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
    if (tempActive.value) return outputJobsAssets.loading.value
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

  function selectTemp() {
    clearTagAndFavorites()
    tempActive.value = true
  }

  function selectFavorites() {
    tagSelection.clear()
    favoritesActive.value = true
    tempActive.value = false
  }

  function selectGenerated() {
    clearTagAndFavorites()
    tempActive.value = false
    activeSources.value = ['output']
  }

  function selectImported() {
    clearTagAndFavorites()
    tempActive.value = false
    activeSources.value = ['input']
  }

  function onTagSelectionChanged() {
    if (!tagSelection.hasSelection) return
    favoritesActive.value = false
    tempActive.value = false
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
    if (tempActive.value) {
      promises.push(outputJobsAssets.fetchMediaList())
    } else {
      if (activeSources.value.includes('output'))
        promises.push(outputAssets.fetchMediaList())
      if (activeSources.value.includes('input'))
        promises.push(inputAssets.fetchMediaList())
    }
    await Promise.all(promises)
  }

  void refreshAssets()

  watch(tempActive, (active) => {
    if (active) void outputJobsAssets.fetchMediaList()
  })

  const hasTagFilter = computed(() => tagSelection.hasSelection)

  const sidebarFlags = computed(() => ({
    tempActive:
      tempActive.value && !favoritesActive.value && !hasTagFilter.value,
    favoritesActive: favoritesActive.value && !hasTagFilter.value,
    generatedActive:
      !tempActive.value &&
      !favoritesActive.value &&
      !hasTagFilter.value &&
      activeSources.value.length === 1 &&
      activeSources.value[0] === 'output',
    importedActive:
      !tempActive.value &&
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
    selectTemp,
    selectFavorites,
    selectGenerated,
    selectImported,
    onTagSelectionChanged,

    refreshAssets
  }
}
