<template>
  <ContextMenu
    ref="contextMenu"
    :model="contextMenuItems"
    :pt="{
      root: {
        id: contextMenuId,
        class: cn(
          'rounded-lg border border-border-default',
          'bg-secondary-background text-base-foreground',
          'shadow-lg'
        )
      }
    }"
    @hide="onMenuHide"
  >
    <template #item="{ item, props }">
      <Button
        variant="secondary"
        class="w-full justify-start gap-2"
        v-bind="props.action"
        @mouseenter="handleItemMouseEnter($event, item)"
      >
        <i v-if="item.icon" :class="item.icon" class="size-4" />
        <span class="flex-1 text-left">{{
          typeof item.label === 'function' ? item.label() : (item.label ?? '')
        }}</span>
        <i
          v-if="(item as MenuItemWithSubmenu).isTagsSubmenu"
          class="icon-[lucide--chevron-right] size-4 opacity-60"
        />
      </Button>
    </template>
  </ContextMenu>
  <Teleport to="body">
    <div
      v-if="tagsPopoverVisible"
      ref="tagsPopoverRef"
      class="fixed z-1500 w-64 overscroll-contain rounded-lg border border-border-default bg-secondary-background p-2 text-base-foreground shadow-lg"
      :style="tagsPopoverStyle"
      @click.stop
      @wheel.stop
    >
      <AssetTagsEditor :assets="tagTargets" always-editing />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import ContextMenu from 'primevue/contextmenu'
import type { MenuItem } from 'primevue/menuitem'
import { computed, ref, useId } from 'vue'
import type { CSSProperties } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import AssetTagsEditor from '@/platform/assets/components/AssetTagsEditor.vue'
import { isCloud, isDesktop } from '@/platform/distribution/types'
import { supportsWorkflowMetadata } from '@/platform/workflow/utils/workflowExtractionUtil'
import {
  getMediaTypeFromFilename,
  isPreviewableMediaType
} from '@/utils/formatUtil'
import { detectNodeTypeFromFilename } from '@/utils/loaderNodeUtil'
import { electronAPI } from '@/utils/envUtil'
import { cn } from '@/utils/tailwindUtil'

import { useAssetFavorites } from '../composables/useAssetFavorites'
import { useMediaAssetActions } from '../composables/useMediaAssetActions'
import type { AssetItem } from '../schemas/assetSchema'
import type { AssetContext, MediaKind } from '../schemas/mediaAssetSchema'

type MenuItemWithSubmenu = MenuItem & {
  isTagsSubmenu?: boolean
}

const {
  asset,
  assetType,
  fileKind,
  showDeleteButton,
  selectedAssets,
  isBulkMode,
  allowMoveActions = false
} = defineProps<{
  asset: AssetItem
  assetType: AssetContext['type']
  fileKind: MediaKind
  showDeleteButton?: boolean
  selectedAssets?: AssetItem[]
  isBulkMode?: boolean
  allowMoveActions?: boolean
}>()

const emit = defineEmits<{
  zoom: []
  hide: []
  'asset-deleted': []
  'bulk-download': [assets: AssetItem[]]
  'bulk-move': [assets: AssetItem[]]
  'bulk-delete': [assets: AssetItem[]]
  'bulk-add-to-workflow': [assets: AssetItem[]]
  'bulk-open-workflow': [assets: AssetItem[]]
  'bulk-export-workflow': [assets: AssetItem[]]
  'bulk-compare': [assets: AssetItem[], totalSelected: number]
  'show-details': [asset: AssetItem]
}>()

type ContextMenuHandle = {
  show: (event: MouseEvent) => void
  hide: () => void
}

const contextMenu = ref<ContextMenuHandle | null>(null)
const contextMenuId = useId()
const isVisible = ref(false)
const actions = useMediaAssetActions()
const favorites = useAssetFavorites()
const { t } = useI18n()

