<template>
  <div
    data-component-id="MediaAssetsView"
    class="absolute inset-0 flex overflow-hidden bg-base-background"
  >
    <nav
      class="flex w-72 shrink-0 flex-col overflow-hidden bg-modal-panel-background"
    >
      <header class="flex h-18 w-full shrink-0 items-center gap-2 pr-3 pl-6">
        <i class="icon-[comfy--image-ai-edit] size-5 shrink-0" />
        <h2 class="flex-auto text-base text-nowrap select-none">
          {{ $t('mediaAssets.modal.title') }}
        </h2>
      </header>
      <div class="flex min-h-0 flex-1 flex-col">
        <AssetsSidebar
          data-component-id="MediaAssetsView-Sidebar"
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
      </div>
    </nav>

    <section
      class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-base-background"
    >
      <header
        class="flex h-18 w-full shrink-0 items-center justify-between gap-2 px-6"
      >
        <div class="flex flex-1 shrink-0 gap-2">
          <div class="max-w-lg flex-1">
            <MetadataSearchInput
              v-model:search-query="browser.searchQuery.value"
              v-model:metadata-filters="browser.metadataFilters.value"
              :available-tags="browser.availableTags.value"
              :available-values-by-field="browser.availableValuesByField.value"
            />
          </div>
        </div>
      </header>

      <main class="flex min-h-0 flex-1 flex-col">
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
                    :min="densityRange.min"
                    :max="densityRange.max"
                    :step="densityRange.step"
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
          <MediaAssetFilterChipsBar
            v-model="browser.metadataFilters.value"
            class="-mx-2 2xl:-mx-4"
          />
        </div>

        <div
          class="relative flex scrollbar-custom min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-0 pb-2"
        >
          <div
            v-if="showInitialLoading"
            class="grid w-full gap-3"
            :style="skeletonGridStyle"
          >
            <div
              v-for="n in skeletonCount"
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
        </div>
      </main>
    </section>

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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import NoResultsPlaceholder from '@/components/common/NoResultsPlaceholder.vue'
import SingleSelect from '@/components/input/SingleSelect.vue'
import MediaLightbox from '@/components/sidebar/tabs/queue/MediaLightbox.vue'
import Popover from '@/components/ui/Popover.vue'
import Button from '@/components/ui/button/Button.vue'
import Slider from '@/components/ui/slider/Slider.vue'
import AssetMasonryGrid from '@/platform/assets/components/AssetMasonryGrid.vue'
import AssetSelectionFloatingBar from '@/platform/assets/components/AssetSelectionFloatingBar.vue'
import AssetsSidebar from '@/platform/assets/components/AssetsSidebar.vue'
import MediaAssetContextMenu from '@/platform/assets/components/MediaAssetContextMenu.vue'
import MediaAssetFilterChipsBar from '@/platform/assets/components/MediaAssetFilterChipsBar.vue'
import MetadataSearchInput from '@/platform/assets/components/MetadataSearchInput.vue'
import { useMediaAssetsBrowserState } from '@/platform/assets/composables/useMediaAssetsBrowserState'

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
  compareItems
} = useMediaAssetsBrowserState({ contextMenuRef })
</script>
