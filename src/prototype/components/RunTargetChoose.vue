<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
              — step 1, where it runs
    decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
              — a new project on an existing deployment; updating a
              deployment updates every project on it
    open-q:   ../IA_Plan/wiki/open-questions.md#dropped-workflow-other-deployment
              — working: update the project's own deployment on Platform, or
              make a new one
    decision: prototype/design-decisions.md — 2026-10-07 "Flow 07: the
              incompatible-workflow dialog, redesigned on a canvas"

  Step 1 of "choose where it runs", in one of three states:
    - existing: a deployment already runs the workflow. A new project on it
      is the main action; a new deployment is in the same picker; opening it
      in a project that runs it is the quiet option.
    - new: nothing runs it, from a Comfy Cloud project. Create a deployment;
      updating one on Platform is the quiet option.
    - update: nothing runs it, from a project on its own deployment. Update
      that deployment on Platform; a new deployment is the quiet option.
-->
<template>
  <h2 :id="titleId" class="m-0 pr-8 text-2xl font-semibold">{{ title }}</h2>

  <MissingItemsTable :missing="missing" />

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
    <footer class="flex items-center gap-2.5">
      <RunTargetProjectChooser
        :targets="customCloud.projectTargets"
        :current-project-id="customCloud.currentProject?.id"
        @pick="customCloud.openInProject"
      />
      <span class="mr-auto" />
      <Button variant="muted-textonly" size="lg" @click="emit('close')">
        {{ t('prototype.customCloud.dialog.notNow') }}
      </Button>
      <Button variant="inverted" size="lg" @click="onCreate">
        {{
          newDeploymentPicked
            ? t('prototype.customCloud.dialog.createDeployment')
            : t('prototype.customCloud.dialog.createProject')
        }}
      </Button>
    </footer>
  </template>

  <template v-else-if="mode === 'new'">
    <div class="flex flex-col gap-3">
      <span class="text-sm text-muted-foreground">
        {{ t('prototype.customCloud.dialog.newLabel') }}
      </span>
      <ul class="m-0 flex list-none flex-col gap-2.5 p-0 text-sm">
        <li
          v-for="benefit in benefits"
          :key="benefit"
          class="flex items-center gap-2.5"
        >
          <i
            class="icon-[lucide--check] size-4 shrink-0 text-success-background"
          />
          {{ benefit }}
        </li>
      </ul>
    </div>
    <footer class="flex items-center gap-2.5">
      <Button
        variant="muted-textonly"
        size="lg"
        class="mr-auto px-1 font-normal"
        @click="onPlatform"
      >
        {{ t('prototype.customCloud.dialog.updateExisting') }}
        <i class="icon-[lucide--external-link] size-3.5" />
      </Button>
      <Button variant="muted-textonly" size="lg" @click="emit('close')">
        {{ t('prototype.customCloud.dialog.notNow') }}
      </Button>
      <Button
        variant="inverted"
        size="lg"
        @click="customCloud.dialogStep = 'build'"
      >
        {{ t('prototype.customCloud.dialog.createDeployment') }}
      </Button>
    </footer>
  </template>

  <template v-else>
    <div class="flex flex-col gap-2">
      <span class="text-sm text-muted-foreground">
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
    <footer class="flex items-center gap-2.5">
      <Button
        variant="muted-textonly"
        size="lg"
        class="mr-auto px-1 font-normal"
        @click="customCloud.dialogStep = 'build'"
      >
        {{ t('prototype.customCloud.dialog.createInstead') }}
      </Button>
      <Button variant="muted-textonly" size="lg" @click="emit('close')">
        {{ t('prototype.customCloud.dialog.notNow') }}
      </Button>
      <Button variant="inverted" size="lg" @click="onPlatform">
        {{ t('prototype.customCloud.dialog.updateOnPlatform') }}
        <i class="icon-[lucide--external-link] size-3.5" />
      </Button>
    </footer>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import { useToastStore } from '@/platform/updates/common/toastStore'

import { useTextT } from '../composables/useTextT'
import { MATTE_PASS } from '../fixtures/customCloud'
import {
  NEW_BUILD_TARGET,
  usePrototypeCustomCloudStore
} from '../stores/customCloudStore'
import { missingFrom, nextRelease } from '../utils/deployment'

import DeploymentStatusDot from './DeploymentStatusDot.vue'
import MissingItemsTable from './MissingItemsTable.vue'
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
const toast = useToastStore()
const customCloud = usePrototypeCustomCloudStore()

const mode = computed(() => customCloud.chooseMode)
const deployment = computed(() => customCloud.currentDeployment)
const missing = computed(() => missingFrom(deployment.value, MATTE_PASS))
const newDeploymentPicked = computed(
  () => customCloud.deploymentTarget === NEW_BUILD_TARGET
)

const title = computed(() =>
  tText('prototype.customCloud.dialog.cantRunOn', {
    deployment: deployment.value.name
  })
)

const benefits = computed(() => [
  t('prototype.customCloud.dialog.benefits.pinned'),
  t('prototype.customCloud.dialog.benefits.ownProject'),
  t('prototype.customCloud.dialog.benefits.builtForYou')
])

function onCreate() {
  customCloud.dialogStep = newDeploymentPicked.value ? 'build' : 'project'
}

function onPlatform() {
  toast.add({
    severity: 'info',
    summary: t('prototype.customCloud.settings.platformToast'),
    detail: t('prototype.customCloud.dialog.platformToastDetail'),
    life: 3000
  })
}
</script>
