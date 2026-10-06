<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/project-switcher-in-tab-bar.md —
              switching projects is a full reload, for now ("they can have
              different front end extensions")

  The brief reload transition shown while the app "reloads" into another
  project. Covers the whole window, tab strip included.
-->
<template>
  <div
    class="fixed inset-0 z-60 flex flex-col items-center justify-center gap-4 bg-base-background text-base-foreground"
    role="status"
    aria-live="polite"
  >
    <ProjectTile :project :deployment />
    <span class="text-sm">
      {{
        tText('prototype.customCloud.reload.opening', { project: project.name })
      }}
    </span>
    <span
      class="h-0.5 w-40 overflow-hidden rounded-full bg-secondary-background"
    >
      <span
        class="block h-full w-1/3 animate-pulse rounded-full bg-primary-background"
      />
    </span>
  </div>
</template>

<script setup lang="ts">
import { useTextT } from '../composables/useTextT'
import type { Deployment, Project } from '../types'

import ProjectTile from './ProjectTile.vue'

defineProps<{
  project: Project
  deployment: Deployment
}>()

const tText = useTextT()
</script>
