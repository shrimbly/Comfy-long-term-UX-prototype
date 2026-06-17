<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/workflow.md
    log:    ../prototype/design-decisions.md (2026-05-15 Workflow context menu)

  Grid: a hairline-bordered card — full-bleed thumbnail with rounded top
  corners over a caption row (file-type icon, name, storage, modified).
  List: a compact row. Right-clicking either opens a role-gated
  WorkflowContextMenu.
-->
<template>
  <div
    class="text-base-foreground select-none"
    @contextmenu.prevent.stop="onContextMenu"
  >
    <button
      v-if="layout === 'grid'"
      type="button"
      :class="
        cn(
          'flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-secondary-background text-left text-base-foreground transition-colors',
          selected
            ? 'border-primary-background'
            : 'border-border-subtle hover:border-muted-foreground'
        )
      "
      @click="emit('open', workflow.id)"
    >
      <span class="block aspect-3/2 w-full overflow-hidden">
        <CustomThumbnail v-if="customThumbnails" :title="workflow.name" />
        <span
          v-else
          class="block size-full"
          :style="{ background: thumbnail }"
        />
      </span>
      <span class="flex flex-col px-3 py-2.5">
        <span class="flex items-center gap-1.5">
          <span class="min-w-0 flex-1 truncate text-xs/tight font-medium">{{
            workflow.name
          }}</span>
          <StorageIcon
            v-if="workflow.storage"
            :storage="workflow.storage"
            :label="storageTitle"
            class="size-4 shrink-0 text-muted-foreground"
          />
        </span>
        <span class="truncate text-xs text-muted-foreground">{{
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
      <span class="block aspect-3/2 h-9 shrink-0 overflow-hidden rounded-md">
        <CustomThumbnail v-if="customThumbnails" :title="workflow.name" />
        <span
          v-else
          class="block size-full"
          :style="{ background: thumbnail }"
        />
      </span>
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
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomThumbnail from './CustomThumbnail.vue'
import StorageIcon from './StorageIcon.vue'
import WorkflowContextMenu from './WorkflowContextMenu.vue'
import { useViewerWorkflowRole } from '../composables/useViewerWorkflowRole'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import { workflowThumbnail } from '../utils/thumbnail'
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
const personaStore = usePrototypePersonaStore()
const { customThumbnails } = storeToRefs(usePrototypeUiStore())

const thumbnail = computed(() =>
  workflowThumbnail(workflow, personaStore.workflowThumbnailSeed(workflow.id))
)

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
