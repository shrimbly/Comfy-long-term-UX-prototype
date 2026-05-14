<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/project.md
    Bare thumbnail + caption. Supports grid + list layouts.
-->
<template>
  <button
    v-if="layout === 'grid'"
    type="button"
    :class="
      cn(
        'group flex flex-col gap-3 rounded-lg bg-secondary-background p-3 text-left text-base-foreground transition-colors select-none',
        project.currentUserHasAccess
          ? 'cursor-pointer hover:bg-secondary-background-hover'
          : 'cursor-not-allowed opacity-50'
      )
    "
    :disabled="!project.currentUserHasAccess"
    @click="emit('open', project.id)"
  >
    <span
      class="grid aspect-square w-full grid-cols-2 grid-rows-2 gap-2 overflow-hidden rounded-md"
    >
      <span
        v-for="(seed, i) in thumbnailSeeds"
        :key="i"
        class="block rounded-sm"
        :style="{ background: thumbnailGradient(seed) }"
      />
    </span>
    <span class="flex flex-col gap-1">
      <span class="flex items-center justify-between gap-2">
        <span class="truncate text-sm/tight">{{ project.name }}</span>
        <span
          :class="
            cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs',
              project.tier === 'restricted'
                ? 'bg-warning-background text-button-surface-contrast'
                : 'bg-secondary-background text-muted-foreground'
            )
          "
        >
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
        'group flex w-full items-center gap-3 rounded-lg bg-secondary-background px-3 py-2 text-left text-base-foreground transition-colors select-none',
        project.currentUserHasAccess
          ? 'cursor-pointer hover:bg-secondary-background-hover'
          : 'cursor-not-allowed opacity-50'
      )
    "
    :disabled="!project.currentUserHasAccess"
    @click="emit('open', project.id)"
  >
    <span
      class="grid size-10 shrink-0 grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-md"
    >
      <span
        v-for="(seed, i) in thumbnailSeeds"
        :key="i"
        class="block rounded-xs"
        :style="{ background: thumbnailGradient(seed) }"
      />
    </span>
    <span class="min-w-0 flex-1 truncate text-sm/tight">{{
      project.name
    }}</span>
    <span class="shrink-0 text-xs text-muted-foreground">
      {{
        t('prototype.views.projects.workflowCount', {
          count: workflows.length
        })
      }}
    </span>
    <span
      :class="
        cn(
          'shrink-0 rounded-full px-2 py-0.5 text-xs',
          project.tier === 'restricted'
            ? 'bg-warning-background text-button-surface-contrast'
            : 'bg-secondary-background-hover text-muted-foreground'
        )
      "
    >
      {{ t(`prototype.projectTier.${project.tier}`) }}
    </span>
    <span
      v-if="!project.currentUserHasAccess"
      class="shrink-0 text-xs text-muted-foreground italic"
    >
      {{ t('prototype.views.projects.noAccess') }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { thumbnailGradient } from '../utils/thumbnail'
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

const thumbnailSeeds = computed(() => {
  const seeds = workflows.slice(0, 4).map((w) => w.id)
  while (seeds.length < 4) seeds.push(`${project.id}-${seeds.length}`)
  return seeds
})
</script>
