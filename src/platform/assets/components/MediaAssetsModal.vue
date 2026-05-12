<template>
  <div ref="modalRootRef" class="contents">
    <BaseModalLayout
      ref="modalLayoutRef"
      data-component-id="MediaAssetsModal"
      :size="isInspecting ? 'inspect' : 'lg'"
      :left-panel-width="isInspecting ? '4rem' : '14rem'"
      :content-padding="isInspecting ? 'none' : 'compact'"
      :hide-header="isInspecting"
      :content-title="$t('mediaAssets.modal.title')"
    >
      <template #leftPanelHeaderTitle>
        <i class="icon-[comfy--image-ai-edit] size-5 shrink-0" />
        <h2
          v-if="!isInspecting"
          class="flex-auto text-base text-nowrap select-none"
        >
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
          :compact="isInspecting"
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
            :size="isScrolled ? 'md' : 'lg'"
          />
        </div>
        <div
          :class="
            cn(
              'ml-auto flex shrink-0 items-center gap-3 transition-[opacity,transform] duration-200 ease-out',
              isScrolled
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none -translate-y-1 opacity-0'
            )
          "
          :aria-hidden="!isScrolled"
        >
          <Popover :show-arrow="false" align="start">
            <template #button>
              <Button
                variant="secondary"
                size="lg"
                :aria-label="$t('mediaAssets.modal.density')"
              >
                <span class="font-normal">
                  {{ $t('mediaAssets.modal.density') }}
                </span>
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
      </template>

      <template v-if="!isInspecting" #contentFilter>
        <div
          :class="
            cn(
              'flex shrink-0 flex-col px-6 pt-0 transition-[gap,padding] duration-200 ease-out',
              isScrolled ? 'gap-0 pb-0' : 'gap-1 pb-2'
            )
          "
        >
          <div
            :class="
              cn(
                'grid transition-[grid-template-rows] duration-200 ease-out',
                isScrolled ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
              )
            "
          >
            <div class="overflow-hidden">
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
                        <span class="font-normal">
                          {{ $t('mediaAssets.modal.density') }}
                        </span>
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
                      <i
                        class="icon-[lucide--arrow-up-down] text-muted-foreground"
                      />
                    </template>
                  </SingleSelect>
                </div>
              </div>
            </div>
          </div>
          <MediaAssetFilterChipsBar
            v-model="browser.metadataFilters.value"
            class="-mx-2 2xl:-mx-4"
          />
        </div>
      </template>

      <template #content>
        <MediaAssetCarousel
          v-if="isInspecting"
          :assets="previewableAssets"
          :active-index="inspectActiveIndex"
          @navigate="navigateInspect"
          @select="setInspectIndex"
          @exit="exitInspect"
        />
        <template v-else>
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
      @show-details="handleShowDetails"
    />
    <AssetDetailPopover
      :asset="detailsAsset"
      :anchor="detailsAnchor"
      @close="closeDetails"
    />
    <MediaLightbox
      v-model:active-index="galleryActiveIndex"
      v-model:compare-items="compareItems"
      v-model:compare-assets="compareAssets"
      :all-gallery-items="galleryItems"
    />
  </div>
</template>

<script setup lang="ts">
import { useEventListener, useScroll } from '@vueuse/core'
import { computed, provide, ref, useTemplateRef } from 'vue'

