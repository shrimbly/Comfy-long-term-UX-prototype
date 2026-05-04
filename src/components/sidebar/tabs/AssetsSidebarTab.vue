<template>
  <SidebarTabTemplate
    :title="
      hasLeftSidebar || showAllAssets ? '' : $t('sideToolbar.mediaAssets.title')
    "
    :class="hasLeftSidebar ? 'assets-tab-with-sidebar' : ''"
    v-bind="$attrs"
  >
    <template #alt-title>
      <!-- Folder view: job ID display (both modes) -->
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
      <!-- Advanced view title -->
      <div
        v-else-if="showAllAssets"
        class="flex w-full items-center justify-between gap-2"
      >
        <span
          class="truncate font-bold"
          :title="$t('sideToolbar.mediaAssets.title')"
        >
          {{ $t('sideToolbar.mediaAssets.title') }}
        </span>
      </div>
    </template>
    <template #header>
      <!-- Job Detail View Header -->
      <div v-if="isInFolderView" class="px-2 2xl:px-4">
        <Button variant="secondary" size="lg" @click="exitFolderView">
          <i class="icon-[lucide--arrow-left] size-4" />
          <span>{{ $t('sideToolbar.backToAssets') }}</span>
        </Button>
      </div>
    </template>
    <template #body>
      <div
        :class="
          showAllAssets || showRecentsSidebar
            ? 'assets-content-layout'
            : 'contents'
        "
      >
        <!-- Left Folders Sidebar (advanced view, folders layout) -->
        <div
          v-if="hasLeftSidebar"
          class="relative flex h-full shrink-0 flex-col"
          :style="{ width: `${sidebarWidth}px` }"
        >
          <div
            class="flex h-18 shrink-0 items-center gap-2 bg-(--comfy-menu-bg) pr-3 pl-6"
            :title="$t('sideToolbar.mediaAssets.title')"
          >
            <i class="icon-[comfy--image-ai-edit] size-5 shrink-0" />
            <h2 class="text-neutral truncate text-base">
              {{ $t('sideToolbar.mediaAssets.title') }}
            </h2>
          </div>
          <div class="flex min-h-0 flex-1">
            <AssetsSidebar
              v-if="showRecentsSidebar"
              :available-tags="availableUserTags"
              :recents-active="
                !showAllAssets && !favoritesActive && !hasTagFilter
              "
              :favorites-active="favoritesActive && !hasTagFilter"
              :generated-active="
                showAllAssets &&
                !favoritesActive &&
                !hasTagFilter &&
                singleActiveSource === 'output'
              "
              :imported-active="
                showAllAssets &&
                !favoritesActive &&
                !hasTagFilter &&
                singleActiveSource === 'input'
              "
              :favorite-color-filter="favoriteColorFilter"
              @select-recents="handleSelectRecents"
              @select-favorites="handleSelectFavorites"
              @select-favorite-color="handleSelectFavoriteColor"
              @select-generated="handleSelectGenerated"
              @select-imported="handleSelectImported"
              @selection-changed="handleTagSelectionChanged"
              @rename-tag="handleRenameTag"
              @delete-tags="handleDeleteTags"
            />
          </div>
          <!-- Resize handle -->
          <div
            class="absolute inset-y-0 right-0 z-10 w-1 -translate-x-1/2 cursor-col-resize hover:bg-primary/50"
            :class="isResizingSidebar && 'bg-primary/50'"
            @mousedown.prevent="startSidebarResize"
          >
            <div
              v-if="showRecentsSidebar"
              class="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-comfy-input"
              aria-hidden="true"
            />
          </div>
        </div>
        <!-- Main Content Area -->
        <div
          :class="
            showAllAssets || showRecentsSidebar
              ? 'assets-main-content bg-base-background'
              : 'contents'
          "
        >
          <!-- Filter Bar -->
          <div :class="hasLeftSidebar ? 'flex h-18 flex-col pt-3' : 'contents'">
            <MediaAssetFilterBar
              v-model:search-query="searchQuery"
              v-model:sort-by="sortBy"
              v-model:view-mode="viewMode"
              v-model:hide-sidebar="hideRecentsSidebar"
              v-model:media-type-filters="mediaTypeFilters"
              v-model:metadata-filters="metadataFilters"
              :bottom-divider="false"
              :show-generation-time-sort="activeSources.includes('output')"
              :available-tags="availableTags"
              :available-values-by-field="availableValuesByField"
            />
          </div>
          <!-- Active metadata filter chips -->
          <MediaAssetFilterChipsBar v-model="metadataFilters" />
          <!-- Active filter + Show Details toggle -->
          <div
            v-if="
              !isInFolderView &&
              (activeFilterLabel || selectionStore.lastSelectedAssetId)
            "
            class="sticky top-0 z-10 flex items-center gap-2 border-b border-comfy-input bg-base-background px-2 py-1.5 text-xs"
          >
            <span
              v-if="activeFilterLabel"
              class="truncate font-medium text-text-primary"
            >
              {{ activeFilterLabel }}
            </span>
            <PopoverRoot
              v-if="selectionStore.lastSelectedAssetId"
              v-model:open="showDetailPanel"
            >
              <PopoverTrigger as-child>
                <Button variant="secondary" size="sm" class="ml-auto shrink-0">
                  {{
                    showDetailPanel
                      ? t('mediaAsset.details.hideDetails')
                      : t('mediaAsset.details.showDetails')
                  }}
                </Button>
              </PopoverTrigger>
              <PopoverPortal>
                <PopoverContent
                  side="right"
                  align="start"
                  :side-offset="20"
                  :collision-padding="10"
                  class="data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade z-1700 w-72 overflow-hidden rounded-lg border border-border-subtle bg-base-background shadow-lg will-change-[transform,opacity]"
                  @interact-outside.prevent
                >
                  <div
                    v-if="detailAssets.length > 0"
                    class="flex max-h-[70vh] flex-col"
                  >
                    <div
                      class="flex shrink-0 items-center justify-between border-b border-border-subtle px-3 py-2"
                    >
                      <span class="text-sm font-medium text-text-primary">
                        {{ t('mediaAsset.details.assetDetails') }}
                      </span>
                      <PopoverClose
                        :aria-label="t('g.close')"
                        class="flex cursor-pointer appearance-none items-center justify-center border-none bg-transparent p-1 text-muted-foreground hover:text-base-foreground"
                      >
                        <i class="icon-[lucide--x] size-4" />
                      </PopoverClose>
                    </div>
                    <div class="min-h-0 flex-1 overflow-y-auto">
                      <AssetDetailPanel
                        :assets="detailAssets"
                        :prompt-metadata="detailPromptMeta"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </PopoverPortal>
            </PopoverRoot>
          </div>
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
              :title="$t(emptyStateTitle)"
              :message="$t('sideToolbar.noFilesFoundMessage')"
            />
          </div>
          <div v-else class="relative size-full" @click="handleEmptySpaceClick">
            <AssetsSidebarListView
              v-if="isListView"
              :asset-items="listViewAssetItems"
              :is-selected="isSelected"
              :selectable-assets="listViewSelectableAssets"
              :is-stack-expanded="isListViewStackExpanded"
              :toggle-stack="toggleListViewStack"
              :restrict-stack-favorites="showRecentsSidebar"
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
              :restrict-stack-favorites="showRecentsSidebar"
              @select-asset="handleAssetSelect"
              @context-menu="handleAssetContextMenu"
              @approach-end="handleApproachEnd"
              @zoom="handleZoomClick"
              @output-count-click="enterFolderView"
            />
          </div>
          <!-- Inline Selection Footer (anchored to bottom of main content column) -->
          <div
            v-if="hasSelection && hasLeftSidebar"
            ref="footerRef"
            class="sticky bottom-0 z-10 mt-auto flex h-18 w-full shrink-0 items-center justify-between gap-2 bg-base-background px-4"
          >
            <span class="truncate text-sm text-base-foreground">
              {{
                $t('mediaAsset.selection.selectedCountShort', {
                  count: totalOutputCount
                })
              }}
            </span>
            <div class="flex shrink items-center-safe justify-end-safe gap-2">
              <Button
                variant="secondary"
                data-testid="assets-select-all"
                @click="handleSelectAll"
              >
                <span>{{ $t('mediaAsset.selection.selectAll') }}</span>
              </Button>
              <Button
                variant="secondary"
                data-testid="assets-clear-selection"
                @click="handleDeselectAll"
              >
                <span>{{ $t('mediaAsset.selection.clear') }}</span>
              </Button>
              <template v-if="isCompact">
                <Button
                  v-if="shouldShowDeleteButton"
                  size="icon"
                  data-testid="assets-delete-selected"
                  @click="handleDeleteSelected"
                >
                  <i class="icon-[lucide--trash-2] size-4" />
                </Button>
                <Button
                  size="icon"
                  data-testid="assets-download-selected"
                  @click="handleDownloadSelected"
                >
                  <i class="icon-[lucide--download] size-4" />
                </Button>
              </template>
              <template v-else>
                <Button
                  v-if="shouldShowDeleteButton"
                  variant="secondary"
                  data-testid="assets-delete-selected"
                  @click="handleDeleteSelected"
                >
                  <span>{{ $t('mediaAsset.selection.deleteSelected') }}</span>
                  <i class="icon-[lucide--trash-2] size-4" />
                </Button>
                <Button
                  variant="secondary"
                  data-testid="assets-download-selected"
                  @click="handleDownloadSelected"
                >
                  <span>{{ $t('mediaAsset.selection.downloadSelected') }}</span>
                  <i class="icon-[lucide--download] size-4" />
                </Button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <!-- Selection Footer (rendered here only when no left sidebar; otherwise inline in main content column) -->
      <div
        v-if="hasSelection && !hasLeftSidebar"
        ref="footerRef"
        class="flex h-18 w-full items-center justify-between gap-2 px-4"
      >
        <span class="truncate text-sm text-base-foreground">
          {{
            $t('mediaAsset.selection.selectedCountShort', {
              count: totalOutputCount
            })
          }}
        </span>
        <div class="flex shrink items-center-safe justify-end-safe gap-2">
          <Button
            variant="secondary"
            data-testid="assets-select-all"
            @click="handleSelectAll"
          >
            <span>{{ $t('mediaAsset.selection.selectAll') }}</span>
          </Button>
          <Button
            variant="secondary"
            data-testid="assets-clear-selection"
            @click="handleDeselectAll"
          >
            <span>{{ $t('mediaAsset.selection.clear') }}</span>
          </Button>
          <template v-if="isCompact">
            <!-- Compact mode: Icon only -->
            <Button
              v-if="shouldShowDeleteButton"
              size="icon"
              data-testid="assets-delete-selected"
              @click="handleDeleteSelected"
            >
              <i class="icon-[lucide--trash-2] size-4" />
            </Button>
            <Button
              size="icon"
              data-testid="assets-download-selected"
              @click="handleDownloadSelected"
            >
              <i class="icon-[lucide--download] size-4" />
            </Button>
          </template>
          <template v-else>
            <!-- Normal mode: Icon + Text -->
            <Button
              v-if="shouldShowDeleteButton"
              variant="secondary"
              data-testid="assets-delete-selected"
              @click="handleDeleteSelected"
            >
              <span>{{ $t('mediaAsset.selection.deleteSelected') }}</span>
              <i class="icon-[lucide--trash-2] size-4" />
            </Button>
            <Button
              variant="secondary"
              data-testid="assets-download-selected"
              @click="handleDownloadSelected"
            >
              <span>{{ $t('mediaAsset.selection.downloadSelected') }}</span>
              <i class="icon-[lucide--download] size-4" />
            </Button>
          </template>
        </div>
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
    :allow-move-actions="false"
    @zoom="handleZoomClick(contextMenuAsset)"
    @hide="handleContextMenuHide"
    @asset-deleted="refreshAssets"
    @bulk-download="handleBulkDownload"
    @bulk-move="handleBulkMove"
    @bulk-delete="handleBulkDelete"
    @bulk-add-to-workflow="handleBulkAddToWorkflow"
    @bulk-open-workflow="handleBulkOpenWorkflow"
    @bulk-export-workflow="handleBulkExportWorkflow"
    @bulk-compare="handleBulkCompare"
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
  useResizeObserver,
  useStorage,
  useTimeoutFn
} from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import {
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger
} from 'reka-ui'
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowReactive,
  watch
} from 'vue'
import { useI18n } from 'vue-i18n'

