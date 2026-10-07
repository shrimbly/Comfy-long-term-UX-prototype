<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
              — step 2, review the build; "the detail control happens in
              platform"
    decision: prototype/design-decisions.md — 2026-10-07 "Flow 07: the
              incompatible-workflow dialog, redesigned on a canvas"

  Step 2: the build summary card Platform shows for a workflow ("Suggested
  settings"). The name edits in place; every other setting is changed on
  Platform, so its row asks first. The coding agent is offered a step
  earlier, as the first way to a deployment.
-->
<template>
  <h2 :id="titleId" class="m-0 pr-8 text-2xl font-semibold">
    {{
      t(
        editing
          ? 'prototype.customCloud.dialog.build.editTitle'
          : 'prototype.customCloud.dialog.build.title'
      )
    }}
  </h2>

  <div
    class="flex flex-col rounded-xl border border-border-subtle bg-secondary-background/40 px-4 pt-3.5 pb-2"
  >
    <span class="flex items-center gap-2 px-3 pb-3.5 text-sm">
      <i class="icon-[lucide--circle-check] size-4 text-success-background" />
      {{ source.name }}
      <span v-if="editing?.release" class="text-muted-foreground">
        {{ editing.release }}
      </span>
    </span>
    <span
      class="px-3 pt-2 pb-1.5 text-xs font-medium tracking-widest text-muted-foreground uppercase"
    >
      {{
        t(
          editing
            ? 'prototype.customCloud.dialog.build.currentSettings'
            : 'prototype.customCloud.dialog.build.settings'
        )
      }}
    </span>
    <label
      class="flex h-11.5 items-center justify-between gap-3 border-t border-border-subtle px-3 text-sm"
    >
      <span class="text-muted-foreground">
        {{ t('prototype.customCloud.dialog.build.name') }}
      </span>
      <span class="flex min-w-0 items-center gap-2">
        <input
          v-model="customCloud.newDeploymentName"
          type="text"
          class="field-sizing-content min-w-0 border-0 bg-transparent p-0 text-right text-sm text-base-foreground outline-none focus:underline"
        />
        <i class="icon-[lucide--pencil] size-3.5 text-muted-foreground" />
      </span>
    </label>
    <Button
      v-for="row in rows"
      :key="row.label"
      variant="textonly"
      size="unset"
      class="h-11.5 w-full justify-between gap-3 rounded-none border-t border-border-subtle px-3 text-sm font-normal"
      @click="emit('customise', row.label)"
    >
      <span class="text-muted-foreground">{{ row.label }}</span>
      <span class="flex min-w-0 items-center gap-2">
        <span class="truncate">{{ row.value }}</span>
        <span v-if="row.detail" class="text-xs text-muted-foreground">
          {{ row.detail }}
        </span>
        <i
          class="icon-[lucide--chevron-right] size-3.5 text-muted-foreground"
        />
      </span>
    </Button>
  </div>

  <footer class="flex items-center gap-2.5">
    <Button variant="muted-textonly" size="lg" class="mr-auto" @click="onBack">
      {{ t('prototype.customCloud.dialog.back') }}
    </Button>
    <Button
      variant="inverted"
      size="lg"
      @click="customCloud.dialogStep = 'deploy'"
    >
      {{ t('prototype.customCloud.dialog.build.next') }}
    </Button>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { BUILD_DEFAULTS, MATTE_PASS } from '../fixtures/customCloud'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'

const { titleId } = defineProps<{
  titleId: string
}>()

const emit = defineEmits<{
  customise: [setting: string]
}>()

const { t } = useI18n()
const customCloud = usePrototypeCustomCloudStore()

const editing = computed(() => customCloud.editingDeployment)

// The build's source: the deployment under edit, or the dropped workflow.
const source = computed(() =>
  editing.value
    ? {
        name: editing.value.name,
        comfyVersion: editing.value.comfyVersion ?? BUILD_DEFAULTS.comfyVersion,
        runtime: editing.value.runtime ?? BUILD_DEFAULTS.runtime,
        models: editing.value.models,
        nodePacks: editing.value.nodePacks
      }
    : {
        name: MATTE_PASS.name,
        comfyVersion: BUILD_DEFAULTS.comfyVersion,
        runtime: BUILD_DEFAULTS.runtime,
        models: MATTE_PASS.models,
        nodePacks: MATTE_PASS.nodePacks
      }
)

const rows = computed(() => [
  {
    label: t('prototype.customCloud.dialog.build.comfyui'),
    value: source.value.comfyVersion,
    detail:
      source.value.comfyVersion === BUILD_DEFAULTS.comfyVersion
        ? t('prototype.customCloud.dialog.build.latestStable')
        : undefined
  },
  {
    label: t('prototype.customCloud.dialog.build.runtime'),
    value: source.value.runtime
  },
  {
    label: t('prototype.customCloud.dialog.build.openSourceModels'),
    value: t('prototype.customCloud.dialog.build.allAllowed'),
    detail: t(
      'prototype.customCloud.dialog.build.preInstalled',
      source.value.models.length
    )
  },
  {
    label: t('prototype.customCloud.dialog.build.partnerModels'),
    value: t('prototype.customCloud.dialog.build.allAllowed')
  },
  {
    label: t('prototype.customCloud.dialog.build.customNodes'),
    value: t(
      'prototype.customCloud.dialog.build.packs',
      source.value.nodePacks.length
    )
  },
  {
    label: t('prototype.customCloud.dialog.build.pythonPackages'),
    value: t('prototype.customCloud.dialog.build.nonePinned')
  }
])

// Editing starts here, so Back closes; a new build goes back to the choice.
function onBack() {
  customCloud.dialogStep = editing.value ? null : 'choose'
}
</script>
