<template>
  <div
    ref="cardContainerRef"
    role="button"
    :data-asset-id="asset?.id"
    :aria-label="
      asset
        ? $t('assetBrowser.ariaLabel.assetCard', {
            name: getAssetDisplayName(asset),
            type: fileKind
          })
        : $t('assetBrowser.ariaLabel.loadingAsset')
    "
    :tabindex="loading ? -1 : 0"
    :class="
      cn(
        'relative flex cursor-pointer flex-col overflow-hidden rounded-lg transition-colors duration-200',
        'group select-none',
        hideFooter ? 'gap-0 p-1' : 'gap-2 p-2',
        selected && hideFooter && 'ring-2 ring-white ring-inset',
        selected &&
          !hideFooter &&
          'ring-3 ring-modal-card-border-highlighted ring-inset',
        !selected && 'hover:bg-modal-card-background-hovered/20'
      )
    "
    :data-selected="selected"
    :draggable="true"
    @click.stop="$emit('click')"
    @contextmenu.prevent.stop="
      asset ? emit('context-menu', $event, asset) : undefined
    "
    @dragstart="dragStart"
  >
    <!-- Top Area: Media Preview -->
    <div
      class="relative overflow-hidden p-0"
      :class="
        cn(naturalAspect ? '' : 'aspect-square', hideFooter && 'rounded-md')
      "
      :style="naturalAspect ? { aspectRatio: previewAspectRatio } : undefined"
    >
      <!-- Loading State -->
      <div
        v-if="loading"
        class="size-full animate-pulse rounded-lg bg-modal-card-placeholder-background"
      />

      <!-- Content based on asset type -->
      <component
        :is="getTopComponent(previewKind)"
        v-else-if="asset && adaptedAsset"
        :asset="adaptedAsset"
        :context="{ type: assetType }"
        class="absolute inset-0"
        @view="handleZoomClick"
        @download="actions.downloadAsset()"
        @video-playing-state-changed="isVideoPlaying = $event"
        @video-controls-changed="showVideoControls = $event"
        @image-loaded="handleImageLoaded"
      />

      <LoadingOverlay :loading="isDeleting">
        <i class="icon-[lucide--trash-2] size-5" />
      </LoadingOverlay>

      <!-- Action buttons overlay (top-left of the image). Prototype
           context disables favoriting per design-decisions 2026-05-18 —
           only the more-options handle is exposed. -->
      <Transition
        enter-active-class="transition-[transform,opacity] duration-150 ease-out"
        leave-active-class="transition-[transform,opacity] duration-100 ease-in"
        enter-from-class="scale-90 opacity-0"
        leave-to-class="scale-90 opacity-0"
      >
        <div
          v-if="showActionsOverlay"
          class="absolute top-2 left-2 flex origin-top-left flex-wrap justify-start gap-2"
        >
          <IconGroup background-class="bg-white">
            <Button
              variant="overlay-white"
              size="icon"
              :aria-label="$t('mediaAsset.actions.moreOptions')"
              @click.stop="
                asset ? emit('context-menu', $event, asset) : undefined
              "
            >
              <i class="icon-[lucide--ellipsis] size-4" />
            </Button>
          </IconGroup>
        </div>
      </Transition>

      <!-- Storage badge (cloud vs local) — only on hover, to keep the
           grid quiet at rest. Sourced from user_metadata.storage. -->
      <div
        v-if="storage"
        :title="
          storage === 'cloud'
            ? $t('mediaAsset.storage.cloud')
            : $t('mediaAsset.storage.local')
        "
        :class="
          cn(
            'pointer-events-none absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-md bg-black/55 text-white backdrop-blur-sm transition-opacity duration-150',
            isHovered ? 'opacity-100' : 'opacity-0'
          )
        "
      >
        <i
          :class="
            cn(
              'size-3.5',
              storage === 'cloud'
                ? 'icon-[lucide--cloud]'
                : 'icon-[lucide--hard-drive]'
            )
          "
        />
      </div>

      <!-- Creator chip (Explore-feed attribution). Bottom-left,
           hover-revealed. Gated on user_metadata.creator so it only
           renders for prototype fixtures — the real ComfyUI media
           browser path leaves the corner empty. -->
      <div
        v-if="creator"
        :class="
          cn(
            'pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-black/55 py-1 pr-2.5 pl-1 text-white backdrop-blur-sm transition-opacity duration-150',
            isHovered ? 'opacity-100' : 'opacity-0'
          )
        "
      >
        <span
          class="grid size-5 place-items-center rounded-full text-[10px] font-semibold"
          :style="{ backgroundColor: creator.avatarColor ?? '#7c7c7c' }"
        >
          {{ creatorInitial }}
        </span>
        <span class="text-xs/none">@{{ creator.username }}</span>
      </div>
    </div>

    <!-- Bottom Area: Media Info -->
    <div v-if="!hideFooter" class="flex-1">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-start justify-between">
        <div class="flex flex-col gap-1">
          <div
            class="h-4 w-24 animate-pulse rounded-sm bg-modal-card-background"
          />
          <div
            class="h-3 w-20 animate-pulse rounded-sm bg-modal-card-background"
          />
        </div>
        <div
          class="h-6 w-12 animate-pulse rounded-sm bg-modal-card-background"
        />
      </div>

      <!-- Content -->
      <div
        v-else-if="asset && adaptedAsset"
        class="flex items-end justify-between gap-1.5"
      >
        <!-- Left side: Media name and metadata -->
        <div class="flex flex-col gap-1">
          <!-- Title -->
          <MediaTitle :file-name="fileName" />
          <!-- Metadata -->
          <div class="flex gap-1.5 text-xs text-muted-foreground">
            <span v-if="formattedDuration">{{ formattedDuration }}</span>
            <span v-if="metaInfo">{{ metaInfo }}</span>
          </div>
        </div>

        <!-- Right side: Output count -->
        <div v-if="showOutputCount" class="shrink-0">
          <Button
            v-tooltip.top.pt:pointer-events-none="
              $t('mediaAsset.actions.seeMoreOutputs')
            "
            variant="secondary"
            @click.stop="handleOutputCountClick"
          >
            <i class="icon-[lucide--layers] size-4" />
            <span>{{ outputCount }}</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useElementHover } from '@vueuse/core'
