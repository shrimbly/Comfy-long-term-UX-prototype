<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/workflow.md
    log:    ../prototype/design-decisions.md (2026-05-15 Workflow context menu)

  Bare thumbnail + caption. The thumbnail is the card. Right-clicking
  anywhere on the card opens a role-gated WorkflowContextMenu.
-->
<template>
  <div
    :class="
      cn(
        'group text-base-foreground select-none',
        layout === 'grid' ? 'flex flex-col gap-2' : 'block'
      )
    "
    @contextmenu.prevent.stop="onContextMenu"
  >
    <button
      v-if="layout === 'grid'"
      type="button"
      class="flex cursor-pointer flex-col gap-2 text-left text-base-foreground"
      @click="emit('open', workflow.id)"
    >
      <span
        :class="
          cn(
            'block aspect-3/2 w-full overflow-hidden rounded-md ring-2 ring-offset-2 ring-offset-base-background transition-shadow',
            selected ? 'ring-primary-background' : 'ring-transparent'
          )
        "
        :style="{ background: thumbnail }"
      />
      <span class="flex flex-col">
        <span class="flex items-center gap-1.5">
          <span class="min-w-0 flex-1 truncate text-xs/tight">{{
            workflow.name
          }}</span>
          <StorageIcon
            v-if="workflow.storage"
            :storage="workflow.storage"
            :label="storageTitle"
            class="size-4 shrink-0 text-muted-foreground"
          />
        </span>
        <span class="text-xs text-muted-foreground">{{
          workflow.updatedAt
        }}</span>
      </span>
    </button>

    <button
      v-else
      type="button"
      :class="
        cn(
          'flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors',
          selected
            ? 'bg-secondary-background'
            : 'hover:bg-secondary-background-hover'
        )
      "
      @click="emit('open', workflow.id)"
    >
      <span
        class="block aspect-3/2 h-9 shrink-0 overflow-hidden rounded-md"
        :style="{ background: thumbnail }"
      />
      <span class="flex min-w-0 flex-1 items-center gap-1.5">
        <span class="truncate text-sm">{{ workflow.name }}</span>
      </span>
      <StorageIcon
        v-if="workflow.storage"
        :storage="workflow.storage"
        :label="storageTitle"
        class="size-4 shrink-0 text-muted-foreground"
      />
      <span class="shrink-0 text-xs text-muted-foreground">{{
        workflow.updatedAt
      }}</span>
    </button>

    <WorkflowContextMenu
      ref="menuRef"
      :workflow="workflow"
      :viewer-role="viewerRole"
      :show-open-containing-project="showOpenContainingProject"
      @open="emit('open', $event)"
      @open-project="emit('open-project', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import StorageIcon from './StorageIcon.vue'
import WorkflowContextMenu from './WorkflowContextMenu.vue'
import { useViewerWorkflowRole } from '../composables/useViewerWorkflowRole'
import { thumbnailGradient } from '../utils/thumbnail'
import type { Workflow } from '../types'

const {
  workflow,
  layout = 'grid',
  showOpenContainingProject = true,
  selected = false
} = defineProps<{
  workflow: Workflow
  layout?: 'grid' | 'list'
  showOpenContainingProject?: boolean
  selected?: boolean
}>()

const emit = defineEmits<{
  open: [workflowId: string]
  'open-project': [projectId: string]
}>()

const { t } = useI18n()
const thumbnail = computed(() => thumbnailGradient(workflow.id))

const storageTitle = computed(() =>
  t(
    workflow.storage === 'local'
      ? 'prototype.workflowCard.storageLocal'
      : 'prototype.workflowCard.storageCloud'
  )
)

const workflowRef = computed(() => workflow)
const viewerRole = useViewerWorkflowRole(workflowRef)

type MenuHandle = { show: (event: MouseEvent) => void }
const menuRef = ref<MenuHandle | null>(null)

function onContextMenu(event: MouseEvent) {
  menuRef.value?.show(event)
}
</script>
