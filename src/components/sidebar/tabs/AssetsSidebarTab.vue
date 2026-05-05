<template>
  <SidebarTabTemplate
    :title="isInFolderView ? '' : $t('sideToolbar.mediaAssets.title')"
    v-bind="$attrs"
  >
    <template v-if="!isInFolderView" #title-icon>
      <i class="mr-2 icon-[comfy--image-ai-edit] size-5 shrink-0" />
    </template>
    <template #alt-title>
      <div
        v-if="isInFolderView"
        class="flex w-full items-center justify-between gap-2"
      >
        <div class="flex items-center gap-2">
          <span class="font-bold">{{ $t('assetBrowser.jobId') }}:</span>
          <span class="text-sm">{{ folderJobId?.substring(0, 8) }}</span>
          <button
            class="m-0 cursor-pointer border-0 bg-transparent p-0 outline-0"
            role="button"
            @click="copyJobId"
          >
            <i class="icon-[lucide--copy] text-sm"></i>
          </button>
        </div>
        <div>
          <span>{{ formattedExecutionTime }}</span>
        </div>
      </div>
    </template>
    <template #tool-buttons-pinned>
      <button
        v-tooltip.bottom="$t('mediaAssets.modal.openBrowser')"
        type="button"
        class="m-0 flex cursor-pointer items-center justify-center border-0 bg-transparent p-1 text-text-primary outline-0 hover:text-base-foreground"
        :aria-label="$t('mediaAssets.modal.openBrowser')"
        @click="openMediaAssetBrowser"
      >
        <i class="icon-[lucide--external-link] size-5" />
      </button>
    </template>
    <template #header>
      <div v-if="isInFolderView" class="px-2 2xl:px-4">
        <Button variant="secondary" size="lg" @click="exitFolderView">
          <i class="icon-[lucide--arrow-left] size-4" />
          <span>{{ $t('sideToolbar.backToAssets') }}</span>
        </Button>
      </div>

      <MediaAssetFilterBar
        v-model:search-query="searchQuery"
        v-model:sort-by="sortBy"
        v-model:view-mode="viewMode"
        v-model:media-type-filters="mediaTypeFilters"
        v-model:metadata-filters="metadataFilters"
        v-model:favorites-only="favoritesOnly"
        bottom-divider
        :show-generation-time-sort="activeTab === 'temp'"
        :available-tags="availableTags"
        :available-values-by-field="availableValuesByField"
      />
      <MediaAssetFilterChipsBar v-model="metadataFilters" />
      <div
        v-if="!isInFolderView"
        class="border-b border-comfy-input p-2 2xl:px-4"
      >
        <TabList v-model="activeTab">
          <Tab value="output">{{ $t('sideToolbar.labels.generated') }}</Tab>
          <Tab value="input">{{ $t('sideToolbar.labels.imported') }}</Tab>
          <Tab value="temp">{{ $t('sideToolbar.labels.temp') }}</Tab>
        </TabList>
      </div>
    </template>
    <template #body>
      <div
        v-if="showLoadingState"
        class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 p-2"
      >
        <div
          v-for="n in skeletonCount"
          :key="`skeleton-${n}`"
          class="flex flex-col gap-2 p-2"
        >
          <Skeleton class="aspect-square w-full rounded-lg" />
          <div class="flex flex-col gap-1">
            <Skeleton class="h-4 w-3/4" />
            <Skeleton class="h-3 w-1/2" />
          </div>
        </div>
      </div>
      <div v-else-if="showEmptyState">
        <NoResultsPlaceholder
          icon="pi pi-info-circle"
          :title="$t(emptyStateTitleKey)"
          :message="$t('sideToolbar.noFilesFoundMessage')"
        />
      </div>
      <div
        v-else
        class="relative size-full py-2"
        @click="handleEmptySpaceClick"
      >
        <AssetsSidebarListView
          v-if="isListView"
          :asset-items="listViewAssetItems"
          :is-selected="isSelected"
          :selectable-assets="listViewSelectableAssets"
          :is-stack-expanded="isListViewStackExpanded"
          :toggle-stack="toggleListViewStack"
          @select-asset="handleAssetSelect"
          @preview-asset="handleZoomClick"
          @context-menu="handleAssetContextMenu"
          @approach-end="handleApproachEnd"
        />
        <AssetsSidebarGridView
          v-else
          :assets="displayAssets"
          :is-selected="isSelected"
          :show-output-count="shouldShowOutputCount"
          :get-output-count="getOutputCount"
          :grid-size="gridSize"
          @select-asset="handleAssetSelect"
          @context-menu="handleAssetContextMenu"
          @approach-end="handleApproachEnd"
          @zoom="handleZoomClick"
          @output-count-click="enterFolderView"
        />
        <AssetSelectionFloatingBar
          :visible="hasSelection"
          :count="totalOutputCount"
          :show-delete="shouldShowDeleteButton"
          bottom-offset="lg"
          @select-all="handleSelectAll"
          @deselect-all="handleDeselectAll"
          @download="handleDownloadSelected"
          @delete-selected="handleDeleteSelected"
        />
      </div>
    </template>
  </SidebarTabTemplate>
  <MediaLightbox
    v-model:active-index="galleryActiveIndex"
    :all-gallery-items="galleryItems"
    :compare-items="compareItems"
  />
  <MediaAssetContextMenu
    v-if="contextMenuAsset"
    ref="contextMenuRef"
    :asset="contextMenuAsset"
    :asset-type="contextMenuAssetType"
    :file-kind="contextMenuFileKind"
    :show-delete-button="shouldShowDeleteButton"
    :selected-assets="selectedAssets"
    :is-bulk-mode="isBulkMode"
    @zoom="handleZoomClick(contextMenuAsset)"
    @hide="handleContextMenuHide"
    @asset-deleted="refreshAssets"
    @bulk-download="handleBulkDownload"
    @bulk-delete="handleBulkDelete"
    @bulk-compare="handleBulkCompare"
    @bulk-add-to-workflow="handleBulkAddToWorkflow"
    @bulk-open-workflow="handleBulkOpenWorkflow"
    @bulk-export-workflow="handleBulkExportWorkflow"
  />
  <Teleport to="body">
    <div
      ref="dragPreviewWrapperRef"
      class="pointer-events-none fixed -top-[10000px] -left-[10000px]"
      aria-hidden="true"
    >
      <AssetDragPreview
        :thumbnails="dragPreviewThumbnails"
        :label="dragPreviewLabel"
        :content-visible="dragPreviewContentVisible"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  useAsyncState,
  useDebounceFn,
  useStorage,
  useTimeoutFn
} from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch
} from 'vue'
import { useI18n } from 'vue-i18n'

