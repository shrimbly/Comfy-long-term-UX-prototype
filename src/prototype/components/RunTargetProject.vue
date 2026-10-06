<!--
  Implements:
    entity:   ../IA_Plan/wiki/entities/project.md
    concept:  ../IA_Plan/wiki/concepts/three-level-permissions.md — project level
    decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
              — "you name it and choose a backend for it"
    decision: prototype/design-decisions.md — 2026-10-07 "Flow 07: a new
              project is named and shared before it's made"

  The "New project" step: every path that makes a project names it and
  chooses who can access it, with the dashboard's New project fields. On a
  deployment that already runs the workflow it creates the project; on a
  new deployment it goes on to the build summary.
-->
<template>
  <header class="flex flex-col items-start gap-2.5 pr-8">
    <h2 :id="titleId" class="m-0 text-2xl font-semibold">
      {{ t('prototype.customCloud.dialog.project.title') }}
    </h2>
    <span
      class="inline-flex h-7 items-center gap-2 rounded-full border border-border-subtle px-2.5 text-[13px] text-muted-foreground"
    >
      <i v-if="!deployment" class="icon-[lucide--plus] size-3.5" />
      <DeploymentStatusDot v-else :status="deployment.status" />
      {{
        deployment
          ? tText('prototype.customCloud.dialog.project.runsOn', {
              deployment: deployment.name
            })
          : t('prototype.customCloud.dialog.project.runsOnNew')
      }}
    </span>
  </header>

  <label class="flex flex-col gap-1.5">
    <span
      class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
    >
      {{ t('prototype.views.projects.newProjectDialog.nameLabel') }}
    </span>
    <input
      v-model="customCloud.newProjectName"
      type="text"
      :placeholder="
        t('prototype.views.projects.newProjectDialog.namePlaceholder')
      "
      class="h-10 rounded-lg border border-border-subtle bg-secondary-background px-3 text-sm outline-none focus:border-base-foreground"
      @keydown.enter="onNext"
    />
  </label>

  <ProjectAccessFields
    v-model:tier="customCloud.newProjectTier"
    v-model:collaborators="customCloud.newProjectCollaborators"
  />

  <footer class="flex items-center gap-2.5">
    <Button
      variant="muted-textonly"
      size="lg"
      class="mr-auto"
      @click="customCloud.dialogStep = 'choose'"
    >
      {{ t('prototype.customCloud.dialog.back') }}
    </Button>
    <Button variant="muted-textonly" size="lg" @click="emit('close')">
      {{ t('prototype.customCloud.dialog.notNow') }}
    </Button>
    <Button variant="inverted" size="lg" :disabled="!named" @click="onNext">
      {{
        deployment
          ? t('prototype.customCloud.dialog.createProject')
          : t('prototype.customCloud.dialog.project.nextBuild')
      }}
    </Button>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { useTextT } from '../composables/useTextT'
import {
  NEW_BUILD_TARGET,
  usePrototypeCustomCloudStore
} from '../stores/customCloudStore'

import DeploymentStatusDot from './DeploymentStatusDot.vue'
import ProjectAccessFields from './ProjectAccessFields.vue'

const { titleId } = defineProps<{
  titleId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const tText = useTextT()
const customCloud = usePrototypeCustomCloudStore()

// The existing deployment the project will run on; none for a new one.
const deployment = computed(() =>
  customCloud.deploymentTarget === NEW_BUILD_TARGET
    ? undefined
    : customCloud.deploymentTargets.find(
        (target) => target.deployment.id === customCloud.deploymentTarget
      )?.deployment
)
const named = computed(() => customCloud.newProjectName.trim().length > 0)

function onNext() {
  if (!named.value) return
  if (deployment.value) {
    customCloud.createProjectOn(deployment.value.id)
    return
  }
  customCloud.newDeploymentName = customCloud.newProjectName.trim()
  customCloud.dialogStep = 'build'
}
</script>
