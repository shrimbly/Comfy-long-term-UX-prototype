<!--
  Implements:
    entity:   ../IA_Plan/wiki/entities/project.md
    concept:  ../IA_Plan/wiki/concepts/three-level-permissions.md
    working:  ../IA_Plan/wiki/prototype-log.md — Workspace / Restricted tiers
              (Private collapses into Drafts; Scoped → Restricted)

  Projects index for the current workspace. Filter pills toggle the
  visible tier. Each card carries its tier badge. Restricted projects the
  user wasn't invited to are NOT shown (filtered out upstream in the
  personaStore) — confidentiality contract.
-->
<template>
  <div class="flex flex-col gap-6">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">
        {{ t('prototype.views.projects.title') }}
      </h1>
      <button
        type="button"
        class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary-background px-4 py-2 text-sm font-medium text-button-surface-contrast transition-colors hover:bg-primary-background-hover"
      >
        {{ t('prototype.views.projects.newProject') }}
      </button>
    </header>

    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <button
          v-for="opt in filterOptions"
          :key="opt.value"
          type="button"
          :class="
            cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors',
              filter === opt.value
                ? 'bg-base-foreground text-base-background'
                : 'bg-secondary-background text-base-foreground hover:bg-secondary-background-hover'
            )
          "
          @click="filter = opt.value"
        >
          <span>{{ opt.label }}</span>
          <span
            :class="
              cn(
                'rounded-full px-1.5 text-xs',
                filter === opt.value
                  ? 'bg-base-background text-base-foreground'
                  : 'bg-secondary-background-hover text-muted-foreground'
              )
            "
          >
            {{ opt.count }}
          </span>
        </button>
      </div>

      <div class="flex items-center gap-2">
        <div ref="sortMenuRef" class="relative inline-flex">
          <button
            type="button"
            class="inline-flex h-8 cursor-pointer appearance-none items-center gap-1.5 rounded-md border-0 bg-secondary-background px-3 text-sm text-base-foreground transition-colors hover:bg-secondary-background-hover focus:outline-none"
            :aria-expanded="isSortOpen"
            @click="isSortOpen = !isSortOpen"
          >
            <span>{{ currentSortLabel }}</span>
            <span
              class="icon-[lucide--chevron-down] size-3.5 text-muted-foreground"
            />
          </button>
          <div
            v-if="isSortOpen"
            class="absolute top-full right-0 z-20 mt-1 flex w-48 flex-col gap-0.5 rounded-lg border border-border-default bg-interface-menu-surface p-1 text-sm shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
          >
            <button
              v-for="opt in sortOptions"
              :key="opt.value"
              type="button"
              class="flex w-full cursor-pointer appearance-none items-center justify-between rounded-sm border-0 bg-transparent px-3 py-2 text-left text-base-foreground transition-colors hover:bg-interface-menu-component-surface-hovered focus:bg-interface-menu-component-surface-hovered focus:outline-none"
              @click="onSelectSort(opt.value)"
            >
              <span>{{ opt.label }}</span>
              <span
                v-if="opt.value === sort"
                class="icon-[lucide--check] size-3.5 text-muted-foreground"
              />
            </button>
          </div>
        </div>
        <div
          class="flex items-center gap-1 rounded-md bg-secondary-background p-0.5"
        >
          <button
            type="button"
            :class="
              cn(
                'inline-flex size-7 cursor-pointer appearance-none items-center justify-center rounded-sm border-0 bg-transparent text-base-foreground transition-colors focus:outline-none',
                viewMode === 'grid'
                  ? 'bg-secondary-background-hover'
                  : 'text-muted-foreground hover:text-base-foreground'
              )
            "
            :title="t('prototype.views.projects.viewMode.grid')"
            :aria-pressed="viewMode === 'grid'"
            @click="viewMode = 'grid'"
          >
            <span class="icon-[lucide--layout-grid] size-4" />
          </button>
          <button
            type="button"
            :class="
              cn(
                'inline-flex size-7 cursor-pointer appearance-none items-center justify-center rounded-sm border-0 bg-transparent text-base-foreground transition-colors focus:outline-none',
                viewMode === 'list'
                  ? 'bg-secondary-background-hover'
                  : 'text-muted-foreground hover:text-base-foreground'
              )
            "
            :title="t('prototype.views.projects.viewMode.list')"
            :aria-pressed="viewMode === 'list'"
            @click="viewMode = 'list'"
          >
            <span class="icon-[lucide--list] size-4" />
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="sortedProjects.length && viewMode === 'grid'"
      class="grid grid-cols-3 gap-4"
    >
      <ProjectCard
        v-for="p in sortedProjects"
        :key="p.id"
        :project="p"
        :workflows="workflowsByProject[p.id] ?? []"
        @open="onOpen"
      />
    </div>
    <div v-else-if="sortedProjects.length" class="flex flex-col gap-2">
      <ProjectCard
        v-for="p in sortedProjects"
        :key="p.id"
        layout="list"
        :project="p"
        :workflows="workflowsByProject[p.id] ?? []"
        @open="onOpen"
      />
    </div>
    <p v-else class="text-sm text-muted-foreground">
      {{ t('prototype.views.projects.empty') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { onClickOutside } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import ProjectCard from '../components/ProjectCard.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'

type FilterValue = 'all' | 'workspace-wide' | 'restricted'
type SortValue = 'last-modified' | 'oldest' | 'az' | 'za'
type ViewMode = 'grid' | 'list'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const uiStore = usePrototypeUiStore()
const { visibleProjects, fixture } = storeToRefs(personaStore)

const workflowsByProject = computed(() => {
  const buckets: Record<string, typeof fixture.value.workflows> = {}
  for (const w of fixture.value.workflows) {
    ;(buckets[w.projectId] ??= []).push(w)
  }
  for (const list of Object.values(buckets)) {
    list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
  return buckets
})

const filter = ref<FilterValue>('all')
const sort = ref<SortValue>('last-modified')
const viewMode = ref<ViewMode>('grid')

const sortMenuRef = useTemplateRef<HTMLElement>('sortMenuRef')
const isSortOpen = ref(false)
onClickOutside(sortMenuRef, () => {
  isSortOpen.value = false
})

function onSelectSort(next: SortValue) {
  sort.value = next
  isSortOpen.value = false
}

const workspaceWideCount = computed(
  () => visibleProjects.value.filter((p) => p.tier === 'workspace-wide').length
)
const restrictedCount = computed(
  () => visibleProjects.value.filter((p) => p.tier === 'restricted').length
)

const filterOptions = computed<
  Array<{ value: FilterValue; label: string; count: number }>
>(() => [
  {
    value: 'all',
    label: t('prototype.views.projects.filterAll'),
    count: visibleProjects.value.length
  },
  {
    value: 'workspace-wide',
    label: t('prototype.projectTier.workspace-wide'),
    count: workspaceWideCount.value
  },
  {
    value: 'restricted',
    label: t('prototype.projectTier.restricted'),
    count: restrictedCount.value
  }
])

const sortOptions = computed<Array<{ value: SortValue; label: string }>>(() => [
  {
    value: 'last-modified',
    label: t('prototype.views.projects.sort.lastModified')
  },
  { value: 'oldest', label: t('prototype.views.projects.sort.oldest') },
  { value: 'az', label: t('prototype.views.projects.sort.az') },
  { value: 'za', label: t('prototype.views.projects.sort.za') }
])

const currentSortLabel = computed(
  () =>
    sortOptions.value.find((o) => o.value === sort.value)?.label ??
    sortOptions.value[0].label
)

const filteredProjects = computed(() => {
  if (filter.value === 'all') return visibleProjects.value
  return visibleProjects.value.filter((p) => p.tier === filter.value)
})

function lastModified(projectId: string): string {
  const list = workflowsByProject.value[projectId]
  return list && list.length ? list[0].updatedAt : ''
}

const sortedProjects = computed(() => {
  const list = [...filteredProjects.value]
  switch (sort.value) {
    case 'az':
      return list.sort((a, b) => a.name.localeCompare(b.name))
    case 'za':
      return list.sort((a, b) => b.name.localeCompare(a.name))
    case 'oldest':
      return list.sort((a, b) =>
        lastModified(a.id).localeCompare(lastModified(b.id))
      )
    case 'last-modified':
    default:
      return list.sort((a, b) =>
        lastModified(b.id).localeCompare(lastModified(a.id))
      )
  }
})

function onOpen(projectId: string) {
  uiStore.go({ kind: 'project', projectId })
}
</script>