import NoResultsPlaceholder from '@/components/common/NoResultsPlaceholder.vue'
import AssetsSidebarGridView from '@/components/sidebar/tabs/AssetsSidebarGridView.vue'
import AssetsSidebarListView from '@/components/sidebar/tabs/AssetsSidebarListView.vue'
import SidebarTabTemplate from '@/components/sidebar/tabs/SidebarTabTemplate.vue'
import MediaLightbox from '@/components/sidebar/tabs/queue/MediaLightbox.vue'
import Tab from '@/components/tab/Tab.vue'
import TabList from '@/components/tab/TabList.vue'
import Button from '@/components/ui/button/Button.vue'
import Skeleton from '@/components/ui/skeleton/Skeleton.vue'
import AssetDragPreview from '@/platform/assets/components/AssetDragPreview.vue'
import AssetSelectionFloatingBar from '@/platform/assets/components/AssetSelectionFloatingBar.vue'
import MediaAssetContextMenu from '@/platform/assets/components/MediaAssetContextMenu.vue'
import MediaAssetFilterBar from '@/platform/assets/components/MediaAssetFilterBar.vue'
import MediaAssetFilterChipsBar from '@/platform/assets/components/MediaAssetFilterChipsBar.vue'
import type { ViewMode } from '@/platform/assets/components/MediaAssetFilterBar.vue'
import { getAssetType } from '@/platform/assets/composables/media/assetMappers'
import { useMediaAssets } from '@/platform/assets/composables/media/useMediaAssets'
import { useOutputJobsAssets } from '@/platform/assets/composables/media/useOutputJobsAssets'
import { useAssetDragPreview } from '@/platform/assets/composables/useAssetDragPreview'
import { useAssetFavorites } from '@/platform/assets/composables/useAssetFavorites'
import { useAssetFilters } from '@/platform/assets/composables/useAssetFilters'
import { useAssetPromptMetadata } from '@/platform/assets/composables/useAssetPromptMetadata'
import { useAssetSelection } from '@/platform/assets/composables/useAssetSelection'
import { useAssetTags } from '@/platform/assets/composables/useAssetTags'
import { useMediaAssetActions } from '@/platform/assets/composables/useMediaAssetActions'
import { useMediaAssetBrowserDialog } from '@/platform/assets/composables/useMediaAssetBrowserDialog'
import { useMediaAssetFiltering } from '@/platform/assets/composables/useMediaAssetFiltering'
import { useOutputStacks } from '@/platform/assets/composables/useOutputStacks'
import type { OutputAssetMetadata } from '@/platform/assets/schemas/assetMetadataSchema'
import { getOutputAssetMetadata } from '@/platform/assets/schemas/assetMetadataSchema'
import type { AssetItem } from '@/platform/assets/schemas/assetSchema'
import type { MediaKind } from '@/platform/assets/schemas/mediaAssetSchema'
import type { MetadataFilter } from '@/platform/assets/types/metadataFilter'
import { assetToResultItem } from '@/platform/assets/utils/assetLightboxAdapter'
import { getAssetDisplayName } from '@/platform/assets/utils/assetMetadataUtils'
import { resolveOutputAssetItems } from '@/platform/assets/utils/outputAssetUtil'
import { isCloud } from '@/platform/distribution/types'
import { useDialogStore } from '@/stores/dialogStore'
import type { ResultItemImpl } from '@/stores/queueStore'
import {
  formatDuration,
  getMediaTypeFromFilename,
  isPreviewableMediaType
} from '@/utils/formatUtil'

