<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
              — projects that already run the workflow first ("✓ Runs it"),
              then the rest with what they lack, then a new project on a new
              build
    open-q:   ../IA_Plan/wiki/open-questions.md#dropped-workflow-other-deployment
              — switch, new project or branch the build?
              Working: only "runs it" projects and a new build are
              pickable; the rest are listed for context.

  The "Open it in" selector of the run-target dialog.
-->
<template>
  <div ref="field" class="relative">
    <Button
      variant="secondary"
      size="unset"
      :class="
        cn(
          'min-h-13 w-full justify-start gap-2.5 rounded-lg border border-border-default px-3 py-2 text-left font-normal',
          open && 'border-border-subtle bg-secondary-background-hover'
        )
      "
      role="combobox"
      :aria-expanded="open"
      @click="open = !open"
    >
      <template v-if="selected">
        <ProjectTile
          :project="selected.project"
          :deployment="selected.deployment"
          size="sm"
        />
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="truncate text-sm">{{ selected.project.name }}</span>
          <DeploymentLabel
            :deployment="selected.deployment"
            class="text-xs text-muted-foreground"
          />
        </span>
        <span
          class="inline-flex items-center gap-1 text-xs text-success-background"
        >
          <i class="icon-[lucide--check] size-3" />
          {{ t('prototype.customCloud.dialog.runsWorkflow', { workflow }) }}
        </span>
      </template>
      <template v-else>
        <NewBuildTile />
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="truncate text-sm">{{
            t('prototype.customCloud.dialog.newBuild')
          }}</span>
          <span class="text-xs text-muted-foreground">{{
            t('prototype.customCloud.dialog.newBuildDetail')
          }}</span>
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

    <div
      v-if="open"
      role="listbox"
      class="absolute inset-x-0 top-[calc(100%+4px)] z-30 flex max-h-80 flex-col overflow-y-auto rounded-lg border border-border-default bg-base-background p-1 shadow-[1px_1px_12px_0_rgb(0_0_0/0.5)]"
    >
      <template v-if="compatible.length">
        <span :class="groupLabelClass">
          {{ t('prototype.customCloud.dialog.groupRuns', { workflow }) }}
        </span>
        <Button
          v-for="target in compatible"
          :key="target.project.id"
          variant="textonly"
          size="unset"
          role="option"
          :aria-selected="model === target.project.id"
          :class="rowClass"
          @click="pick(target.project.id)"
        >
          <ProjectTile
            :project="target.project"
            :deployment="target.deployment"
            size="sm"
          />
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="truncate text-sm">{{ target.project.name }}</span>
            <DeploymentLabel
              :deployment="target.deployment"
              class="text-xs text-muted-foreground"
            />
          </span>
          <span
            class="inline-flex items-center gap-1 text-xs text-success-background"
          >
            <i class="icon-[lucide--check] size-3" />
            {{ t('prototype.customCloud.dialog.runsIt') }}
          </span>
          <i
            v-if="model === target.project.id"
            class="icon-[lucide--check] size-4"
          />
        </Button>
      </template>

      <span :class="groupLabelClass">
        {{ t('prototype.customCloud.dialog.groupMissing') }}
      </span>
      <div
        v-for="target in incompatible"
        :key="target.project.id"
        class="flex items-center gap-2.5 rounded-md px-2 py-1.5"
      >
        <ProjectTile
          :project="target.project"
          :deployment="target.deployment"
          size="sm"
        />
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="truncate text-sm text-muted-foreground">
            {{
              target.project.id === currentProjectId
                ? tText('prototype.customCloud.dialog.thisProject', {
                    name: target.project.name
                  })
                : target.project.name
            }}
          </span>
          <DeploymentLabel
            :deployment="target.deployment"
            class="text-xs text-muted-foreground"
          />
        </span>
        <span class="text-xs whitespace-nowrap text-warning-background">
          {{ missingText(target.missing) }}
        </span>
      </div>

      <div class="my-1 h-px bg-border-subtle" />
      <Button
        variant="textonly"
        size="unset"
        role="option"
        :aria-selected="model === NEW_BUILD_TARGET"
        :class="rowClass"
        @click="pick(NEW_BUILD_TARGET)"
      >
        <NewBuildTile />
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="truncate text-sm">{{
            t('prototype.customCloud.dialog.newBuild')
          }}</span>
          <span class="text-xs text-muted-foreground">{{
            t('prototype.customCloud.dialog.newBuildMenuDetail')
          }}</span>
        </span>
        <i
          v-if="model === NEW_BUILD_TARGET"
          class="icon-[lucide--check] size-4"
        />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { onClickOutside } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { useTextT } from '../composables/useTextT'
import { NEW_BUILD_TARGET } from '../stores/customCloudStore'
import type { Deployment, Project } from '../types'

import DeploymentLabel from './DeploymentLabel.vue'
import NewBuildTile from './NewBuildTile.vue'
import ProjectTile from './ProjectTile.vue'

interface RunTarget {
  project: Project
  deployment: Deployment
  runs: boolean
  missing: { nodePacks: string[]; models: string[] }
}

const { targets, workflow, currentProjectId } = defineProps<{
  targets: RunTarget[]
  workflow: string
  currentProjectId?: string
}>()

const model = defineModel<string>({ required: true })

const { t } = useI18n()
const tText = useTextT()

const open = ref(false)
const field = useTemplateRef('field')
onClickOutside(field, () => {
  open.value = false
})

const compatible = computed(() => targets.filter((target) => target.runs))
const incompatible = computed(() => targets.filter((target) => !target.runs))
const selected = computed(() =>
  compatible.value.find((target) => target.project.id === model.value)
)

const groupLabelClass =
  'px-2 pt-1.5 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase'
const rowClass =
  'w-full justify-start gap-2.5 rounded-md px-2 py-1.5 text-left font-normal'

function pick(value: string) {
  model.value = value
  open.value = false
}

function missingText(missing: RunTarget['missing']) {
  return [
    missing.nodePacks.length &&
      t('prototype.customCloud.dialog.packsMissing', missing.nodePacks.length),
    missing.models.length &&
      t('prototype.customCloud.dialog.modelsMissing', missing.models.length)
  ]
    .filter(Boolean)
    .join(', ')
}
</script>
