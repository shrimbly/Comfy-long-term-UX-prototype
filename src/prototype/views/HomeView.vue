<!--
  Implements:
    concept: ../IA_Plan/wiki/concepts/personas-and-flows.md — dashboard landing
    log:     ../prototype/design-decisions.md (2026-06-17 visual style + Home)

  Dashboard landing. Time-based greeting + a search across the viewer's own
  workflows + media assets and the projects they can access (no global search
  in MVP). Below: a Recents
  strip (top 5, with a "Show all" link to the full Recents view) and a
  featured gallery tabbed across What's new / Templates / Tutorials. Tutorials
  surfaces the getting-started curriculum and leads (first tab, selected) for
  new users with an empty Recents.
-->
<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-10">
    <section class="flex flex-col items-center gap-5 pt-6">
      <h1
        class="text-center font-['PP_Formula'] text-3xl font-medium tracking-[-0.03em]"
      >
        {{ greeting }}
      </h1>
      <label
        class="flex h-12 w-full max-w-2xl items-center gap-3 rounded-full border border-border-subtle bg-secondary-background px-5 transition-colors focus-within:border-muted-foreground"
      >
        <i
          class="icon-[lucide--search] size-5 shrink-0 text-muted-foreground"
        />
        <input
          v-model="query"
          type="text"
          :placeholder="t('prototype.views.home.searchPlaceholder')"
          class="min-w-0 flex-1 bg-transparent text-sm text-base-foreground outline-none placeholder:text-muted-foreground"
        />
        <Button
          v-if="query"
          variant="muted-textonly"
          size="icon-sm"
          class="rounded-full"
          :aria-label="t('prototype.views.home.clearSearch')"
          @click="query = ''"
        >
          <i class="icon-[lucide--x] size-4" />
        </Button>
      </label>
    </section>

    <section v-if="trimmedQuery" class="flex flex-col gap-8">
      <p
        v-if="!hasResults"
        class="py-8 text-center text-sm text-muted-foreground"
      >
        {{ t('prototype.views.home.noResults', { query: trimmedQuery }) }}
      </p>

      <div v-if="showChips" class="flex flex-wrap items-center gap-2">
        <FilterPill
          :label="t('prototype.views.home.filterAll')"
          :active="resultFilter === 'all'"
          @click="resultFilter = 'all'"
        />
        <FilterPill
          v-for="group in presentTypes"
          :key="group.type"
          :label="group.label"
          :active="resultFilter === group.type"
          @click="resultFilter = group.type"
        />
      </div>

      <div
        v-if="showGroup('projects') && matchedProjects.length"
        class="flex flex-col gap-3"
      >
        <h2 class="text-sm font-semibold">
          {{ t('prototype.views.home.resultsProjects') }}
        </h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-6">
          <ProjectCard
            v-for="p in matchedProjects"
            :key="p.id"
            :project="p"
            :workflows="workflowsByProject[p.id] ?? []"
            @open="onOpenProject"
          />
        </div>
      </div>

      <div
        v-if="showGroup('folders') && matchedFolders.length"
        class="flex flex-col gap-3"
      >
        <h2 class="text-sm font-semibold">
          {{ t('prototype.views.home.resultsFolders') }}
        </h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-3">
          <FolderCard
            v-for="f in matchedFolders"
            :key="f.id"
            :folder="f"
            :count="folderWorkflowCount(f.id)"
            @open="onOpenFolder"
          />
        </div>
      </div>

      <div
        v-if="showGroup('published') && matchedPublished.length"
        class="flex flex-col gap-3"
      >
        <h2 class="text-sm font-semibold">
          {{ t('prototype.views.home.resultsPublished') }}
        </h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-6">
          <WorkflowCard
            v-for="wf in matchedPublished"
            :key="wf.id"
            :workflow="wf"
            @open="onOpenWorkflow"
          />
        </div>
      </div>

      <div
        v-if="showGroup('drafts') && matchedDrafts.length"
        class="flex flex-col gap-3"
      >
        <h2 class="text-sm font-semibold">
          {{ t('prototype.views.home.resultsDrafts') }}
        </h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-6">
          <WorkflowCard
            v-for="wf in matchedDrafts"
            :key="wf.id"
            :workflow="wf"
            @open="onOpenWorkflow"
          />
        </div>
      </div>

      <div
        v-if="showGroup('my-workflows') && matchedMyWorkflows.length"
        class="flex flex-col gap-3"
      >
        <h2 class="text-sm font-semibold">
          {{ t('prototype.views.home.resultsMyWorkflows') }}
        </h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-6">
          <WorkflowCard
            v-for="wf in matchedMyWorkflows"
            :key="wf.id"
            :workflow="wf"
            @open="onOpenWorkflow"
          />
        </div>
      </div>

      <div
        v-if="showGroup('media') && matchedAssets.length"
        class="flex flex-col gap-3"
      >
        <h2 class="text-sm font-semibold">
          {{ t('prototype.views.home.resultsAssets') }}
        </h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-6">
          <ShowcaseCard
            v-for="asset in matchedAssets"
            :key="asset.id"
            :title="asset.name"
            :seed="asset.id"
            aspect="3/2"
          />
        </div>
      </div>

      <div
        v-if="showGroup('templates') && matchedTemplates.length"
        class="flex flex-col gap-3"
      >
        <h2 class="text-sm font-semibold">
          {{ t('prototype.views.home.resultsTemplates') }}
        </h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-4">
          <TemplateCard
            v-for="tpl in matchedTemplates"
            :key="tpl.id"
            :template="tpl"
          />
        </div>
      </div>
    </section>

    <template v-else>
      <section v-if="recentWorkflows.length" class="flex flex-col gap-3">
        <header class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-semibold">
            {{ t('prototype.views.home.recents') }}
          </h2>
          <Button
            variant="link"
            size="sm"
            class="gap-1"
            @click="uiStore.go({ kind: 'recents' })"
          >
            {{ t('prototype.views.home.showAll') }}
            <i class="icon-[lucide--chevron-right] size-4" />
          </Button>
        </header>
        <div class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          <WorkflowCard
            v-for="wf in recentsStrip"
            :key="wf.id"
            :workflow="wf"
            @open="onOpenWorkflow"
          />
        </div>
      </section>

      <section v-else class="flex flex-col gap-3">
        <header class="flex h-6 items-center">
          <h2 class="text-sm font-semibold">
            {{ t('prototype.views.home.recents') }}
          </h2>
        </header>
        <WorkflowsEmptyState
          :heading="t('prototype.views.home.recentsEmpty.heading')"
        />
      </section>

      <section class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <Button
            v-for="tab in featuredTabs"
            :key="tab.value"
            :variant="
              activeFeaturedTab === tab.value ? 'inverted' : 'muted-textonly'
            "
            size="sm"
            class="rounded-full px-3"
            @click="activeFeaturedTab = tab.value"
          >
            {{ tab.label }}
          </Button>
        </div>

        <div
          v-if="activeFeaturedTab === 'tutorials'"
          class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <TemplateCard
            v-for="tpl in gettingStartedTemplates"
            :key="tpl.id"
            :template="tpl"
            aspect="video"
          />
        </div>
        <div
          v-else
          class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <ShowcaseCard
            v-for="card in featuredCards"
            :key="card.id"
            :title="card.title"
            :seed="card.id"
            :image="card.image"
            :image-position="card.imagePosition"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import FilterPill from '../components/FilterPill.vue'
