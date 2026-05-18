<!--
  Implements:
    Dashboard home for every persona — the "community" feed. For now the
    feed is sourced from the same prototype media-asset fixtures that
    drive the Media Assets tab; the plan is to swap in real community
    output data later. Until then, each asset carries
    `user_metadata.creator` (username + avatarColor) so the hover chip
    on MediaAssetCard can attribute the work.

  Reuses platform AssetMasonryGrid + MediaAssetCard so the visual
  matches the Media Assets tab exactly. The view is sidebar-less and
  filter-less — it's a discovery surface, not a workspace browser.
-->
<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-semibold">
        {{ t('prototype.views.explore.title') }}
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ t('prototype.views.explore.subtitle') }}
      </p>
    </header>

    <AssetMasonryGrid
      v-model:selected-ids="selectedIds"
      :assets="assets"
      :column-width="COLUMN_WIDTH"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AssetMasonryGrid from '@/platform/assets/components/AssetMasonryGrid.vue'

import { buildPrototypeMediaAssets } from '../fixtures/mediaAssets'

const COLUMN_WIDTH = 240

const { t } = useI18n()

// Pass no persona so we get every fixture asset — Explore is meant to
// feel like a community feed, not a workspace-scoped browser.
const assets = computed(() => buildPrototypeMediaAssets())

const selectedIds = ref<Set<string>>(new Set())
</script>
