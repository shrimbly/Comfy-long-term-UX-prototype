<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
              — "you name it and choose a backend for it"
    decision: prototype/design-decisions.md — 2026-10-08 "Flow 07: the
              coding agent leads 'choose where it runs'"

  The only screen the agent path shows after the prompt: the user's coding
  agent has deployed, so the dialog comes back to choose the new deployment
  for a project. The "New project" step names it next.
-->
<template>
  <header class="flex flex-col gap-2.5 pr-8">
    <h2 :id="titleId" class="m-0 text-2xl font-semibold">
      {{
        tText('prototype.customCloud.dialog.agentDone.title', {
          deployment: built?.name ?? ''
        })
      }}
    </h2>
    <p class="m-0 text-sm text-muted-foreground">
      {{
        t('prototype.customCloud.dialog.agentDone.body', {
          workflow: MATTE_PASS.name,
          items: [...MATTE_PASS.nodePacks, ...MATTE_PASS.models].join(', ')
        })
      }}
    </p>
  </header>

  <div class="flex flex-col gap-2">
    <span class="text-sm text-muted-foreground">
      {{ t('prototype.customCloud.dialog.runsOnLabel') }}
    </span>
    <RunTargetDeploymentPicker
      v-model="customCloud.deploymentTarget"
      :targets="customCloud.deploymentTargets"
    />
  </div>

  <RunTargetAgentChoice
    v-if="newDeploymentPicked"
    @agent="customCloud.dialogStep = 'agent'"
    @here="customCloud.dialogStep = 'build'"
  />
  <footer v-else class="flex justify-end">
    <Button
      variant="inverted"
      size="lg"
      @click="customCloud.dialogStep = 'project'"
    >
      {{ t('prototype.customCloud.dialog.createProject') }}
    </Button>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { useTextT } from '../composables/useTextT'
import { MATTE_PASS } from '../fixtures/customCloud'
import {
  NEW_BUILD_TARGET,
  usePrototypeCustomCloudStore
} from '../stores/customCloudStore'

import RunTargetAgentChoice from './RunTargetAgentChoice.vue'
import RunTargetDeploymentPicker from './RunTargetDeploymentPicker.vue'

const { titleId } = defineProps<{
  titleId: string
}>()

const { t } = useI18n()
const tText = useTextT()
const customCloud = usePrototypeCustomCloudStore()

const built = computed(
  () =>
    customCloud.deploymentTargets.find(
      (target) => target.deployment.id === customCloud.builtDeploymentId
    )?.deployment
)
const newDeploymentPicked = computed(
  () => customCloud.deploymentTarget === NEW_BUILD_TARGET
)
</script>
