<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/project.md
    log:    ../prototype/design-decisions.md (2026-06-17 — projects read as
            folders, distinct from workflow file cards)
    concept: ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — each card
             says where the project runs

  A project reads as a folder (tab + contents preview of its workflows),
  deliberately distinct from the single-image WorkflowCard. Grid + list.
  Right-clicking opens a role-gated ProjectContextMenu.
-->
<template>
  <div @contextmenu.prevent.stop="onContextMenu">
    <button
      v-if="layout === 'grid'"
      type="button"
      :class="
        cn(
          'group flex w-full flex-col gap-2.5 rounded-lg bg-secondary-background p-3 text-left text-base-foreground transition-colors select-none',
          project.currentUserHasAccess
            ? 'cursor-pointer hover:bg-secondary-background-hover'
            : 'cursor-not-allowed opacity-50'
        )
      "
      :disabled="!project.currentUserHasAccess"
      @click="emit('open', project.id)"
    >
      <span
        class="grid aspect-3/2 w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-md"
      >
        <span
          v-for="(tile, i) in tiles"
          :key="i"
          :class="cn('block', !tile && 'bg-base-background/40')"
          :style="tile ? { background: workflowThumbnail(tile) } : undefined"
        />
      </span>
      <span class="flex flex-col gap-1">
        <span class="flex items-center justify-between gap-2">
          <span class="flex min-w-0 items-center gap-1.5">
            <i
              class="icon-[lucide--folder] size-4 shrink-0 text-muted-foreground"
            />
            <span class="truncate text-sm/tight">{{ project.name }}</span>
          </span>
          <ProjectAccessBadge :project="project" />
        </span>
        <span class="flex items-center justify-between gap-2">
          <span class="text-xs text-muted-foreground">
            {{
              t('prototype.views.projects.workflowCount', {
                count: workflows.length
              })
            }}
          </span>
          <span
            v-if="!project.currentUserHasAccess"
            class="text-xs text-muted-foreground italic"
          >
            {{ t('prototype.views.projects.noAccess') }}
          </span>
        </span>
        <DeploymentLabel
          :deployment
          with-dot
          class="text-xs text-muted-foreground"
        />
      </span>
    </button>

    <button
      v-else
      type="button"
      :class="
        cn(
          'group flex w-full items-center gap-3 rounded-lg bg-secondary-background px-3 py-2.5 text-left text-base-foreground transition-colors select-none',
          project.currentUserHasAccess
            ? 'cursor-pointer hover:bg-secondary-background-hover'
            : 'cursor-not-allowed opacity-50'
        )
      "
      :disabled="!project.currentUserHasAccess"
      @click="emit('open', project.id)"
    >
      <span
        class="grid size-9 shrink-0 place-items-center rounded-md bg-secondary-background-hover"
      >
        <i class="icon-[lucide--folder] size-4 text-muted-foreground" />
      </span>
      <span class="flex min-w-0 flex-1 flex-col">
        <span class="truncate text-sm/tight">{{ project.name }}</span>
        <DeploymentLabel
          v-if="project.currentUserHasAccess"
          :deployment
          with-dot
          class="text-xs text-muted-foreground"
        />
        <span v-else class="truncate text-xs text-muted-foreground italic">
          {{ t('prototype.views.projects.noAccess') }}
        </span>
      </span>
      <ProjectAccessBadge :project="project" />
    </button>

    <ProjectContextMenu
      ref="menuRef"
      :project="project"
      @open="emit('open', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { workflowThumbnail } from '../utils/thumbnail'
import type { Project, Workflow } from '../types'

import DeploymentLabel from './DeploymentLabel.vue'
import ProjectAccessBadge from './ProjectAccessBadge.vue'
import ProjectContextMenu from './ProjectContextMenu.vue'

const {
  project,
  workflows = [],
  layout = 'grid'
} = defineProps<{
  project: Project
  workflows?: Workflow[]
  layout?: 'grid' | 'list'
}>()

const emit = defineEmits<{
  open: [projectId: string]
}>()

const { t } = useI18n()

// Contents preview: one tile per workflow (capped at 4), each showing the
// workflow's own thumbnail; empty slots recessed.
const tiles = computed(() => {
  const items = workflows.slice(0, 4)
  return Array.from({ length: 4 }, (_, i) => items[i] ?? null)
})

const customCloud = usePrototypeCustomCloudStore()
const deployment = computed(() => customCloud.deploymentOf(project.id))

type MenuHandle = { show: (event: MouseEvent) => void }
const menuRef = ref<MenuHandle | null>(null)

function onContextMenu(event: MouseEvent) {
  if (!project.currentUserHasAccess) return
  menuRef.value?.show(event)
}
</script>
