<template>
  <BaseModalLayout
    data-component-id="MediaAssetsModal"
    size="full"
    class="size-full max-h-full max-w-full min-w-0"
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
        :recents-active="browser.sidebarFlags.value.recentsActive"
        :favorites-active="browser.sidebarFlags.value.favoritesActive"
        :generated-active="browser.sidebarFlags.value.generatedActive"
        :imported-active="browser.sidebarFlags.value.importedActive"
        @select-recents="browser.selectRecents"
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

    <template #header-right-area>
      <Button
        v-tooltip.bottom="
          $t(
            browser.favoritesOnly.value
              ? 'assets.filters.showAll'
              : 'assets.filters.showFavoritesOnly'
          )
        "
        variant="secondary"
        size="lg"
        :aria-pressed="browser.favoritesOnly.value"
        @click="browser.favoritesOnly.value = !browser.favoritesOnly.value"
      >
        <i
          :class="
            cn(
              'size-4',
              browser.favoritesOnly.value
                ? 'icon-[ph--star-fill] text-citrine-400'
                : 'icon-[ph--star]'
            )
          "
        />
      </Button>
    </template>

    <template #contentFilter>
      <div class="px-6">
        <MediaAssetFilterChipsBar v-model="browser.metadataFilters.value" />
      </div>
      <div
        class="flex shrink-0 items-center justify-between gap-4 px-6 pt-2 pb-4"
      >
        <span class="text-sm text-muted-foreground">
          {{
            $t('mediaAssets.modal.assetCount', {
              count: browser.displayAssets.value.length
            })
          }}
        </span>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-xs text-muted-foreground">
            <i class="icon-[lucide--columns-2] size-3.5" />
            <span>{{ $t('mediaAssets.modal.density') }}</span>
            <input
              v-model.number="density"
              type="range"
              :min="MIN_DENSITY"
              :max="MAX_DENSITY"
              :step="DENSITY_STEP"
              class="w-32 cursor-pointer accent-primary"
              :aria-label="$t('mediaAssets.modal.density')"
            />
          </label>
        </div>
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
        :assets="browser.displayAssets.value"
        :column-width="density"
        :is-selected="(id) => isSelected(id)"
        @select-asset="handleAssetSelect"
        @preview-asset="handlePreview"
        @context-menu="handleContextMenu"
      />
    </template>
  </BaseModalLayout>
  <MediaAssetContextMenu
    v-if="contextMenuAsset"
    ref="contextMenuRef"
    :asset="contextMenuAsset"
    :asset-type="contextMenuAssetType"
    :file-kind="contextMenuFileKind"
    @hide="onContextMenuHide"
    @asset-deleted="browser.refreshAssets"
  />
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { computed, nextTick, provide, ref } from 'vue'
import type { CSSProperties } from 'vue'

import NoResultsPlaceholder from '@/components/common/NoResultsPlaceholder.vue'
import Button from '@/components/ui/button/Button.vue'
import BaseModalLayout from '@/components/widget/layout/BaseModalLayout.vue'
import AssetMasonryGrid from '@/platform/assets/components/AssetMasonryGrid.vue'
import AssetsSidebar from '@/platform/assets/components/AssetsSidebar.vue'
import MediaAssetContextMenu from '@/platform/assets/components/MediaAssetContextMenu.vue'
import MediaAssetFilterChipsBar from '@/platform/assets/components/MediaAssetFilterChipsBar.vue'
import MetadataSearchInput from '@/platform/assets/components/MetadataSearchInput.vue'
import { getAssetType } from '@/platform/assets/composables/media/assetMappers'
import { useAssetSelection } from '@/platform/assets/composables/useAssetSelection'
import { useMediaAssetBrowser } from '@/platform/assets/composables/useMediaAssetBrowser'
import type { AssetItem } from '@/platform/assets/schemas/assetSchema'
import type { MediaKind } from '@/platform/assets/schemas/mediaAssetSchema'
import { OnCloseKey } from '@/types/widgetTypes'
import { getMediaTypeFromFilename } from '@/utils/formatUtil'
import { cn } from '@/utils/tailwindUtil'

const { onClose } = defineProps<{
  onClose?: () => void
}>()

provide(OnCloseKey, () => onClose?.())

const browser = useMediaAssetBrowser()

const MIN_DENSITY = 160
const MAX_DENSITY = 480
const DENSITY_STEP = 20
const DEFAULT_DENSITY = 240

const density = useStorage('Comfy.Assets.Modal.Density', DEFAULT_DENSITY)

const { isSelected, handleAssetClick } = useAssetSelection()

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

function handlePreview(asset: AssetItem) {
  // v1: no inline lightbox in modal — pass through select.
  handleAssetSelect(asset)
}

function handleContextMenu(event: MouseEvent, asset: AssetItem) {
  contextMenuAsset.value = asset
  void nextTick(() => contextMenuRef.value?.show(event))
}

function onContextMenuHide() {
  contextMenuAsset.value = null
}
</script>
