<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/media-file.md
    entity: ../IA_Plan/wiki/entities/output.md — outputs belong to the
            project of their workflow
    log:    ../prototype/design-decisions.md (2026-10-07 — media library in
            place, filters in one row)

  The workspace's media, in the dashboard like every other view. One row
  of filters: modality tabs with counts, a project dropdown and a
  Favorites toggle. Cards carry the file name, project, size and age.
-->
<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
    <PageTitle>{{ t('prototype.media.title') }}</PageTitle>

    <div class="flex flex-wrap items-center gap-3">
      <div
        role="tablist"
        class="flex items-center gap-0.5 rounded-lg border border-border-subtle p-0.5"
      >
        <button
          v-for="tab in modalityTabs"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="modality === tab.id"
          :class="
            cn(
              'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm transition-colors active:scale-[0.96]',
              modality === tab.id
                ? 'bg-secondary-background-hover text-base-foreground'
                : 'text-muted-foreground hover:text-base-foreground'
            )
          "
          @click="modality = tab.id"
        >
          <i :class="cn(tab.icon, 'size-4')" />
          {{ tab.label }}
          <span class="text-xs tabular-nums opacity-70">{{ tab.count }}</span>
        </button>
      </div>

      <ToolbarSelect
        v-model="uiStore.projectFilter"
        :options="projectOptions"
        :aria-label="t('prototype.media.project')"
      />

      <button
        type="button"
        :aria-pressed="favoritesOnly"
        :class="
          cn(
            'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm transition-colors active:scale-[0.96]',
            favoritesOnly
              ? 'bg-secondary-background-hover text-base-foreground'
              : 'bg-secondary-background text-base-foreground hover:bg-secondary-background-hover'
          )
        "
        @click="favoritesOnly = !favoritesOnly"
      >
        <i
          class="icon-[lucide--star] size-4"
          :style="favoritesOnly ? { fill: 'currentColor' } : undefined"
        />
        {{ t('prototype.media.favorites') }}
      </button>

      <span class="ml-auto text-xs text-muted-foreground tabular-nums">
        {{ t('prototype.media.count', visible.length) }}
      </span>
    </div>

    <div
      v-if="visible.length"
      class="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4"
    >
      <AssetCard
        v-for="asset in visible"
        :key="asset.id"
        :asset
        :project-name="projectNameOf(asset)"
        :favorite="favorites.isFavorite(asset.id)"
        @toggle-favorite="favorites.toggle"
      />
    </div>
    <p
      v-else
      class="rounded-xl border border-dashed border-border-subtle p-10 text-center text-sm text-muted-foreground"
    >
      {{ t('prototype.media.empty') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { AssetItem } from '@/platform/assets/schemas/assetSchema'

import AssetCard from '../components/AssetCard.vue'
import PageTitle from '../components/PageTitle.vue'
import ToolbarSelect from '../components/ToolbarSelect.vue'
import { buildPrototypeMediaAssets } from '../fixtures/mediaAssets'
import type { MediaKind } from '../fixtures/mediaAssets'
import { usePrototypeAssetFavoritesStore } from '../stores/assetFavoritesStore'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import { MEDIA_KINDS, mediaKind, projectIdOf } from '../utils/mediaAssets'

type Modality = 'all' | MediaKind

const KIND_ICONS: Record<Modality, string> = {
  all: 'icon-[lucide--layout-grid]',
  image: 'icon-[lucide--image]',
  video: 'icon-[lucide--play]',
  model3d: 'icon-[lucide--box]',
  audio: 'icon-[lucide--music]'
}

const { t } = useI18n()
const uiStore = usePrototypeUiStore()
const favorites = usePrototypeAssetFavoritesStore()
const personaStore = usePrototypePersonaStore()
const { fixture, currentPersonaId } = storeToRefs(personaStore)

const modality = ref<Modality>('all')
const favoritesOnly = ref(false)

const all = computed(() =>
  buildPrototypeMediaAssets(currentPersonaId.value)
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
)

const byProject = computed(() =>
  uiStore.projectFilter === 'all'
    ? all.value
    : all.value.filter((a) => projectIdOf(a) === uiStore.projectFilter)
)

const byFavorite = computed(() =>
  favoritesOnly.value
    ? byProject.value.filter((a) => favorites.isFavorite(a.id))
    : byProject.value
)

const visible = computed(() =>
  modality.value === 'all'
    ? byFavorite.value
    : byFavorite.value.filter((a) => mediaKind(a) === modality.value)
)

// Counts follow the project and favorites filters, so the tabs say what
// each modality would show.
const modalityTabs = computed(() =>
  (['all', ...MEDIA_KINDS] as Modality[]).map((id) => ({
    id,
    icon: KIND_ICONS[id],
    label: t(`prototype.media.modality.${id}`),
    count:
      id === 'all'
        ? byFavorite.value.length
        : byFavorite.value.filter((a) => mediaKind(a) === id).length
  }))
)

const projectOptions = computed(() => [
  { value: 'all', label: t('prototype.media.allProjects') },
  ...fixture.value.projects
    .filter((p) => all.value.some((a) => projectIdOf(a) === p.id))
    .map((p) => ({ value: p.id, label: p.name }))
])

function projectNameOf(asset: AssetItem) {
  const id = projectIdOf(asset)
  return (
    fixture.value.projects.find((p) => p.id === id)?.name ??
    t('prototype.media.noProject')
  )
}
</script>
