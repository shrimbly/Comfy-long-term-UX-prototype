<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/drafts-as-default-private-project.md
    concept:  ../IA_Plan/wiki/concepts/three-level-permissions.md §"Asset level"
              — workflows shared via asset-level grant outside of any
              project the viewer can reach.

  Drafts is the default save target. The view has two tabs:

    Private — workflows in the viewer's own Drafts/My-Workflows project.
    Shared  — workflows where the viewer has an asset-level grant
              (access[] entry) on a workflow whose project they can't
              reach through normal project nav. Per the wiki, these are
              shared via asset-level invite and would otherwise have no
              home in the UI.

  "+ New workflow" only makes sense from the Private tab — new
  workflows are auto-saved into the viewer's Drafts.
-->
<template>
  <div class="flex flex-col gap-8">
    <header class="flex items-end justify-between">
      <div>
        <h1 class="text-2xl font-semibold">
          {{ t('prototype.views.drafts.title') }}
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t('prototype.views.drafts.subtitle') }}
        </p>
      </div>
      <button
        v-if="activeTab === 'private' && privateWorkflows.length"
        type="button"
        class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary-background px-4 py-2 text-sm font-medium text-button-surface-contrast transition-colors hover:bg-primary-background-hover"
      >
        {{ t('prototype.dashboard.newWorkflow') }}
      </button>
    </header>

    <nav class="flex gap-1 border-b border-interface-stroke" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :class="
          cn(
            'inline-flex h-10 cursor-pointer appearance-none items-center gap-2 border-0 border-b-2 bg-transparent px-3 text-sm transition-colors',
            activeTab === tab.id
              ? 'border-text-primary text-text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          )
        "
        @click="activeTab = tab.id"
      >
        <span>{{ tab.label }}</span>
        <span
          class="rounded-full bg-secondary-background px-2 py-0.5 text-xs text-muted-foreground"
        >
          {{ tab.count }}
        </span>
      </button>
    </nav>

    <div
      v-if="activeWorkflows.length"
      class="grid grid-cols-[repeat(auto-fill,minmax(10rem,14rem))] gap-4"
    >
      <WorkflowCard v-for="wf in activeWorkflows" :key="wf.id" :workflow="wf" />
    </div>

    <template v-else-if="activeTab === 'private'">
      <section
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
        <button
          type="button"
          class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary-background px-5 text-sm font-medium text-button-surface-contrast transition-colors hover:bg-primary-background-hover"
        >
          {{ t('prototype.views.drafts.createWorkflow') }}
        </button>
      </section>
    </template>

    <p
      v-else
      class="rounded-2xl border border-dashed border-border-subtle p-10 text-center text-sm text-muted-foreground"
    >
      {{ t('prototype.views.drafts.sharedEmpty') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import WorkflowCard from '../components/WorkflowCard.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'

type DraftsTabId = 'private' | 'shared'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { sharedWorkflows, fixture, draftsProject } = storeToRefs(personaStore)

const activeTab = ref<DraftsTabId>('private')

const privateWorkflows = computed(() => {
  const drafts = draftsProject.value
  if (!drafts) return []
  return fixture.value.workflows
    .filter((w) => w.projectId === drafts.id)
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})

const activeWorkflows = computed(() =>
  activeTab.value === 'private' ? privateWorkflows.value : sharedWorkflows.value
)

const tabs = computed<Array<{ id: DraftsTabId; label: string; count: number }>>(
  () => [
    {
      id: 'private',
      label: t('prototype.views.drafts.tabs.private'),
      count: privateWorkflows.value.length
    },
    {
      id: 'shared',
      label: t('prototype.views.drafts.tabs.shared'),
      count: sharedWorkflows.value.length
    }
  ]
)
</script>
