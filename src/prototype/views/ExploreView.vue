<!--
  Implements:
    Dashboard home for every persona — the "community" feed. For now the
    feed is sourced from the same prototype media-asset fixtures that
    drive the Media Assets tab; the plan is to swap in real community
    output data later. Until then, each asset carries
    `user_metadata.creator` (username + avatarColor) so the hover chip
    on MediaAssetCard can attribute the work.

  Reuses platform AssetMasonryGrid + MediaAssetCard so the visual
  matches the Media Assets tab exactly. Title-less; the only chrome is
  a right-aligned media-kind filter (Images / Videos).
-->
<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-4">
      <h1 class="m-0 text-2xl font-semibold">
        {{ t('prototype.views.explore.title') }}
      </h1>
      <div class="flex items-center gap-2">
        <button
          v-for="opt in filterOptions"
          :key="opt.value"
          type="button"
          :class="
            cn(
              'inline-flex cursor-pointer items-center rounded-full px-3 py-1 text-sm transition-colors',
              filter === opt.value
                ? 'bg-base-foreground text-base-background'
                : 'bg-secondary-background text-base-foreground hover:bg-secondary-background-hover'
            )
          "
          @click="filter = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <AssetMasonryGrid
      v-model:selected-ids="selectedIds"
      :assets="filteredAssets"
      :column-width="COLUMN_WIDTH"
    />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AssetMasonryGrid from '@/platform/assets/components/AssetMasonryGrid.vue'
import { getMediaTypeFromFilename } from '@/utils/formatUtil'

import { buildExploreAssets } from '../fixtures/exploreAssets'

type ExploreFilter = 'all' | 'image' | 'video'

const COLUMN_WIDTH = 360

const { t } = useI18n()

// Community-feed fixtures live under public/prototype-fixtures/explore.
// Distinct from buildPrototypeMediaAssets() — that source models a
// workspace's own outputs, this one is the public discover surface.
const assets = computed(() => buildExploreAssets())

const filter = ref<ExploreFilter>('all')
const selectedIds = ref<Set<string>>(new Set())

const filterOptions = computed<Array<{ value: ExploreFilter; label: string }>>(
  () => [
    { value: 'all', label: t('prototype.views.explore.filterAll') },
    { value: 'image', label: t('prototype.views.explore.filterImages') },
    { value: 'video', label: t('prototype.views.explore.filterVideos') }
  ]
)

const filteredAssets = computed(() => {
  if (filter.value === 'all') return assets.value
  return assets.value.filter(
    (a) => getMediaTypeFromFilename(a.name) === filter.value
  )
})
</script>
