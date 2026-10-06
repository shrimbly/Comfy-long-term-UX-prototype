<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
              step 3: "in the settings you can see where it's deployed"
    decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
    decision: ../IA_Plan/wiki/decisions/opinionated-roles-no-permission-matrix.md
              — only workspace admins change a project's deployment

  Read-mostly Deployment section of a project's settings: where it runs, the
  GPU, how long it stays warm, and a hand-off to Platform. Staging and
  production live on Platform and are out of scope here.
-->
<template>
  <section class="flex max-w-3xl flex-col gap-3">
    <header class="flex flex-col gap-1">
      <h2
        class="m-0 text-sm font-semibold tracking-wide text-base-foreground uppercase"
      >
        {{ t('prototype.customCloud.settings.deployment') }}
      </h2>
      <p class="m-0 text-sm text-muted-foreground">
        {{ t('prototype.customCloud.settings.deploymentHint') }}
      </p>
    </header>

    <dl
      class="m-0 flex flex-col rounded-lg border border-border-subtle bg-secondary-background/40 p-2"
    >
      <div class="flex items-center justify-between gap-6 px-4 py-3">
        <dt class="flex min-w-0 flex-col gap-1">
          <span class="text-base">{{
            t('prototype.customCloud.settings.runsOn')
          }}</span>
          <span class="text-xs text-muted-foreground">{{ runsOnDetail }}</span>
        </dt>
        <dd class="m-0 text-base">
          <DeploymentLabel :deployment with-dot />
        </dd>
      </div>
      <div
        class="flex items-center justify-between gap-6 border-t border-border-subtle px-4 py-3"
      >
        <dt class="text-base">{{ t('prototype.customCloud.settings.gpu') }}</dt>
        <dd class="m-0 text-base tabular-nums">
          {{ deployment.gpu ?? t('prototype.customCloud.settings.gpuShared') }}
        </dd>
      </div>
      <div
        v-if="deployment.warmMinutes"
        class="flex items-center justify-between gap-6 border-t border-border-subtle px-4 py-3"
      >
        <dt class="text-base">
          {{ t('prototype.customCloud.settings.warm') }}
        </dt>
        <dd class="m-0 text-base">
          {{
            t('prototype.customCloud.settings.warmValue', {
              minutes: deployment.warmMinutes
            })
          }}
        </dd>
      </div>
    </dl>

    <div class="flex items-center gap-2">
      <Button
        v-if="deployment.kind === 'custom'"
        variant="link"
        size="lg"
        class="mr-auto px-0"
        @click="onManageOnPlatform"
      >
        {{ t('prototype.customCloud.settings.manageOnPlatform') }}
        <i class="icon-[lucide--external-link] size-4" />
      </Button>
      <Button
        v-if="isAdmin"
        variant="secondary"
        size="lg"
        :class="cn(deployment.kind !== 'custom' && 'ml-auto')"
        @click="onChangeDeployment"
      >
        {{ t('prototype.customCloud.settings.change') }}
      </Button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { useToast } from 'primevue/usetoast'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { Project } from '../types'

import DeploymentLabel from './DeploymentLabel.vue'

const { project } = defineProps<{
  project: Project
}>()

const { t } = useI18n()
const toast = useToast()
const personaStore = usePrototypePersonaStore()
const customCloud = usePrototypeCustomCloudStore()

const deployment = computed(() => customCloud.deploymentOf(project.id))
const isAdmin = computed(
  () => personaStore.currentWorkspace?.currentUserRole === 'admin'
)

const runsOnDetail = computed(() => {
  if (deployment.value.kind !== 'custom') {
    return t('prototype.customCloud.settings.comfyCloudDetail')
  }
  const others = personaStore.fixture.projects.filter(
    (p) => p.id !== project.id && p.deploymentId === project.deploymentId
  ).length
  return t('prototype.customCloud.settings.sharedWith', { count: others })
})

function onManageOnPlatform() {
  toast.add({
    severity: 'info',
    summary: t('prototype.customCloud.settings.platformToast'),
    detail: t('prototype.customCloud.settings.platformToastDetail'),
    life: 3000
  })
}

function onChangeDeployment() {
  toast.add({
    severity: 'info',
    summary: t('prototype.customCloud.settings.change'),
    detail: t('prototype.customCloud.settings.changeToastDetail'),
    life: 3000
  })
}
</script>
