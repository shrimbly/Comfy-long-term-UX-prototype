<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/project-switcher-in-tab-bar.md
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
              step 8
    open-q:   ../IA_Plan/wiki/open-questions.md#project-switch-reload
              — working: reload, for now

  Project switcher in the tab strip, after Home and before the tabs: "the
  parent of all". A neutral pill with a cloud icon for Comfy Cloud, or the
  custom deployment's status dot (blue with a halo and the minutes left while
  building, green when ready, grey when asleep), the name cut at about 15
  characters and shown in full on hover. The menu (ProjectSwitcherMenu)
  searches the projects, recent first. Picking one reloads into that
  project's remembered tabs, or its drafts the first time.
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
          <i
            v-else-if="deployment.kind === 'comfy-cloud'"
            class="icon-[lucide--cloud] size-3.5 text-muted-foreground"
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
        class="w-80 overflow-hidden rounded-xl border-border-default bg-base-background p-0 shadow-lg"
        @keydown.escape.stop="customCloud.switcherOpen = false"
      >
        <ProjectSwitcherMenu :project />
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
import type { Project } from '../types'

import DeploymentStatusDot from './DeploymentStatusDot.vue'
import ProjectSwitcherMenu from './ProjectSwitcherMenu.vue'

const { project } = defineProps<{
  project: Project
}>()

const { t } = useI18n()
const customCloud = usePrototypeCustomCloudStore()

const deployment = computed(() => customCloud.deploymentOf(project.id))

const minutesLeft = computed(() => {
  const progress = customCloud.progress
  if (deployment.value.status !== 'building' || !progress) return null
  return Math.max(1, Math.ceil(progress.remainingSeconds / 60))
})
</script>
