<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/project-switcher-in-tab-bar.md
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
              step 8
    open-q:   ../IA_Plan/wiki/open-questions.md#project-switch-reload
              — working: reload, for now

  Project switcher in the tab strip, after Home and before the tabs: "the
  parent of all". A neutral pill with the deployment's status dot (blue with
  a halo and the minutes left while building, green when ready, grey when
  asleep), the name cut at about 15 characters and shown in full on hover.
  The menu lists every project, with its colour tile and where it runs.
  Picking one reloads into that project's remembered tabs.
-->
<template>
  <div
    class="flex shrink-0 items-center border-r border-(--border-color) pr-2 pl-0.5"
  >
    <PopoverRoot v-model:open="customCloud.switcherOpen">
      <PopoverTrigger as-child>
        <Button
          variant="secondary"
          size="unset"
          :class="
            cn(
              'h-6.5 max-w-65 gap-2 rounded-full border border-border-subtle pr-2 pl-2.5 text-[13px] font-medium text-base-foreground',
              customCloud.switcherOpen && 'bg-secondary-background-hover'
            )
          "
          :title="project.name"
          :aria-label="t('prototype.customCloud.switcher.label')"
        >
          <i
            v-if="project.isDrafts"
            class="icon-[lucide--user] size-3 text-muted-foreground"
          />
          <DeploymentStatusDot
            v-else
            :status="deployment.status"
            :class="
              cn(
                deployment.status === 'building' &&
                  'ring-3 ring-primary-background/25'
              )
            "
          />
          <span class="max-w-[15ch] truncate">{{ project.name }}</span>
          <span
            v-if="minutesLeft"
            class="text-xs font-normal whitespace-nowrap text-muted-foreground"
          >
            {{
              t('prototype.customCloud.switcher.building', {
                minutes: minutesLeft
              })
            }}
          </span>
          <i
            class="icon-[lucide--chevron-down] size-3.5 text-muted-foreground"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        :side-offset="4"
        class="w-80 border-border-default bg-interface-menu-surface p-0"
      >
        <div class="flex items-center gap-2 px-3 py-2">
          <ProjectTile :project :deployment />
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="truncate text-sm font-medium">{{ project.name }}</span>
            <DeploymentLabel
              :deployment
              class="text-xs text-muted-foreground"
            />
          </span>
        </div>
        <div class="h-px bg-border-default" />
        <div class="flex max-h-96 flex-col overflow-y-auto p-1">
          <span
            class="px-2 pt-1.5 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            {{ t('prototype.customCloud.switcher.projects') }}
          </span>
          <Button
            v-for="p in customCloud.switchableProjects"
            :key="p.id"
            variant="textonly"
            size="unset"
            :class="
              cn(
                'w-full justify-start gap-2 rounded-md px-2 py-1.5 text-left font-normal',
                p.id === project.id &&
                  'bg-interface-menu-component-surface-selected'
              )
            "
            @click="onPick(p.id)"
          >
            <ProjectTile
              :project="p"
              :deployment="customCloud.deploymentOf(p.id)"
              size="sm"
            />
            <span class="flex min-w-0 flex-1 flex-col">
              <span class="truncate text-sm">{{ p.name }}</span>
              <DeploymentLabel
                :deployment="customCloud.deploymentOf(p.id)"
                class="text-xs text-muted-foreground"
              />
            </span>
            <i
              v-if="p.id === project.id"
              class="icon-[lucide--check] size-4 text-muted-foreground"
            />
          </Button>
        </div>
        <div class="h-px bg-border-default" />
        <div class="p-1">
          <Button
            variant="textonly"
            size="unset"
            class="w-full justify-start gap-2 rounded-md px-2 py-1.5 font-normal"
            @click="onAllProjects"
          >
            <i class="icon-[lucide--folder] size-4 text-muted-foreground" />
            {{ t('prototype.customCloud.switcher.allProjects') }}
          </Button>
        </div>
      </PopoverContent>
    </PopoverRoot>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import PopoverContent from '@/components/ui/popover/PopoverContent.vue'

import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { HOME_TAB_ID, usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import type { Project } from '../types'

import DeploymentLabel from './DeploymentLabel.vue'
import DeploymentStatusDot from './DeploymentStatusDot.vue'
import ProjectTile from './ProjectTile.vue'

const { project } = defineProps<{
  project: Project
}>()

const { t } = useI18n()
const customCloud = usePrototypeCustomCloudStore()
const tabsStore = usePrototypeTabsStore()
const uiStore = usePrototypeUiStore()

const deployment = computed(() => customCloud.deploymentOf(project.id))

const minutesLeft = computed(() => {
  const progress = customCloud.progress
  if (deployment.value.status !== 'building' || !progress) return null
  return Math.max(1, Math.ceil(progress.remainingSeconds / 60))
})

function onPick(projectId: string) {
  customCloud.switcherOpen = false
  customCloud.switchProject(projectId)
}

function onAllProjects() {
  customCloud.switcherOpen = false
  tabsStore.select(HOME_TAB_ID)
  uiStore.go({ kind: 'projects' })
}
</script>
