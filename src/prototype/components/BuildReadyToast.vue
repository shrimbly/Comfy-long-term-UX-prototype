<!--
  Implements:
    concept: ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
             step 7: "all the red around the nodes is gone"

  Shown once a demo build is ready: the project now has every node and
  model matte_pass needs.
-->
<template>
  <div
    role="status"
    class="absolute top-24 right-5 z-30 flex w-100 items-start gap-2.5 rounded-lg border border-l-4 border-border-default border-l-success-background bg-base-background py-3.5 pr-3.5 pl-3 shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
  >
    <i
      class="mt-0.5 icon-[lucide--circle-check] size-5 shrink-0 text-success-background"
    />
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <span class="text-base">
        {{
          tText('prototype.customCloud.ready.title', { project: project.name })
        }}
      </span>
      <span class="text-sm text-muted-foreground">
        {{
          tText('prototype.customCloud.ready.body', {
            workflow: MATTE_PASS.name,
            project: project.name
          })
        }}
      </span>
    </div>
    <Button
      variant="muted-textonly"
      size="icon-sm"
      :aria-label="t('prototype.customCloud.ready.dismiss')"
      @click="customCloud.readyProjectId = null"
    >
      <i class="icon-[lucide--x] size-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { useTextT } from '../composables/useTextT'
import { MATTE_PASS } from '../fixtures/customCloud'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import type { Project } from '../types'

defineProps<{
  project: Project
}>()

const { t } = useI18n()
const tText = useTextT()
const customCloud = usePrototypeCustomCloudStore()
</script>