import NoResultsPlaceholder from '@/components/common/NoResultsPlaceholder.vue'
import AssetDragPreview from '@/platform/assets/components/AssetDragPreview.vue'
import AssetsSidebarGridView from '@/components/sidebar/tabs/AssetsSidebarGridView.vue'
import AssetsSidebarListView from '@/components/sidebar/tabs/AssetsSidebarListView.vue'
import SidebarTabTemplate from '@/components/sidebar/tabs/SidebarTabTemplate.vue'
import Skeleton from '@/components/ui/skeleton/Skeleton.vue'
import MediaLightbox from '@/components/sidebar/tabs/queue/MediaLightbox.vue'
import Button from '@/components/ui/button/Button.vue'
import AssetDetailPanel from '@/platform/assets/components/AssetDetailPanel.vue'
import MediaAssetContextMenu from '@/platform/assets/components/MediaAssetContextMenu.vue'
import MediaAssetFilterBar from '@/platform/assets/components/MediaAssetFilterBar.vue'
import MediaAssetFilterChipsBar from '@/platform/assets/components/MediaAssetFilterChipsBar.vue'
import AssetsSidebar from '@/platform/assets/components/AssetsSidebar.vue'
import { useAssetTagGroups } from '@/platform/assets/composables/useAssetTagGroups'
import { useAssetTagSelectionStore } from '@/platform/assets/composables/useAssetTagSelectionStore'
import { useAssetTags } from '@/platform/assets/composables/useAssetTags'
import type { ViewMode } from '@/platform/assets/components/MediaAssetFilterBar.vue'
import { getAssetType } from '@/platform/assets/composables/media/assetMappers'
import { useMediaAssets } from '@/platform/assets/composables/media/useMediaAssets'
import { useOutputJobsAssets } from '@/platform/assets/composables/media/useOutputJobsAssets'
import { useCustomDirectoryAssets } from '@/platform/assets/composables/media/useCustomDirectoryAssets'
import { useAssetFavorites } from '@/platform/assets/composables/useAssetFavorites'
import type { FavoriteColor } from '@/platform/assets/composables/useAssetFavorites'
import { useAssetDragPreview } from '@/platform/assets/composables/useAssetDragPreview'
import { useAssetPromptMetadata } from '@/platform/assets/composables/useAssetPromptMetadata'
import { useAssetSelection } from '@/platform/assets/composables/useAssetSelection'
import { useAssetSelectionStore } from '@/platform/assets/composables/useAssetSelectionStore'
import { useMediaAssetActions } from '@/platform/assets/composables/useMediaAssetActions'
import { useMediaAssetFiltering } from '@/platform/assets/composables/useMediaAssetFiltering'
import { useAssetFilters } from '@/platform/assets/composables/useAssetFilters'
import { useOutputStacks } from '@/platform/assets/composables/useOutputStacks'
import type { OutputAssetMetadata } from '@/platform/assets/schemas/assetMetadataSchema'
import { getOutputAssetMetadata } from '@/platform/assets/schemas/assetMetadataSchema'
import type { AssetItem } from '@/platform/assets/schemas/assetSchema'
import { getAssetDisplayName } from '@/platform/assets/utils/assetMetadataUtils'
import type { MetadataFilter } from '@/platform/assets/types/metadataFilter'
import type { PromptMetadata } from '@/platform/assets/utils/promptMetadataParser'
import type { MediaKind } from '@/platform/assets/schemas/mediaAssetSchema'
import { resolveOutputAssetItems } from '@/platform/assets/utils/outputAssetUtil'
import { isCloud } from '@/platform/distribution/types'
import { useAssetsStore } from '@/stores/assetsStore'
import { useDialogStore } from '@/stores/dialogStore'
import { ResultItemImpl } from '@/stores/queueStore'
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