import FolderCard from '../components/FolderCard.vue'
import ProjectCard from '../components/ProjectCard.vue'
import ShowcaseCard from '../components/ShowcaseCard.vue'
import TemplateCard from '../components/TemplateCard.vue'
import WorkflowCard from '../components/WorkflowCard.vue'
import WorkflowsEmptyState from '../components/WorkflowsEmptyState.vue'
import {
  gettingStartedTemplates,
  workflowTemplates
} from '../fixtures/templates'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import type { Workflow } from '../types'

type FeaturedTab = 'whatsNew' | 'templates' | 'tutorials'

// "What's new" promotes the latest models supported in ComfyUI (per
// blog.comfy.org) across modalities — image, audio, 3D, multimodal. Most
// artwork is square (400²); `imagePosition` picks the vertical band to keep
// when it crops into the landscape (16:9) tile — biased toward each image's
// subject (face, headphones/label). Already-landscape art omits it.
type FeaturedCard = {
  id: string
  title: string
  image?: string
  imagePosition?: string
}

const featuredModels: FeaturedCard[] = [
  {
    id: 'model-ideogram-4',
    title: 'Ideogram 4.0',
    image: '/whats-new/ideogram-4.webp'
  },
  {
    id: 'model-krea-2',
    title: 'Krea 2 Image',
    image: '/whats-new/krea-2.webp'
  },
  {
    id: 'model-stable-audio-3',
    title: 'Stable Audio 3.0',
    image: '/whats-new/stable-audio-3.webp',
    imagePosition: 'center 70%'
  },
  {
    id: 'model-triposplat',
    title: 'TripoSplat',
    image: '/whats-new/triposplat.webp'
  },
  {
    id: 'model-luma-uni-1',
    title: 'Luma Uni-1',
    image: '/whats-new/luma-uni-1.webp'
  },
  { id: 'model-gemma-4', title: 'Gemma 4', image: '/whats-new/gemma-4.webp' }
]

