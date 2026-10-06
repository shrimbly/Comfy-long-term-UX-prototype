<!--
  Implements:
    concept: ../IA_Plan/wiki/concepts/custom-comfy-cloud.md

  Deployment status dot: ready (green), asleep (grey), building (blue).
-->
<template>
  <span
    :class="
      cn(
        'inline-block size-2 shrink-0 rounded-full',
        status === 'ready' && 'bg-success-background',
        status === 'asleep' && 'bg-muted-foreground',
        status === 'building' && 'bg-primary-background'
      )
    "
  />
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'

import type { DeploymentStatus } from '../types'

defineProps<{
  status: DeploymentStatus
}>()
</script>
