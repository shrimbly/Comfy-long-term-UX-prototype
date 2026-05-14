<!--
  Implements:
    Recents view — workflows from every accessible project (visible projects
    + Drafts) sorted by updatedAt desc.

    Empty-state pattern: prominent "Create workflow" CTA + a starter
    template grid below, so the first-run / solo-creator view has a
    launching pad instead of dead space.
-->
<template>
  <div class="flex flex-col gap-8">
    <header>
      <h1 class="text-2xl font-semibold">
        {{ t('prototype.views.recents.title') }}
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ t('prototype.views.recents.subtitle') }}
      </p>
    </header>

    <div
      v-if="recentWorkflows.length"
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
    >
      <WorkflowCard v-for="wf in recentWorkflows" :key="wf.id" :workflow="wf" />
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
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import TemplateCard from '../components/TemplateCard.vue'
import WorkflowCard from '../components/WorkflowCard.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { recentWorkflows, fixture } = storeToRefs(personaStore)

const templates = computed(() => fixture.value.templates)
const starterTemplates = computed(() => templates.value.slice(0, 4))
</script>
