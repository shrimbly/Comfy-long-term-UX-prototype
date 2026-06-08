<!--
  Implements:
    Recents view — workflows from every accessible project (visible
    projects + Drafts) plus asset-level-shared workflows that don't
    belong to any project the viewer can reach.

    Filter + sort affordances mirror the Projects index (filter pills
    with counts; sort dropdown). Skipped the grid/list view-mode toggle
    in this pass — the WorkflowCard currently only renders as a tile.
-->
<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-semibold">
        {{ t('prototype.views.recents.title') }}
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ t('prototype.views.recents.subtitle') }}
      </p>
    </header>

    <div v-if="recentWorkflows.length" class="flex flex-col gap-4">
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
      </div>

      <div
        v-if="sortedWorkflows.length"
        class="grid grid-cols-[repeat(auto-fill,minmax(10rem,14rem))] gap-4"
      >
        <WorkflowCard
          v-for="wf in sortedWorkflows"
          :key="wf.id"
          :workflow="wf"
        />
      </div>
      <p
        v-else
        class="rounded-2xl border border-dashed border-border-subtle p-10 text-center text-sm text-muted-foreground"
      >
        {{ t('prototype.views.recents.filterEmpty') }}
      </p>
    </div>

    <template v-else>
      <section
        class="flex flex-col items-center gap-6 rounded-2xl border border-border-subtle bg-secondary-background px-8 py-10 text-center"
      >
        <div class="flex flex-col gap-1">
          <h2 class="text-lg/tight font-semibold">
            {{ t('prototype.views.recents.emptyHeading') }}
          </h2>
          <p class="text-sm text-muted-foreground">
            {{ t('prototype.views.recents.emptySubtitle') }}
          </p>
        </div>
        <button
          type="button"
          class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary-background px-5 text-sm font-medium text-button-surface-contrast transition-colors hover:bg-primary-background-hover"
        >
          {{ t('prototype.views.recents.createWorkflow') }}
        </button>
      </section>

      <section v-if="templates.length" class="flex flex-col gap-4">
        <header class="flex items-baseline justify-between">
          <h2
            class="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {{ t('prototype.views.recents.templatesHeading') }}
          </h2>
        </header>
        <div
          class="grid grid-cols-[repeat(auto-fill,minmax(10rem,14rem))] gap-4"
        >
          <TemplateCard
            v-for="tpl in starterTemplates"
            :key="tpl.id"
            :template="tpl"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { onClickOutside } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import TemplateCard from '../components/TemplateCard.vue'
import WorkflowCard from '../components/WorkflowCard.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { Workflow } from '../types'

type FilterValue = 'all' | 'mine' | 'shared'
type SortValue = 'last-modified' | 'oldest' | 'az' | 'za'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { recentWorkflows, sharedWorkflows, draftsProject, fixture } =
  storeToRefs(personaStore)

const filter = ref<FilterValue>('all')
const sort = ref<SortValue>('last-modified')

const sortMenuRef = useTemplateRef<HTMLElement>('sortMenuRef')
const isSortOpen = ref(false)
onClickOutside(sortMenuRef, () => {
  isSortOpen.value = false
})

function onSelectSort(next: SortValue) {
  sort.value = next
  isSortOpen.value = false
}

const sharedIds = computed(
  () => new Set(sharedWorkflows.value.map((w) => w.id))
)

const mineWorkflows = computed(() => {
  const viewerId = fixture.value.currentUser.id
  return recentWorkflows.value.filter(
    (w) => w.projectId === draftsProject.value?.id || w.ownerUserId === viewerId
  )
})

const filterOptions = computed<
  Array<{ value: FilterValue; label: string; count: number }>
>(() => [
  {
    value: 'all',
    label: t('prototype.views.recents.filterAll'),
    count: recentWorkflows.value.length
  },
  {
    value: 'mine',
    label: t('prototype.views.recents.filterMine'),
    count: mineWorkflows.value.length
  },
  {
    value: 'shared',
    label: t('prototype.views.recents.filterShared'),
    count: sharedWorkflows.value.length
  }
])

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

const filteredWorkflows = computed<Workflow[]>(() => {
  if (filter.value === 'mine') return mineWorkflows.value
  if (filter.value === 'shared') {
    return recentWorkflows.value.filter((w) => sharedIds.value.has(w.id))
  }
  return recentWorkflows.value
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

const templates = computed(() => fixture.value.templates)
const starterTemplates = computed(() => templates.value.slice(0, 4))
</script>
