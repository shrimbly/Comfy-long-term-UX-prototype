<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/drafts-as-default-private-project.md

  Drafts is the default save target. Shows the workflows in the viewer's
  own Drafts / My-Workflows project. "+ New workflow" saves into it.

  The listing can get long, so it has a toolbar: search by name, filter
  by storage, sort, and a grid/list view toggle. Defaults to the dense
  list view.
-->
<template>
  <div class="flex flex-col gap-6">
    <header class="flex items-end justify-between">
      <div>
        <PageTitle>{{ t('prototype.views.drafts.title') }}</PageTitle>
      </div>
      <Button v-if="privateWorkflows.length" variant="primary" size="lg">
        {{ t('prototype.dashboard.newWorkflow') }}
      </Button>
    </header>

    <template v-if="privateWorkflows.length">
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
            :placeholder="t('prototype.views.drafts.searchPlaceholder')"
            class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>

        <div class="flex items-center gap-2">
          <ToolbarSelect
            v-model="filter"
            :options="filterOptions"
            :aria-label="t('prototype.views.drafts.filterAria')"
          />
          <ToolbarSelect
            v-model="sort"
            :options="sortOptions"
            :aria-label="t('prototype.views.drafts.sortAria')"
          />
          <div
            class="flex items-center gap-0.5 rounded-lg bg-secondary-background p-0.5"
          >
            <Button
              :variant="viewMode === 'grid' ? 'inverted' : 'muted-textonly'"
              size="unset"
              class="size-7 rounded-md"
              :aria-label="t('prototype.views.drafts.view.grid')"
              :aria-pressed="viewMode === 'grid'"
              @click="viewMode = 'grid'"
            >
              <i class="icon-[lucide--layout-grid] size-4" />
            </Button>
            <Button
              :variant="viewMode === 'list' ? 'inverted' : 'muted-textonly'"
              size="unset"
              class="size-7 rounded-md"
              :aria-label="t('prototype.views.drafts.view.list')"
              :aria-pressed="viewMode === 'list'"
              @click="viewMode = 'list'"
            >
              <i class="icon-[lucide--list] size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div v-if="displayed.length" :class="layoutClass">
        <WorkflowCard
          v-for="wf in displayed"
          :key="wf.id"
          :workflow="wf"
          :layout="viewMode"
        />
      </div>
      <p
        v-else
        class="rounded-xl border border-dashed border-border-subtle p-10 text-center text-sm text-muted-foreground"
      >
        {{ t('prototype.views.drafts.filterEmpty') }}
      </p>
    </template>

    <section
      v-else
      class="flex flex-col items-center gap-6 rounded-2xl border border-border-subtle bg-secondary-background px-8 py-10 text-center"
    >
      <div class="flex flex-col gap-1">
        <h2 class="text-lg/tight font-semibold">
          {{ t('prototype.views.drafts.emptyHeading') }}
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ t('prototype.views.drafts.emptySubtitle') }}
        </p>
      </div>
      <Button variant="primary" size="lg">
        {{ t('prototype.views.drafts.createWorkflow') }}
      </Button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import PageTitle from '../components/PageTitle.vue'

import Button from '@/components/ui/button/Button.vue'

import ToolbarSelect from '../components/ToolbarSelect.vue'
import WorkflowCard from '../components/WorkflowCard.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'

type FilterValue = 'all' | 'cloud' | 'local'
type SortValue = 'last-modified' | 'oldest' | 'az' | 'za'
type ViewMode = 'grid' | 'list'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture, draftsProject } = storeToRefs(personaStore)

const searchQuery = ref('')
const filter = ref<FilterValue>('all')
const sort = ref<SortValue>('last-modified')
const viewMode = ref<ViewMode>('grid')

const privateWorkflows = computed(() => {
  const drafts = draftsProject.value
  if (!drafts) return []
  return fixture.value.workflows.filter((w) => w.projectId === drafts.id)
})

const filterOptions = computed<Array<{ value: FilterValue; label: string }>>(
  () => [
    { value: 'all', label: t('prototype.views.drafts.filter.all') },
    { value: 'cloud', label: t('prototype.views.drafts.filter.cloud') },
    { value: 'local', label: t('prototype.views.drafts.filter.local') }
  ]
)

const sortOptions = computed<Array<{ value: SortValue; label: string }>>(() => [
  {
    value: 'last-modified',
    label: t('prototype.views.drafts.sort.lastModified')
  },
  { value: 'oldest', label: t('prototype.views.drafts.sort.oldest') },
  { value: 'az', label: t('prototype.views.drafts.sort.az') },
  { value: 'za', label: t('prototype.views.drafts.sort.za') }
])

const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return privateWorkflows.value.filter((w) => {
    if (q && !w.name.toLowerCase().includes(q)) return false
    if (filter.value === 'cloud') return w.storage === 'cloud'
    if (filter.value === 'local') return w.storage === 'local'
    return true
  })
})

const displayed = computed(() => {
  const list = [...filtered.value]
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

const layoutClass = computed(() =>
  viewMode.value === 'grid'
    ? 'grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4'
    : 'flex flex-col gap-0.5'
)
</script>
