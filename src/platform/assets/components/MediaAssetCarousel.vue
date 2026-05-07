<template>
  <div
    ref="rootRef"
    tabindex="-1"
    class="absolute inset-0 grid grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-base-background outline-none select-none"
    @keydown="handleKeyDown"
  >
    <div class="relative min-h-0 overflow-hidden">
      <Button
        variant="secondary"
        size="lg"
        class="absolute top-4 left-4 z-20 gap-1.5 rounded-sm"
        :aria-label="t('g.back')"
        @click="emit('exit')"
      >
        <i class="icon-[lucide--arrow-left] size-4" />
        <span>{{ t('g.back') }}</span>
      </Button>

      <Button
        v-if="onClose"
        variant="secondary"
        size="icon-lg"
        class="absolute top-4 right-4 z-20 rounded-sm"
        :aria-label="t('g.close')"
        @click="onClose"
      >
        <i class="icon-[lucide--x] size-5" />
      </Button>

      <Button
        v-if="hasMultiple"
        variant="secondary"
        size="icon-lg"
        class="absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full"
        :aria-label="t('g.previous')"
        @click="emit('navigate', -1)"
      >
        <i class="icon-[lucide--chevron-left] size-6" />
      </Button>

      <div class="absolute inset-0 flex items-center justify-center p-2">
        <LightboxAssetView
          v-if="activeItem"
          :key="activeItem.url"
          :item="activeItem"
          class="max-h-full max-w-full"
        />
      </div>

      <Button
        v-if="hasMultiple"
        variant="secondary"
        size="icon-lg"
        class="absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full"
        :aria-label="t('g.next')"
        @click="emit('navigate', 1)"
      >
        <i class="icon-[lucide--chevron-right] size-6" />
      </Button>
    </div>

    <div
      v-if="hasMultiple"
      class="flex shrink-0 items-center justify-center gap-1.5 px-4 py-3"
    >
      <button
        v-for="entry in thumbnailWindow"
        :key="entry.asset.id"
        type="button"
        :aria-label="entry.asset.name"
        :aria-pressed="entry.index === activeIndex"
        :class="
          cn(
            'relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border-none bg-modal-card-placeholder-background p-0 transition-all',
            entry.index === activeIndex
              ? 'ring-1 ring-modal-card-border-highlighted ring-offset-1 ring-offset-base-background'
              : 'opacity-60 hover:opacity-100'
          )
        "
        @click="emit('select', entry.index)"
      >
        <img
          v-if="entry.asset.preview_url"
          :src="entry.asset.preview_url"
          :alt="entry.asset.name"
          class="size-full object-cover"
        />
        <span
          v-else
          class="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground"
        >
          {{ fileExt(entry.asset.name) }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import LightboxAssetView from '@/components/sidebar/tabs/queue/LightboxAssetView.vue'
import Button from '@/components/ui/button/Button.vue'
import type { AssetItem } from '@/platform/assets/schemas/assetSchema'
import { assetToResultItem } from '@/platform/assets/utils/assetLightboxAdapter'
import { OnCloseKey } from '@/types/widgetTypes'
import { cn } from '@/utils/tailwindUtil'

const THUMBNAIL_RADIUS = 4

const { assets, activeIndex } = defineProps<{
  assets: readonly AssetItem[]
  activeIndex: number
}>()

const emit = defineEmits<{
  navigate: [direction: number]
  select: [index: number]
  exit: []
}>()

const { t } = useI18n()

const onClose = inject(OnCloseKey, null)

const rootRef = ref<HTMLElement | null>(null)

const hasMultiple = computed(() => assets.length > 1)

const activeItem = computed(() => {
  const asset = assets[activeIndex]
  return asset ? assetToResultItem(asset) : undefined
})

const thumbnailWindow = computed(() => {
  const total = assets.length
  if (total === 0) return []
  const result: { asset: AssetItem; index: number }[] = []
  for (let offset = -THUMBNAIL_RADIUS; offset <= THUMBNAIL_RADIUS; offset++) {
    const index = activeIndex + offset
    if (index < 0 || index >= total) continue
    const asset = assets[index]
    if (asset) result.push({ asset, index })
  }
  return result
})

function fileExt(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '?' : name.slice(dot + 1).toUpperCase()
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    emit('navigate', -1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    emit('navigate', 1)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    emit('exit')
  }
}

onMounted(() => {
  rootRef.value?.focus()
})
</script>