const Load3dViewerContent = defineAsyncComponent(
  () => import('@/components/load3d/Load3dViewerContent.vue')
)

const { t } = useI18n()

const emit = defineEmits<{ assetSelected: [asset: AssetItem] }>()

type ActiveTab = 'input' | 'output' | 'temp'
const activeTab = ref<ActiveTab>('output')
const folderJobId = ref<string | null>(null)
const folderExecutionTime = ref<number | undefined>(undefined)
const expectedFolderCount = ref(0)
const isInFolderView = computed(() => folderJobId.value !== null)
const viewMode = useStorage<ViewMode>(
  'Comfy.Assets.Sidebar.ViewMode',
  'grid-sm'
)
const isListView = computed(() => viewMode.value === 'list')
const gridSize = computed<'sm' | 'lg'>(() =>
  viewMode.value === 'grid-lg' ? 'lg' : 'sm'
)

const contextMenuRef = ref<InstanceType<typeof MediaAssetContextMenu>>()
const contextMenuAsset = ref<AssetItem | null>(null)

const shouldShowDeleteButton = computed(() => {
  if (activeTab.value === 'input' && !isCloud) return false
  return true
})

const contextMenuAssetType = computed(() =>
  contextMenuAsset.value ? getAssetType(contextMenuAsset.value.tags) : 'input'
)

const contextMenuFileKind = computed<MediaKind>(() =>
  getMediaTypeFromFilename(contextMenuAsset.value?.name ?? '')
)

const shouldShowOutputCount = (item: AssetItem): boolean => {
  if (activeTab.value !== 'temp' || isInFolderView.value) return false
  return getOutputCount(item) > 1
}

