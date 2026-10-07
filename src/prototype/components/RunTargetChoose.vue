<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
              — step 1, where it runs
    decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
              — a new project on an existing deployment; updating a
              deployment updates every project on it
    open-q:   ../IA_Plan/wiki/open-questions.md#dropped-workflow-other-deployment
              — working: update the project's own deployment
    decision: prototype/design-decisions.md — 2026-10-07 "Flow 07: the
              incompatible-workflow dialog, redesigned on a canvas"
    decision: prototype/design-decisions.md — 2026-10-08 "Flow 07: the
              coding agent leads 'choose where it runs'"

  Step 1 of "choose where it runs", in one of three states:
    - existing: a deployment already runs the workflow. A new project on it
      is the main action; a new deployment is in the same picker, and picking
      it offers the coding agent or building it here; opening it in a project
      that runs it is the quiet option.
    - new: nothing runs it, from a Comfy Cloud project. A new deployment,
      built by the user's coding agent or here. Packs picked in the Custom
      nodes modal of a Comfy Cloud project open this state too.
    - update: nothing runs it, from a project on its own deployment. A new
      release of that deployment, built by the coding agent or here.
-->
<template>
  <h2 :id="titleId" class="m-0 pr-8 text-2xl font-semibold">{{ title }}</h2>

  <MissingItemsTable :missing="missing" :picked="customCloud.forPacks" />

  <template v-if="mode === 'existing'">
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
    <footer v-else class="flex items-center gap-2.5">
      <RunTargetProjectChooser
        :targets="customCloud.projectTargets"
        :current-project-id="customCloud.currentProject?.id"
        @pick="customCloud.openInProject"
      />
      <span class="mr-auto" />
      <Button variant="muted-textonly" size="lg" @click="emit('close')">
        {{ t('prototype.customCloud.dialog.notNow') }}
      </Button>
      <Button
        variant="inverted"
        size="lg"
        @click="customCloud.dialogStep = 'project'"
      >
        {{ t('prototype.customCloud.dialog.createProject') }}
      </Button>
    </footer>
  </template>

  <template v-else-if="mode === 'new'">
    <div class="flex flex-col gap-1.5 text-sm">
      <template v-if="customCloud.forPacks">
        <span class="font-medium">
          {{ t('prototype.customCloud.dialog.packsLead') }}
        </span>
        <span class="text-muted-foreground">
          {{
            tText('prototype.customCloud.dialog.packsDetail', {
              project: customCloud.currentProject?.name ?? ''
            })
          }}
        </span>
      </template>
      <template v-else>
        <span class="font-medium">
          {{ t('prototype.customCloud.dialog.newLead') }}
        </span>
        <span class="text-muted-foreground">
          {{ t('prototype.customCloud.dialog.newDetail') }}
        </span>
      </template>
    </div>
    <RunTargetAgentChoice
      @agent="customCloud.dialogStep = 'agent'"
      @here="customCloud.dialogStep = 'build'"
    />
  </template>

  <template v-else>
    <div class="flex flex-col gap-2">
      <span class="text-sm font-medium">
        {{ t('prototype.customCloud.dialog.updateLabel') }}
      </span>
      <div
        class="flex h-11 items-center gap-2.5 rounded-lg border border-border-default bg-secondary-background px-3 text-sm"
      >
        <DeploymentStatusDot :status="deployment.status" />
        <span class="min-w-0 flex-1 truncate">{{ deployment.name }}</span>
        <span class="text-xs text-muted-foreground">
          {{
            t('prototype.customCloud.dialog.updateRelease', {
              from: deployment.release,
              to: nextRelease(deployment.release),
              items: [...missing.nodePacks, ...missing.models].join(', ')
            })
          }}
        </span>
      </div>
      <span class="text-xs text-muted-foreground">
        {{
          tText('prototype.customCloud.dialog.updateNote', {
            deployment: deployment.name
          })
        }}
      </span>
    </div>
    <RunTargetAgentChoice
      @agent="customCloud.dialogStep = 'agent'"
      @here="rebuildHere"
    />
  </template>
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
import { usePrototypeCustomNodesStore } from '../stores/customNodesStore'
import type { PackChange } from '../utils/customNodes'
import { missingFrom, nextRelease } from '../utils/deployment'

import DeploymentStatusDot from './DeploymentStatusDot.vue'
import MissingItemsTable from './MissingItemsTable.vue'
import RunTargetAgentChoice from './RunTargetAgentChoice.vue'
import RunTargetDeploymentPicker from './RunTargetDeploymentPicker.vue'
import RunTargetProjectChooser from './RunTargetProjectChooser.vue'

const { titleId } = defineProps<{
  titleId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const tText = useTextT()
const customCloud = usePrototypeCustomCloudStore()
const customNodes = usePrototypeCustomNodesStore()

const mode = computed(() => customCloud.chooseMode)
const deployment = computed(() => customCloud.currentDeployment)
const missing = computed(() => missingFrom(deployment.value, customCloud.needs))
const newDeploymentPicked = computed(
  () => customCloud.deploymentTarget === NEW_BUILD_TARGET
)

const title = computed(() =>
  customCloud.forPacks
    ? t('prototype.customCloud.dialog.packsTitle')
    : tText('prototype.customCloud.dialog.cantRunOn', {
        deployment: deployment.value.name
      })
)

// Building the new release here is the Install flow's rebuild: its
// confirmation, then the release builds behind the Building chip.
function rebuildHere() {
  customCloud.cancelAgentHandoff()
  customNodes.pendingChanges = missing.value.nodePacks.map(
    (packId): PackChange => ({
      kind: 'add',
      packId,
      to: null
    })
  )
  emit('close')
}
</script>