const tagsPopoverVisible = ref(false)
const tagsPopoverStyle = ref<CSSProperties>({})
const tagsPopoverRef = ref<HTMLElement | null>(null)

const tagTargets = computed<AssetItem[]>(() =>
  bulkActive.value && selectedAssets ? selectedAssets : asset ? [asset] : []
)

function showTagsPopover(anchor: HTMLElement) {
  const rect = anchor.getBoundingClientRect()
  tagsPopoverStyle.value = {
    left: `${rect.right + 8}px`,
    top: `${rect.top}px`
  }
  tagsPopoverVisible.value = true
}

useEventListener(
  window,
  'wheel',
  (event: WheelEvent) => {
    if (!tagsPopoverVisible.value) return
    const target = event.target
    if (!(target instanceof Node)) return
    if (tagsPopoverRef.value?.contains(target)) {
      event.stopImmediatePropagation()
    }
  },
  { capture: true }
)

const isCurrentAssetSelected = computed(
  () => selectedAssets?.some((a) => a.id === asset.id) ?? false
)

const bulkActive = computed(
  () =>
    !!isBulkMode &&
    !!selectedAssets &&
    selectedAssets.length > 0 &&
    isCurrentAssetSelected.value
)

const favoriteTargets = computed<AssetItem[]>(() =>
  bulkActive.value && selectedAssets ? selectedAssets : asset ? [asset] : []
)

const allTargetsFavorited = computed(() => {
  const targets = favoriteTargets.value
  if (targets.length === 0) return false
  return targets.every((a) => favorites.isFavorited(a))
})

async function applyFavoriteToTargets(value: boolean) {
  await Promise.all(
    favoriteTargets.value.map((a) => favorites.setFavorited(a, value))
  )
}

function buildFavoriteMenuItem(): MenuItem {
  const active = allTargetsFavorited.value
  return {
    label: t(
      active ? 'mediaAsset.actions.unfavorite' : 'mediaAsset.actions.favorite'
    ),
    icon: active ? 'icon-[ph--star-fill] text-citrine-400' : 'icon-[ph--star]',
    command: () => {
      void applyFavoriteToTargets(!active)
    }
  }
}

function buildTagsMenuItem(): MenuItemWithSubmenu {
  return {
    label: t('mediaAsset.actions.editTags'),
    icon: 'icon-[lucide--tags]',
    isTagsSubmenu: true,
    command: (e: { originalEvent: Event }) => {
      const target = (e.originalEvent.currentTarget ??
        e.originalEvent.target) as HTMLElement | null
      if (target) showTagsPopover(target)
    }
  }
}

function handleItemMouseEnter(event: MouseEvent, item: MenuItem) {
  const target = event.currentTarget as HTMLElement | null
  if (!target) return
  if ((item as MenuItemWithSubmenu).isTagsSubmenu) {
    showTagsPopover(target)
  }
}

useEventListener(
  window,
  'pointerdown',
  (event: PointerEvent) => {
    if (!isVisible.value) return
    if (!(event.target instanceof Node)) {
      hide()
      return
    }
    const menuEl = document.getElementById(contextMenuId)
    if (menuEl?.contains(event.target)) return
    if (tagsPopoverRef.value?.contains(event.target)) return
    hide()
  },
  { capture: true }
)

useEventListener(
  window,
  'pointerdown',
  (event: PointerEvent) => {
    if (!tagsPopoverVisible.value) return
    if (!(event.target instanceof Node)) {
      tagsPopoverVisible.value = false
      return
    }
    if (tagsPopoverRef.value?.contains(event.target)) return
    const menuEl = document.getElementById(contextMenuId)
    if (menuEl?.contains(event.target)) return
    tagsPopoverVisible.value = false
  },
  { capture: true }
)

useEventListener(
  window,
  'scroll',
  (event: Event) => {
    if (!isVisible.value) return
    const target = event.target
    if (target instanceof Node && tagsPopoverRef.value?.contains(target)) {
      return
    }
    hide()
  },
  { capture: true, passive: true }
)

