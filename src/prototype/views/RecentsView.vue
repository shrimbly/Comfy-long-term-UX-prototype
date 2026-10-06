<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/save-destination-workflow-level.md

    Recents view — the user's recently-opened drafts and My Workflows items.
    Published canonicals (which live in shared projects) are excluded; only
    Drafts-project work is shown. Search by name on the left; chip filter by
    storage (All / Cloud / Local) and sort dropdown on the right. Replaces the
    old All/Mine owner filter, which is meaningless in the copy-on-access MVP
    model where every workflow is the user's. Grid renders WorkflowCard tiles.
-->
<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
    <header>
      <PageTitle>{{ t('prototype.views.recents.title') }}</PageTitle>
    </header>

    <div v-if="myRecentWorkflows.length" class="flex flex-col gap-4">
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
            :placeholder="t('prototype.views.recents.searchPlaceholder')"
            class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>

        <div class="flex items-center gap-2">
          <FilterPill
            v-for="opt in filterOptions"
            :key="opt.value"
            :label="opt.label"
            :active="filter === opt.value"
            @click="filter = opt.value"
          />

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
              class="absolute top-full right-0 z-50 mt-1 flex w-48 flex-col gap-0.5 rounded-lg border border-border-default bg-interface-menu-surface p-1 text-sm shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
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
            class="flex items-center gap-0.5 rounded-lg bg-secondary-background p-0.5"
          >
            <Button
              :variant="viewMode === 'grid' ? 'inverted' : 'muted-textonly'"
              size="unset"
              class="size-7 rounded-md"
              :aria-label="t('prototype.views.recents.view.grid')"
              :aria-pressed="viewMode === 'grid'"
              @click="viewMode = 'grid'"
            >
              <i class="icon-[lucide--layout-grid] size-4" />
            </Button>
            <Button
              :variant="viewMode === 'list' ? 'inverted' : 'muted-textonly'"
              size="unset"
              class="size-7 rounded-md"
              :aria-label="t('prototype.views.recents.view.list')"
              :aria-pressed="viewMode === 'list'"
              @click="viewMode = 'list'"
            >
              <i class="icon-[lucide--list] size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div v-if="sortedWorkflows.length" :class="layoutClass">
        <WorkflowCard
          v-for="wf in sortedWorkflows"
          :key="wf.id"
          :workflow="wf"
          :layout="viewMode"
        />
      </div>
      <p
        v-else
        class="rounded-2xl border border-dashed border-border-subtle p-10 text-center text-sm text-muted-foreground"
      >
        {{ t('prototype.views.recents.filterEmpty') }}
      </p>
    </div>

    <WorkflowsEmptyState
      v-else
      :heading="t('prototype.views.recents.emptyHeading')"
    />
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import FilterPill from '../components/FilterPill.vue'
import PageTitle from '../components/PageTitle.vue'
import WorkflowCard from '../components/WorkflowCard.vue'
import WorkflowsEmptyState from '../components/WorkflowsEmptyState.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'

type FilterValue = 'all' | 'cloud' | 'local'
type SortValue = 'last-modified' | 'oldest' | 'az' | 'za'
type ViewMode = 'grid' | 'list'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { recentWorkflows, draftsProject } = storeToRefs(personaStore)

// Recents surfaces only the viewer's own work — drafts and My Workflows, both
// of which live in the Drafts project. Published canonicals (which live in
// shared projects) are deliberately excluded.
const myRecentWorkflows = computed(() =>
  recentWorkflows.value.filter((w) => w.projectId === draftsProject.value?.id)
)

const searchQuery = ref('')
const filter = ref<FilterValue>('all')
const sort = ref<SortValue>('last-modified')
const viewMode = ref<ViewMode>('grid')

// Grid fills the content area (auto-fill gallery); the single-column list is
// capped so rows don't stretch uncomfortably wide on large screens.
const layoutClass = computed(() =>
  viewMode.value === 'grid'
    ? 'grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-6'
    : 'flex flex-col gap-0.5'
)

const sortMenuRef = useTemplateRef<HTMLElement>('sortMenuRef')
const isSortOpen = ref(false)
onClickOutside(sortMenuRef, () => {
  isSortOpen.value = false
})

function onSelectSort(next: SortValue) {
  sort.value = next
  isSortOpen.value = false
}

const filterOptions = computed<Array<{ value: FilterValue; label: string }>>(
  () => [
    { value: 'all', label: t('prototype.views.recents.filterAll') },
    { value: 'cloud', label: t('prototype.views.recents.filterCloud') },
    { value: 'local', label: t('prototype.views.recents.filterLocal') }
  ]
)

const sortOptions = computed<Array<{ value: SortValue; label: string }>>(() => [
  {
    value: 'last-modified',
    label: t('prototype.views.recents.sort.lastModified')
  },
  { value: 'oldest', label: t('prototype.views.recents.sort.oldest') },
  { value: 'az', label: t('prototype.views.recents.sort.az') },
  { value: 'za', label: t('prototype.views.recents.sort.za') }
])

const currentSortLabel = computed(
  () =>
    sortOptions.value.find((o) => o.value === sort.value)?.label ??
    sortOptions.value[0].label
)

const filteredWorkflows = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return myRecentWorkflows.value.filter((w) => {
    if (q && !w.name.toLowerCase().includes(q)) return false
    if (filter.value !== 'all' && w.storage !== filter.value) return false
    return true
  })
})

const sortedWorkflows = computed(() => {
  const list = [...filteredWorkflows.value]
  switch (sort.value) {
    case 'az':
      return list.sort((a, b) => a.name.localeCompare(b.name))
    case 'za':
      return list.sort((a, b) => b.name.localeCompare(a.name))
    case 'oldest':
      return list.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
    case 'last-modified':
    default:
      return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
})
</script>
