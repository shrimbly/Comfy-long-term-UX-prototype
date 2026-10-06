<!--
  Implements:
    concept: ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — where a project
             runs: "Acme Studio pipeline · v3 · ready", or "Comfy Cloud"

  One-line "where it runs" label for project cards, menus and settings.
-->
<template>
  <span class="inline-flex min-w-0 items-center gap-1.5">
    <DeploymentStatusDot
      v-if="withDot && deployment.kind === 'custom'"
      :status="deployment.status"
    />
    <span class="truncate">{{ text }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useTextT } from '../composables/useTextT'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import type { Deployment, DeploymentStatus } from '../types'

import DeploymentStatusDot from './DeploymentStatusDot.vue'

const { deployment, withDot = false } = defineProps<{
  deployment: Deployment
  withDot?: boolean
}>()

const STATUS_KEYS: Record<DeploymentStatus, string> = {
  ready: 'prototype.customCloud.status.ready',
  asleep: 'prototype.customCloud.status.asleep',
  building: 'prototype.customCloud.status.building'
}

const { t } = useI18n()
const tText = useTextT()
const customCloud = usePrototypeCustomCloudStore()

const status = computed(() => {
  const progress = customCloud.progress
  if (deployment.status === 'building' && progress) {
    return t('prototype.customCloud.status.buildingLeft', {
      minutes: Math.max(1, Math.ceil(progress.remainingSeconds / 60))
    })
  }
  return t(STATUS_KEYS[deployment.status])
})

const text = computed(() =>
  deployment.kind === 'custom'
    ? tText('prototype.customCloud.deploymentLine', {
        name: deployment.name,
        release: deployment.release,
        status: status.value
      })
    : deployment.name
)
</script>
