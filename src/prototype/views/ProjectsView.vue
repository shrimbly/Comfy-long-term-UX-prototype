<!--
  Implements:
    entity:   ../IA_Plan/wiki/entities/project.md
    concept:  ../IA_Plan/wiki/concepts/three-level-permissions.md
    working:  ../IA_Plan/wiki/prototype-log.md — Workspace / Restricted tiers
              (Private collapses into Drafts; Scoped → Restricted)

  Projects index for the current workspace. Search by name + sort, with a
  grid/list toggle. Each card carries its access badge. Restricted projects
  the user wasn't invited to are NOT shown (filtered out upstream in the
  personaStore) — confidentiality contract.
-->
<template>
  <div class="flex flex-col gap-6">
    <header class="flex items-center justify-between">
      <PageTitle>{{ t('prototype.views.projects.title') }}</PageTitle>
      <button
        type="button"
        class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary-background px-4 py-2 text-sm font-medium text-button-surface-contrast transition-colors hover:bg-primary-background-hover"
        @click="showNewProject = true"
      >
        <span class="icon-[lucide--plus] size-4" />
        {{ t('prototype.views.projects.newProject') }}
      </button>
    </header>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <label
        class="flex h-8 max-w-xs min-w-48 flex-1 items-center gap-2 rounded-lg bg-secondary-background px-2.5 text-base-foreground"
      >
        <i
          class="icon-[lucide--search] size-4 shrink-0 text-muted-foreground"
        />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('prototype.views.projects.searchPlaceholder')"
          class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div class="flex items-center gap-2">
        <ToolbarSelect
          v-model="sort"
          :options="sortOptions"
          :aria-label="t('prototype.views.projects.sortLabel')"
        />
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
      class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-6"
    >
      <ProjectCard
        v-for="p in sortedProjects"
        :key="p.id"
        :project="p"
        :workflows="workflowsByProject[p.id] ?? []"
        @open="onOpen"
      />
    </div>
    <div
      v-else-if="sortedProjects.length"
      class="grid max-w-5xl grid-cols-[repeat(auto-fill,minmax(14rem,18rem))] gap-4"
    >
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
      {{
        searchQuery
          ? t('prototype.views.projects.searchEmpty')
          : t('prototype.views.projects.empty')
      }}
    </p>

    <NewProjectDialog
      v-if="showNewProject"
      @close="showNewProject = false"
      @created="onCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import NewProjectDialog from '../components/NewProjectDialog.vue'
import PageTitle from '../components/PageTitle.vue'
import ProjectCard from '../components/ProjectCard.vue'
import ToolbarSelect from '../components/ToolbarSelect.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'

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

const searchQuery = ref('')
const sort = ref<SortValue>('last-modified')
const viewMode = ref<ViewMode>('grid')
const showNewProject = ref(false)

const searchedProjects = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return visibleProjects.value
  return visibleProjects.value.filter((p) => p.name.toLowerCase().includes(q))
})

const sortOptions = computed<Array<{ value: SortValue; label: string }>>(() => [
  {
    value: 'last-modified',
    label: t('prototype.views.projects.sort.lastModified')
  },
  { value: 'oldest', label: t('prototype.views.projects.sort.oldest') },
  { value: 'az', label: t('prototype.views.projects.sort.az') },
  { value: 'za', label: t('prototype.views.projects.sort.za') }
])

function lastModified(projectId: string): string {
  const list = workflowsByProject.value[projectId]
  return list && list.length ? list[0].updatedAt : ''
}

const sortedProjects = computed(() => {
  const list = [...searchedProjects.value]
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

function onCreated(projectId: string) {
  showNewProject.value = false
  uiStore.go({ kind: 'project', projectId })
}
</script>
