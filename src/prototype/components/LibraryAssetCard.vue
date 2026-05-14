<!--
  Implements:
    Library asset tile, masonry-friendly. Variable aspect ratio per asset
    (deterministic hash) so the masonry layout reads. Title + project +
    tier overlay appears on hover; no visible footer at rest — same shape
    as the ComfyUI_frontend MediaAssetCard's hide-footer mode.
-->
<template>
  <button
    type="button"
    class="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-lg"
    :style="{ background: thumbnail, aspectRatio }"
  >
    <span
      class="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-linear-to-t from-black/80 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
    >
      <span class="truncate text-left text-sm font-medium text-white">
        {{ asset.name }}
      </span>
      <span
        class="flex items-center justify-between gap-2 text-xs text-white/80"
      >
        <span class="truncate">{{ project?.name ?? '—' }}</span>
        <span class="flex shrink-0 items-center gap-1">
          <span
            v-if="asset.storage"
            class="inline-flex items-center gap-1 rounded-sm bg-white/15 px-1.5 py-0.5"
          >
            <i
              :class="
                cn(
                  'size-3',
                  asset.storage === 'local'
                    ? 'icon-[lucide--hard-drive]'
                    : 'icon-[lucide--cloud]'
                )
              "
            />
            {{
              asset.storage === 'local'
                ? t('prototype.assetCard.storageLocal')
                : t('prototype.assetCard.storageCloud')
            }}
          </span>
          <span
            v-if="project"
            :class="
              cn(
                'rounded-sm px-1.5 py-0.5 text-xs',
                project.tier === 'restricted'
                  ? 'bg-warning-background text-button-surface-contrast'
                  : 'bg-white/20 text-white'
              )
            "
          >
            {{ t(`prototype.projectTier.${project.tier}`) }}
          </span>
        </span>
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { thumbnailGradient } from '../utils/thumbnail'
import type { LibraryAsset, Project } from '../types'

const { asset, project } = defineProps<{
  asset: LibraryAsset
  project: Project | undefined
}>()

const { t } = useI18n()

const aspectRatios = ['4 / 5', '1 / 1', '3 / 4', '5 / 4', '16 / 9', '4 / 3']

const aspectRatio = computed(() => {
  let hash = 0
  for (const c of asset.id) hash = (hash * 31 + c.charCodeAt(0)) | 0
  return aspectRatios[Math.abs(hash) % aspectRatios.length]
})

const thumbnail = computed(() => thumbnailGradient(asset.id))
</script>