const { t } = useI18n()
const uiStore = usePrototypeUiStore()
const personaStore = usePrototypePersonaStore()
const customCloud = usePrototypeCustomCloudStore()
const { recentWorkflows, visibleProjects, draftsProject, fixture } =
  storeToRefs(personaStore)

// Project cards preview up to four of the project's workflow thumbnails.
const workflowsByProject = computed(() => {
  const buckets: Record<string, typeof fixture.value.workflows> = {}
  for (const w of fixture.value.workflows) {
    ;(buckets[w.projectId] ??= []).push(w)
  }
  return buckets
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  const slot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  return t(`prototype.views.home.greeting.${slot}`)
})

// --- Search: the viewer's workflows + media assets + accessible projects
// (no global search) ---

const query = ref('')
const trimmedQuery = computed(() => query.value.trim().toLowerCase())

const matchedWorkflows = computed(() =>
  trimmedQuery.value
    ? recentWorkflows.value.filter((w) =>
        w.name.toLowerCase().includes(trimmedQuery.value)
      )
    : []
)

// Split the workflow matches into the three buckets the result chips expose.
// A workflow in the personal Drafts project is either project-tied (it carries
// a real project's provenance → Drafts) or purely personal (My Workflows);
// anything living in a real project is a published canonical.
const draftsProjectId = computed(() => draftsProject.value?.id)

function hasProjectProvenance(w: Workflow): boolean {
  const id = w.provenanceProjectId
  return !!id && fixture.value.projects.some((p) => p.id === id && !p.isDrafts)
}

const matchedPublished = computed(() =>
  matchedWorkflows.value.filter((w) => w.projectId !== draftsProjectId.value)
)
const matchedDrafts = computed(() =>
  matchedWorkflows.value.filter(
    (w) => w.projectId === draftsProjectId.value && hasProjectProvenance(w)
  )
)
const matchedMyWorkflows = computed(() =>
  matchedWorkflows.value.filter(
    (w) => w.projectId === draftsProjectId.value && !hasProjectProvenance(w)
  )
)

const matchedAssets = computed(() =>
  trimmedQuery.value
    ? fixture.value.libraryAssets.filter(
        (a) =>
          a.section === 'media' &&
          a.name.toLowerCase().includes(trimmedQuery.value)
      )
    : []
)

const matchedProjects = computed(() =>
  trimmedQuery.value
    ? visibleProjects.value.filter((p) =>
        p.name.toLowerCase().includes(trimmedQuery.value)
      )
    : []
)

// Folders from the viewer's accessible containers (My Workflows + visible
// projects) that match by name.
const searchableContainerIds = computed(
  () =>
    new Set(
      [draftsProjectId.value, ...visibleProjects.value.map((p) => p.id)].filter(
        (id): id is string => !!id
      )
    )
)
const matchedFolders = computed(() =>
  trimmedQuery.value
    ? (fixture.value.folders ?? []).filter(
        (f) =>
          searchableContainerIds.value.has(f.projectId) &&
          f.name.toLowerCase().includes(trimmedQuery.value)
      )
    : []
)

function folderWorkflowCount(folderId: string): number {
  return fixture.value.workflows.filter((w) => w.folderId === folderId).length
}

// Templates match on name + model (the gallery's defining fields).
const matchedTemplates = computed(() =>
  trimmedQuery.value
    ? workflowTemplates.filter((tpl) =>
        `${tpl.name} ${tpl.model}`.toLowerCase().includes(trimmedQuery.value)
      )
    : []
)

// Result types, in the order both the filter chips and the result groups use.
type ResultType =
  | 'projects'
  | 'folders'
  | 'published'
  | 'drafts'
  | 'my-workflows'
  | 'media'
  | 'templates'

