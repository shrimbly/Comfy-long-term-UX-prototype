<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/project.md
    concept: ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — the project
             page says where it runs and whether it is up

  Title row of the project page, in three shapes picked by the presenter
  switcher:
    tabs  — environment chip beside the title; Workflows, Usage and
            Settings as a tab strip under it. Media assets stays a button:
            it opens its own top-bar tab
    quiet — one meta line under the title (environment, people, count);
            Media and Settings are icon buttons, Settings opens a sheet
    rail  — title and "+ Workflow" only; everything else lives in the rail
-->
<template>
  <header class="flex flex-col gap-4">
    <div class="flex items-end justify-between gap-4">
      <div class="flex min-w-0 flex-col gap-2">
        <div class="flex items-center gap-3">
          <PageTitle class="relative top-2">{{ project.name }}</PageTitle>
          <button
            v-if="variant === 'tabs'"
            type="button"
            class="relative top-2 inline-flex h-7 cursor-pointer items-center rounded-full border border-border-subtle px-2.5 text-xs text-base-foreground transition-colors hover:bg-secondary-background"
            @click="emit('update:activeTab', 'settings')"
          >
            <ProjectEnvironmentChip :deployment />
          </button>
        </div>
        <p
          v-if="variant === 'quiet'"
          class="m-0 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ProjectEnvironmentChip :deployment class="text-base-foreground" />
          <span aria-hidden="true">·</span>
          <span>{{ peopleText }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ workflowText }}</span>
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <button
          v-if="variant !== 'rail' && project.tier !== 'private'"
          type="button"
          :class="cn(secondaryButtonClass, 'gap-2 pl-1.5')"
          @click="emit('share')"
        >
          <span
            v-if="accessLevel !== 'private' && visibleAvatars.length"
            class="flex items-center"
          >
            <span
              v-for="(a, i) in visibleAvatars"
              :key="a.userId"
              :class="
                cn(
                  'grid size-6 place-items-center rounded-full border-2 border-secondary-background text-[10px] font-semibold text-button-surface-contrast',
                  i > 0 && '-ml-2'
                )
              "
              :style="{ backgroundColor: a.avatarColor }"
              :title="a.name"
            >
              {{ a.initial }}
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
          v-if="variant === 'tabs'"
          type="button"
          :class="cn(secondaryButtonClass, 'gap-1.5')"
          @click="emit('media')"
        >
          <span class="icon-[lucide--image] size-4" />
          {{ t('prototype.views.project.viewMediaAssets') }}
        </button>

        <template v-if="variant === 'quiet'">
          <button
            type="button"
            :class="cn(secondaryButtonClass, 'w-9 px-0')"
            :title="t('prototype.views.project.viewMediaAssets')"
            :aria-label="t('prototype.views.project.viewMediaAssets')"
            @click="emit('media')"
          >
            <span class="icon-[lucide--image] size-4" />
          </button>
          <button
            type="button"
            :class="cn(secondaryButtonClass, 'w-9 px-0')"
            :title="t('prototype.projectPage.tabs.settings')"
            :aria-label="t('prototype.projectPage.tabs.settings')"
            @click="emit('settings')"
          >
            <span class="icon-[lucide--settings] size-4" />
          </button>
        </template>

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
      v-if="variant === 'tabs'"
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
        @click="onTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div v-else class="border-b border-interface-stroke" />
  </header>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useProjectAccess } from '../../composables/useProjectAccess'
import { usePrototypeCustomCloudStore } from '../../stores/customCloudStore'
import { usePrototypePersonaStore } from '../../stores/personaStore'
import type { ProjectPageVariant } from '../../stores/uiStore'
import type { Project } from '../../types'
import PageTitle from '../PageTitle.vue'
import ProjectEnvironmentChip from './ProjectEnvironmentChip.vue'

export type ProjectPageTab = 'workflows' | 'usage' | 'settings'

const { project, variant, activeTab, canViewUsage, workflowCount } =
  defineProps<{
    project: Project
    variant: ProjectPageVariant
    activeTab: ProjectPageTab
    canViewUsage: boolean
    workflowCount: number
  }>()

const emit = defineEmits<{
  'update:activeTab': [tab: ProjectPageTab]
  share: []
  media: []
  settings: []
  'new-workflow': []
}>()

const secondaryButtonClass =
  'inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-secondary-background px-3 text-sm text-base-foreground transition-colors hover:bg-secondary-background-hover'

const { t } = useI18n()
const customCloud = usePrototypeCustomCloudStore()
const personaStore = usePrototypePersonaStore()

const deployment = computed(() => customCloud.deploymentOf(project.id))

const { accessLevel, visibleAvatars, hiddenAvatarCount, peopleCount } =
  useProjectAccess(() => project)

const peopleText = computed(() =>
  accessLevel.value === 'everyone'
    ? t('prototype.views.project.sharing.summaryAnyone', {
        workspace: personaStore.currentWorkspace?.name ?? ''
      })
    : t('prototype.views.project.sharing.summaryRestricted', {
        count: peopleCount.value
      })
)

const workflowText = computed(() =>
  t('prototype.views.projects.workflowCount', { count: workflowCount })
)

const tabs = computed<{ id: ProjectPageTab; label: string }[]>(() => [
  { id: 'workflows', label: t('prototype.projectPage.tabs.workflows') },
  ...(canViewUsage
    ? [{ id: 'usage' as const, label: t('prototype.projectPage.tabs.usage') }]
    : []),
  { id: 'settings', label: t('prototype.projectPage.tabs.settings') }
])

function onTab(tab: ProjectPageTab) {
  emit('update:activeTab', tab)
}
</script>
