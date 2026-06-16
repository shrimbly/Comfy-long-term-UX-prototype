<!--
  Implements:
    concept: ../IA_Plan/wiki/concepts/personas-and-flows.md — dashboard landing
    log:     ../prototype/design-decisions.md (2026-06-17 visual style + Home)

  Dashboard landing. Time-based greeting + a search that filters the viewer's
  own workflows + media assets (no global search in MVP). Below: a Recents
  strip (filterable by project) and a featured gallery tabbed across
  Workflows / Templates / Tutorials (Tutorials is a placeholder for now).
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

      <div v-if="matchedWorkflows.length" class="flex flex-col gap-3">
        <h2 class="text-sm font-semibold">
          {{ t('prototype.views.home.resultsWorkflows') }}
        </h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-4">
          <WorkflowCard
            v-for="wf in matchedWorkflows"
            :key="wf.id"
            :workflow="wf"
          />
        </div>
      </div>

      <div v-if="matchedAssets.length" class="flex flex-col gap-3">
        <h2 class="text-sm font-semibold">
          {{ t('prototype.views.home.resultsAssets') }}
        </h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-4">
          <ShowcaseCard
            v-for="asset in matchedAssets"
            :key="asset.id"
            :title="asset.name"
            :seed="asset.id"
            aspect="3/2"
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
          <ToolbarSelect
            v-if="projectFilterOptions.length > 1"
            v-model="recentsProject"
            :options="projectFilterOptions"
            :aria-label="t('prototype.views.home.projectFilterLabel')"
          />
        </header>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <WorkflowCard
            v-for="wf in recentsStrip"
            :key="wf.id"
            :workflow="wf"
          />
        </div>
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

        <p
          v-if="activeFeaturedTab === 'tutorials'"
          class="rounded-2xl border border-dashed border-border-subtle py-12 text-center text-sm text-muted-foreground"
        >
          {{ t('prototype.views.home.tutorialsPlaceholder') }}
        </p>
        <div
          v-else
          class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <ShowcaseCard
            v-for="card in featuredCards"
            :key="card.id"
            :title="card.title"
            :subtitle="card.subtitle"
            :seed="card.id"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import ShowcaseCard from '../components/ShowcaseCard.vue'
import ToolbarSelect from '../components/ToolbarSelect.vue'
import WorkflowCard from '../components/WorkflowCard.vue'
import { workflowTemplates } from '../fixtures/templates'
import { usePrototypePersonaStore } from '../stores/personaStore'

type FeaturedTab = 'workflows' | 'templates' | 'tutorials'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { recentWorkflows, visibleProjects, draftsProject, fixture } =
  storeToRefs(personaStore)

const greeting = computed(() => {
  const hour = new Date().getHours()
  const slot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  return t(`prototype.views.home.greeting.${slot}`)
})

// --- Search: the viewer's own workflows + media assets (no global search) ---

const query = ref('')
const trimmedQuery = computed(() => query.value.trim().toLowerCase())

const matchedWorkflows = computed(() =>
  trimmedQuery.value
    ? recentWorkflows.value.filter((w) =>
        w.name.toLowerCase().includes(trimmedQuery.value)
      )
    : []
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

const hasResults = computed(
  () => matchedWorkflows.value.length > 0 || matchedAssets.value.length > 0
)

// --- Recents strip, filterable by project ---

const projectName = (projectId: string) =>
  fixture.value.projects.find((p) => p.id === projectId)?.name ?? ''

const recentsProject = ref<string>('all')

const projectFilterOptions = computed(() => {
  const projects = [
    ...(draftsProject.value ? [draftsProject.value] : []),
    ...visibleProjects.value
  ]
  return [
    { value: 'all', label: t('prototype.views.home.allProjects') },
    ...projects.map((p) => ({ value: p.id, label: p.name }))
  ]
})

const recentsStrip = computed(() => {
  const list =
    recentsProject.value === 'all'
      ? recentWorkflows.value
      : recentWorkflows.value.filter(
          (w) => w.projectId === recentsProject.value
        )
  return list.slice(0, 6)
})

// --- Featured gallery ---

const activeFeaturedTab = ref<FeaturedTab>('workflows')

const featuredTabs = computed<Array<{ value: FeaturedTab; label: string }>>(
  () => [
    { value: 'workflows', label: t('prototype.views.home.tabs.workflows') },
    { value: 'templates', label: t('prototype.views.home.tabs.templates') },
    { value: 'tutorials', label: t('prototype.views.home.tabs.tutorials') }
  ]
)

const featuredCards = computed<
  Array<{ id: string; title: string; subtitle: string }>
>(() => {
  if (activeFeaturedTab.value === 'templates') {
    return workflowTemplates.slice(0, 3).map((tpl) => ({
      id: tpl.id,
      title: tpl.name,
      subtitle: t(`prototype.templateCategory.${tpl.category}`)
    }))
  }
  if (activeFeaturedTab.value === 'workflows') {
    return recentWorkflows.value.slice(0, 3).map((wf) => ({
      id: wf.id,
      title: wf.name,
      subtitle: projectName(wf.projectId)
    }))
  }
  return []
})
</script>
