<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/workflow.md
    log:    ../prototype/design-decisions.md (2026-05-15 Workflow context menu)

  Bare thumbnail + caption. The thumbnail is the card. Right-clicking
  anywhere on the card opens a role-gated WorkflowContextMenu.
-->
<template>
  <div
    class="group flex flex-col gap-2 text-base-foreground select-none"
    @contextmenu.prevent.stop="onContextMenu"
  >
    <button
      type="button"
      class="flex cursor-pointer flex-col gap-2 text-left text-base-foreground"
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
        <span class="flex items-center gap-1.5">
          <span class="truncate text-sm/tight">{{ workflow.name }}</span>
          <span
            v-if="isBranch"
            class="shrink-0 rounded-sm bg-secondary-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
          >
            {{ t('prototype.workflowCard.branchBadge') }}
          </span>
        </span>
        <span class="text-xs text-muted-foreground">
          {{
            ownerName
              ? t('prototype.workflowCard.meta', {
                  date: workflow.updatedAt,
                  user: ownerName
                })
              : workflow.updatedAt
          }}
        </span>
      </span>
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

import WorkflowContextMenu from './WorkflowContextMenu.vue'
import { useViewerWorkflowRole } from '../composables/useViewerWorkflowRole'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { thumbnailGradient } from '../utils/thumbnail'
import type { Workflow } from '../types'

const { workflow, showOpenContainingProject = true } = defineProps<{
  workflow: Workflow
  showOpenContainingProject?: boolean
}>()

const emit = defineEmits<{
  open: [workflowId: string]
  'open-project': [projectId: string]
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const thumbnail = computed(() => thumbnailGradient(workflow.id))
const isBranch = computed(() => !!workflow.forkedFrom)

// Branch cards show whose branch it is next to the date.
const ownerName = computed(() => {
  if (!workflow.forkedFrom) return null
  const id = workflow.ownerUserId
  if (!id) return null
  return personaStore.fixture.members.find((m) => m.id === id)?.name ?? null
})

const workflowRef = computed(() => workflow)
const viewerRole = useViewerWorkflowRole(workflowRef)

type MenuHandle = { show: (event: MouseEvent) => void }
const menuRef = ref<MenuHandle | null>(null)

function onContextMenu(event: MouseEvent) {
  menuRef.value?.show(event)
}
</script>
