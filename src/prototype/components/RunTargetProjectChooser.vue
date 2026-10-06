<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
              — projects that already run it come first; the rest show what
              they lack
    open-q:   ../IA_Plan/wiki/open-questions.md#dropped-workflow-other-deployment
              — working: only projects that run it can be picked
    decision: prototype/design-decisions.md — 2026-10-07 "Flow 07: the
              incompatible-workflow dialog, redesigned on a canvas"

  "Open in another project": a quiet footer button whose menu lists the
  projects that run the workflow (styled like the project switcher). Picking
  one moves the workflow there and reloads into it.
-->
<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="muted-textonly"
        size="lg"
        :class="cn('px-1 font-normal', open && 'text-base-foreground')"
        :aria-expanded="open"
      >
        {{ t('prototype.customCloud.dialog.openInProject') }}
        <i class="icon-[lucide--chevron-down] size-3.5" />
      </Button>
    </PopoverTrigger>
    <PopoverContent
      align="start"
      side="top"
      :side-offset="4"
      class="flex max-h-96 w-80 flex-col overflow-y-auto rounded-xl border-border-default bg-base-background p-1 shadow-lg"
    >
      <div role="listbox" class="flex flex-col">
        <span :class="groupClass">
          {{ t('prototype.customCloud.dialog.projectsRun') }}
        </span>
        <Button
          v-for="target in running"
          :key="target.project.id"
          variant="textonly"
          size="unset"
          role="option"
          aria-selected="false"
          :class="rowClass"
          @click="pick(target.project.id)"
        >
          <span :class="glyphClass">
            <DeploymentStatusDot :status="target.deployment.status" />
          </span>
          <span class="min-w-0 flex-1 truncate">{{ target.project.name }}</span>
          <span class="max-w-33 truncate text-xs text-muted-foreground">
            {{ target.deployment.name }}
          </span>
        </Button>

        <span :class="groupClass">
          {{ t('prototype.customCloud.dialog.projectsMissing') }}
        </span>
        <div
          v-for="target in lacking"
          :key="target.project.id"
          role="option"
          aria-disabled="true"
          aria-selected="false"
          :class="cn(rowClass, 'text-muted-foreground')"
        >
          <span :class="glyphClass">
            <i
              v-if="target.project.isDrafts"
              class="icon-[lucide--user] size-3"
            />
            <i
              v-else-if="target.deployment.kind === 'comfy-cloud'"
              class="icon-[lucide--cloud] size-3.5"
            />
            <DeploymentStatusDot v-else :status="target.deployment.status" />
          </span>
          <span class="min-w-0 flex-1 truncate">
            {{
              target.project.id === currentProjectId
                ? tText('prototype.customCloud.dialog.thisProject', {
                    name: target.project.name
                  })
                : target.project.name
            }}
          </span>
          <span class="max-w-33 truncate text-xs">
            {{ missingLabel(target.missing) }}
          </span>
        </div>
      </div>
    </PopoverContent>
  </PopoverRoot>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { PopoverRoot, PopoverTrigger } from 'reka-ui'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import PopoverContent from '@/components/ui/popover/PopoverContent.vue'

import { useMissingLabel } from '../composables/useMissingLabel'
import { useTextT } from '../composables/useTextT'
import type { Deployment, Project } from '../types'

import DeploymentStatusDot from './DeploymentStatusDot.vue'

interface ProjectTarget {
  project: Project
  deployment: Deployment
  runs: boolean
  missing: { nodePacks: string[]; models: string[] }
}

const { targets, currentProjectId } = defineProps<{
  targets: ProjectTarget[]
  currentProjectId?: string
}>()

const emit = defineEmits<{
  pick: [projectId: string]
}>()

const { t } = useI18n()
const tText = useTextT()
const missingLabel = useMissingLabel()
const open = ref(false)

const running = computed(() => targets.filter((target) => target.runs))
const lacking = computed(() => targets.filter((target) => !target.runs))

const groupClass = 'px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground'
const rowClass =
  'flex h-8 w-full shrink-0 items-center justify-start gap-2 rounded-lg px-2 text-left text-sm font-normal'
const glyphClass =
  'grid size-4 shrink-0 place-items-center text-muted-foreground'

function pick(projectId: string) {
  open.value = false
  emit('pick', projectId)
}
</script>
