import { useEventListener, useKeyModifier, useStorage } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import { computed, nextTick, ref, watch } from 'vue'
import type { CSSProperties, Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type MediaAssetContextMenu from '@/platform/assets/components/MediaAssetContextMenu.vue'
import { getAssetType } from '@/platform/assets/composables/media/assetMappers'
import { useMediaAssetActions } from '@/platform/assets/composables/useMediaAssetActions'
import { useMediaAssetBrowser } from '@/platform/assets/composables/useMediaAssetBrowser'
import type { AssetItem } from '@/platform/assets/schemas/assetSchema'
import type { MediaKind } from '@/platform/assets/schemas/mediaAssetSchema'
import { assetToResultItem } from '@/platform/assets/utils/assetLightboxAdapter'
import type { ResultItemImpl } from '@/stores/queueStore'
import {
  getMediaTypeFromFilename,
  isPreviewableMediaType
} from '@/utils/formatUtil'

const MIN_DENSITY = 160
const MAX_DENSITY = 480
const DENSITY_STEP = 80
const DEFAULT_DENSITY = 240
const SKELETON_COUNT = 18
const SKELETON_ASPECTS = ['1 / 1', '3 / 4', '4 / 3', '2 / 3', '16 / 9']

type ContextMenuRef = Ref<InstanceType<typeof MediaAssetContextMenu> | null>

export function useMediaAssetsBrowserState(options: {
  contextMenuRef: ContextMenuRef
}) {
  const { contextMenuRef } = options
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

  function handleAssetClick(
    asset: AssetItem,
    index: number,
    list: AssetItem[]
  ) {
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

  const contextMenuAsset = ref<AssetItem | null>(null)
  let contextMenuAnchor: HTMLElement | null = null

  const contextMenuAssetType = computed(() =>
    contextMenuAsset.value ? getAssetType(contextMenuAsset.value.tags) : 'input'
  )

  const contextMenuFileKind = computed<MediaKind>(() =>
    getMediaTypeFromFilename(contextMenuAsset.value?.name ?? '')
  )

  const detailsAsset = ref<AssetItem | null>(null)
  const detailsAnchor = ref<HTMLElement | null>(null)

  function findAnchorForAsset(assetId: string): HTMLElement | null {
    const el = document.querySelector(`[data-asset-id="${assetId}"]`)
    if (!(el instanceof HTMLElement)) return null
    return (el.closest('[data-asset-card]') as HTMLElement | null) ?? el
  }

  function handleShowDetails(asset: AssetItem) {
    selectedIds.value = new Set([asset.id])
    lastClickedId.value = asset.id
    detailsAsset.value = asset
    detailsAnchor.value = contextMenuAnchor ?? findAnchorForAsset(asset.id)
  }

  function closeDetails() {
    detailsAsset.value = null
    detailsAnchor.value = null
  }

  useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if (selectedIds.value.size !== 1) return
    const target = event.target
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT')
    )
      return
    const dir =
      event.key === 'ArrowRight'
        ? 'right'
        : event.key === 'ArrowLeft'
          ? 'left'
          : event.key === 'ArrowDown'
            ? 'down'
            : event.key === 'ArrowUp'
              ? 'up'
              : null
    if (!dir) return
    event.preventDefault()
    navigateSelection(dir)
  })

  function findSpatialNeighbor(
    currentId: string,
    dir: 'up' | 'down',
    candidates: readonly AssetItem[]
  ): AssetItem | undefined {
    const currentEl = findAnchorForAsset(currentId)
    if (!currentEl) return undefined
    const currentRect = currentEl.getBoundingClientRect()
    const currentCenterX = currentRect.left + currentRect.width / 2
    let inCol: { asset: AssetItem; score: number } | null = null
    let offCol: { asset: AssetItem; score: number } | null = null
    for (const candidate of candidates) {
      if (candidate.id === currentId) continue
      const el = findAnchorForAsset(candidate.id)
      if (!el) continue
      const rect = el.getBoundingClientRect()
      const dy = rect.top - currentRect.top
      if (dir === 'down' && dy <= 5) continue
      if (dir === 'up' && dy >= -5) continue
      const overlap =
        Math.min(rect.right, currentRect.right) -
        Math.max(rect.left, currentRect.left)
      const overlapsColumn =
        overlap > Math.min(rect.width, currentRect.width) * 0.3
      if (overlapsColumn) {
        const score = Math.abs(dy)
        if (!inCol || score < inCol.score) inCol = { asset: candidate, score }
      } else {
        const candCenterX = rect.left + rect.width / 2
        const dx = Math.abs(candCenterX - currentCenterX)
        const score = dx + Math.abs(dy)
        if (!offCol || score < offCol.score)
          offCol = { asset: candidate, score }
      }
    }
    return inCol?.asset ?? offCol?.asset
  }

  function navigateSelection(direction: 'up' | 'down' | 'left' | 'right') {
    if (selectedIds.value.size !== 1) return
    const list = browser.displayAssets.value
    const currentId = [...selectedIds.value][0]
    const idx = list.findIndex((a) => a.id === currentId)
    if (idx === -1) return
    let next: AssetItem | undefined
    if (direction === 'left') next = list[idx - 1]
    else if (direction === 'right') next = list[idx + 1]
    else next = findSpatialNeighbor(currentId, direction, list)
    if (!next) return
    selectedIds.value = new Set([next.id])
    lastClickedId.value = next.id
    if (detailsAsset.value) {
      const el = findAnchorForAsset(next.id)
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'auto' })
        detailsAnchor.value = el
      }
      detailsAsset.value = next
    }
  }

  const showInitialLoading = computed(
    () => browser.isLoading.value && browser.displayAssets.value.length === 0
  )

  const showEmptyState = computed(
    () => !browser.isLoading.value && browser.displayAssets.value.length === 0
  )

  const skeletonGridStyle = computed<CSSProperties>(() => ({
    gridTemplateColumns: `repeat(auto-fill, minmax(${density.value}px, 1fr))`
  }))

  function skeletonAspect(n: number): string {
    return SKELETON_ASPECTS[n % SKELETON_ASPECTS.length]
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
  const compareAssets = ref<AssetItem[]>([])

  watch(galleryActiveIndex, (index) => {
    if (index === -1) {
      compareItems.value = []
      compareAssets.value = []
    }
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
    compareAssets.value = []
    galleryActiveIndex.value = index
  }

  function handleBulkCompare(assets: AssetItem[], totalSelected: number) {
    const items = assets.map(assetToResultItem)
    if (items.length < 2) return
    compareItems.value = items
    compareAssets.value = assets
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
    const target = event.target
    contextMenuAnchor =
      target instanceof HTMLElement
        ? (target.closest('[data-asset-card]') as HTMLElement | null)
        : null
    void nextTick(() => contextMenuRef.value?.show(event))
  }

  function onContextMenuHide() {
    contextMenuAsset.value = null
  }

  return {
    browser,
    sortBy,
    sortOptions,
    pageTitle,
    density,
    onDensityChange,
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
    navigateSelection,
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
    galleryItems,
    galleryActiveIndex,
    compareItems,
    compareAssets,
    densityRange: {
      min: MIN_DENSITY,
      max: MAX_DENSITY,
      step: DENSITY_STEP
    },
    skeletonCount: SKELETON_COUNT
  }
}