import NoResultsPlaceholder from '@/components/common/NoResultsPlaceholder.vue'
import SingleSelect from '@/components/input/SingleSelect.vue'
import MediaLightbox from '@/components/sidebar/tabs/queue/MediaLightbox.vue'
import Popover from '@/components/ui/Popover.vue'
import Button from '@/components/ui/button/Button.vue'
import Slider from '@/components/ui/slider/Slider.vue'
import BaseModalLayout from '@/components/widget/layout/BaseModalLayout.vue'
import AssetDetailPopover from '@/platform/assets/components/AssetDetailPopover.vue'
import AssetMasonryGrid from '@/platform/assets/components/AssetMasonryGrid.vue'
import AssetSelectionFloatingBar from '@/platform/assets/components/AssetSelectionFloatingBar.vue'
import AssetsSidebar from '@/platform/assets/components/AssetsSidebar.vue'
import MediaAssetCarousel from '@/platform/assets/components/MediaAssetCarousel.vue'
import MediaAssetContextMenu from '@/platform/assets/components/MediaAssetContextMenu.vue'
import MediaAssetFilterChipsBar from '@/platform/assets/components/MediaAssetFilterChipsBar.vue'
import MetadataSearchInput from '@/platform/assets/components/MetadataSearchInput.vue'
import { ASSET_DRAG_MIME } from '@/platform/assets/composables/useAssetDragPreview'
import { useMediaAssetsBrowserState } from '@/platform/assets/composables/useMediaAssetsBrowserState'
import { OnCloseKey } from '@/types/widgetTypes'
import { cn } from '@/utils/tailwindUtil'

const { onClose } = defineProps<{
  onClose?: () => void
}>()

provide(OnCloseKey, () => onClose?.())

const SCROLL_COLLAPSE_THRESHOLD = 32

const modalLayoutRef = useTemplateRef<{
  scrollContainerRef: HTMLElement | null
}>('modalLayoutRef')
const scrollContainer = computed(
  () => modalLayoutRef.value?.scrollContainerRef ?? null
)
const { y: scrollY } = useScroll(scrollContainer)
const isScrolled = computed(() => scrollY.value > SCROLL_COLLAPSE_THRESHOLD)

const contextMenuRef = ref<InstanceType<typeof MediaAssetContextMenu> | null>(
  null
)

const {
  browser,
  sortBy,
  sortOptions,
  pageTitle,
  density,
  onDensityChange,
  densityRange,
  selectedIds,
  hasSelection,
  selectedAssets,
  handleSelectAll,
  handleDeselectAll,
  handleDownloadSelected,
  handleDeleteSelected,
  handleAssetSelect,
  handlePreview,
  handleContextMenu,
  onContextMenuHide,
  handleBulkCompare,
  handleShowDetails,
  closeDetails,
  detailsAsset,
  detailsAnchor,
  contextMenuAsset,
  contextMenuAssetType,
  contextMenuFileKind,
  isBulkMode,
  showInitialLoading,
  showEmptyState,
  skeletonGridStyle,
  skeletonAspect,
  skeletonCount,
  galleryItems,
  galleryActiveIndex,
  inspectActiveIndex,
  isInspecting,
  previewableAssets,
  exitInspect,
  navigateInspect,
  setInspectIndex,
  compareItems,
  compareAssets
} = useMediaAssetsBrowserState({ contextMenuRef })

const MIN_DENSITY = densityRange.min
const MAX_DENSITY = densityRange.max
const DENSITY_STEP = densityRange.step
const SKELETON_COUNT = skeletonCount

const DRAG_OUT_DWELL_MS = 500
const modalRootRef = useTemplateRef<HTMLElement>('modalRootRef')
let dwellTimer: number | null = null

const clearDwellTimer = () => {
  if (dwellTimer !== null) {
    clearTimeout(dwellTimer)
    dwellTimer = null
  }
}

const cursorInsideModal = (event: DragEvent) => {
  const root = modalRootRef.value
  if (!root) return false
  const target = event.target as Node | null
  if (target && root.contains(target)) return true
  const pointEl = document.elementFromPoint(event.clientX, event.clientY)
  return Boolean(pointEl && root.contains(pointEl))
}

useEventListener(document, 'dragover', (event: DragEvent) => {
  const isAssetDrag =
    event.dataTransfer?.types.includes(ASSET_DRAG_MIME) ?? false
  if (!isAssetDrag) {
    clearDwellTimer()
    return
  }
  if (cursorInsideModal(event)) {
    clearDwellTimer()
  } else if (dwellTimer === null) {
    dwellTimer = window.setTimeout(() => {
      dwellTimer = null
      onClose?.()
    }, DRAG_OUT_DWELL_MS)
  }
})

useEventListener(document, 'dragend', clearDwellTimer)
useEventListener(document, 'drop', clearDwellTimer)
</script>
