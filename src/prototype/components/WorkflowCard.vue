<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/workflow.md
    Bare thumbnail + caption. No outer fill, no border, no hover wash —
    the thumbnail is the card.
-->
<template>
  <button
    type="button"
    class="group flex cursor-pointer flex-col gap-2 text-left text-base-foreground select-none"
    @click="emit('open', workflow.id)"
  >
    <span
      class="relative block aspect-square w-full overflow-hidden rounded-md"
      :style="{ background: thumbnail }"
    >
      <span
        v-if="workflow.storage"
        :title="
          t(
            workflow.storage === 'local'
              ? 'prototype.workflowCard.storageLocal'
              : 'prototype.workflowCard.storageCloud'
          )
        "
        class="absolute top-2 right-2 grid size-6 place-items-center rounded-sm bg-black/40 backdrop-blur-sm"
      >
        <i
          :class="
            cn(
              'size-3.5 text-white',
              workflow.storage === 'local'
                ? 'icon-[lucide--hard-drive]'
                : 'icon-[lucide--cloud]'
            )
          "
        />
      </span>
    </span>
    <span class="flex flex-col">
      <span class="truncate text-sm/tight">{{ workflow.name }}</span>
      <span class="text-xs text-muted-foreground">{{
        workflow.updatedAt
      }}</span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { thumbnailGradient } from '../utils/thumbnail'
import type { Workflow } from '../types'

const { workflow } = defineProps<{
  workflow: Workflow
}>()

const emit = defineEmits<{
  open: [workflowId: string]
}>()

const { t } = useI18n()
const thumbnail = computed(() => thumbnailGradient(workflow.id))
</script>