const resultGroups = computed<
  Array<{ type: ResultType; label: string; count: number }>
>(() => [
  {
    type: 'projects',
    label: t('prototype.views.home.resultsProjects'),
    count: matchedProjects.value.length
  },
  {
    type: 'folders',
    label: t('prototype.views.home.resultsFolders'),
    count: matchedFolders.value.length
  },
  {
    type: 'published',
    label: t('prototype.views.home.resultsPublished'),
    count: matchedPublished.value.length
  },
  {
    type: 'drafts',
    label: t('prototype.views.home.resultsDrafts'),
    count: matchedDrafts.value.length
  },
  {
    type: 'my-workflows',
    label: t('prototype.views.home.resultsMyWorkflows'),
    count: matchedMyWorkflows.value.length
  },
  {
    type: 'media',
    label: t('prototype.views.home.resultsAssets'),
    count: matchedAssets.value.length
  },
  {
    type: 'templates',
    label: t('prototype.views.home.resultsTemplates'),
    count: matchedTemplates.value.length
  }
])

const presentTypes = computed(() =>
  resultGroups.value.filter((group) => group.count > 0)
)
const showChips = computed(() => presentTypes.value.length > 1)
const hasResults = computed(() => presentTypes.value.length > 0)

// A new query starts unfiltered.
const resultFilter = ref<ResultType | 'all'>('all')
watch(trimmedQuery, () => {
  resultFilter.value = 'all'
})

function showGroup(type: ResultType): boolean {
  return resultFilter.value === 'all' || resultFilter.value === type
}

// A workflow opens in the editor, in the project it belongs to: a draft's
// provenance project, else its own.
function onOpenWorkflow(workflowId: string) {
  const wf = fixture.value.workflows.find((w) => w.id === workflowId)
  if (wf) customCloud.openWorkflow(wf.provenanceProjectId ?? wf.projectId, wf)
}

function onOpenProject(projectId: string) {
  uiStore.go({ kind: 'project', projectId })
}

// Open a folder result in its container, pre-opening the folder via the
// one-shot intent useFolderBrowser consumes on arrival.
function onOpenFolder(folderId: string) {
  const folder = (fixture.value.folders ?? []).find((f) => f.id === folderId)
  if (!folder) return
  const container = fixture.value.projects.find(
    (p) => p.id === folder.projectId
  )
  uiStore.requestFolder(folder.projectId, folderId)
  uiStore.go(
    container?.isDrafts
      ? { kind: 'drafts' }
      : { kind: 'project', projectId: folder.projectId }
  )
}

// --- Recents strip (top 5; "Show all" opens the full Recents view) ---

const recentsStrip = computed(() => recentWorkflows.value.slice(0, 5))

// --- Featured gallery ---

// A new user (nothing in Recents) leads with Tutorials — the getting-started
// curriculum — promoted to the first tab and selected by default. Established
// users keep What's new first. Reset on persona switch via the watch below.
const isNewUser = computed(() => recentWorkflows.value.length === 0)

const activeFeaturedTab = ref<FeaturedTab>('whatsNew')
watch(
  isNewUser,
  (newUser) => {
    activeFeaturedTab.value = newUser ? 'tutorials' : 'whatsNew'
  },
  { immediate: true }
)

const tabLabels = computed<
  Record<FeaturedTab, { value: FeaturedTab; label: string }>
>(() => ({
  whatsNew: {
    value: 'whatsNew',
    label: t('prototype.views.home.tabs.whatsNew')
  },
  templates: {
    value: 'templates',
    label: t('prototype.views.home.tabs.templates')
  },
  tutorials: {
    value: 'tutorials',
    label: t('prototype.views.home.tabs.tutorials')
  }
}))

const featuredTabs = computed(() => {
  const { whatsNew, templates, tutorials } = tabLabels.value
  return isNewUser.value
    ? [tutorials, whatsNew, templates]
    : [whatsNew, templates, tutorials]
})

const featuredCards = computed<FeaturedCard[]>(() => {
  if (activeFeaturedTab.value === 'templates') {
    return workflowTemplates.slice(0, 3).map((tpl) => ({
      id: tpl.id,
      title: tpl.name
    }))
  }
  if (activeFeaturedTab.value === 'whatsNew') {
    return featuredModels
  }
  return []
})
</script>
