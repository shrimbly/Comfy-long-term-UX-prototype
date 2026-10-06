<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
              — a new project names the deployment it runs on
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
              — places that run it first, then a new build, then the rest
    decision: prototype/design-decisions.md — 2026-10-07 "Flow 07: the
              incompatible-workflow dialog, redesigned on a canvas"

  The "Create a new project that runs on" field: deployments that already
  run the workflow, a new deployment, and (not pickable) the deployments
  that lack something.
-->
<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="secondary"
        size="unset"
        :class="
          cn(
            'h-11 w-full justify-start gap-2.5 rounded-lg border border-border-default px-3 text-left text-sm font-normal',
            open && 'bg-secondary-background-hover'
          )
        "
        role="combobox"
        :aria-expanded="open"
      >
        <template v-if="selected">
          <DeploymentStatusDot :status="selected.deployment.status" />
          <span class="min-w-0 flex-1 truncate">
            {{ selected.deployment.name }}
          </span>
          <span class="text-xs text-muted-foreground">
            {{ t('prototype.customCloud.dialog.readyNow') }}
          </span>
        </template>
        <template v-else>
          <i class="icon-[lucide--plus] size-3.5 text-muted-foreground" />
          <span class="min-w-0 flex-1 truncate">
            {{ t('prototype.customCloud.dialog.newDeployment') }}
          </span>
          <span class="text-xs text-muted-foreground">
            {{ t('prototype.customCloud.dialog.newDeploymentTime') }}
          </span>
        </template>
        <i
          :class="
            cn(
              'size-4 text-muted-foreground',
              open ? 'icon-[lucide--chevron-up]' : 'icon-[lucide--chevron-down]'
            )
          "
        />
      </Button>
    </PopoverTrigger>
    <PopoverContent
      align="start"
      :side-offset="4"
      class="flex min-w-(--reka-popover-trigger-width) flex-col rounded-xl border-border-default bg-base-background p-1 shadow-lg"
    >
      <div role="listbox" class="flex flex-col">
        <template v-if="running.length">
          <span :class="groupClass">
            {{ t('prototype.customCloud.dialog.groupRuns') }}
          </span>
          <Button
            v-for="target in running"
            :key="target.deployment.id"
            variant="textonly"
            size="unset"
            role="option"
            :aria-selected="model === target.deployment.id"
            :class="rowClass"
            @click="pick(target.deployment.id)"
          >
            <span :class="glyphClass">
              <i
                v-if="model === target.deployment.id"
                class="icon-[lucide--check] size-4 text-base-foreground"
              />
              <DeploymentStatusDot v-else :status="target.deployment.status" />
            </span>
            <span class="min-w-0 flex-1 truncate">
              {{ target.deployment.name }}
            </span>
            <span class="text-xs text-muted-foreground">
              {{ deploymentLine(target.deployment) }}
            </span>
          </Button>
        </template>

        <span :class="groupClass">
          {{ t('prototype.customCloud.dialog.groupNew') }}
        </span>
        <Button
          variant="textonly"
          size="unset"
          role="option"
          :aria-selected="model === NEW_BUILD_TARGET"
          :class="rowClass"
          @click="pick(NEW_BUILD_TARGET)"
        >
          <span :class="glyphClass">
            <i
              :class="
                cn(
                  'size-4',
                  model === NEW_BUILD_TARGET
                    ? 'icon-[lucide--check] text-base-foreground'
                    : 'icon-[lucide--plus] text-muted-foreground'
                )
              "
            />
          </span>
          <span class="min-w-0 flex-1 truncate">
            {{ t('prototype.customCloud.dialog.newDeployment') }}
          </span>
          <span class="text-xs text-muted-foreground">
            {{ t('prototype.customCloud.dialog.newDeploymentTime') }}
          </span>
        </Button>

        <span :class="groupClass">
          {{ t('prototype.customCloud.dialog.groupMissing') }}
        </span>
        <div
          v-for="target in lacking"
          :key="target.deployment.id"
          role="option"
          aria-disabled="true"
          aria-selected="false"
          :class="cn(rowClass, 'text-muted-foreground')"
        >
          <span :class="glyphClass">
            <i
              v-if="target.deployment.kind === 'comfy-cloud'"
              class="icon-[lucide--cloud] size-3.5"
            />
            <DeploymentStatusDot v-else :status="target.deployment.status" />
          </span>
          <span class="min-w-0 flex-1 truncate">
            {{ target.deployment.name }}
          </span>
          <span class="max-w-1/2 truncate text-xs">
            {{ lacksLabel(target.missing) }}
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

import { useLacksLabel } from '../composables/useLacksLabel'
import { NEW_BUILD_TARGET } from '../stores/customCloudStore'
import type { Deployment } from '../types'

import DeploymentStatusDot from './DeploymentStatusDot.vue'

interface DeploymentTarget {
  deployment: Deployment
  runs: boolean
  missing: { nodePacks: string[]; models: string[] }
}

const { targets } = defineProps<{
  targets: DeploymentTarget[]
}>()

const model = defineModel<string>({ required: true })

const { t } = useI18n()
const lacksLabel = useLacksLabel()
const open = ref(false)

const running = computed(() => targets.filter((target) => target.runs))
const lacking = computed(() => targets.filter((target) => !target.runs))
const selected = computed(() =>
  running.value.find((target) => target.deployment.id === model.value)
)

const groupClass = 'px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground'
const rowClass =
  'flex h-8 w-full items-center justify-start gap-2 rounded-lg px-2 text-left text-sm font-normal'
const glyphClass =
  'grid size-4 shrink-0 place-items-center text-muted-foreground'

function deploymentLine(deployment: Deployment) {
  return [deployment.release, t('prototype.customCloud.dialog.readyNow')]
    .filter(Boolean)
    .join(' · ')
}

function pick(value: string) {
  model.value = value
  open.value = false
}
</script>
