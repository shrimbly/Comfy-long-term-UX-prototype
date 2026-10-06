<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md
    decision: ../IA_Plan/wiki/decisions/project-switcher-in-tab-bar.md

  A project's colour tile (its initial on the project colour) with the
  deployment status dot. The personal project (My Workflows) gets a neutral
  tile. Comfy Cloud projects show no dot: the shared default is always up.
-->
<template>
  <span
    :class="
      cn(
        'relative grid shrink-0 place-items-center rounded-sm font-semibold text-button-surface-contrast',
        size === 'sm' ? 'size-4 text-[9px]' : 'size-6 text-xs',
        !project.color && 'bg-secondary-background-hover'
      )
    "
    :style="project.color ? { backgroundColor: project.color } : undefined"
    aria-hidden="true"
  >
    <i v-if="project.isDrafts" class="icon-[lucide--user] size-3" />
    <template v-else>{{ project.name.charAt(0).toUpperCase() }}</template>
    <DeploymentStatusDot
      v-if="deployment.kind === 'custom'"
      :status="deployment.status"
      class="absolute -right-1 -bottom-1 ring-2 ring-base-background"
    />
  </span>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'

import type { Deployment, Project } from '../types'

import DeploymentStatusDot from './DeploymentStatusDot.vue'

const { size = 'md' } = defineProps<{
  project: Project
  deployment: Deployment
  size?: 'sm' | 'md'
}>()
</script>
