<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/project.md
             §"What it contains" — allowlists; §"Roles" — Owner-only.
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md
             §"Project level" — Owner-only edits.
    log:     ../prototype/design-decisions.md (2026-05-15) — strict
             override allowlists, read-only usage, filename-prefix seed.

  Composed inside ProjectDetailView's Settings tab. Three sections, in
  fixed order: Allowlists -> Usage -> Defaults.
-->
<template>
  <div class="flex flex-col gap-6">
    <section class="flex flex-col gap-4">
      <h2
        class="m-0 text-sm font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {{ t('prototype.views.project.settings.allowlistsHeading') }}
      </h2>
      <div class="grid gap-4 lg:grid-cols-2">
        <ProjectAllowlistEditor
          :title="t('prototype.views.project.settings.modelAllowlist.heading')"
          :description="
            t('prototype.views.project.settings.modelAllowlist.description')
          "
          :override="modelAllowlist.override"
          :entries="modelAllowlist.entries"
          :workspace-entries="fixture.allowlists.models.entries"
          :can-edit="canEdit"
          :add-placeholder="
            t('prototype.views.project.settings.modelAllowlist.placeholder')
          "
          :added-by-label="addedByLabel"
          @add="(name) => onAdd('model', name)"
          @remove="(id) => onRemove('model', id)"
          @toggle-override="(value) => onToggleOverride('model', value)"
        />
        <ProjectAllowlistEditor
          :title="
            t('prototype.views.project.settings.customNodeAllowlist.heading')
          "
          :description="
            t(
              'prototype.views.project.settings.customNodeAllowlist.description'
            )
          "
          :override="customNodeAllowlist.override"
          :entries="customNodeAllowlist.entries"
          :workspace-entries="fixture.allowlists.customNodes.entries"
          :can-edit="canEdit"
          :add-placeholder="
            t(
              'prototype.views.project.settings.customNodeAllowlist.placeholder'
            )
          "
          :added-by-label="addedByLabel"
          @add="(name) => onAdd('custom-node', name)"
          @remove="(id) => onRemove('custom-node', id)"
          @toggle-override="(value) => onToggleOverride('custom-node', value)"
        />
      </div>
    </section>

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

import ProjectAllowlistEditor from '../components/ProjectAllowlistEditor.vue'
import ProjectDefaultsSection from '../components/ProjectDefaultsSection.vue'
import ProjectUsageSection from '../components/ProjectUsageSection.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type {
  Project,
  ProjectAllowlistConfig,
  ProjectAllowlistKind
} from '../types'

const { project, canEdit } = defineProps<{
  project: Project
  canEdit: boolean
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture } = storeToRefs(personaStore)

const emptyConfig: ProjectAllowlistConfig = { override: false, entries: [] }

const modelAllowlist = computed<ProjectAllowlistConfig>(
  () => project.allowlists?.models ?? emptyConfig
)
const customNodeAllowlist = computed<ProjectAllowlistConfig>(
  () => project.allowlists?.customNodes ?? emptyConfig
)

const filenamePrefix = computed(() => project.defaults?.filenamePrefix ?? '')

const projectCredits = computed(() => project.creditsThisMonth ?? 0)

const workspaceCredits = computed(() =>
  fixture.value.projects
    .filter((p) => p.workspaceId === project.workspaceId)
    .reduce((sum, p) => sum + (p.creditsThisMonth ?? 0), 0)
)

function addedByLabel(userId: string): string {
  if (userId === fixture.value.currentUser.id) {
    return t('prototype.views.members.actions.you')
  }
  return fixture.value.members.find((m) => m.id === userId)?.name ?? userId
}

function onAdd(kind: ProjectAllowlistKind, name: string) {
  personaStore.addProjectAllowlistEntry(project.id, kind, name)
}

function onRemove(kind: ProjectAllowlistKind, entryId: string) {
  personaStore.removeProjectAllowlistEntry(project.id, kind, entryId)
}

function onToggleOverride(kind: ProjectAllowlistKind, value: boolean) {
  personaStore.setProjectAllowlistOverride(project.id, kind, value)
}

function onUpdateFilenamePrefix(value: string) {
  personaStore.setProjectFilenamePrefix(project.id, value)
}
</script>
