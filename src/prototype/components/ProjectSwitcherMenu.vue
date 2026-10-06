<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/project-switcher-in-tab-bar.md
              — "The menu lists projects with where each runs"
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
              step 8
    decision: prototype/design-decisions.md — 2026-10-07 "Project switcher
              menu: search, recent first"

  The project switcher's menu. Typing filters by name as soon as it opens;
  the arrows move, Enter switches and Escape closes. Recent projects come
  first, then the rest A–Z. Each row leads with the pill's glyph (a person,
  a cloud, or the deployment's status dot), or a tick for the current
  project, and a custom deployment's row says where it runs.
-->
<template>
  <ListboxRoot
    :model-value="project.id"
    selection-behavior="replace"
    highlight-on-hover
    class="flex min-h-0 flex-col"
  >
    <div :class="cn(searchInputVariants({ size: 'md' }), 'm-1 w-auto')">
      <i
        :class="
          cn(
            'pointer-events-none absolute icon-[lucide--search] text-muted-foreground',
            searchSize.iconPos,
            searchSize.icon
          )
        "
      />
      <ListboxFilter
        v-model="query"
        auto-focus
        :placeholder="t('prototype.customCloud.switcher.search')"
        :aria-label="t('prototype.customCloud.switcher.search')"
        :class="
          cn(
            'size-full min-w-0 border-none bg-transparent outline-none placeholder:text-muted-foreground',
            searchSize.inputPl,
            searchSize.inputText
          )
        "
      />
      <Button
        v-if="query"
        variant="textonly"
        size="icon-sm"
        tabindex="-1"
        :aria-label="t('g.clear')"
        @mousedown.prevent
        @click="query = ''"
      >
        <i class="icon-[lucide--x] size-4" />
      </Button>
    </div>
    <ListboxContent class="flex max-h-112 flex-col overflow-y-auto px-1 pb-1">
      <ListboxGroup
        v-for="section in sections"
        :key="section.label ?? 'matches'"
        class="flex flex-col"
      >
        <ListboxGroupLabel
          v-if="section.label"
          class="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground"
        >
          {{ t(SECTION_LABELS[section.label]) }}
        </ListboxGroupLabel>
        <ListboxItem
          v-for="p in section.projects"
          :key="p.id"
          :value="p.id"
          class="flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm outline-none data-highlighted:bg-secondary-background-hover"
          @select="onPick(p.id)"
        >
          <span
            class="grid size-4 shrink-0 place-items-center text-muted-foreground"
          >
            <i
              v-if="p.id === project.id"
              class="icon-[lucide--check] size-4 text-base-foreground"
            />
            <i v-else-if="p.isDrafts" class="icon-[lucide--user] size-3" />
            <i
              v-else-if="p.deployment.kind === 'comfy-cloud'"
              class="icon-[lucide--cloud] size-3.5"
            />
            <DeploymentStatusDot
              v-else
              :status="p.deployment.status"
              :class="
                cn(
                  p.deployment.status === 'building' &&
                    'ring-3 ring-primary-background/25'
                )
              "
            />
          </span>
          <span class="min-w-0 flex-1 truncate">{{ p.name }}</span>
          <span
            v-if="p.deployment.kind === 'custom'"
            class="max-w-33 truncate text-xs text-muted-foreground"
          >
            {{ whereItRuns(p.deployment) }}
          </span>
        </ListboxItem>
      </ListboxGroup>
      <p
        v-if="!sections.length"
        class="m-0 px-3 py-5 text-center text-sm text-muted-foreground"
      >
        {{
          t('prototype.customCloud.switcher.noMatch', { query: query.trim() })
        }}
      </p>
    </ListboxContent>
  </ListboxRoot>
  <div class="h-px bg-border-subtle" />
  <div class="p-1">
    <Button
      variant="textonly"
      size="unset"
      class="h-8 w-full justify-start gap-2 rounded-lg px-2 text-sm font-normal"
      @click="onAllProjects"
    >
      <i class="icon-[lucide--folder] size-4 text-muted-foreground" />
      {{ t('prototype.customCloud.switcher.allProjects') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import {
  ListboxContent,
  ListboxFilter,
  ListboxGroup,
  ListboxGroupLabel,
  ListboxItem,
  ListboxRoot
} from 'reka-ui'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import Button from '@/components/ui/button/Button.vue'
import {
  searchInputSizeConfig,
  searchInputVariants
} from '@/components/ui/search-input/searchInput.variants'

import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { HOME_TAB_ID, usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import type { Deployment, Project } from '../types'
import { switcherSections } from '../utils/projectSwitcher'

import DeploymentStatusDot from './DeploymentStatusDot.vue'

const { project } = defineProps<{
  project: Project
}>()

const SECTION_LABELS = {
  recent: 'prototype.customCloud.switcher.recent',
  others: 'prototype.customCloud.switcher.otherProjects'
} as const

const searchSize = searchInputSizeConfig.md

const { t } = useI18n()
const router = useRouter()
const customCloud = usePrototypeCustomCloudStore()
const tabsStore = usePrototypeTabsStore()
const uiStore = usePrototypeUiStore()

const query = ref('')

const sections = computed(() =>
  switcherSections(
    customCloud.switchableProjects.map((p) => ({
      ...p,
      deployment: customCloud.deploymentOf(p.id)
    })),
    customCloud.recentProjectIds,
    query.value
  )
)

const buildMinutesLeft = computed(() => {
  const progress = customCloud.progress
  return progress ? Math.max(1, Math.ceil(progress.remainingSeconds / 60)) : 0
})

function whereItRuns(deployment: Deployment) {
  return deployment.status === 'building' && buildMinutesLeft.value
    ? t('prototype.customCloud.switcher.building', {
        minutes: buildMinutesLeft.value
      })
    : deployment.name
}

async function onPick(projectId: string) {
  customCloud.switcherOpen = false
  await router.push({ name: 'PrototypeDashboard' })
  customCloud.switchProject(projectId)
}

async function onAllProjects() {
  customCloud.switcherOpen = false
  tabsStore.select(HOME_TAB_ID)
  uiStore.go({ kind: 'projects' })
  await router.push({ name: 'PrototypeDashboard' })
}
</script>
