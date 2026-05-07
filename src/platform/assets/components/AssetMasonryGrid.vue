<template>
  <div ref="containerRef" class="relative w-full" @pointerdown="onPointerDown">
    <div
      v-for="asset in visibleAssets"
      :key="asset.id"
      data-asset-card
      class="absolute will-change-transform"
      :style="positionStyle(asset.id)"
    >
      <MediaAssetCard
        natural-aspect
        hide-footer
        :asset="asset"
        :selected="isSelected(asset.id)"
        :selected-ids="selectedIds"
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
    <div
      v-if="isDragging && marqueeRect"
      class="pointer-events-none absolute z-50 rounded-sm border border-modal-card-border-highlighted bg-modal-card-border-highlighted/20"
      :style="{
        left: `${marqueeRect.left}px`,
        top: `${marqueeRect.top}px`,
        width: `${marqueeRect.width}px`,
        height: `${marqueeRect.height}px`
      }"
    />
  </div>
</template>

<script setup lang="ts">
import {
  useElementSize,
  useIntersectionObserver,
  useKeyModifier,
  useResizeObserver,
  useScroll
} from '@vueuse/core'
import { computed, nextTick, onMounted, ref, watch, watchEffect } from 'vue'
import type { CSSProperties } from 'vue'

import { useClickDragGuard } from '@/composables/useClickDragGuard'
import MediaAssetCard from '@/platform/assets/components/MediaAssetCard.vue'
import { useAssetDimensionsCache } from '@/platform/assets/composables/useAssetDimensionsCache'
import { useMasonryLayout } from '@/platform/assets/composables/useMasonryLayout'
import type { AssetItem } from '@/platform/assets/schemas/assetSchema'

const {
  assets,
  columnWidth,
  gap = 12,
  selectedIds
} = defineProps<{
  assets: readonly AssetItem[]
  columnWidth: number
  gap?: number
  selectedIds: ReadonlySet<string>
}>()

const emit = defineEmits<{
  'select-asset': [asset: AssetItem]
  'preview-asset': [asset: AssetItem]
  'context-menu': [event: MouseEvent, asset: AssetItem]
  'approach-end': []
  'update:selectedIds': [ids: Set<string>]
}>()

function isSelected(id: string): boolean {
  return selectedIds.has(id)
}

// Cards in the masonry hide their info footer and outer padding (title shows
// as a hover overlay over the image instead), so the card height equals the
// preview height exactly.
const CARD_FOOTER_HEIGHT = 0

const containerRef = ref<HTMLElement | null>(null)
const sentinelRef = ref<HTMLElement | null>(null)
const dimensions = useAssetDimensionsCache()

const itemIds = computed(() => assets.map((a) => a.id))
const columnWidthRef = computed(() => columnWidth)
const gapRef = computed(() => gap)

const { positions, containerHeight, actualColumnWidth, reportItemHeight } =
  useMasonryLayout({
    containerRef,
    itemIds,
    columnWidth: columnWidthRef,
    gap: gapRef
  })

// Drive item heights from the dimensions cache rather than from per-card
// ResizeObservers. This collapses the two competing height sources (cache vs.
// measured DOM) into one and removes the feedback loop that made the layout
// shuffle on scroll-up: each remount used to re-fire the observer with the
// placeholder height, then again with the post-decode height, cascading
// through every item below.
watchEffect(() => {
  const colW = actualColumnWidth.value
  if (colW <= 0) return
  for (const asset of assets) {
    const dims = dimensions.getDimensions(asset.id)
    if (!dims) continue
    const previewHeight = colW * (dims.height / dims.width)
    reportItemHeight(asset.id, previewHeight + CARD_FOOTER_HEIGHT)
  }
})

const APPROACH_END_OFFSET = 600

const sentinelTop = computed(() =>
  Math.max(0, containerHeight.value - APPROACH_END_OFFSET)
)

useIntersectionObserver(sentinelRef, ([entry]) => {
  if (entry?.isIntersecting) emit('approach-end')
})

// Virtualization: only render cards in the viewport ± buffer so we don't
// pay the cost of mounting hundreds of MediaAssetCards (and firing hundreds
// of image requests) on first paint.

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

// Track the topmost visible item so we can keep it in view when the
// layout reflows (sidebar / details panel toggling, window resize, card
// size slider). Updated on scroll; consumed when actualColumnWidth changes.
const scrollAnchor = ref<{ id: string; offsetInViewport: number } | null>(null)

watch(scrollY, () => {
  if (!scrollParent.value) return
  const visibleTop = scrollY.value - containerTopInDoc.value
  let bestId: string | null = null
  let bestOffset = Infinity
  for (const asset of assets) {
    const pos = positions.value.get(asset.id)
    if (!pos) continue
    const offset = pos.top - visibleTop
    if (offset >= 0 && offset < bestOffset) {
      bestOffset = offset
      bestId = asset.id
    }
  }
  scrollAnchor.value = bestId
    ? { id: bestId, offsetInViewport: bestOffset }
    : null
})

