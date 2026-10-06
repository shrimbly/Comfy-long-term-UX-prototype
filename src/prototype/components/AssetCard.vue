<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/media-file.md
    log:    ../prototype/design-decisions.md (2026-10-07 — media library in
            place)

  One media asset: a square preview, a play badge for video, an icon for
  audio and 3D, a star to favorite, and the file name with its project,
  size and age under it.
-->
<template>
  <article
    class="group flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-secondary-background/40"
  >
    <div
      class="relative aspect-square w-full overflow-hidden bg-base-background"
    >
      <img
        v-if="asset.thumbnail_url"
        :src="asset.thumbnail_url"
        :alt="asset.display_name ?? asset.name"
        class="size-full object-cover outline-1 -outline-offset-1 outline-white/10"
        loading="lazy"
      />
      <div
        v-else
        class="grid size-full place-items-center text-muted-foreground"
      >
        <i :class="cn(KIND_ICONS[kind], 'size-8')" />
      </div>
      <span
        v-if="kind === 'video'"
        class="absolute top-2 left-2 grid size-8 place-items-center rounded-md bg-black/60 text-white"
        aria-hidden="true"
      >
        <i class="icon-[lucide--play] size-4" />
      </span>
      <button
        type="button"
        :aria-pressed="favorite"
        :aria-label="
          favorite
            ? t('prototype.media.unfavorite')
            : t('prototype.media.favorite')
        "
        :class="
          cn(
            'absolute top-2 right-2 grid size-8 cursor-pointer place-items-center rounded-md bg-black/60 text-white transition-opacity active:scale-[0.96]',
            favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )
        "
        @click="emit('toggle-favorite', asset.id)"
      >
        <i
          class="icon-[lucide--star] size-4"
          :style="favorite ? { fill: 'currentColor' } : undefined"
        />
      </button>
    </div>
    <div class="flex flex-col gap-0.5 px-3 py-2.5">
      <span class="truncate text-sm">{{
        asset.display_name ?? asset.name
      }}</span>
      <span class="truncate text-xs text-muted-foreground">{{ meta }}</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { formatTimeAgo } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { AssetItem } from '@/platform/assets/schemas/assetSchema'

import type { MediaKind } from '../fixtures/mediaAssets'
import { formatBytes, mediaKind } from '../utils/mediaAssets'

const { asset, projectName, favorite } = defineProps<{
  asset: AssetItem
  projectName: string
  favorite: boolean
}>()

const emit = defineEmits<{
  'toggle-favorite': [assetId: string]
}>()

const KIND_ICONS: Record<MediaKind, string> = {
  image: 'icon-[lucide--image]',
  video: 'icon-[lucide--play]',
  audio: 'icon-[lucide--music]',
  model3d: 'icon-[lucide--box]'
}

const { t } = useI18n()

const kind = computed(() => mediaKind(asset))

const meta = computed(() =>
  [
    projectName,
    formatBytes(asset.size ?? 0),
    formatTimeAgo(new Date(asset.created_at))
  ].join(' · ')
)
</script>
