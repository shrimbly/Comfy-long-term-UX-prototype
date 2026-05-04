<template>
  <div ref="containerRef" class="relative w-full">
    <div
      v-for="asset in visibleAssets"
      :key="asset.id"
      :ref="(el) => setItemRef(asset.id, el as HTMLElement | null)"
      class="absolute transition-[transform,width] duration-200 ease-out will-change-transform"
      :style="positionStyle(asset.id)"
    >
      <MediaAssetCard
        natural-aspect
        :asset="asset"
        :selected="isSelected(asset.id)"
        @click="emit('select-asset', asset)"
        @zoom="emit('preview-asset', asset)"
        @context-menu="(event, a) => emit('context-menu', event, a)"
      />
    </div>
    <div :style="{ height: `${containerHeight}px` }" aria-hidden="true" />
    <div
      ref="sentinelRef"
      class="pointer-events-none absolute inset-x-0 h-px"
      :style="{ top: `${sentinelTop}px` }"
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
import {
  useElementSize,
  useIntersectionObserver,
  useResizeObserver,
  useScroll
} from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { CSSProperties } from 'vue'

import MediaAssetCard from '@/platform/assets/components/MediaAssetCard.vue'
import { useMasonryLayout } from '@/platform/assets/composables/useMasonryLayout'
import type { AssetItem } from '@/platform/assets/schemas/assetSchema'

const {
  assets,
  columnWidth,
  gap = 12,
  isSelected = () => false
} = defineProps<{
  assets: readonly AssetItem[]
  columnWidth: number
  gap?: number
  isSelected?: (assetId: string) => boolean
}>()

const emit = defineEmits<{
  'select-asset': [asset: AssetItem]
  'preview-asset': [asset: AssetItem]
  'context-menu': [event: MouseEvent, asset: AssetItem]
  'approach-end': []
}>()

const containerRef = ref<HTMLElement | null>(null)
const sentinelRef = ref<HTMLElement | null>(null)
const itemElements = new Map<string, HTMLElement>()
const itemObservers = new Map<string, () => void>()

const itemIds = computed(() => assets.map((a) => a.id))
const columnWidthRef = computed(() => columnWidth)
const gapRef = computed(() => gap)

const { positions, containerHeight, reportItemHeight } = useMasonryLayout({
  containerRef,
  itemIds,
  columnWidth: columnWidthRef,
  gap: gapRef
})

const APPROACH_END_OFFSET = 600

const sentinelTop = computed(() =>
  Math.max(0, containerHeight.value - APPROACH_END_OFFSET)
)

useIntersectionObserver(sentinelRef, ([entry]) => {
  if (entry?.isIntersecting) emit('approach-end')
})

// Virtualization: only render cards in the viewport ± buffer so we don't pay
// the cost of mounting hundreds of MediaAssetCards (and firing hundreds of
// image requests + ResizeObservers) on first paint.

const VIEWPORT_BUFFER_PX = 800
const FALLBACK_VISIBLE_HEIGHT = 1200

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let current = el?.parentElement ?? null
  while (current) {
    const style = window.getComputedStyle(current)
    const overflowY = style.overflowY
    if (
      overflowY === 'auto' ||
      overflowY === 'scroll' ||
      overflowY === 'overlay'
    ) {
      return current
    }
    current = current.parentElement
  }
  return null
}

const scrollParent = ref<HTMLElement | null>(null)
const scrollParentRef = computed(() => scrollParent.value)
const { y: scrollY } = useScroll(scrollParentRef)
const { height: viewportHeight } = useElementSize(scrollParentRef)
const { top: containerTopInDoc } = useContainerOffset(
  containerRef,
  scrollParent
)

onMounted(() => {
  scrollParent.value = findScrollParent(containerRef.value)
})

const visibleRange = computed(() => {
  const vpHeight = viewportHeight.value || FALLBACK_VISIBLE_HEIGHT
  // Translate viewport coordinates into the masonry's local coordinate space
  // (offsetTop relative to scroll parent).
  const top = scrollY.value - containerTopInDoc.value - VIEWPORT_BUFFER_PX
  const bottom =
    scrollY.value - containerTopInDoc.value + vpHeight + VIEWPORT_BUFFER_PX
  return { top, bottom }
})

const visibleAssets = computed(() => {
  const { top, bottom } = visibleRange.value
  const out: AssetItem[] = []
  const fallbackHeight = columnWidth // square estimate
  for (const asset of assets) {
    const pos = positions.value.get(asset.id)
    if (!pos) continue
    const itemBottom = pos.top + fallbackHeight
    if (pos.top > bottom) continue
    if (itemBottom < top) continue
    out.push(asset)
  }
  return out
})

function positionStyle(id: string): CSSProperties {
  const pos = positions.value.get(id)
  if (!pos) {
    return {
      transform: 'translate(0, 0)',
      width: `${columnWidth}px`,
      opacity: 0
    }
  }
  return {
    transform: `translate(${pos.left}px, ${pos.top}px)`,
    width: `${pos.width}px`
  }
}

function observe(id: string, el: HTMLElement) {
  const stop = useResizeObserver(el, (entries) => {
    const entry = entries[0]
    if (entry) reportItemHeight(id, entry.contentRect.height)
  }).stop
  itemObservers.set(id, stop)
  reportItemHeight(id, el.getBoundingClientRect().height)
}

function setItemRef(id: string, el: HTMLElement | null) {
  if (el) {
    if (itemElements.get(id) === el) return
    if (itemElements.has(id)) {
      itemObservers.get(id)?.()
      itemObservers.delete(id)
    }
    itemElements.set(id, el)
    observe(id, el)
  } else {
    itemObservers.get(id)?.()
    itemObservers.delete(id)
    itemElements.delete(id)
  }
}

onBeforeUnmount(() => {
  for (const stop of itemObservers.values()) stop()
  itemObservers.clear()
  itemElements.clear()
})

// Track the masonry container's offset within the scroll parent so we can
// translate scroll coordinates into masonry-local coordinates without
// rerunning getBoundingClientRect on every visibility recompute.
function useContainerOffset(
  el: ReturnType<typeof ref<HTMLElement | null>>,
  parent: ReturnType<typeof ref<HTMLElement | null>>
) {
  const top = ref(0)
  function recompute() {
    if (!el.value || !parent.value) {
      top.value = 0
      return
    }
    const elRect = el.value.getBoundingClientRect()
    const parentRect = parent.value.getBoundingClientRect()
    top.value = elRect.top - parentRect.top + parent.value.scrollTop
  }
  useResizeObserver(el, recompute)
  useResizeObserver(parent, recompute)
  onMounted(recompute)
  return { top }
}
</script>
