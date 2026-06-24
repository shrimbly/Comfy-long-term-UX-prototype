<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/drafts-as-default-private-project.md
    decision: ../IA_Plan/wiki/decisions/mvp-scope.md
    log:      ../prototype/design-decisions.md (2026-06-24 My Workflows = personal project; folders)

  My Workflows — the viewer's personal project. Shows only *personal*
  workflows: copies/drafts tied to a real shared project live in that
  project's "My drafts", not here. Organized with single-level folders.

  Toolbar: search by name (container-wide), filter by storage, sort, and a
  grid/list view toggle.
-->
<template>
  <div class="flex flex-col gap-6">
    <header class="flex items-end justify-between">
      <div>
        <PageTitle>{{ t('prototype.views.drafts.title') }}</PageTitle>
      </div>
      <div v-if="hasContent" class="flex items-center gap-2">
        <Button
          v-if="!currentFolder"
          variant="secondary"
          size="lg"
          @click="creatingFolder = true"
        >
          <i class="icon-[lucide--folder-plus] size-4" />
          {{ t('prototype.folders.newFolder') }}
        </Button>
        <Button variant="primary" size="lg">
          {{ t('prototype.dashboard.newWorkflow') }}
        </Button>
      </div>
    </header>

    <template v-if="hasContent">
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

      <nav v-if="currentFolder" class="flex items-center gap-1.5 text-sm">
        <button
          type="button"
          class="cursor-pointer text-muted-foreground transition-colors hover:text-base-foreground"
          @click="goToRoot"
        >
          {{ t('prototype.views.drafts.title') }}
        </button>
        <i class="icon-[lucide--chevron-right] size-4 text-muted-foreground" />
        <span class="font-medium">{{ currentFolder.name }}</span>
      </nav>

      <div
        v-if="showFolders"
        class="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-3"
      >
        <FolderCard
          v-for="f in folders"
          :key="f.id"
          :folder="f"
          :count="workflowCount(f.id)"
          @open="enterFolder"
        />
      </div>

      <SelectableWorkflowGrid
        v-if="displayed.length"
        :workflows="displayed"
        :container-id="containerId ?? ''"
        :layout-class="layoutClass"
      >
        <template
          #default="{
            isSelected,
            selectionActive,
            onSelect,
            onContextMenu,
            onDragStart
          }"
        >
          <WorkflowCard
            v-for="d in displayedWithMeta"
            :key="d.wf.id"
            :workflow="d.wf"
            :layout="viewMode"
            :draft-meta="d.meta"
            :draggable="!searching"
            selectable
            :selected="isSelected(d.wf.id)"
            :selection-active="selectionActive"
            @select="onSelect(d.wf.id, $event)"
            @context-menu="onContextMenu($event)"
            @dragstart="onDragStart(d.wf.id, $event)"
          />
        </template>
      </SelectableWorkflowGrid>
      <p
        v-else-if="emptyMessage"
        class="rounded-xl border border-dashed border-border-subtle p-10 text-center text-sm text-muted-foreground"
      >
        {{ emptyMessage }}
      </p>
    </template>

    <WorkflowsEmptyState
      v-else
      :heading="t('prototype.views.drafts.emptyHeading')"
    />

    <PromptDialog
      v-if="creatingFolder"
      :title="t('prototype.folders.newFolderTitle')"
      :placeholder="t('prototype.folders.namePlaceholder')"
      :confirm-label="t('prototype.folders.create')"
      @confirm="onCreateFolder"
      @cancel="creatingFolder = false"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import PageTitle from '../components/PageTitle.vue'

import Button from '@/components/ui/button/Button.vue'

import FolderCard from '../components/FolderCard.vue'
import PromptDialog from '../components/PromptDialog.vue'
import SelectableWorkflowGrid from '../components/SelectableWorkflowGrid.vue'
import ToolbarSelect from '../components/ToolbarSelect.vue'
import WorkflowCard from '../components/WorkflowCard.vue'
import WorkflowsEmptyState from '../components/WorkflowsEmptyState.vue'
import { useFolderBrowser } from '../composables/useFolderBrowser'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { deriveDraftMeta } from '../utils/draftMeta'

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
const creatingFolder = ref(false)

const containerId = computed(() => draftsProject.value?.id)

// Personal workflows only. A copy/draft whose provenance is a real shared
// project belongs to that project's "My drafts", not here (My Workflows = your
// personal project). Orphans (provenance project gone) fall back to here.
const personalWorkflows = computed(() => {
  const id = containerId.value
  if (!id) return []
  const inRealProject = (pid?: string) =>
    !!pid && fixture.value.projects.some((p) => p.id === pid && !p.isDrafts)
  return fixture.value.workflows.filter(
    (w) => w.projectId === id && !inRealProject(w.provenanceProjectId)
  )
})

const {
  currentFolderId,
  currentFolder,
  folders,
  workflowsHere,
  workflowCount,
  enterFolder,
  goToRoot
} = useFolderBrowser(containerId, personalWorkflows)

const searching = computed(() => searchQuery.value.trim().length > 0)

// Search is container-wide; otherwise list the active folder level.
const base = computed(() =>
  searching.value ? personalWorkflows.value : workflowsHere.value
)

const hasContent = computed(
  () => personalWorkflows.value.length > 0 || folders.value.length > 0
)

const showFolders = computed(
  () =>
    !searching.value &&
    currentFolderId.value === null &&
    folders.value.length > 0
)

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
  return base.value.filter((w) => {
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

// Surface a provenance link on any workflow connected to a project; plain
// personal workflows get no badge.
const displayedWithMeta = computed(() =>
  displayed.value.map((wf) => ({
    wf,
    meta: deriveDraftMeta(wf, fixture.value.workflows, fixture.value.projects)
  }))
)

const emptyMessage = computed(() => {
  if (displayed.value.length > 0) return null
  if (searching.value) return t('prototype.views.drafts.filterEmpty')
  if (currentFolder.value) return t('prototype.folders.empty')
  if (!showFolders.value) return t('prototype.views.drafts.filterEmpty')
  return null
})

const layoutClass = computed(() =>
  viewMode.value === 'grid'
    ? 'grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-6'
    : 'flex flex-col gap-0.5'
)

function onCreateFolder(name: string) {
  creatingFolder.value = false
  const id = containerId.value
  if (id) personaStore.createFolder(id, name)
}
</script>
