<!--
  Implements:
    reference: ../../../../ComfyUI_frontend/src/platform/assets/components/MediaAssetsView.vue
               (dedicated-page sidebar takeover pattern)

  Library-mode sidebar. Filters: Project (collapsible, open by default) ·
  Tags (collapsible, closed by default, multi-select toggles) · Folders
  (collapsible, closed by default). Clicking the active project / folder
  again deselects (no explicit "All" row).
-->
<template>
  <aside
    class="flex h-full w-64 shrink-0 flex-col gap-3 border-r border-border-subtle bg-secondary-background p-3 text-base-foreground"
  >
    <button
      type="button"
      class="flex cursor-pointer items-center gap-2 self-start rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-interface-menu-component-surface-hovered hover:text-base-foreground"
      @click="uiStore.goHome"
    >
      <span class="icon-[lucide--arrow-left] size-3.5" />
      {{ t('prototype.libraryPage.back') }}
    </button>

    <header
      class="flex items-center gap-2 rounded-md bg-modal-card-background p-2"
    >
      <span
        class="grid size-8 shrink-0 place-items-center rounded-md bg-secondary-background"
      >
        <span :class="cn('size-4 text-base-foreground', sectionIcon)" />
      </span>
      <span class="flex flex-col">
        <span class="text-sm font-medium">{{ sectionTitle }}</span>
        <span class="text-xs text-muted-foreground">
          {{ t('prototype.views.library.count', { n: totalCount }) }}
        </span>
      </span>
    </header>

    <nav class="flex flex-1 flex-col gap-5 overflow-y-auto">
      <CollapsibleSection
        :label="t('prototype.libraryPage.projectHeading')"
        :count="projectsWithItems.length || null"
        :default-open="true"
      >
        <SidebarItem
          v-for="p in projectsWithItems"
          :key="p.id"
          :label="p.name"
          icon="icon-[lucide--folder]"
          :count="countForProject(p.id)"
          :active="projectFilter === p.id"
          @click="uiStore.selectProject(p.id)"
        />
      </CollapsibleSection>

      <CollapsibleSection
        :label="t('prototype.libraryPage.tagsHeading')"
        :count="availableTags.length || null"
        :default-open="false"
      >
        <p
          v-if="!availableTags.length"
          class="px-2 text-xs text-muted-foreground italic"
        >
          {{ t('prototype.libraryPage.tagsEmpty') }}
        </p>
        <SidebarItem
          v-for="tag in availableTags"
          :key="tag"
          :label="`#${tag}`"
          icon="icon-[lucide--tag]"
          :count="countForTag(tag)"
          :active="tagFilter.has(tag)"
          @click="uiStore.toggleTagFilter(tag)"
        />
      </CollapsibleSection>

      <CollapsibleSection
        :label="t('prototype.libraryPage.foldersHeading')"
        :count="availableFolders.length || null"
        :default-open="false"
      >
        <SidebarItem
          v-for="folder in availableFolders"
          :key="folder"
          :label="folder"
          icon="icon-[lucide--folder-open]"
          :count="countForFolder(folder)"
          :active="folderFilter === folder"
          @click="uiStore.selectFolder(folder)"
        />
      </CollapsibleSection>

      <CollapsibleSection
        v-if="section === 'media'"
        :label="t('prototype.libraryPage.storageHeading')"
        :count="null"
        :default-open="false"
      >
        <SidebarItem
          :label="t('prototype.libraryPage.storageLocal')"
          icon="icon-[lucide--hard-drive]"
          :count="countForStorage('local')"
          :active="storageFilter === 'local'"
          @click="
            uiStore.setStorageFilter(
              storageFilter === 'local' ? 'all' : 'local'
            )
          "
        />
        <SidebarItem
          :label="t('prototype.libraryPage.storageCloud')"
          icon="icon-[lucide--cloud]"
          :count="countForStorage('cloud')"
          :active="storageFilter === 'cloud'"
          @click="
            uiStore.setStorageFilter(
              storageFilter === 'cloud' ? 'all' : 'cloud'
            )
          "
        />
      </CollapsibleSection>
    </nav>

    <div class="flex flex-col gap-2">
      <SidebarItem
        :label="t('prototype.sidebar.help')"
        icon="icon-[lucide--help-circle]"
      />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import CollapsibleSection from './sidebar/CollapsibleSection.vue'
import SidebarItem from './sidebar/SidebarItem.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import type { AssetStorage, LibrarySection } from '../types'

const { section } = defineProps<{
  section: LibrarySection
}>()

const { t } = useI18n()
const uiStore = usePrototypeUiStore()
const personaStore = usePrototypePersonaStore()
const { projectFilter, tagFilter, folderFilter, storageFilter } =
  storeToRefs(uiStore)
const { visibleProjects, fixture } = storeToRefs(personaStore)

const sectionIconMap: Record<LibrarySection, string> = {
  media: 'icon-[lucide--image]',
  models: 'icon-[lucide--box]',
  nodes: 'icon-[lucide--blocks]',
  prompts: 'icon-[lucide--text]'
}

const sectionIcon = computed(() => sectionIconMap[section])
const sectionTitle = computed(() =>
  t(`prototype.views.library.${section}.title`)
)

const projectById = computed(() => {
  const map = new Map<string, (typeof fixture.value.projects)[number]>()
  for (const p of fixture.value.projects) map.set(p.id, p)
  return map
})

const sectionAssets = computed(() =>
  fixture.value.libraryAssets.filter((a) => {
    if (a.section !== section) return false
    const project = a.projectId ? projectById.value.get(a.projectId) : undefined
    return (
      project !== undefined &&
      (project.tier === 'workspace-wide' || project.currentUserHasAccess)
    )
  })
)

const totalCount = computed(() => sectionAssets.value.length)

const projectsWithItems = computed(() => {
  const ids = new Set(sectionAssets.value.map((a) => a.projectId))
  return visibleProjects.value.filter((p) => ids.has(p.id))
})

const availableTags = computed(() => {
  const set = new Set<string>()
  for (const a of sectionAssets.value) {
    for (const tag of a.tags ?? []) set.add(tag)
  }
  return [...set].sort()
})

const availableFolders = computed(() => {
  const set = new Set<string>()
  for (const a of sectionAssets.value) {
    if (a.folder) set.add(a.folder)
  }
  return [...set].sort()
})

function countForProject(projectId: string) {
  return sectionAssets.value.filter((a) => a.projectId === projectId).length
}
function countForTag(tag: string) {
  return sectionAssets.value.filter((a) => (a.tags ?? []).includes(tag)).length
}
function countForFolder(folder: string) {
  return sectionAssets.value.filter((a) => a.folder === folder).length
}
function countForStorage(value: AssetStorage) {
  return sectionAssets.value.filter((a) => (a.storage ?? 'cloud') === value)
    .length
}
</script>
