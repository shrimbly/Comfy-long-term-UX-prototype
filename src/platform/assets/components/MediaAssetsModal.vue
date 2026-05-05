<template>
  <BaseModalLayout
    data-component-id="MediaAssetsModal"
    size="lg"
    content-padding="compact"
    :content-title="$t('mediaAssets.modal.title')"
  >
    <template #leftPanelHeaderTitle>
      <i class="icon-[comfy--image-ai-edit] size-5 shrink-0" />
      <h2 class="flex-auto text-base text-nowrap select-none">
        {{ $t('mediaAssets.modal.title') }}
      </h2>
    </template>
    <template #leftPanel>
      <AssetsSidebar
        data-component-id="MediaAssetsModal-Sidebar"
        :available-tags="browser.sidebarTags.value"
        :temp-active="browser.sidebarFlags.value.tempActive"
        :favorites-active="browser.sidebarFlags.value.favoritesActive"
        :generated-active="browser.sidebarFlags.value.generatedActive"
        :imported-active="browser.sidebarFlags.value.importedActive"
        @select-temp="browser.selectTemp"
        @select-favorites="browser.selectFavorites"
        @select-generated="browser.selectGenerated"
        @select-imported="browser.selectImported"
        @selection-changed="browser.onTagSelectionChanged"
      />
    </template>

    <template #header>
      <div class="max-w-lg flex-1">
        <MetadataSearchInput
          v-model:search-query="browser.searchQuery.value"
          v-model:metadata-filters="browser.metadataFilters.value"
          :available-tags="browser.availableTags.value"
          :available-values-by-field="browser.availableValuesByField.value"
        />
      </div>
    </template>

    <template #contentFilter>
      <div class="flex shrink-0 flex-col gap-1 px-6 pt-0 pb-2">
        <div class="flex items-center justify-between gap-4">
          <div class="flex min-w-0 items-baseline gap-3">
            <h1 class="text-neutral truncate text-2xl font-semibold">
              {{ pageTitle }}
            </h1>
            <span class="shrink-0 text-sm text-muted-foreground">
              {{
                $t('mediaAssets.modal.assetCount', {
                  count: browser.displayAssets.value.length
                })
              }}
            </span>
          </div>
          <div class="flex shrink-0 items-center gap-3">
            <Popover :show-arrow="false" align="start">
              <template #button>
                <Button
                  variant="secondary"
                  size="lg"
                  :aria-label="$t('mediaAssets.modal.density')"
                >
                  <span>{{ $t('mediaAssets.modal.density') }}</span>
                  <i class="icon-[lucide--chevron-down] size-4" />
                </Button>
              </template>
              <div class="flex w-32 items-center p-2">
                <Slider
                  :model-value="[density]"
                  :min="MIN_DENSITY"
                  :max="MAX_DENSITY"
                  :step="DENSITY_STEP"
                  :aria-label="$t('mediaAssets.modal.density')"
                  class="flex-1 **:data-[slot=slider-range]:bg-white **:data-[slot=slider-thumb]:bg-white"
                  @update:model-value="onDensityChange"
                />
              </div>
            </Popover>
            <SingleSelect
              v-model="sortBy"
              :label="$t('mediaAssets.modal.sortBy')"
              :options="sortOptions"
              class="w-56"
            >
              <template #icon>
                <i class="icon-[lucide--arrow-up-down] text-muted-foreground" />
              </template>
            </SingleSelect>
          </div>
        </div>
        <MediaAssetFilterChipsBar
          v-model="browser.metadataFilters.value"
          class="-mx-2 2xl:-mx-4"
        />
      </div>
    </template>

    <template #content>
      <div
        v-if="showInitialLoading"
        class="grid w-full gap-3"
        :style="skeletonGridStyle"
      >
        <div
          v-for="n in SKELETON_COUNT"
          :key="`skeleton-${n}`"
          class="animate-pulse rounded-lg bg-modal-card-placeholder-background"
          :style="{ aspectRatio: skeletonAspect(n) }"
        />
      </div>
      <div
        v-else-if="showEmptyState"
        class="flex flex-1 items-center justify-center"
      >
        <NoResultsPlaceholder
          icon="pi pi-info-circle"
          :title="$t('mediaAssets.modal.empty.title')"
          :message="$t('mediaAssets.modal.empty.message')"
        />
      </div>
      <AssetMasonryGrid
        v-else
        v-model:selected-ids="selectedIds"
        :assets="browser.displayAssets.value"
        :column-width="density"
        @select-asset="handleAssetSelect"
        @preview-asset="handlePreview"
        @context-menu="handleContextMenu"
      />
      <AssetSelectionFloatingBar
        :visible="hasSelection"
        :count="selectedAssets.length"
        bottom-offset="md"
        @select-all="handleSelectAll"
        @deselect-all="handleDeselectAll"
        @download="handleDownloadSelected"
        @delete-selected="handleDeleteSelected"
      />
    </template>
  </BaseModalLayout>
  <MediaAssetContextMenu
    v-if="contextMenuAsset"
    ref="contextMenuRef"
    :asset="contextMenuAsset"
    :asset-type="contextMenuAssetType"
    :file-kind="contextMenuFileKind"
    :selected-assets="selectedAssets"
    :is-bulk-mode="isBulkMode"
    @hide="onContextMenuHide"
    @asset-deleted="browser.refreshAssets"
    @bulk-compare="handleBulkCompare"
  />
  <MediaLightbox
    v-model:active-index="galleryActiveIndex"
    :all-gallery-items="galleryItems"
    :compare-items="compareItems"
  />
