<!--
  Implements:
    entity:   ../IA_Plan/wiki/entities/project.md
    concept:  ../IA_Plan/wiki/concepts/three-level-permissions.md — project level
    decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
              — "you name it and choose a backend for it"
    decision: prototype/design-decisions.md — 2026-10-07 "Flow 07: a new
              project is named and shared before it's made"

  The "New project" step: every path that makes a project names it and
  chooses who can access it, with the dashboard's New project fields. It
  comes after "Create project" on a deployment that runs the workflow, and
  again when a new deployment finishes, so a project only opens once it
  runs.
-->
<template>
  <header class="flex flex-col items-start gap-2 pr-8">
    <h2 :id="titleId" class="m-0 text-2xl font-semibold">
      {{ t('prototype.customCloud.dialog.project.title') }}
    </h2>
    <span
      v-if="deployment"
      class="inline-flex h-7 items-center gap-2 rounded-full border border-border-subtle px-2.5 text-[13px] text-muted-foreground"
    >
      <DeploymentStatusDot :status="deployment.status" />
      {{
        tText('prototype.customCloud.dialog.project.runsOn', {
          deployment: deployment.name
        })
      }}
    </span>
  </header>

  <div class="flex flex-col gap-4">
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
  </div>

  <footer class="flex items-center gap-2.5">
    <Button
      v-if="!justBuilt"
      variant="muted-textonly"
      size="lg"
      class="mr-auto px-1"
      @click="customCloud.dialogStep = 'choose'"
    >
      {{ t('prototype.customCloud.dialog.back') }}
    </Button>
    <Button
      variant="muted-textonly"
      size="lg"
      :class="cn(justBuilt && 'ml-auto')"
      @click="emit('close')"
    >
      {{ t('prototype.customCloud.dialog.notNow') }}
    </Button>
    <Button variant="inverted" size="lg" :disabled="!named" @click="onNext">
      {{ t('prototype.customCloud.dialog.createProject') }}
    </Button>
  </footer>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { useTextT } from '../composables/useTextT'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'

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

const deployment = computed(
  () =>
    customCloud.deploymentTargets.find(
      (target) => target.deployment.id === customCloud.deploymentTarget
    )?.deployment
)
// Straight from a finished build there is no step to go back to.
const justBuilt = computed(
  () => customCloud.deploymentTarget === customCloud.builtDeploymentId
)
const named = computed(() => customCloud.newProjectName.trim().length > 0)

function onNext() {
  if (!named.value || !deployment.value) return
  customCloud.createProjectOn(deployment.value.id)
}
</script>
