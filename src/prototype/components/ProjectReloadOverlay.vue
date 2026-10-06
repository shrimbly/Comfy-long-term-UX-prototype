<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/project-switcher-in-tab-bar.md —
              switching projects is a full reload, for now ("they can have
              different front end extensions")

  The reload transition shown while the app "reloads" into another
  project, styled as ComfyUI's own loading screen (index.html's splash):
  the palette background and the Comfy logo filling with a wave. Covers the
  whole window, tab strip included.
-->
<template>
  <div
    class="fixed inset-0 z-60 flex flex-col items-center justify-center gap-6 bg-(--bg-color)"
    role="status"
    aria-live="polite"
  >
    <LogoComfyWaveLoader size="md" color="white" />
    <span class="text-sm text-muted-foreground">
      {{
        tText('prototype.customCloud.reload.opening', { project: project.name })
      }}
    </span>
  </div>
</template>

<script setup lang="ts">
import LogoComfyWaveLoader from '@/components/loader/LogoComfyWaveLoader.vue'

import { useTextT } from '../composables/useTextT'
import type { Project } from '../types'

defineProps<{
  project: Project
}>()

const tText = useTextT()
</script>
