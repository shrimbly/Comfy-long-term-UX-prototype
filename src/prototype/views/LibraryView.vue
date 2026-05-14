<!--
  Implements:
    working: ../IA_Plan/wiki/prototype-log.md — Library page-takeover; filters
             live in the dedicated LibrarySidebar.
    reference: ComfyUI_frontend/src/platform/assets/components/AssetMasonryGrid.vue

  Parameterized library section body. Search bar sits above the title; the
  collapsible filters (project / tags / folders) live in the LibrarySidebar.
-->
<template>
  <div class="flex flex-col gap-6">
    <div class="max-w-xl">
      <div
        class="flex items-center gap-2 rounded-md bg-secondary-background px-3 py-2 text-base-foreground"
      >
        <span class="icon-[lucide--search] size-4 text-muted-foreground" />
        <input
          :value="searchQuery"
          type="text"
          :placeholder="t('prototype.views.library.searchPlaceholder')"
          class="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          @input="
            uiStore.setSearchQuery(($event.target as HTMLInputElement).value)
          "
        />
        <button
          v-if="searchQuery"
          type="button"
          class="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-base-foreground"
          @click="uiStore.setSearchQuery('')"
        >
          <span class="icon-[lucide--x] size-3.5" />
        </button>
      </div>
    </div>

    <header class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">{{ sectionTitle }}</h1>
        <p class="mt-1 text-sm text-muted-foreground">{{ sectionSubtitle }}</p>
      </div>
      <span class="text-sm text-muted-foreground">
        {{ t('prototype.views.library.count', { n: filteredAssets.length }) }}
      </span>
    </header>

    <div
      v-if="filteredAssets.length"
      class="columns-2 gap-4 md:columns-3 lg:columns-4"
    >
      <LibraryAssetCard
        v-for="asset in filteredAssets"
        :key="asset.id"
        :asset="asset"
        :project="projectFor(asset.projectId)"
      />
    </div>
    <p v-else class="text-sm text-muted-foreground">
      {{ t('prototype.views.library.empty') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import LibraryAssetCard from '../components/LibraryAssetCard.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import type { LibrarySection, Project } from '../types'

const { section } = defineProps<{
  section: LibrarySection
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const uiStore = usePrototypeUiStore()
const { fixture } = storeToRefs(personaStore)
const { projectFilter, tagFilter, folderFilter, storageFilter, searchQuery } =
  storeToRefs(uiStore)

const sectionTitle = computed(() =>
  t(`prototype.views.library.${section}.title`)
)
const sectionSubtitle = computed(() =>
  t(`prototype.views.library.${section}.subtitle`)
)

const projectById = computed(() => {
  const map = new Map<string, Project>()
  for (const p of fixture.value.projects) map.set(p.id, p)
  return map
})

function projectFor(projectId: string): Project | undefined {
  return projectById.value.get(projectId)
}

const filteredAssets = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return fixture.value.libraryAssets.filter((a) => {
    if (a.section !== section) return false
    const project = projectFor(a.projectId)
    if (!project) return false
    if (!(project.tier === 'workspace-wide' || project.currentUserHasAccess)) {
      return false
    }
    if (projectFilter.value !== 'all' && a.projectId !== projectFilter.value) {
      return false
    }
    if (folderFilter.value !== 'all' && a.folder !== folderFilter.value) {
      return false
    }
    if (
      storageFilter.value !== 'all' &&
      (a.storage ?? 'cloud') !== storageFilter.value
    ) {
      return false
    }
    if (tagFilter.value.size > 0) {
      const tags = a.tags ?? []
      const hasAll = [...tagFilter.value].every((t) => tags.includes(t))
      if (!hasAll) return false
    }
    if (q && !a.name.toLowerCase().includes(q)) return false
    return true
  })
})
</script>
