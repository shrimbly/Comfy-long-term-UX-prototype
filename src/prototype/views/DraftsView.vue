<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/drafts-as-default-private-project.md

  Drafts is the default save target. Shows the workflows in the viewer's
  own Drafts / My-Workflows project. "+ New workflow" saves into it.
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
        v-if="privateWorkflows.length"
        type="button"
        class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary-background px-4 py-2 text-sm font-medium text-button-surface-contrast transition-colors hover:bg-primary-background-hover"
      >
        {{ t('prototype.dashboard.newWorkflow') }}
      </button>
    </header>

    <div
      v-if="privateWorkflows.length"
      class="grid grid-cols-[repeat(auto-fill,minmax(10rem,14rem))] gap-4"
    >
      <WorkflowCard
        v-for="wf in privateWorkflows"
        :key="wf.id"
        :workflow="wf"
      />
    </div>

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
      <button
        type="button"
        class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary-background px-5 text-sm font-medium text-button-surface-contrast transition-colors hover:bg-primary-background-hover"
      >
        {{ t('prototype.views.drafts.createWorkflow') }}
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import WorkflowCard from '../components/WorkflowCard.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture, draftsProject } = storeToRefs(personaStore)

const privateWorkflows = computed(() => {
  const drafts = draftsProject.value
  if (!drafts) return []
  return fixture.value.workflows
    .filter((w) => w.projectId === drafts.id)
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})
</script>
