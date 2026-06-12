<!--
  Implements:
    open-q: ../IA_Plan/wiki/open-questions.md#local-media-as-references
    log:    ../IA_Plan/wiki/prototype-log.md — Flow 03 (non-final)
    fork-of: src/platform/assets/components/MediaAssetsView.vue

  A prototype-owned fork of the upstream MediaAssetsView so the local user's
  referenced media renders with the *real* media browser (same AssetsSidebar,
  AssetMasonryGrid, MediaAssetCard, density/sort/lightbox) for pixel-perfect
  parity. Referenced files arrive via usePrototypeAssetsProvider (local
  persona branch); the only additions over upstream are a thin prototype
  toolbar (Add / link-status filter / missing banner), routing a click on a
  missing file to the relink dialog, and the relink/add/remove dialogs +
  context-menu handlers. The missing/relink/path overlay itself lives in the
  shared MediaAssetCard (prototype-gated on user_metadata, like the creator
  chip). Keep this close to the upstream template so it stays mergeable.
-->
<template>
  <div
    data-component-id="LocalMediaView"
    class="absolute inset-0 flex overflow-hidden bg-modal-panel-background"
  >
    <nav
      :class="
        cn(
          'mt-5 flex shrink-0 flex-col overflow-hidden bg-modal-panel-background transition-[width] duration-200 ease-out',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )
      "
    >
      <header
        :class="
          cn(
            'flex h-12 w-full shrink-0 items-center gap-2',
            sidebarCollapsed ? 'justify-center px-2' : 'pr-2 pl-6'
          )
        "
      >
        <template v-if="!sidebarCollapsed">
          <i class="icon-[comfy--image-ai-edit] size-6 shrink-0" />
          <h2 class="flex-auto text-xl font-semibold text-nowrap select-none">
            {{ $t('mediaAssets.modal.title') }}
          </h2>
        </template>
        <Button
          variant="muted-textonly"
          size="icon-lg"
          :aria-label="
            sidebarCollapsed
              ? $t('sideToolbar.expandSidebar')
              : $t('sideToolbar.collapseSidebar')
          "
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <i
            :class="
              cn(
                'size-5',
                sidebarCollapsed
                  ? 'icon-[lucide--panel-left-open]'
                  : 'icon-[lucide--panel-left-close]'
              )
            "
          />
        </Button>
      </header>
      <div class="flex min-h-0 flex-1 flex-col pt-3">
        <div class="flex min-h-0 flex-1 flex-col">
          <AssetsSidebar
            data-component-id="LocalMediaView-Sidebar"
            :available-tags="browser.sidebarTags.value"
            :temp-active="browser.sidebarFlags.value.tempActive"
            :favorites-active="browser.sidebarFlags.value.favoritesActive"
            :generated-active="browser.sidebarFlags.value.generatedActive"
            :imported-active="browser.sidebarFlags.value.importedActive"
            :compact="sidebarCollapsed"
            @select-temp="browser.selectTemp"
            @select-favorites="browser.selectFavorites"
            @select-generated="browser.selectGenerated"
            @select-imported="browser.selectImported"
            @selection-changed="browser.onTagSelectionChanged"
          />
        </div>
        <div
          :class="
            cn(
              'flex shrink-0 flex-col gap-1 border-t border-border-subtle py-2',
              sidebarCollapsed ? 'px-2' : 'px-3'
            )
          "
        >
          <AssetsSidebarItem
            :active="false"
            icon="pi pi-question-circle"
            :label="$t('menu.help')"
            :compact="sidebarCollapsed"
            @click="toggleHelpCenter"
          />
          <AssetsSidebarItem
            :active="false"
            icon="icon-[lucide--settings]"
            :label="$t('g.settings')"
            :compact="sidebarCollapsed"
            @click="openSettings"
          />
        </div>
      </div>
    </nav>

    <section
      class="mt-5 mr-3 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-t-2xl bg-base-background"
    >
      <header
        class="flex h-22 w-full shrink-0 items-center justify-between gap-3 px-6"
      >
        <div class="flex flex-1 shrink-0 gap-2">
          <div class="max-w-xl flex-1">
            <MetadataSearchInput
              v-model:search-query="browser.searchQuery.value"
              v-model:metadata-filters="browser.metadataFilters.value"
              :available-tags="browser.availableTags.value"
              :available-values-by-field="browser.availableValuesByField.value"
              :size="isScrolled ? 'md' : 'lg'"
            />
          </div>
        </div>
        <div
          :class="
            cn(
              'flex shrink-0 items-center gap-3 transition-[opacity,transform] duration-200 ease-out',
              isScrolled
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none -translate-y-1 opacity-0'
            )
          "
          aria-hidden="true"
        >
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
              <i class="icon-[lucide--arrow-up-down] text-muted-foreground" />
            </template>
          </SingleSelect>
        </div>

        <!-- Prototype: referenced-media actions (Flow 03, non-final), pinned
             top-right of the header (right of search, above the sort). -->
        <div class="flex shrink-0 items-center gap-3">
          <button
            v-if="isDev && mediaRefs.firstLinkedFolder"
            type="button"
            class="text-xs text-muted-foreground underline decoration-dotted underline-offset-2 transition-colors hover:text-base-foreground"
            @click="onSimulateFolder"
          >
            {{ t('prototype.media.devSimulateFolder') }}
          </button>
          <Button variant="secondary" size="lg" @click="showAdd = true">
            <i class="icon-[lucide--plus] size-4" />
            {{ t('prototype.media.add') }}
          </Button>
        </div>
      </header>

      <main class="flex min-h-0 flex-1 flex-col">
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
                  <h1 class="text-neutral truncate text-lg font-semibold">
                    {{ $t('mediaAssets.modal.title') }}
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
            </div>
          </div>
          <MediaAssetFilterChipsBar
            v-model="browser.metadataFilters.value"
            class="-mx-2 2xl:-mx-4"
          />

          <!-- Prototype: quiet missing-files notice (Flow 03, non-final). -->
          <p
            v-if="mediaRefs.missingCount > 0"
            class="text-warning flex min-w-0 items-center gap-1.5 text-xs"
          >
            <i class="icon-[lucide--unlink] size-3.5 shrink-0" />
            <span class="truncate">
              {{
                t('prototype.media.missingBanner', {
                  count: mediaRefs.missingCount
                })
              }}
            </span>
          </p>
        </div>

        <div
          ref="scrollContainerRef"
          class="relative flex scrollbar-custom min-h-0 flex-1 flex-col overflow-y-auto mask-[linear-gradient(to_bottom,transparent_0,black_2px)] px-6 pt-0 pb-2"
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
            v-else-if="!browser.displayAssets.value.length"
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
            @select-asset="onSelectAsset"
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

    <AssetDetailSidebar :asset="detailsAsset" @close="closeDetails" />

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
      @relink="onRelinkFromMenu"
      @remove-from-comfy="onRemoveFromComfy"
    />
    <MediaLightbox
      v-model:active-index="galleryActiveIndex"
      v-model:compare-items="compareItems"
      v-model:compare-assets="compareAssets"
      :all-gallery-items="galleryItems"
    />

    <RelinkDialog
      v-if="relinkTarget"
      :asset="relinkTarget"
      @close="relinkTarget = null"
      @confirm="onRelinkConfirm"
    />
    <RemoveFromComfyDialog
      v-if="removeTarget"
      :asset="removeTarget"
      @close="removeTarget = null"
      @confirm="onRemoveConfirm"
    />
    <AddMediaDialog
      v-if="showAdd"
      @close="showAdd = false"
      @confirm="onAddConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { useScroll } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import NoResultsPlaceholder from '@/components/common/NoResultsPlaceholder.vue'
