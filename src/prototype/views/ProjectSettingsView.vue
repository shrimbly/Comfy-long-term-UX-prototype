<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/project.md §"Roles" — Owner-only.
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md
             §"Project level" — Owner-only edits.
    log:     ../prototype/design-decisions.md (2026-05-15) filename-prefix
             seed; (2026-06-16) MVP — allowlists removed.

  Composed inside ProjectDetailView's Settings tab. Two sections, in
  fixed order: Usage -> Defaults.
-->
<template>
  <div class="flex flex-col gap-6">
    <section class="flex flex-col gap-4">
      <h2
        class="m-0 text-sm font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {{ t('prototype.views.project.settings.usageHeading') }}
      </h2>
      <ProjectUsageSection
        :project-credits="projectCredits"
        :workspace-credits="workspaceCredits"
      />
    </section>

    <section class="flex flex-col gap-4">
      <h2
        class="m-0 text-sm font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {{ t('prototype.views.project.settings.defaultsHeading') }}
      </h2>
      <ProjectDefaultsSection
        :filename-prefix="filenamePrefix"
        :can-edit="canEdit"
        @update:filename-prefix="onUpdateFilenamePrefix"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import ProjectDefaultsSection from '../components/ProjectDefaultsSection.vue'
import ProjectUsageSection from '../components/ProjectUsageSection.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { Project } from '../types'

const { project, canEdit } = defineProps<{
  project: Project
  canEdit: boolean
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture } = storeToRefs(personaStore)

const filenamePrefix = computed(() => project.defaults?.filenamePrefix ?? '')

const projectCredits = computed(() => project.creditsThisMonth ?? 0)

const workspaceCredits = computed(() =>
  fixture.value.projects
    .filter((p) => p.workspaceId === project.workspaceId)
    .reduce((sum, p) => sum + (p.creditsThisMonth ?? 0), 0)
)

function onUpdateFilenamePrefix(value: string) {
  personaStore.setProjectFilenamePrefix(project.id, value)
}
</script>
