<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/project.md
    concept: ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — the project
             page says where it runs and whether it is up
    log:     ../prototype/design-decisions.md (2026-10-07 — Tabs chosen)

  Title row of the project page: the environment chip beside the title,
  Share, Media assets and "+ Workflow" on the right, and a tab strip for
  Workflows, Usage, Settings and Members. Media assets stays a button because it
  opens its own top-bar tab.
-->
<template>
  <header class="flex flex-col gap-4">
    <div class="flex items-end justify-between gap-4">
      <div class="flex min-w-0 items-center gap-3">
        <PageTitle class="relative top-2">{{ project.name }}</PageTitle>
        <button
          type="button"
          class="relative top-2 inline-flex h-7 cursor-pointer items-center rounded-full border border-border-subtle px-2.5 text-xs text-base-foreground transition-colors hover:bg-secondary-background"
          @click="emit('update:activeTab', 'settings')"
        >
          <ProjectEnvironmentChip :deployment />
        </button>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <button
          v-if="project.tier !== 'private'"
          type="button"
          :class="cn(secondaryButtonClass, 'gap-2 pl-1.5')"
          @click="emit('share')"
        >
          <span
            v-if="accessLevel !== 'private' && visibleAvatars.length"
            class="flex items-center"
          >
            <span
              v-for="(avatar, i) in visibleAvatars"
              :key="avatar.userId"
              :class="
                cn(
                  'grid size-6 place-items-center rounded-full border-2 border-secondary-background text-[10px] font-semibold text-button-surface-contrast',
                  i > 0 && '-ml-2'
                )
              "
              :style="{ backgroundColor: avatar.avatarColor }"
              :title="avatar.name"
            >
              {{ avatar.initial }}
            </span>
            <span
              v-if="hiddenAvatarCount > 0"
              class="-ml-2 grid size-6 place-items-center rounded-full border-2 border-secondary-background bg-secondary-background-hover text-[10px] font-semibold text-muted-foreground"
            >
              {{
                t('prototype.views.project.sharing.summaryMore', {
                  count: hiddenAvatarCount
                })
              }}
            </span>
          </span>
          <span class="font-medium">
            {{ t('prototype.views.project.sharing.shareButton') }}
          </span>
        </button>

        <button
          type="button"
          :class="cn(secondaryButtonClass, 'gap-1.5')"
          @click="emit('media')"
        >
          <span class="icon-[lucide--image] size-4" />
          {{ t('prototype.views.project.viewMediaAssets') }}
        </button>

        <button
          type="button"
          class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary-background px-3 text-sm font-medium text-button-surface-contrast transition-colors hover:bg-primary-background-hover"
          @click="emit('new-workflow')"
        >
          {{ t('prototype.views.project.newWorkflow') }}
        </button>
      </div>
    </div>

    <div
      role="tablist"
      class="flex items-center gap-1 border-b border-interface-stroke"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :class="
          cn(
            '-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm transition-colors',
            activeTab === tab.id
              ? 'border-base-foreground text-base-foreground'
              : 'border-transparent text-muted-foreground hover:text-base-foreground'
          )
        "
        @click="emit('update:activeTab', tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useProjectAccess } from '../../composables/useProjectAccess'
import { usePrototypeCustomCloudStore } from '../../stores/customCloudStore'
import type { Project } from '../../types'
import PageTitle from '../PageTitle.vue'
import ProjectEnvironmentChip from './ProjectEnvironmentChip.vue'

export type ProjectPageTab = 'workflows' | 'usage' | 'settings' | 'members'

const { project, activeTab, canViewUsage } = defineProps<{
  project: Project
  activeTab: ProjectPageTab
  canViewUsage: boolean
}>()

const emit = defineEmits<{
  'update:activeTab': [tab: ProjectPageTab]
  share: []
  media: []
  'new-workflow': []
}>()

const secondaryButtonClass =
  'inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-secondary-background px-3 text-sm text-base-foreground transition-colors hover:bg-secondary-background-hover'

const { t } = useI18n()
const customCloud = usePrototypeCustomCloudStore()

const deployment = computed(() => customCloud.deploymentOf(project.id))

const { accessLevel, visibleAvatars, hiddenAvatarCount } = useProjectAccess(
  () => project
)

const tabs = computed<{ id: ProjectPageTab; label: string }[]>(() => [
  { id: 'workflows', label: t('prototype.projectPage.tabs.workflows') },
  ...(canViewUsage
    ? [{ id: 'usage' as const, label: t('prototype.projectPage.tabs.usage') }]
    : []),
  { id: 'settings', label: t('prototype.projectPage.tabs.settings') },
  { id: 'members', label: t('prototype.projectPage.tabs.members') }
])
</script>