import { computed, defineAsyncComponent, provide, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

import IconGroup from '@/components/button/IconGroup.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import Button from '@/components/ui/button/Button.vue'
import { isCloud } from '@/platform/distribution/types'
import { useAssetsStore } from '@/stores/assetsStore'
import {
  formatDuration,
  formatSize,
  getFilenameDetails,
  getMediaTypeFromFilename,
  isPreviewableMediaType
} from '@/utils/formatUtil'
import { cn } from '@comfyorg/tailwind-utils'

import { getAssetType } from '../composables/media/assetMappers'
import { getAssetUrl } from '../utils/assetUrlUtil'
import { useAssetDimensionsCache } from '../composables/useAssetDimensionsCache'
import {
  ASSET_DRAG_MIME,
  useAssetDragPreview
} from '../composables/useAssetDragPreview'
import { useMediaAssetActions } from '../composables/useMediaAssetActions'
import type { AssetItem } from '../schemas/assetSchema'
import { getAssetDisplayName } from '../utils/assetMetadataUtils'
import type { MediaKind } from '../schemas/mediaAssetSchema'
import { MediaAssetKey } from '../schemas/mediaAssetSchema'
import MediaTitle from './MediaTitle.vue'

type PreviewKind = ReturnType<typeof getMediaTypeFromFilename>

const mediaComponents = {
  top: {
    video: defineAsyncComponent(() => import('./MediaVideoTop.vue')),
    audio: defineAsyncComponent(() => import('./MediaAudioTop.vue')),
    image: defineAsyncComponent(() => import('./MediaImageTop.vue')),
    '3D': defineAsyncComponent(() => import('./Media3DTop.vue')),
    text: defineAsyncComponent(() => import('./MediaTextTop.vue')),
    other: defineAsyncComponent(() => import('./MediaOtherTop.vue'))
  }
}

function getTopComponent(kind: PreviewKind) {
  return mediaComponents.top[kind] || mediaComponents.top.other
}

const {
  asset,
  loading,
  selected,
  selectedIds,
  showOutputCount,
  outputCount,
  naturalAspect = false,
  hideFooter = false
} = defineProps<{
  asset?: AssetItem
  loading?: boolean
  selected?: boolean
  selectedIds?: ReadonlySet<string>
  showOutputCount?: boolean
  outputCount?: number
  naturalAspect?: boolean
  hideFooter?: boolean
}>()

const assetsStore = useAssetsStore()

// Get deletion state from store
const isDeleting = computed(() =>
  asset ? assetsStore.isAssetDeleting(asset.id) : false
)

const emit = defineEmits<{
  click: []
  zoom: [asset: AssetItem]
  'output-count-click': []
  'context-menu': [event: MouseEvent, asset: AssetItem]
}>()

const cardContainerRef = ref<HTMLElement>()

const isVideoPlaying = ref(false)
const showVideoControls = ref(false)

// Store actual image dimensions
const imageDimensions = ref<{ width: number; height: number } | undefined>()

const isHovered = useElementHover(cardContainerRef)

const actions = useMediaAssetActions()
const dimensionsCache = useAssetDimensionsCache()

// Get asset type from tags
const assetType = computed(() => {
  return getAssetType(asset?.tags)
})

// Storage origin (prototype fixtures set this via user_metadata; falls back
// to undefined for real-app assets, where the badge is hidden).
const storage = computed<'local' | 'cloud' | undefined>(() => {
  const raw = asset?.user_metadata?.storage
  return raw === 'local' || raw === 'cloud' ? raw : undefined
})

// Creator attribution. Only prototype Explore-feed fixtures set this;
// gating on the metadata shape keeps the overlay invisible in the
// real ComfyUI media browser path.
interface CreatorMeta {
  username: string
  avatarColor?: string
}
const creator = computed<CreatorMeta | undefined>(() => {
  const raw = asset?.user_metadata?.creator as
    | { username?: unknown; avatarColor?: unknown }
    | undefined
  if (!raw || typeof raw.username !== 'string') return undefined
  return {
    username: raw.username,
    avatarColor:
      typeof raw.avatarColor === 'string' ? raw.avatarColor : undefined
  }
})

const creatorInitial = computed(
  () => creator.value?.username.trim().charAt(0).toUpperCase() ?? ''
)

// Determine file type from extension
const fileKind = computed((): MediaKind => {
  return getMediaTypeFromFilename(asset?.name || '')
})

const previewKind = computed((): PreviewKind => {
  return getMediaTypeFromFilename(asset?.name || '')
})

const canInspect = computed(() => isPreviewableMediaType(fileKind.value))

const cachedDimensions = computed(() =>
  asset ? dimensionsCache.getDimensions(asset.id) : null
)

const previewAspectRatio = computed(() => {
  const dims = imageDimensions.value ?? cachedDimensions.value
  if (dims && dims.width > 0 && dims.height > 0) {
    return `${dims.width} / ${dims.height}`
  }
  if (fileKind.value === 'video') return '16 / 9'
  return '1 / 1'
})

// Get filename without extension
const fileName = computed(() => {
  return getFilenameDetails(asset ? getAssetDisplayName(asset) : '').filename
})

// Adapt AssetItem to legacy AssetMeta format for existing components
const adaptedAsset = computed(() => {
  if (!asset) return undefined
  return {
    id: asset.id,
    name: asset.name,
    display_name: asset.display_name,
    kind: fileKind.value,
    src:
      fileKind.value === '3D'
        ? getAssetUrl(asset)
        : asset.thumbnail_url || asset.preview_url || '',
    preview_url: asset.preview_url,
    preview_id: asset.preview_id,
    size: asset.size,
    tags: asset.tags || [],
    created_at: asset.created_at,
    duration: asset.user_metadata?.duration
      ? Number(asset.user_metadata.duration)
      : undefined,
    dimensions: imageDimensions.value
  }
})

provide(MediaAssetKey, {
  asset: toRef(() => adaptedAsset.value),
  context: toRef(() => ({ type: assetType.value })),
  isVideoPlaying,
  showVideoControls
})

const formattedDuration = computed(() => {
  // Check for execution time first (from history API)
  const executionTime = asset?.user_metadata?.executionTimeInSeconds
  if (executionTime !== undefined && executionTime !== null) {
    return `${Number(executionTime).toFixed(2)}s`
  }

  // Fall back to duration for media files
  const duration = asset?.user_metadata?.duration
  if (!duration) return ''
  return formatDuration(Number(duration))
})

// Get metadata info based on file kind
const metaInfo = computed(() => {
  if (!asset) return ''
  // TODO(assets): Re-enable once /assets API returns original image dimensions in metadata (#10590)
  if (fileKind.value === 'image' && imageDimensions.value && !isCloud) {
    return `${imageDimensions.value.width}x${imageDimensions.value.height}`
  }
  if (asset.size && ['video', 'audio', '3D'].includes(fileKind.value)) {
    return formatSize(asset.size)
  }
  return ''
})

const showActionsOverlay = computed(() => {
  if (loading || !asset || isDeleting.value) return false
  return isHovered.value || selected || isVideoPlaying.value
})

const handleZoomClick = () => {
  if (asset && canInspect.value) {
    emit('zoom', asset)
  }
}

const handleImageLoaded = (width: number, height: number) => {
  imageDimensions.value = { width, height }
  if (asset) dimensionsCache.setDimensions(asset.id, width, height)
}

const handleOutputCountClick = () => {
  emit('output-count-click')
}

const dragPreview = useAssetDragPreview()
const { t } = useI18n()

function dragStart(e: DragEvent) {
  if (!asset) return

  const { dataTransfer } = e
  if (!dataTransfer) return

  const dragIds =
    selected && selectedIds && selectedIds.size > 1
      ? [...selectedIds]
      : [asset.id]

  dataTransfer.setData(ASSET_DRAG_MIME, JSON.stringify(dragIds))
  dataTransfer.effectAllowed = 'copyMove'

  dragPreview.configure(dragIds, asset, t)
  dragPreview.startDrag(e)
}
</script>