import SingleSelect from '@/components/ui/single-select/SingleSelect.vue'
import MediaLightbox from '@/components/sidebar/tabs/queue/MediaLightbox.vue'
import Popover from '@/components/ui/Popover.vue'
import Button from '@/components/ui/button/Button.vue'
import Slider from '@/components/ui/slider/Slider.vue'
import AssetDetailSidebar from '@/platform/assets/components/AssetDetailSidebar.vue'
import AssetMasonryGrid from '@/platform/assets/components/AssetMasonryGrid.vue'
import AssetSelectionFloatingBar from '@/platform/assets/components/AssetSelectionFloatingBar.vue'
import AssetsSidebar from '@/platform/assets/components/AssetsSidebar.vue'
import AssetsSidebarItem from '@/platform/assets/components/AssetsSidebarItem.vue'
import MediaAssetContextMenu from '@/platform/assets/components/MediaAssetContextMenu.vue'
import MediaAssetFilterChipsBar from '@/platform/assets/components/MediaAssetFilterChipsBar.vue'
import MetadataSearchInput from '@/platform/assets/components/MetadataSearchInput.vue'
import type { AssetItem } from '@/platform/assets/schemas/assetSchema'
import { useMediaAssetsBrowserState } from '@/platform/assets/composables/useMediaAssetsBrowserState'
import { useHelpCenter } from '@/composables/useHelpCenter'
import { useCommandStore } from '@/stores/commandStore'
import { cn } from '@comfyorg/tailwind-utils'

