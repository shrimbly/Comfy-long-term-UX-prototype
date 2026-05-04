<template>
  <button
    type="button"
    :class="
      cn(
        'flex shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent transition-[background-color,filter,padding,opacity,transform] duration-150 ease-out hover:scale-110',
        pill
          ? 'bg-white p-1 text-gray-600 shadow-sm hover:bg-white/90'
          : 'p-0 drop-shadow-none',
        visible
          ? 'scale-100 opacity-100'
          : 'pointer-events-none scale-95 opacity-0'
      )
    "
    :aria-label="
      $t(
        active ? 'mediaAsset.actions.unfavorite' : 'mediaAsset.actions.favorite'
      )
    "
    :aria-pressed="active"
    :tabindex="visible ? 0 : -1"
    :aria-hidden="!visible || undefined"
    @click.stop="handleToggle"
  >
    <i
      :class="
        cn(
          'text-citrine-400 transition-[width,height,filter] duration-200 ease-out',
          pill ? 'size-4' : 'size-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
          active ? 'icon-[ph--star-fill]' : 'icon-[ph--star]'
        )
      "
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '@/utils/tailwindUtil'

import { useAssetFavorites } from '../composables/useAssetFavorites'
import type { AssetItem } from '../schemas/assetSchema'

const {
  asset,
  pill = true,
  visible = true
} = defineProps<{
  asset: AssetItem
  pill?: boolean
  visible?: boolean
}>()

const favorites = useAssetFavorites()

const active = computed(() => favorites.isFavorited(asset))

async function handleToggle() {
  await favorites.toggleFavorite(asset)
}
</script>