// --- Source selection (replaces old tab system) ---
const activeSources = useStorage<string[]>('Comfy.Assets.ActiveSources', [
  'output'
])

interface SavedCustomDirectory {
  id: string
  name: string
}

const savedCustomDirectories = useStorage<SavedCustomDirectory[]>(
  'Comfy.Assets.CustomDirectories',
  []
)

// Runtime map of custom directory providers (not persisted — handles are session-only)
type CustomDirProvider = ReturnType<typeof useCustomDirectoryAssets>
const customDirProviders = shallowReactive(new Map<string, CustomDirProvider>())

// On setup, remove any custom dir IDs from activeSources since handles don't survive reload
activeSources.value = activeSources.value.filter(
  (s) => s === 'output' || s === 'input'
)

// Tracks whether the user has navigated into a specific folder (vs. viewing
// recently generated assets across all folders).
const showAllAssets = useStorage<boolean>('Comfy.Assets.ShowAllAssets', false)
const favoritesActive = ref(false)
const favoriteColorFilter = ref<FavoriteColor | null>(null)

// Computed helper: which single source is active (null if 0 or 2+)
const singleActiveSource = computed(() => {
  if (activeSources.value.length === 1) return activeSources.value[0]
  return null
})

const folderJobId = ref<string | null>(null)
const folderExecutionTime = ref<number | undefined>(undefined)
const expectedFolderCount = ref(0)
const isInFolderView = computed(() => folderJobId.value !== null)
const viewMode = useStorage<ViewMode>(
  'Comfy.Assets.Sidebar.ViewMode',
  'grid-md'
)
const hideRecentsSidebar = useStorage<boolean>(
  'Comfy.Assets.HideRecentsSidebar',
  false
)