const emptyStateTitleKey = computed(() => {
  if (activeTab.value === 'input') return 'sideToolbar.noImportedFiles'
  if (activeTab.value === 'temp') return 'sideToolbar.noTempFiles'
  return 'sideToolbar.noGeneratedFiles'
})

const formattedExecutionTime = computed(() => {
  if (!folderExecutionTime.value) return ''
  return formatDuration(folderExecutionTime.value * 1000)
})

const toast = useToast()

const inputAssets = useMediaAssets('input')
const outputAssets = useMediaAssets('output')
const outputJobsAssets = useOutputJobsAssets()

const {
  isSelected,
  handleAssetClick,
  hasSelection,
  clearSelection,
  getSelectedAssets,
  reconcileSelection,
  getOutputCount,
  getTotalOutputCount,
  selectAll,
  activate: activateSelection,
  deactivate: deactivateSelection
} = useAssetSelection()

function handleSelectAll() {
  selectAll(visibleAssets.value)
}

const {
  downloadMultipleAssets,
  deleteAssets,
  addMultipleToWorkflow,
  openMultipleWorkflows,
  exportMultipleWorkflows
} = useMediaAssetActions()

const totalOutputCount = computed(() =>
  getTotalOutputCount(selectedAssets.value)
)

const favoritesOnly = ref(false)
const searchQuery = ref('')

const isFlattenedView = computed(
  () => searchQuery.value.trim() !== '' || favoritesOnly.value
)

const tabAssets = computed(() => {
  if (activeTab.value === 'input') return inputAssets
  if (activeTab.value === 'temp') return outputJobsAssets
  return outputAssets
})
const loading = computed(() =>
  isFlattenedView.value
    ? inputAssets.loading.value || outputAssets.loading.value
    : tabAssets.value.loading.value
)
const error = computed(() =>
  isFlattenedView.value
    ? (inputAssets.error.value ?? outputAssets.error.value)
    : tabAssets.value.error.value
)
const mediaAssets = computed<AssetItem[]>(() =>
  isFlattenedView.value
    ? [...inputAssets.media.value, ...outputAssets.media.value]
    : tabAssets.value.media.value
)

const galleryActiveIndex = ref(-1)
const currentGalleryAssetId = ref<string | null>(null)
const compareItems = ref<ResultItemImpl[]>([])

const DEFAULT_SKELETON_COUNT = 6
const skeletonCount = computed(() =>
  expectedFolderCount.value > 0
    ? expectedFolderCount.value
    : DEFAULT_SKELETON_COUNT
)

const {
  state: folderAssets,
  isLoading: folderLoading,
  error: folderError,
  execute: loadFolderAssets
} = useAsyncState(
  (metadata: OutputAssetMetadata, options: { createdAt?: string } = {}) =>
    resolveOutputAssetItems(metadata, options),
  [] as AssetItem[],
  { immediate: false, resetOnExecute: true }
)

const favorites = useAssetFavorites()

const baseAssets = computed(() => {
  const source = isInFolderView.value ? folderAssets.value : mediaAssets.value
  return favoritesOnly.value ? favorites.favoritedAssets(source) : source
})

const userTags = useAssetTags()
const availableTags = computed(() => userTags.allTags.value.map((t) => t.name))

const metadataExtractor = useAssetPromptMetadata()
const availableValuesByField = computed(() => ({
  model: metadataExtractor.getAvailableValues('model'),
  lora: metadataExtractor.getAvailableValues('lora'),
  workflowTitle: metadataExtractor.getAvailableValues('workflowTitle')
}))

const metadataFilters = ref<MetadataFilter[]>([])
const mediaTypeFilters = ref<string[]>([])

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
  'Comfy.Assets.DateRange',
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

const dragPreviewWrapperRef = ref<HTMLElement | null>(null)
const {
  thumbnails: dragPreviewThumbnails,
  label: dragPreviewLabel,
  contentVisible: dragPreviewContentVisible,
  setPreviewElement
} = useAssetDragPreview()

watch(
  dragPreviewWrapperRef,
  (el) => {
    setPreviewElement(el)
  },
  { immediate: true }
)

