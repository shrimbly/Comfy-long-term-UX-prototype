<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/drafts-as-default-private-project.md

  Drafts is the default save target. "+ New workflow" is a compact button
  in the page header (Button secondary variant pattern), not a grid tile —
  matches how upstream ComfyUI surfaces create actions.
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
        v-if="workflows.length"
        type="button"
        class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary-background px-4 py-2 text-sm font-medium text-button-surface-contrast transition-colors hover:bg-primary-background-hover"
      >
        {{ t('prototype.dashboard.newWorkflow') }}
      </button>
    </header>

    <div
      v-if="workflows.length"
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
    >
      <WorkflowCard v-for="wf in workflows" :key="wf.id" :workflow="wf" />
    </div>

    <template v-else>
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

      <section v-if="starterTemplates.length" class="flex flex-col gap-4">
        <h2
          class="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
        >
          {{ t('prototype.views.drafts.templatesHeading') }}
        </h2>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import TemplateCard from '../components/TemplateCard.vue'
import WorkflowCard from '../components/WorkflowCard.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()

const workflows = computed(() => {
  const drafts = personaStore.draftsProject
  if (!drafts) return []
  return personaStore.fixture.workflows.filter((w) => w.projectId === drafts.id)
})

const starterTemplates = computed(() =>
  personaStore.fixture.templates.slice(0, 4)
)
</script>
