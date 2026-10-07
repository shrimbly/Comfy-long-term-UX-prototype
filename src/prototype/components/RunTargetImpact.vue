<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
              — updating a deployment updates every project on it
    log:      prototype/design-decisions.md — 2026-10-07 "Edit deployment
              end to end: items, impact, update or fork"

  The last question before a deployment rebuilds: which projects it
  changes and what changes. Update them all, fork a new deployment for
  this project only, or stop.
-->
<template>
  <h2 :id="titleId" class="m-0 pr-8 text-2xl font-semibold">
    {{ tText('prototype.customCloud.dialog.impact.title', { name }) }}
  </h2>
  <p class="m-0 text-sm text-muted-foreground">
    {{ t('prototype.customCloud.dialog.impact.affects', projects.length) }}
  </p>

  <ul
    v-if="projects.length"
    class="m-0 flex list-none flex-col divide-y divide-border-subtle rounded-xl border border-border-subtle p-0 text-sm"
  >
    <li
      v-for="project in projects"
      :key="project.id"
      class="flex items-center gap-3 px-4 py-2.5"
    >
      <span
        class="grid size-4 shrink-0 place-items-center rounded-sm text-[9px] font-semibold text-button-surface-contrast"
        :style="{ backgroundColor: project.color ?? '#7c7c7c' }"
        aria-hidden="true"
      >
        {{ project.name.charAt(0).toUpperCase() }}
      </span>
      <span class="truncate">{{ project.name }}</span>
      <span
        v-if="project.id === customCloud.editingFromProjectId"
        class="ml-auto text-xs text-muted-foreground"
      >
        {{ t('prototype.customCloud.dialog.impact.thisProject') }}
      </span>
    </li>
  </ul>

  <section class="flex flex-col gap-2">
    <h3
      class="m-0 text-xs font-medium tracking-widest text-muted-foreground uppercase"
    >
      {{ t('prototype.customCloud.dialog.impact.changes') }}
    </h3>
    <ul class="m-0 flex list-none flex-col gap-1 p-0 text-sm">
      <li v-for="change in changes" :key="change">{{ change }}</li>
    </ul>
  </section>

  <footer class="flex flex-wrap items-center gap-2.5">
    <Button
      variant="muted-textonly"
      size="lg"
      @click="customCloud.editStep = 'config'"
    >
      <i class="icon-[lucide--arrow-left] size-4" />
      {{ t('prototype.customCloud.dialog.impact.back') }}
    </Button>
    <Button
      variant="muted-textonly"
      size="lg"
      class="mr-auto"
      @click="customCloud.cancelEdit()"
    >
      {{ t('prototype.customCloud.dialog.impact.cancel') }}
    </Button>
    <Button
      v-if="customCloud.editingFromProjectId"
      variant="outline"
      size="lg"
      :title="forkHint"
      @click="customCloud.forkDeployment()"
    >
      {{ t('prototype.customCloud.dialog.impact.fork') }}
    </Button>
    <Button variant="inverted" size="lg" @click="customCloud.confirmUpdate()">
      {{ t('prototype.customCloud.dialog.impact.update') }}
    </Button>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { useTextT } from '../composables/useTextT'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypePolicyStore } from '../stores/policyStore'
import { nextRelease } from '../utils/deployment'

const { titleId } = defineProps<{
  titleId: string
}>()

const { t } = useI18n()
const tText = useTextT()
const customCloud = usePrototypeCustomCloudStore()
const policies = usePrototypePolicyStore()

const name = computed(() => customCloud.newDeploymentName.trim())
const projects = computed(() => customCloud.editingProjects)

function names(ids: string[]) {
  return ids
    .map((id) => policies.catalog.find((item) => item.id === id)?.name ?? id)
    .join(', ')
}

const changes = computed(() => {
  const editing = customCloud.editingDeployment
  const diff = customCloud.editingChanges
  if (!editing) return []
  const lines = [
    t('prototype.customCloud.dialog.impact.release', {
      from: editing.release ?? 'v1',
      to: nextRelease(editing.release)
    })
  ]
  if (diff.name) {
    lines.push(
      t('prototype.customCloud.dialog.impact.name', {
        from: diff.name.from,
        to: diff.name.to
      })
    )
  }
  if (diff.comfyVersion) {
    lines.push(
      t('prototype.customCloud.dialog.impact.version', {
        from: diff.comfyVersion.from,
        to: diff.comfyVersion.to
      })
    )
  }
  if (diff.gpu) {
    lines.push(
      t('prototype.customCloud.dialog.impact.gpu', {
        from: diff.gpu.from,
        to: diff.gpu.to
      })
    )
  }
  if (diff.warmMinutes) {
    lines.push(
      t('prototype.customCloud.dialog.impact.warm', {
        from: diff.warmMinutes.from,
        to: diff.warmMinutes.to
      })
    )
  }
  if (diff.addedPacks.length) {
    lines.push(
      t('prototype.customCloud.dialog.impact.packsAdded', {
        count: diff.addedPacks.length,
        items: names(diff.addedPacks)
      })
    )
  }
  if (diff.removedPacks.length) {
    lines.push(
      t('prototype.customCloud.dialog.impact.packsRemoved', {
        count: diff.removedPacks.length,
        items: names(diff.removedPacks)
      })
    )
  }
  if (diff.addedModels.length) {
    lines.push(
      t('prototype.customCloud.dialog.impact.modelsAdded', {
        count: diff.addedModels.length,
        items: names(diff.addedModels)
      })
    )
  }
  if (diff.removedModels.length) {
    lines.push(
      t('prototype.customCloud.dialog.impact.modelsRemoved', {
        count: diff.removedModels.length,
        items: names(diff.removedModels)
      })
    )
  }
  return lines
})

const forkHint = computed(() => {
  const project = projects.value.find(
    (p) => p.id === customCloud.editingFromProjectId
  )
  return project
    ? tText('prototype.customCloud.dialog.impact.forkHint', {
        project: project.name,
        name: customCloud.editingDeployment?.name ?? ''
      })
    : undefined
})
</script>