const showAddToWorkflow = computed(() => {
  // Output assets can always be added
  if (assetType === 'output') return true

  // Input assets: check if file type is supported by loader nodes
  if (assetType === 'input' && asset?.name) {
    const { nodeType } = detectNodeTypeFromFilename(asset.name)
    return nodeType !== null
  }

  return false
})

const showWorkflowActions = computed(() => {
  // Output assets always have workflow metadata
  if (assetType === 'output') return true

  // Input assets: only formats that support workflow metadata
  if (assetType === 'input' && asset?.name) {
    return supportsWorkflowMetadata(asset.name)
  }

  return false
})

const showCopyJobId = computed(() => {
  return assetType !== 'input'
})

const shouldShowDeleteButton = computed(() => {
  const propAllows = showDeleteButton ?? true
  const typeAllows =
    assetType === 'output' || (assetType === 'input' && isCloud)

  return propAllows && typeAllows
})

// Subset of selected assets that can be compared against the anchor asset:
// same media kind as the right-clicked asset, and previewable.
const compareEligibleAssets = computed<AssetItem[]>(() => {
  if (!selectedAssets || !asset) return []
  const anchorKind = getMediaTypeFromFilename(asset.name)
  if (!isPreviewableMediaType(anchorKind)) return []
  return selectedAssets.filter((a) => {
    const kind = getMediaTypeFromFilename(a.name)
    return kind === anchorKind && isPreviewableMediaType(kind)
  })
})

const canCompare = computed(() => compareEligibleAssets.value.length >= 2)