watch(actualColumnWidth, async (newW, oldW) => {
  if (newW <= 0 || oldW <= 0 || newW === oldW) return
  const anchor = scrollAnchor.value
  if (!anchor || !scrollParent.value) return
  await nextTick()
  const newPos = positions.value.get(anchor.id)
  if (!newPos) return
  const target = containerTopInDoc.value + newPos.top - anchor.offsetInViewport
  scrollParent.value.scrollTop = Math.max(0, target)
})

const visibleRange = computed(() => {
  const vpHeight = viewportHeight.value || FALLBACK_VISIBLE_HEIGHT
  const top = scrollY.value - containerTopInDoc.value - VIEWPORT_BUFFER_PX
  const bottom =
    scrollY.value - containerTopInDoc.value + vpHeight + VIEWPORT_BUFFER_PX
  return { top, bottom }
})

const visibleAssets = computed(() => {
  const { top, bottom } = visibleRange.value
  const out: AssetItem[] = []
  const fallbackHeight = columnWidth + CARD_FOOTER_HEIGHT
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

const itemHeights = computed(() => {
  const map = new Map<string, number>()
  const colW = actualColumnWidth.value
  if (colW <= 0) return map
  const fallback = colW
  for (const asset of assets) {
    const dims = dimensions.getDimensions(asset.id)
    map.set(
      asset.id,
      dims && dims.width > 0
        ? colW * (dims.height / dims.width) + CARD_FOOTER_HEIGHT
        : fallback
    )
  }
  return map
})

const shiftKey = useKeyModifier('Shift')
const ctrlKey = useKeyModifier('Control')
const metaKey = useKeyModifier('Meta')

const isDragging = ref(false)
const marqueeRect = ref<{
  left: number
  top: number
  width: number
  height: number
} | null>(null)

const dragGuard = useClickDragGuard(5)
let dragStartContainerX = 0
let dragStartContainerY = 0
let dragStartScrollTop = 0
let preDragSelection = new Set<string>()
let suppressNextClick = false

function isOnCard(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return !!target.closest('[data-asset-card]')
}

function clientToContainer(
  e: { clientX: number; clientY: number },
  scrollDelta: number
): { x: number; y: number } {
  const containerRect = containerRef.value?.getBoundingClientRect()
  if (!containerRect) return { x: 0, y: 0 }
  return {
    x: e.clientX - containerRect.left,
    y: e.clientY - containerRect.top + scrollDelta
  }
}

function computeHitIds(rect: {
  left: number
  top: number
  right: number
  bottom: number
}): Set<string> {
  const hits = new Set<string>()
  const heights = itemHeights.value
  for (const asset of assets) {
    const pos = positions.value.get(asset.id)
    if (!pos) continue
    const itemHeight = heights.get(asset.id) ?? pos.width
    const itemRight = pos.left + pos.width
    const itemBottom = pos.top + itemHeight
    if (
      rect.left < itemRight &&
      rect.right > pos.left &&
      rect.top < itemBottom &&
      rect.bottom > pos.top
    ) {
      hits.add(asset.id)
    }
  }
  return hits
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  if (isOnCard(e.target)) return

  dragStartScrollTop = scrollParent.value?.scrollTop ?? 0
  const start = clientToContainer(e, 0)
  dragStartContainerX = start.x
  dragStartContainerY = start.y

  dragGuard.recordStart(e)
  preDragSelection = new Set(selectedIds)

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (!dragGuard.wasDragged(e)) return
  isDragging.value = true

  const scrollDelta = (scrollParent.value?.scrollTop ?? 0) - dragStartScrollTop
  const current = clientToContainer(e, scrollDelta)

  const left = Math.min(dragStartContainerX, current.x)
  const right = Math.max(dragStartContainerX, current.x)
  const top = Math.min(dragStartContainerY, current.y)
  const bottom = Math.max(dragStartContainerY, current.y)

  marqueeRect.value = {
    left,
    top,
    width: right - left,
    height: bottom - top
  }

  const hits = computeHitIds({ left, top, right, bottom })
  const isCmdCtrl = ctrlKey.value || metaKey.value

  if (isCmdCtrl) {
    const next = new Set<string>()
    for (const id of preDragSelection) {
      if (!hits.has(id)) next.add(id)
    }
    for (const id of hits) {
      if (!preDragSelection.has(id)) next.add(id)
    }
    emit('update:selectedIds', next)
  } else if (shiftKey.value) {
    const next = new Set(preDragSelection)
    for (const id of hits) next.add(id)
    emit('update:selectedIds', next)
  } else {
    emit('update:selectedIds', new Set(hits))
  }
}

function onPointerUp(e: PointerEvent) {
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)

  const wasDrag = isDragging.value
  isDragging.value = false
  marqueeRect.value = null
  dragGuard.reset()

  if (wasDrag) {
    suppressNextClick = true
    return
  }

  // Plain click on empty space → clear selection.
  if (!isOnCard(e.target)) {
    emit('update:selectedIds', new Set())
  }
}

function onContainerClickCapture(e: MouseEvent) {
  if (suppressNextClick) {
    e.stopPropagation()
    suppressNextClick = false
  }
}

onMounted(() => {
  containerRef.value?.addEventListener('click', onContainerClickCapture, true)
})
</script>
