<template>
  <div ref="containerRef" class="relative w-full">
    <div
      v-for="asset in assets"
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
  </div>
</template>

<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
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
}>()

const containerRef = ref<HTMLElement | null>(null)
const itemElements = new Map<string, HTMLElement>()
const itemObservers = new Map<string, () => void>()

const itemIds = computed(() => assets.map((a) => a.id))
const columnWidthRef = computed(() => columnWidth)
const gapRef = computed(() => gap)

const { positions, containerHeight, reportItemHeight, releaseItem } =
  useMasonryLayout({
    containerRef,
    itemIds,
    columnWidth: columnWidthRef,
    gap: gapRef
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

watch(itemIds, (next, prev) => {
  if (!prev) return
  const present = new Set(next)
  for (const id of prev) {
    if (!present.has(id)) {
      itemObservers.get(id)?.()
      itemObservers.delete(id)
      itemElements.delete(id)
      releaseItem(id)
    }
  }
})

onBeforeUnmount(() => {
  for (const stop of itemObservers.values()) stop()
  itemObservers.clear()
  itemElements.clear()
})
</script>