const {
  assetItems: listViewAssetItems,
  selectableAssets: listViewSelectableAssets,
  isStackExpanded: isListViewStackExpanded,
  toggleStack: toggleListViewStack
} = useOutputStacks({
  assets: computed(() => displayAssets.value)
})

const visibleAssets = computed(() => {
  if (!isListView.value) return displayAssets.value
  return listViewSelectableAssets.value
})

const previewableVisibleAssets = computed(() =>
  visibleAssets.value.filter((asset) =>
    isPreviewableMediaType(getMediaTypeFromFilename(asset.name))
  )
)

const selectedAssets = computed(() => getSelectedAssets(visibleAssets.value))

const isBulkMode = computed(
  () => hasSelection.value && selectedAssets.value.length > 1
)

const isFolderLoading = computed(
  () => isInFolderView.value && folderLoading.value
)

const showLoadingState = computed(
  () =>
    (loading.value || isFolderLoading.value) && displayAssets.value.length === 0
)

const showEmptyState = computed(
  () =>
    !loading.value && !isFolderLoading.value && displayAssets.value.length === 0
)

watch(visibleAssets, (newAssets) => {
  reconcileSelection(newAssets)
  if (currentGalleryAssetId.value && galleryActiveIndex.value !== -1) {
    const newIndex = previewableVisibleAssets.value.findIndex(
      (asset) => asset.id === currentGalleryAssetId.value
    )
    galleryActiveIndex.value = newIndex
  }
})

watch(galleryActiveIndex, (index) => {
  if (index === -1) {
    currentGalleryAssetId.value = null
    compareItems.value = []
  }
})

const galleryItems = computed(() =>
  previewableVisibleAssets.value.map(assetToResultItem)
)

function handleBulkCompare(assets: AssetItem[], totalSelected: number) {
  const items = assets.map(assetToResultItem)
  if (items.length < 2) return
  compareItems.value = items
  galleryActiveIndex.value = 0
  if (totalSelected > items.length) {
    toast.add({
      severity: 'info',
      summary: t('mediaAsset.compare.action'),
      detail: t('mediaAsset.compare.filteredToast', {
        n: items.length,
        m: totalSelected - items.length
      }),
      life: 3000
    })
  }
}

const refreshAssets = async () => {
  if (isFlattenedView.value) {
    await Promise.all([
      inputAssets.fetchMediaList(),
      outputAssets.fetchMediaList()
    ])
  } else {
    await tabAssets.value.fetchMediaList()
  }
  if (error.value) {
    console.error('Failed to refresh assets:', error.value)
  }
}

watch(isFlattenedView, async (flattened) => {
  if (!flattened) return
  const tasks: Promise<unknown>[] = []
  if (inputAssets.media.value.length === 0) {
    tasks.push(inputAssets.fetchMediaList())
  }
  if (outputAssets.media.value.length === 0) {
    tasks.push(outputAssets.fetchMediaList())
  }
  await Promise.all(tasks)
})

watch(
  activeTab,
  () => {
    clearSelection()
    searchQuery.value = ''
    void refreshAssets()
  },
  { immediate: true }
)

function handleAssetSelect(asset: AssetItem, assets?: AssetItem[]) {
  const assetList = assets ?? visibleAssets.value
  const index = assetList.findIndex((a) => a.id === asset.id)
  emit('assetSelected', asset)
  handleAssetClick(asset, index, assetList)
}

const { start: scheduleCleanup, stop: cancelCleanup } = useTimeoutFn(
  () => {
    contextMenuAsset.value = null
  },
  0,
  { immediate: false }
)

function handleAssetContextMenu(event: MouseEvent, asset: AssetItem) {
  cancelCleanup()
  contextMenuAsset.value = asset
  void nextTick(() => {
    contextMenuRef.value?.show(event)
  })
}

function handleContextMenuHide() {
  scheduleCleanup()
}

const handleBulkDownload = (assets: AssetItem[]) => {
  downloadMultipleAssets(assets)
  clearSelection()
}

