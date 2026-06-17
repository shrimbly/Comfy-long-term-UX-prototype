<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/project.md
    log:    ../prototype/design-decisions.md (2026-06-17 — projects read as
            folders, distinct from workflow file cards)

  A project reads as a folder (tab + contents preview of its workflows),
  deliberately distinct from the single-image WorkflowCard. Grid + list.
-->
<template>
  <button
    v-if="layout === 'grid'"
    type="button"
    :class="
      cn(
        'group flex flex-col gap-2.5 rounded-lg bg-secondary-background p-3 text-left text-base-foreground transition-colors select-none',
        project.currentUserHasAccess
          ? 'cursor-pointer hover:bg-secondary-background-hover'
          : 'cursor-not-allowed opacity-50'
      )
    "
    :disabled="!project.currentUserHasAccess"
    @click="emit('open', project.id)"
  >
    <span class="block w-full">
      <span class="block h-2 w-12 rounded-t-sm bg-secondary-background-hover" />
      <span
        class="grid aspect-3/2 w-full grid-cols-2 grid-rows-2 gap-1.5 overflow-hidden rounded-md rounded-tl-none bg-secondary-background-hover p-1.5"
      >
        <span
          v-for="(tile, i) in tiles"
          :key="i"
          :class="cn('block rounded-sm', !tile && 'bg-base-background/40')"
          :style="tile ? { background: workflowThumbnail(tile) } : undefined"
        />
      </span>
    </span>
    <span class="flex flex-col gap-1">
      <span class="flex items-center justify-between gap-2">
        <span class="flex min-w-0 items-center gap-1.5">
          <i
            class="icon-[lucide--folder] size-4 shrink-0 text-muted-foreground"
          />
          <span class="truncate text-sm/tight">{{ project.name }}</span>
        </span>
        <span :class="tierBadgeClass">
          {{ t(`prototype.projectTier.${project.tier}`) }}
        </span>
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
    </span>
  </button>

  <button
    v-else
    type="button"
    :class="
      cn(
        'group flex items-center gap-3 rounded-lg bg-secondary-background px-3 py-2.5 text-left text-base-foreground transition-colors select-none',
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
      <span
        :class="
          cn(
            'truncate text-xs text-muted-foreground',
            !project.currentUserHasAccess && 'italic'
          )
        "
      >
        {{ metaText }}
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { workflowThumbnail } from '../utils/thumbnail'
import type { Project, Workflow } from '../types'

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

// List chip second line: workflow count + the project's scope as "location".
const metaText = computed(() => {
  if (!project.currentUserHasAccess) {
    return t('prototype.views.projects.noAccess')
  }
  const count = t('prototype.views.projects.workflowCount', {
    count: workflows.length
  })
  return `${count} · ${t(`prototype.projectTier.${project.tier}`)}`
})

const tierBadgeClass = computed(() =>
  cn(
    'shrink-0 rounded-full px-2 py-0.5 text-xs',
    project.tier === 'restricted'
      ? 'bg-modal-card-tag-background text-modal-card-tag-foreground'
      : 'bg-secondary-background-hover text-muted-foreground'
  )
)
</script>