const SIDEBAR_MIN_WIDTH = 200
const SIDEBAR_MAX_WIDTH = 500
const sidebarWidth = useStorage<number>(
  'Comfy.Assets.FolderSidebarWidth.v3',
  SIDEBAR_MIN_WIDTH
)
const isResizingSidebar = ref(false)

function startSidebarResize(event: MouseEvent) {
  const startX = event.clientX
  const startWidth = sidebarWidth.value
  isResizingSidebar.value = true

  function onMove(e: MouseEvent) {
    const next = startWidth + (e.clientX - startX)
    sidebarWidth.value = Math.max(
      SIDEBAR_MIN_WIDTH,
      Math.min(SIDEBAR_MAX_WIDTH, next)
    )
  }
  function onUp() {
    isResizingSidebar.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
const userTags = useAssetTags()
const tagGroups = useAssetTagGroups()
const tagSelection = useAssetTagSelectionStore()
const hasTagFilter = computed(() => tagSelection.hasSelection)
const showDetailPanel = ref(false)
const isListView = computed(() => viewMode.value === 'list')
const gridSize = computed<'sm' | 'md' | 'lg'>(() => {
  if (viewMode.value === 'grid-sm') return 'sm'
  if (viewMode.value === 'grid-lg') return 'lg'
  return 'md'
})

const contextMenuRef = ref<InstanceType<typeof MediaAssetContextMenu>>()
const contextMenuAsset = ref<AssetItem | null>(null)

// Hide delete button when only input is active in non-cloud mode
const shouldShowDeleteButton = computed(() => {
  if (
    activeSources.value.length === 1 &&
    activeSources.value[0] === 'input' &&
    !isCloud
  )
    return false
  return true
})

const contextMenuAssetType = computed(() =>
  contextMenuAsset.value ? getAssetType(contextMenuAsset.value.tags) : 'input'
)

const contextMenuFileKind = computed<MediaKind>(() =>
  getMediaTypeFromFilename(contextMenuAsset.value?.name ?? '')
)

const shouldShowOutputCount = (item: AssetItem): boolean => {
  if (isInFolderView.value) return false
  // Only show output count badge for output assets
  if (!item.tags?.includes('output')) return false
  return getOutputCount(item) > 1
}

const formattedExecutionTime = computed(() => {
  if (!folderExecutionTime.value) return ''
  return formatDuration(folderExecutionTime.value * 1000)
})

const toast = useToast()

const inputAssets = useMediaAssets('input')
const outputAssets = useMediaAssets('output')
const outputJobsAssets = useOutputJobsAssets()

// Default view uses jobs-based source (per-job stacks, generation-time sort,
// pagination); advanced view uses file-based source (folder nav, custom dirs).
const activeOutputSource = computed(() =>
  showAllAssets.value ? outputAssets : outputJobsAssets
)

// Date range filtering
const dateRangeFilter = useStorage<[Date, Date] | null>(
  'Comfy.Assets.DateRange',
  null
)

// Asset selection
const {
  isSelected,
  handleAssetClick,
  hasSelection,
  clearSelection,
  selectAll,
  getSelectedAssets,
  reconcileSelection,
  getOutputCount,
  getTotalOutputCount,
  activate: activateSelection,
  deactivate: deactivateSelection
} = useAssetSelection()

const {
  downloadMultipleAssets,
  deleteAssets,
  moveAssets,
  addMultipleToWorkflow,
  openMultipleWorkflows,
  exportMultipleWorkflows
} = useMediaAssetActions()

// Footer responsive behavior
const footerRef = ref<HTMLElement | null>(null)
const footerWidth = ref(0)

// Track footer width changes
useResizeObserver(footerRef, (entries) => {
  const entry = entries[0]
  footerWidth.value = entry.contentRect.width
})

// Determine if we should show compact mode (icon only)
const COMPACT_MODE_THRESHOLD_PX = 430
const isCompact = computed(
  () => footerWidth.value > 0 && footerWidth.value <= COMPACT_MODE_THRESHOLD_PX
)

// Total output count for all selected assets
const totalOutputCount = computed(() => {
  return getTotalOutputCount(selectedAssets.value)
})

// Filter refs — defined early so baseAssets can reference them
const searchQuery = ref('')
const metadataFilters = ref<MetadataFilter[]>([])
const mediaTypeFilters = ref<string[]>([])

// --- Merged assets from all active sources ---
function collectAssets(useAll: boolean): AssetItem[] {
  const result: AssetItem[] = []
  if (activeSources.value.includes('output')) {
    const source = activeOutputSource.value
    result.push(...(useAll ? source.allMedia : source.media).value)
  }
  if (activeSources.value.includes('input')) {
    result.push(...(useAll ? inputAssets.allMedia : inputAssets.media).value)
  }
  for (const dir of savedCustomDirectories.value) {
    if (activeSources.value.includes(dir.id)) {
      const provider = customDirProviders.get(dir.id)
      if (provider) {
        result.push(...provider.media.value)
      }
    }
  }
  return result
}

const mergedAssets = computed(() => collectAssets(false))
const allMergedAssets = computed(() => collectAssets(true))

const loading = computed(() => {
  for (const source of activeSources.value) {
    if (source === 'output' && activeOutputSource.value.loading.value)
      return true
    if (source === 'input' && inputAssets.loading.value) return true
    const provider = customDirProviders.get(source)
    if (provider?.loading.value) return true
  }
  return false
})

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

// Base assets before search filtering. Reflects the current sidebar
// selection so search/metadata filters narrow that subset, not the global pool.
const baseAssets = computed(() => {
  if (tagSelection.hasSelection) {
    return userTags.assetsWithAnyTag(
      allMergedAssets.value,
      tagSelection.asArray
    )
  }
  if (favoritesActive.value) {
    const seen = new Set<string>()
    const unique: AssetItem[] = []
    for (const asset of allMergedAssets.value) {
      if (seen.has(asset.id)) continue
      seen.add(asset.id)
      unique.push(asset)
    }
    const favorited = favorites.favoritedAssets(unique)
    if (favoriteColorFilter.value) {
      return favorited.filter(
        (a) => favorites.getFavoriteColor(a) === favoriteColorFilter.value
      )
    }
    return favorited
  }
  if (isInFolderView.value) {
    return folderAssets.value
  }
  if (showAllAssets.value) {
    return allMergedAssets.value
  }
  return mergedAssets.value
})

const availableTags = computed(() => userTags.allTags.value.map((t) => t.name))

// Prompt metadata extraction for @-filter search
const metadataExtractor = useAssetPromptMetadata()

const availableValuesByField = computed(() => ({
  model: metadataExtractor.getAvailableValues('model'),
  lora: metadataExtractor.getAvailableValues('lora'),
  workflowTitle: metadataExtractor.getAvailableValues('workflowTitle')
}))

// Detail panel — show info for last-clicked asset
const selectionStore = useAssetSelectionStore()

const detailAssets = computed<AssetItem[]>(() => {
  if (!showDetailPanel.value) return []
  const selected = getSelectedAssets(visibleAssets.value)
  if (selected.length > 1) return selected
  const lastId = selectionStore.lastSelectedAssetId
  if (!lastId) return selected
  const last = visibleAssets.value.find((a) => a.id === lastId)
  return last ? [last] : selected
})

const detailPromptMeta = ref<PromptMetadata | null>(null)

watch(detailAssets, async (assets) => {
  if (assets.length !== 1) {
    detailPromptMeta.value = null
    return
  }
  detailPromptMeta.value = await metadataExtractor.extractMetadata(assets[0])
})

// Use media asset filtering composable
const { sortBy, filteredAssets } = useMediaAssetFiltering(baseAssets, {
  metadataExtractor,
  searchQuery,
  metadataFilters,
  mediaTypeFilters
})

// Same scope as `baseAssets` but skipping the sidebar tag selection — used to
// derive which tags are available in the current search results without
// circular narrowing when a tag is selected.
const baseAssetsForTagScope = computed(() => {
  if (favoritesActive.value) {
    const seen = new Set<string>()
    const unique: AssetItem[] = []
    for (const asset of allMergedAssets.value) {
      if (seen.has(asset.id)) continue
      seen.add(asset.id)
      unique.push(asset)
    }
    const favorited = favorites.favoritedAssets(unique)
    if (favoriteColorFilter.value) {
      return favorited.filter(
        (a) => favorites.getFavoriteColor(a) === favoriteColorFilter.value
      )
    }
    return favorited
  }
  if (isInFolderView.value) return folderAssets.value
  if (showAllAssets.value) return allMergedAssets.value
  return mergedAssets.value
})

const { filteredAssets: tagScopeFiltered } = useMediaAssetFiltering(
  baseAssetsForTagScope,
  {
    metadataExtractor,
    searchQuery,
    metadataFilters,
    mediaTypeFilters
  }
)

// Extract metadata in background when metadata filters are active, or when
// the advanced view is showing (so the @-filter type-ahead has real values
// to suggest for model/lora/vae).
watch(
  [metadataFilters, baseAssets, showAllAssets],
  ([filters, assets, advanced]) => {
    if (filters.length > 0 || advanced) {
      metadataExtractor.extractBatch(assets)
    }
  },
  { immediate: true }
)

// Apply date filtering using useAssetFilters
const assetFilters = useAssetFilters(filteredAssets)

// Any navigation/filter action drops the "show details" intent so the panel
// doesn't reappear when the user clicks an asset in the new context.
watch(
  [
    () => tagSelection.asArray,
    favoritesActive,
    favoriteColorFilter,
    activeSources,
    showAllAssets,
    searchQuery,
    metadataFilters,
    mediaTypeFilters,
    () => assetFilters.dateRange.value
  ],
  () => {
    showDetailPanel.value = false
  }
)

// Sync persisted date range with filter composable
watch(
  dateRangeFilter,
  (newValue) => {
    assetFilters.dateRange.value = newValue
  },
  { immediate: true }
)

watch(
  () => assetFilters.dateRange.value,
  (newValue) => {
    dateRangeFilter.value = newValue
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

const emptyStateTitle = computed(() => {
  if (activeSources.value.length === 0) return 'sideToolbar.noFilesFound'
  if (singleActiveSource.value === 'input') return 'sideToolbar.noImportedFiles'
  if (singleActiveSource.value === 'output')
    return 'sideToolbar.noGeneratedFiles'
  // Single custom directory or multiple sources
  if (
    singleActiveSource.value &&
    singleActiveSource.value !== 'input' &&
    singleActiveSource.value !== 'output'
  ) {
    return 'sideToolbar.noCustomFiles'
  }
  return 'sideToolbar.noFilesFound'
})

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

function assetToResultItem(asset: AssetItem): ResultItemImpl {
  const mediaType = getMediaTypeFromFilename(asset.name)
  const resultItem = new ResultItemImpl({
    filename: asset.name,
    subfolder: '',
    type: 'output',
    nodeId: '0',
    mediaType: mediaType === 'image' ? 'images' : mediaType
  })

  Object.defineProperty(resultItem, 'url', {
    get() {
      return asset.preview_url || ''
    },
    configurable: true
  })

  return resultItem
}

const galleryItems = computed(() =>
  previewableVisibleAssets.value.map(assetToResultItem)
)

const refreshAssets = async () => {
  const promises: Promise<unknown>[] = []
  if (activeSources.value.includes('output')) {
    promises.push(activeOutputSource.value.fetchMediaList())
  }
  if (activeSources.value.includes('input')) {
    promises.push(inputAssets.fetchMediaList())
  }
  await Promise.all(promises)
}

// --- Source activation watcher ---
// Initial fetch for active sources
if (activeSources.value.includes('output')) {
  void activeOutputSource.value.fetchMediaList()
}
if (activeSources.value.includes('input')) {
  void inputAssets.fetchMediaList()
}

// Swap output data sources when the user toggles advanced view; fetch the
// newly-active source so the view isn't empty.
watch(showAllAssets, (isOn) => {
  if (activeSources.value.includes('output')) {
    void activeOutputSource.value.fetchMediaList()
  }

  if (isOn) return
  const first = activeSources.value[0]
  activeSources.value = [first === 'input' ? 'input' : 'output']
  if (viewMode.value === 'grid-sm' || viewMode.value === 'grid-lg') {
    viewMode.value = 'grid-md'
  }
  if (isInFolderView.value) exitFolderView()
})

// Watch for source changes after initial setup
watch(activeSources, (newSources, oldSources) => {
  if (!oldSources) return

  const added = newSources.filter((s) => !oldSources.includes(s))

  for (const source of added) {
    if (source === 'output') {
      outputAssets.navigateToRoot()
      void activeOutputSource.value.fetchMediaList()
    } else if (source === 'input') {
      inputAssets.navigateToRoot()
      void inputAssets.fetchMediaList()
    } else if (!customDirProviders.has(source)) {
      // Custom dir checked but no provider — needs reconnection
      void reconnectCustomDir(source)
    }
  }

  clearSelection()
  if (isInFolderView.value) exitFolderView()
})

async function reconnectCustomDir(id: string) {
  const provider = useCustomDirectoryAssets()
  await provider.selectDirectory()

  if (provider.error.value) {
    const err = provider.error.value
    if (
      !(err instanceof Error && err.message === 'Directory selection cancelled')
    ) {
      toast.add({
        severity: 'error',
        summary: t('mediaAsset.directoryPicker.error'),
        detail: err instanceof Error ? err.message : String(err)
      })
    }
    activeSources.value = activeSources.value.filter((s) => s !== id)
    return
  }

  if (provider.navigationState.value.rootPath) {
    customDirProviders.set(id, provider)
    const name =
      provider.navigationState.value.rootPath.split('/').pop() || 'Custom'
    savedCustomDirectories.value = savedCustomDirectories.value.map((d) =>
      d.id === id ? { ...d, name } : d
    )
  } else {
    activeSources.value = activeSources.value.filter((s) => s !== id)
  }
}

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

const assetsStore = useAssetsStore()

const handleBulkDownload = (assets: AssetItem[]) => {
  downloadMultipleAssets(assets)
  clearSelection()
}

const handleBulkDelete = async (assets: AssetItem[]) => {
  if (await deleteAssets(assets)) {
    clearSelection()
  }
}

const handleBulkMove = async (assets: AssetItem[]) => {
  if (await moveAssets(assets)) {
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

const handleBulkCompare = (assets: AssetItem[], totalSelected: number) => {
  if (assets.length < 2) return
  compareItems.value = assets.map(assetToResultItem)
  const excluded = totalSelected - assets.length
  if (excluded > 0) {
    toast.add({
      severity: 'info',
      summary: t('mediaAsset.compare.action'),
      detail: t('mediaAsset.compare.filteredToast', {
        n: assets.length,
        m: excluded
      }),
      life: 3500
    })
  }
  galleryActiveIndex.value = 0
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
  if (!isPreviewableMediaType(mediaType)) {
    return
  }

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
  showDetailPanel.value = false
})

const handleDeselectAll = () => {
  clearSelection()
}

const handleSelectAll = () => {
  selectAll(visibleAssets.value)
}

const handleEmptySpaceClick = () => {
  if (hasSelection) {
    clearSelection()
  }
}

const copyJobId = async () => {
  if (folderJobId.value) {
    try {
      await navigator.clipboard.writeText(folderJobId.value)
      toast.add({
        severity: 'success',
        summary: t('mediaAsset.jobIdToast.copied'),
        detail: t('mediaAsset.jobIdToast.jobIdCopied'),
        life: 2000
      })
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: t('mediaAsset.jobIdToast.error'),
        detail: t('mediaAsset.jobIdToast.jobIdCopyFailed')
      })
    }
  }
}

const handleApproachEnd = useDebounceFn(async () => {
  if (
    activeSources.value.includes('output') &&
    !isInFolderView.value &&
    activeOutputSource.value.hasMore.value &&
    !activeOutputSource.value.isLoadingMore.value
  ) {
    await activeOutputSource.value.loadMore()
  }
}, 300)

// --- Sidebar (tag-based filtering) ---

const showRecentsSidebar = computed(
  () => !hideRecentsSidebar.value && !isInFolderView.value
)

const hasLeftSidebar = showRecentsSidebar

const availableUserTags = computed(() => {
  const scopedTags = userTags.tagsForAssets(tagScopeFiltered.value)
  // Always include currently-selected tags so they remain visible (and
  // de-selectable) even when narrowing means none of their assets are present.
  const present = new Set(scopedTags.map((t) => t.name))
  for (const name of tagSelection.asArray) {
    if (!present.has(name)) scopedTags.push({ name, count: 0 })
  }
  return scopedTags.sort((a, b) => a.name.localeCompare(b.name))
})

const activeFilterLabel = computed(() => {
  if (tagSelection.hasSelection) {
    const tags = tagSelection.asArray
    if (tags.length === 1) {
      return t('sideToolbar.mediaAssets.tagFilterLabel', { tag: tags[0] })
    }
    return t('sideToolbar.mediaAssets.tagFilterLabelMulti', {
      count: tags.length
    })
  }
  if (favoritesActive.value) {
    return t('sideToolbar.mediaAssets.foldersSidebar.favorites')
  }
  if (showAllAssets.value) {
    if (singleActiveSource.value === 'input') {
      return t('sideToolbar.mediaAssets.foldersSidebar.importedHeader')
    }
    if (singleActiveSource.value === 'output') {
      return t('sideToolbar.mediaAssets.foldersSidebar.generatedHeader')
    }
  }
  return ''
})

function clearTagAndFavorites() {
  tagSelection.clear()
  favoritesActive.value = false
  favoriteColorFilter.value = null
}

const handleSelectRecents = () => {
  clearTagAndFavorites()
  showAllAssets.value = false
}

const handleSelectFavorites = () => {
  tagSelection.clear()
  favoritesActive.value = true
  favoriteColorFilter.value = null
}

const handleSelectFavoriteColor = (color: FavoriteColor | null) => {
  favoriteColorFilter.value = color
}

const handleSelectGenerated = () => {
  clearTagAndFavorites()
  activeSources.value = ['output']
  showAllAssets.value = true
}

const handleSelectImported = () => {
  clearTagAndFavorites()
  activeSources.value = ['input']
  showAllAssets.value = true
}

const handleTagSelectionChanged = () => {
  if (!tagSelection.hasSelection) return
  favoritesActive.value = false
  favoriteColorFilter.value = null
  // Tags transcend sources — show across both Generated and Imported.
  activeSources.value = ['output', 'input']
  showAllAssets.value = true
}

const handleRenameTag = (oldName: string, newName: string) => {
  const renamed = userTags.renameTag(oldName, newName)
  if (!renamed) return
  tagGroups.renameTagInGroups(oldName, renamed)
  if (tagSelection.isSelected(oldName)) {
    tagSelection.remove(oldName)
    tagSelection.add(renamed)
  }
}

const handleDeleteTags = (tags: string[]) => {
  for (const tag of tags) {
    userTags.removeTagEverywhere(tag)
  }
  tagGroups.removeTagsFromGroups(tags)
  for (const tag of tags) tagSelection.remove(tag)
}

watch(
  () => userTags.allTags.value,
  (list) => {
    tagSelection.pruneMissing(new Set(list.map((t) => t.name)))
  },
  { immediate: true }
)

watch(
  showRecentsSidebar,
  (visible) => {
    if (!visible) return
    if (assetsStore.historyAssets.length === 0 && !assetsStore.historyLoading) {
      void assetsStore.updateHistory()
    }
    if (assetsStore.inputAssets.length === 0 && !assetsStore.inputLoading) {
      void assetsStore.updateInputs()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.assets-content-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
  border-radius: 1rem;
}

.assets-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  min-width: 0; /* Allow flex item to shrink below content size */
}

/* Match Toolbar horizontal padding to SidebarTopArea (p-2) for alignment */
:deep(.p-toolbar) {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

@media (min-width: 1536px) {
  :deep(.p-toolbar) {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* When a left sidebar is visible, hide the top toolbar so the title can
   be rendered inside the sidebar column and the main column (search +
   options + grid) starts at the same top-vertical position as the title. */
.assets-tab-with-sidebar :deep(.comfy-vue-side-bar-header .p-toolbar) {
  display: none;
}
</style>