const handleBulkDelete = async (assets: AssetItem[]) => {
  if (await deleteAssets(assets)) {
    clearSelection()
  }
}

const handleBulkAddToWorkflow = async (assets: AssetItem[]) => {
  await addMultipleToWorkflow(assets)
  clearSelection()
}

const handleBulkOpenWorkflow = async (assets: AssetItem[]) => {
  await openMultipleWorkflows(assets)
  clearSelection()
}

const handleBulkExportWorkflow = async (assets: AssetItem[]) => {
  await exportMultipleWorkflows(assets)
  clearSelection()
}

const handleDownloadSelected = () => {
  downloadMultipleAssets(selectedAssets.value)
  clearSelection()
}

const handleDeleteSelected = async () => {
  if (await deleteAssets(selectedAssets.value)) {
    clearSelection()
  }
}

const handleZoomClick = (asset: AssetItem) => {
  const mediaType = getMediaTypeFromFilename(asset.name)
  if (!isPreviewableMediaType(mediaType)) return

  if (mediaType === '3D') {
    const dialogStore = useDialogStore()
    dialogStore.showDialog({
      key: 'asset-3d-viewer',
      title: getAssetDisplayName(asset),
      component: Load3dViewerContent,
      props: {
        modelUrl: asset.preview_url || ''
      },
      dialogComponentProps: {
        style: 'width: 80vw; height: 80vh;',
        maximizable: true
      }
    })
    return
  }

  currentGalleryAssetId.value = asset.id
  const index = previewableVisibleAssets.value.findIndex(
    (a) => a.id === asset.id
  )
  if (index !== -1) {
    galleryActiveIndex.value = index
  }
}

const enterFolderView = async (asset: AssetItem) => {
  const metadata = getOutputAssetMetadata(asset.user_metadata)
  if (!metadata) {
    console.warn('Invalid output asset metadata')
    return
  }

  const { jobId, executionTimeInSeconds } = metadata
  if (!jobId) {
    console.warn('Missing required folder view data')
    return
  }

  folderJobId.value = jobId
  folderExecutionTime.value = executionTimeInSeconds
  expectedFolderCount.value = metadata.outputCount ?? 0

  await loadFolderAssets(0, metadata, { createdAt: asset.created_at })

  if (folderError.value) {
    toast.add({
      severity: 'error',
      summary: t('sideToolbar.folderView.errorSummary'),
      detail: t('sideToolbar.folderView.errorDetail')
    })
    exitFolderView()
  }
}

const exitFolderView = () => {
  folderJobId.value = null
  folderExecutionTime.value = undefined
  expectedFolderCount.value = 0
  folderAssets.value = []
  searchQuery.value = ''
}

onMounted(() => {
  activateSelection()
})

onUnmounted(() => {
  deactivateSelection()
})

const handleDeselectAll = () => {
  clearSelection()
}

const handleEmptySpaceClick = () => {
  if (hasSelection) {
    clearSelection()
  }
}

const copyJobId = async () => {
  if (!folderJobId.value) return
  try {
    await navigator.clipboard.writeText(folderJobId.value)
    toast.add({
      severity: 'success',
      summary: t('mediaAsset.jobIdToast.copied'),
      detail: t('mediaAsset.jobIdToast.jobIdCopied'),
      life: 2000
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: t('mediaAsset.jobIdToast.error'),
      detail: t('mediaAsset.jobIdToast.jobIdCopyFailed')
    })
  }
}

const handleApproachEnd = useDebounceFn(async () => {
  if (isInFolderView.value || isFlattenedView.value) return
  if (activeTab.value !== 'temp') return
  if (!outputJobsAssets.hasMore.value || outputJobsAssets.isLoadingMore.value) {
    return
  }
  await outputJobsAssets.loadMore()
}, 300)

const mediaAssetBrowserDialog = useMediaAssetBrowserDialog()
function openMediaAssetBrowser() {
  mediaAssetBrowserDialog.show()
}
</script>
