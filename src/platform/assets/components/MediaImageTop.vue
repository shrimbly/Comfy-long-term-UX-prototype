<template>
  <div
    ref="containerRef"
    class="relative size-full overflow-hidden rounded-sm bg-modal-card-placeholder-background"
    @dblclick="emit('view')"
  >
    <img
      v-if="shouldLoad && !hasError"
      :src="asset.src"
      :alt="getAssetDisplayName(asset)"
      class="size-full object-contain transition-transform duration-300 group-hover:scale-105 group-data-[selected=true]:scale-105"
      :draggable="false"
      decoding="async"
      @load="handleLoad"
      @error="handleError"
    />
    <div
      v-else-if="hasError"
      class="flex size-full items-center justify-center bg-modal-card-placeholder-background"
    >
      <i class="pi pi-image text-3xl text-muted-foreground" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { computed, ref } from 'vue'

import type { AssetMeta } from '../schemas/mediaAssetSchema'
import { getAssetDisplayName } from '../utils/assetMetadataUtils'

const loadedSrcs = new Set<string>()
const failedSrcs = new Set<string>()

const { asset } = defineProps<{
  asset: AssetMeta
}>()

const emit = defineEmits<{
  'image-loaded': [width: number, height: number]
  view: []
}>()

const containerRef = ref<HTMLElement | null>(null)
const hasError = ref(failedSrcs.has(asset.src))
const hasEnteredView = ref(loadedSrcs.has(asset.src))

useIntersectionObserver(
  containerRef,
  ([entry]) => {
    if (entry?.isIntersecting) hasEnteredView.value = true
  },
  { rootMargin: '800px 0px' }
)

const shouldLoad = computed(() => hasEnteredView.value)

function handleLoad(event: Event) {
  const img = event.target as HTMLImageElement
  if (img.naturalWidth && img.naturalHeight) {
    loadedSrcs.add(asset.src)
    emit('image-loaded', img.naturalWidth, img.naturalHeight)
  }
}

function handleError() {
  failedSrcs.add(asset.src)
  hasError.value = true
}
</script>
