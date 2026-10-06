<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
              — a new project names the deployment it runs on
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
              — places that run it first, then the rest with what they lack,
              then a new build
    decision: prototype/design-decisions.md — 2026-10-07 "Flow 07: the
              runs-on picker like the project switcher; no graph while it
              builds"

  The "Create a new project that runs on" field. Its menu is built like the
  project switcher's: a search field, one list (the deployments that run the
  workflow, then the ones that can't, dimmed with what they lack), and
  "Create a new deployment" as the row below the list.
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
          <i class="icon-[lucide--plus] size-4 text-muted-foreground" />
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
      class="min-w-(--reka-popover-trigger-width) overflow-hidden rounded-xl border-border-default bg-base-background p-0 shadow-lg"
      @keydown.escape.stop="open = false"
    >
      <ListboxRoot
        :model-value="model"
        selection-behavior="replace"
        highlight-on-hover
        class="flex min-h-0 flex-col"
        @update:model-value="pick"
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
            :placeholder="t('prototype.customCloud.dialog.searchDeployments')"
            :aria-label="t('prototype.customCloud.dialog.searchDeployments')"
            :class="
              cn(
                'size-full min-w-0 border-none bg-transparent outline-none placeholder:text-muted-foreground',
                searchSize.inputPl,
                searchSize.inputText
              )
            "
          />
        </div>
        <ListboxContent
          class="flex max-h-80 flex-col overflow-y-auto px-1 pb-1"
        >
          <ListboxItem
            v-for="target in matches"
            :key="target.deployment.id"
            :value="target.deployment.id"
            :disabled="!target.runs"
            :class="
              cn(
                rowClass,
                !target.runs && 'cursor-default text-muted-foreground'
              )
            "
          >
            <span :class="glyphClass">
              <i
                v-if="model === target.deployment.id"
                class="icon-[lucide--check] size-4 text-base-foreground"
              />
              <i
                v-else-if="target.deployment.kind === 'comfy-cloud'"
                class="icon-[lucide--cloud] size-3.5"
              />
              <DeploymentStatusDot v-else :status="target.deployment.status" />
            </span>
            <span class="min-w-0 flex-1 truncate">
              {{ target.deployment.name }}
            </span>
            <span class="max-w-1/2 truncate text-xs text-muted-foreground">
              {{
                target.runs
                  ? t('prototype.customCloud.dialog.ready')
                  : missingLabel(target.missing)
              }}
            </span>
          </ListboxItem>
          <p
            v-if="!matches.length"
            class="m-0 px-3 py-4 text-center text-sm text-muted-foreground"
          >
            {{
              t('prototype.customCloud.dialog.noDeploymentMatch', {
                query: query.trim()
              })
            }}
          </p>
          <div class="-mx-1 my-1 h-px shrink-0 bg-border-subtle" />
          <ListboxItem :value="NEW_BUILD_TARGET" :class="rowClass">
            <span :class="glyphClass">
              <i
                :class="
                  cn(
                    'size-4',
                    model === NEW_BUILD_TARGET
                      ? 'icon-[lucide--check] text-base-foreground'
                      : 'icon-[lucide--plus]'
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
          </ListboxItem>
        </ListboxContent>
      </ListboxRoot>
    </PopoverContent>
  </PopoverRoot>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import type { AcceptableValue } from 'reka-ui'
import {
  ListboxContent,
  ListboxFilter,
  ListboxItem,
  ListboxRoot,
  PopoverRoot,
  PopoverTrigger
} from 'reka-ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import PopoverContent from '@/components/ui/popover/PopoverContent.vue'
import {
  searchInputSizeConfig,
  searchInputVariants
} from '@/components/ui/search-input/searchInput.variants'

import { useMissingLabel } from '../composables/useMissingLabel'
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
const missingLabel = useMissingLabel()
const searchSize = searchInputSizeConfig.md
const open = ref(false)
const query = ref('')

watch(open, (isOpen) => {
  if (isOpen) query.value = ''
})

const selected = computed(() =>
  targets.find((target) => target.runs && target.deployment.id === model.value)
)
const matches = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return targets.filter((target) =>
    target.deployment.name.toLowerCase().includes(needle)
  )
})

const rowClass =
  'flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm outline-none data-highlighted:bg-secondary-background-hover'
const glyphClass =
  'grid size-4 shrink-0 place-items-center text-muted-foreground'

function pick(value: AcceptableValue) {
  if (typeof value !== 'string') return
  model.value = value
  open.value = false
}
</script>