</template>

<script setup lang="ts">
import { useKeyModifier, useStorage } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import { computed, nextTick, provide, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { useI18n } from 'vue-i18n'

import NoResultsPlaceholder from '@/components/common/NoResultsPlaceholder.vue'
import SingleSelect from '@/components/input/SingleSelect.vue'
import MediaLightbox from '@/components/sidebar/tabs/queue/MediaLightbox.vue'
import Popover from '@/components/ui/Popover.vue'
import Button from '@/components/ui/button/Button.vue'
import Slider from '@/components/ui/slider/Slider.vue'
import BaseModalLayout from '@/components/widget/layout/BaseModalLayout.vue'
import AssetMasonryGrid from '@/platform/assets/components/AssetMasonryGrid.vue'
import AssetSelectionFloatingBar from '@/platform/assets/components/AssetSelectionFloatingBar.vue'
import AssetsSidebar from '@/platform/assets/components/AssetsSidebar.vue'
import MediaAssetContextMenu from '@/platform/assets/components/MediaAssetContextMenu.vue'
import MediaAssetFilterChipsBar from '@/platform/assets/components/MediaAssetFilterChipsBar.vue'
import MetadataSearchInput from '@/platform/assets/components/MetadataSearchInput.vue'
import { getAssetType } from '@/platform/assets/composables/media/assetMappers'
import { useMediaAssetActions } from '@/platform/assets/composables/useMediaAssetActions'
import { useMediaAssetBrowser } from '@/platform/assets/composables/useMediaAssetBrowser'
import type { AssetItem } from '@/platform/assets/schemas/assetSchema'
import type { MediaKind } from '@/platform/assets/schemas/mediaAssetSchema'
import { assetToResultItem } from '@/platform/assets/utils/assetLightboxAdapter'
import type { ResultItemImpl } from '@/stores/queueStore'
import { OnCloseKey } from '@/types/widgetTypes'
import {
  getMediaTypeFromFilename,
  isPreviewableMediaType
} from '@/utils/formatUtil'

const { onClose } = defineProps<{
  onClose?: () => void
}>()

provide(OnCloseKey, () => onClose?.())

const { t } = useI18n()
const browser = useMediaAssetBrowser()

const sortBy = browser.sortBy
const sortOptions = computed(() => [
  { value: 'newest', name: t('sideToolbar.mediaAssets.sortNewestFirst') },
  { value: 'oldest', name: t('sideToolbar.mediaAssets.sortOldestFirst') },
  { value: 'longest', name: t('sideToolbar.mediaAssets.sortLongestFirst') },
  { value: 'fastest', name: t('sideToolbar.mediaAssets.sortFastestFirst') }
])

const pageTitle = computed(() => {
  const flags = browser.sidebarFlags.value
  const selectedTags = browser.tagSelection.asArray
  if (selectedTags.length > 0) {
    return selectedTags.length === 1
      ? t('mediaAssets.modal.titleTag', { tag: selectedTags[0] })
      : t('mediaAssets.modal.titleTags', { count: selectedTags.length })
  }
  if (flags.favoritesActive) {
    return t('sideToolbar.mediaAssets.foldersSidebar.favorites')
  }
  if (flags.tempActive) return t('sideToolbar.labels.temp')
  if (flags.importedActive) return t('sideToolbar.importedAssetsHeader')
  return t('sideToolbar.generatedAssetsHeader')
})

const MIN_DENSITY = 160
const MAX_DENSITY = 480
const DENSITY_STEP = 80
const DEFAULT_DENSITY = 240

const density = useStorage('Comfy.Assets.Modal.Density', DEFAULT_DENSITY)

function onDensityChange(value: number[] | undefined) {
  const next = value?.[0]
  if (typeof next === 'number') density.value = next
}

const selectedIds = ref<Set<string>>(new Set())
const lastClickedId = ref<string | null>(null)
const shiftKey = useKeyModifier('Shift')
const ctrlKey = useKeyModifier('Control')
const metaKey = useKeyModifier('Meta')

const hasSelection = computed(() => selectedIds.value.size > 0)
const selectedAssets = computed(() =>
  browser.displayAssets.value.filter((a) => selectedIds.value.has(a.id))
)

const { downloadMultipleAssets, deleteAssets } = useMediaAssetActions()

function handleSelectAll() {
  selectedIds.value = new Set(browser.displayAssets.value.map((a) => a.id))
}

function handleDeselectAll() {
  selectedIds.value = new Set()
  lastClickedId.value = null
}

function handleDownloadSelected() {
  downloadMultipleAssets(selectedAssets.value)
  handleDeselectAll()
}

async function handleDeleteSelected() {
  if (await deleteAssets(selectedAssets.value)) {
    handleDeselectAll()
  }
}

function handleAssetClick(asset: AssetItem, index: number, list: AssetItem[]) {
  const id = asset.id
  if (shiftKey.value && lastClickedId.value) {
    const anchor = list.findIndex((a) => a.id === lastClickedId.value)
    if (anchor !== -1) {
      const [start, end] = anchor <= index ? [anchor, index] : [index, anchor]
      selectedIds.value = new Set(list.slice(start, end + 1).map((a) => a.id))
      return
    }
  }
  if (ctrlKey.value || metaKey.value) {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
    lastClickedId.value = id
    return
  }
  selectedIds.value = new Set([id])
  lastClickedId.value = id
}

const contextMenuRef = ref<InstanceType<typeof MediaAssetContextMenu> | null>(
  null
)
const contextMenuAsset = ref<AssetItem | null>(null)

const contextMenuAssetType = computed(() =>
  contextMenuAsset.value ? getAssetType(contextMenuAsset.value.tags) : 'input'
)

const contextMenuFileKind = computed<MediaKind>(() =>
  getMediaTypeFromFilename(contextMenuAsset.value?.name ?? '')
)

const showInitialLoading = computed(
  () => browser.isLoading.value && browser.displayAssets.value.length === 0
)

const showEmptyState = computed(
  () => !browser.isLoading.value && browser.displayAssets.value.length === 0
)

const SKELETON_COUNT = 18

const skeletonGridStyle = computed<CSSProperties>(() => ({
  gridTemplateColumns: `repeat(auto-fill, minmax(${density.value}px, 1fr))`
}))

function skeletonAspect(n: number): string {
  const aspects = ['1 / 1', '3 / 4', '4 / 3', '2 / 3', '16 / 9']
  return aspects[n % aspects.length]
}

function handleAssetSelect(asset: AssetItem) {
  const list = browser.displayAssets.value
  const index = list.findIndex((a) => a.id === asset.id)
  handleAssetClick(asset, index, list)
}

const previewableAssets = computed(() =>
  browser.displayAssets.value.filter((a) =>
    isPreviewableMediaType(getMediaTypeFromFilename(a.name))
  )
)

const galleryItems = computed(() =>
  previewableAssets.value.map(assetToResultItem)
)
const galleryActiveIndex = ref(-1)
const compareItems = ref<ResultItemImpl[]>([])

watch(galleryActiveIndex, (index) => {
  if (index === -1) compareItems.value = []
})

const isBulkMode = computed(() => selectedAssets.value.length > 1)

const toast = useToast()

function handlePreview(asset: AssetItem) {
  const index = previewableAssets.value.findIndex((a) => a.id === asset.id)
  if (index === -1) {
    handleAssetSelect(asset)
    return
  }
  compareItems.value = []
  galleryActiveIndex.value = index
}

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

function handleContextMenu(event: MouseEvent, asset: AssetItem) {
  contextMenuAsset.value = asset
  void nextTick(() => contextMenuRef.value?.show(event))
}

function onContextMenuHide() {
  contextMenuAsset.value = null
}
</script>
