<!--
  Implements:
    concept: ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — where a project
             runs, and whether it is up

  Dot + name, or a cloud icon for Comfy Cloud, which is always up. The
  status word shows only when the environment is not ready ("asleep",
  "building · 12 min"), so a healthy project reads as one name.
-->
<template>
  <span class="inline-flex min-w-0 items-center gap-2">
    <i
      v-if="deployment.kind === 'comfy-cloud'"
      class="icon-[lucide--cloud] size-3.5 shrink-0 text-muted-foreground"
    />
    <DeploymentStatusDot v-else :status="deployment.status" />
    <span class="truncate">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePrototypeCustomCloudStore } from '../../stores/customCloudStore'
import type { Deployment } from '../../types'
import DeploymentStatusDot from '../DeploymentStatusDot.vue'

const { deployment } = defineProps<{
  deployment: Deployment
}>()

const { t } = useI18n()
const customCloud = usePrototypeCustomCloudStore()

const statusText = computed(() => {
  if (deployment.status === 'ready') return null
  const progress = customCloud.progress
  if (deployment.status === 'building' && progress) {
    return t('prototype.projectPage.environment.buildingLeft', {
      minutes: Math.max(1, Math.ceil(progress.remainingSeconds / 60))
    })
  }
  return t(`prototype.customCloud.status.${deployment.status}`)
})

const label = computed(() =>
  statusText.value
    ? t('prototype.projectPage.environment.withStatus', {
        name: deployment.name,
        status: statusText.value
      })
    : deployment.name
)
</script>
