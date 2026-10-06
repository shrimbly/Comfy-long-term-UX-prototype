<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
              step 6
    decision: prototype/design-decisions.md — 2026-10-07 "Flow 07: the
              project opens only once its deployment is done"

  The tab strip's "Building Matte R&D · 18 min" chip while a new deployment
  builds in the background. It opens the build's progress again.
-->
<template>
  <div class="flex shrink-0 items-center px-1.5">
    <Button
      variant="secondary"
      size="unset"
      class="h-7 gap-2 rounded-full px-3 text-xs font-normal"
      @click="customCloud.dialogStep = 'building'"
    >
      <DeploymentStatusDot :status="deployment.status" />
      {{
        tText('prototype.customCloud.lock.chip', {
          deployment: deployment.name,
          minutes: Math.max(1, Math.ceil(remainingSeconds / 60))
        })
      }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'

import { useTextT } from '../composables/useTextT'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import type { Deployment } from '../types'

import DeploymentStatusDot from './DeploymentStatusDot.vue'

const { deployment, remainingSeconds } = defineProps<{
  deployment: Deployment
  remainingSeconds: number
}>()

const tText = useTextT()
const customCloud = usePrototypeCustomCloudStore()
</script>