// Context menu items
const contextMenuItems = computed<MenuItem[]>(() => {
  if (!asset) return []

  const items: MenuItem[] = []

  // Check if current asset is part of the selection
  const isCurrentAssetSelected = selectedAssets?.some(
    (selectedAsset) => selectedAsset.id === asset.id
  )

  // Bulk mode: Show selected count and bulk actions only if current asset is selected
  if (
    isBulkMode &&
    selectedAssets &&
    selectedAssets.length > 0 &&
    isCurrentAssetSelected
  ) {
    // Header item showing selected count
    items.push({
      label: t('mediaAsset.selection.multipleSelectedAssets'),
      disabled: true
    })

    // Compare (same-type pairs only)
    items.push({
      label: t('mediaAsset.compare.action'),
      icon: 'icon-[lucide--columns-2]',
      disabled: !canCompare.value,
      command: () =>
        emit('bulk-compare', compareEligibleAssets.value, selectedAssets.length)
    })

    // Favorite (applies to all selected; click toggles yellow, hover opens color popover)
    items.push(buildFavoriteMenuItem())

    // Edit tags (bulk)
    items.push(buildTagsMenuItem())

    // Bulk Add to Workflow
    items.push({
      label: t('mediaAsset.selection.insertAllAssetsAsNodes'),
      icon: 'icon-[comfy--node]',
      command: () => emit('bulk-add-to-workflow', selectedAssets)
    })

    // Bulk Open Workflow
    items.push({
      label: t('mediaAsset.selection.openWorkflowAll'),
      icon: 'icon-[comfy--workflow]',
      command: () => emit('bulk-open-workflow', selectedAssets)
    })

    // Bulk Export Workflow
    items.push({
      label: t('mediaAsset.selection.exportWorkflowAll'),
      icon: 'icon-[lucide--file-output]',
      command: () => emit('bulk-export-workflow', selectedAssets)
    })

    // Bulk Download
    items.push({
      label: t('mediaAsset.selection.downloadSelectedAll'),
      icon: 'icon-[lucide--download]',
      command: () => emit('bulk-download', selectedAssets)
    })

    // Bulk Move
    if (allowMoveActions) {
      items.push({
        label: t('mediaAsset.selection.moveSelectedAll'),
        icon: 'icon-[lucide--folder-input]',
        command: () => emit('bulk-move', selectedAssets)
      })
    }

    // Bulk Delete (if allowed)
    if (shouldShowDeleteButton.value) {
      items.push({
        label: t('mediaAsset.selection.deleteSelectedAll'),
        icon: 'icon-[lucide--trash-2]',
        command: () => emit('bulk-delete', selectedAssets)
      })
    }

    return items
  }

  // Individual mode: Show all menu options

  // Inspect
  if (isPreviewableMediaType(fileKind)) {
    items.push({
      label: t('mediaAsset.actions.inspect'),
      icon: 'icon-[lucide--zoom-in]',
      command: () => emit('zoom')
    })
  }

  // Show details
  items.push({
    label: t('mediaAsset.details.showDetails'),
    icon: 'icon-[lucide--info]',
    command: () => emit('show-details', asset)
  })

  items.push(buildFavoriteMenuItem())
  items.push(buildTagsMenuItem())

  // Add to workflow (conditional)
  if (showAddToWorkflow.value) {
    items.push({
      label: t('mediaAsset.actions.insertAsNodeInWorkflow'),
      icon: 'icon-[comfy--node]',
      command: () => actions.addWorkflow(asset)
    })
  }

  // Download
  items.push({
    label: t('mediaAsset.actions.download'),
    icon: 'icon-[lucide--download]',
    command: () => actions.downloadAsset(asset)
  })

  // Move to
  if (allowMoveActions) {
    items.push({
      label: t('mediaAsset.actions.moveTo'),
      icon: 'icon-[lucide--folder-input]',
      command: async () => {
        if (asset) await actions.moveAssets(asset)
      }
    })
  }

  // Show in OS file manager (desktop only)
  if (isDesktop) {
    const platform = electronAPI().getPlatform()
    const labelKey =
      platform === 'darwin'
        ? 'mediaAsset.actions.showInFinder'
        : platform === 'win32'
          ? 'mediaAsset.actions.showInExplorer'
          : 'mediaAsset.actions.showInFileManager'
    const iconClass =
      platform === 'darwin'
        ? 'icon-[comfy--finder]'
        : 'icon-[lucide--folder-open]'
    items.push({
      label: t(labelKey),
      icon: iconClass,
      command: () => {
        if (assetType === 'output') {
          electronAPI().openOutputsFolder()
        } else {
          electronAPI().openInputsFolder()
        }
      }
    })
  }

  // Separator before workflow actions (only if there are workflow actions)
  if (showWorkflowActions.value) {
    items.push({ separator: true })
    items.push({
      label: t('mediaAsset.actions.openWorkflow'),
      icon: 'icon-[comfy--workflow]',
      command: () => actions.openWorkflow(asset)
    })
    items.push({
      label: t('mediaAsset.actions.exportWorkflow'),
      icon: 'icon-[lucide--file-output]',
      command: () => actions.exportWorkflow(asset)
    })
  }

  // Copy job ID
  if (showCopyJobId.value) {
    items.push({ separator: true })
    items.push({
      label: t('mediaAsset.actions.copyJobId'),
      icon: 'icon-[lucide--copy]',
      command: async () => {
        await actions.copyJobId(asset)
      }
    })
  }

  // Delete
  if (shouldShowDeleteButton.value) {
    items.push({ separator: true })
    items.push({
      label: t('mediaAsset.actions.delete'),
      icon: 'icon-[lucide--trash-2]',
      command: async () => {
        if (asset) {
          const confirmed = await actions.deleteAssets(asset)
          if (confirmed) {
            emit('asset-deleted')
          }
        }
      }
    })
  }

  return items
})

function onMenuHide() {
  isVisible.value = false
  emit('hide')
}

function show(event: MouseEvent) {
  isVisible.value = true
  contextMenu.value?.show(event)
}

function hide() {
  isVisible.value = false
  contextMenu.value?.hide()
}

defineExpose({ show, hide })
</script>