import AddMediaDialog from './AddMediaDialog.vue'
import RelinkDialog from './RelinkDialog.vue'
import RemoveFromComfyDialog from './RemoveFromComfyDialog.vue'
import {
  parentFolder,
  useMediaReferenceStore
} from '../stores/mediaReferenceStore'
import type { LibraryAsset } from '../types'

const { t } = useI18n()
const { toggleHelpCenter } = useHelpCenter()
const settingsCommand = useCommandStore().getCommand('Comfy.ShowSettingsDialog')
const openSettings = () => {
  settingsCommand.function()
}

const contextMenuRef = ref<InstanceType<typeof MediaAssetContextMenu> | null>(
  null
)

const sidebarCollapsed = ref(false)

const SCROLL_COLLAPSE_THRESHOLD = 32

const scrollContainerRef = ref<HTMLElement | null>(null)
const { y: scrollY } = useScroll(scrollContainerRef)
const isScrolled = computed(() => scrollY.value > SCROLL_COLLAPSE_THRESHOLD)

const {
  browser,
  sortBy,
  sortOptions,
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
  contextMenuAsset,
  contextMenuAssetType,
  contextMenuFileKind,
  isBulkMode,
  showInitialLoading,
  skeletonGridStyle,
  skeletonAspect,
  skeletonCount,
  galleryItems,
  galleryActiveIndex,
  compareItems,
  compareAssets
} = useMediaAssetsBrowserState({ contextMenuRef })

// --- Prototype referenced-media layer ---
const isDev = import.meta.env.DEV
const mediaRefs = useMediaReferenceStore()

const relinkTarget = ref<LibraryAsset | null>(null)
const removeTarget = ref<LibraryAsset | null>(null)
const showAdd = ref(false)

function refById(id: string): LibraryAsset | undefined {
  return mediaRefs.references.find((r) => r.id === id)
}

function onSelectAsset(asset: AssetItem) {
  // A click on a missing file goes straight to relink rather than selection.
  if (asset.user_metadata?.linkState === 'missing') {
    const ref = refById(asset.id)
    if (ref) {
      relinkTarget.value = ref
      return
    }
  }
  handleAssetSelect(asset)
}

function onRelinkFromMenu(asset: AssetItem) {
  const ref = refById(asset.id)
  if (ref) relinkTarget.value = ref
}

function onRemoveFromComfy(asset: AssetItem) {
  const ref = refById(asset.id)
  if (ref) removeTarget.value = ref
}

function onRelinkConfirm(payload: { newPath: string; alsoSiblings: boolean }) {
  const asset = relinkTarget.value
  if (!asset?.sourcePath) return
  const oldFolder = parentFolder(asset.sourcePath)
  mediaRefs.relink(asset.id, payload.newPath)
  if (payload.alsoSiblings) {
    mediaRefs.relinkSiblings(oldFolder, parentFolder(payload.newPath))
  }
  relinkTarget.value = null
  browser.refreshAssets()
}

function onRemoveConfirm() {
  if (removeTarget.value) mediaRefs.removeFromComfy(removeTarget.value.id)
  removeTarget.value = null
  browser.refreshAssets()
}

function onAddConfirm(files: { path: string; tags: string[] }[]) {
  for (const f of files) mediaRefs.addReference(f.path, f.tags)
  showAdd.value = false
  browser.refreshAssets()
}

function onSimulateFolder() {
  if (mediaRefs.firstLinkedFolder) {
    mediaRefs.simulateFolderMissing(mediaRefs.firstLinkedFolder)
  }
  browser.refreshAssets()
}
</script>
