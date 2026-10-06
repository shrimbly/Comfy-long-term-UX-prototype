<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
              — step 2, review the build; "the detail control happens in
              platform"
    decision: prototype/design-decisions.md — 2026-10-07 "Flow 07: the
              incompatible-workflow dialog, redesigned on a canvas"

  Step 2: the build summary card Platform shows for a workflow ("Suggested
  settings"). The name edits in place; every other setting is changed on
  Platform, so its row asks first. The agent is the alternative to deploying
  from here.
-->
<template>
  <h2 :id="titleId" class="m-0 pr-8 text-2xl font-semibold">
    {{ t('prototype.customCloud.dialog.build.title') }}
  </h2>

  <div
    class="flex flex-col rounded-xl border border-border-subtle bg-secondary-background/40 px-4 pt-3.5 pb-2"
  >
    <span class="flex items-center gap-2 px-3 pb-3.5 text-sm">
      <i class="icon-[lucide--circle-check] size-4 text-success-background" />
      {{ MATTE_PASS.name }}
    </span>
    <span
      class="px-3 pt-2 pb-1.5 text-xs font-medium tracking-widest text-muted-foreground uppercase"
    >
      {{ t('prototype.customCloud.dialog.build.settings') }}
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
    <Button
      variant="muted-textonly"
      size="lg"
      class="mr-auto"
      @click="customCloud.dialogStep = 'choose'"
    >
      {{ t('prototype.customCloud.dialog.back') }}
    </Button>
    <Button
      variant="outline"
      size="lg"
      @click="customCloud.dialogStep = 'agent'"
    >
      <i class="icon-[lucide--bot] size-4" />
      {{ t('prototype.customCloud.dialog.build.withAgent') }}
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

const rows = computed(() => [
  {
    label: t('prototype.customCloud.dialog.build.comfyui'),
    value: BUILD_DEFAULTS.comfyVersion,
    detail: t('prototype.customCloud.dialog.build.latestStable')
  },
  {
    label: t('prototype.customCloud.dialog.build.runtime'),
    value: BUILD_DEFAULTS.runtime
  },
  {
    label: t('prototype.customCloud.dialog.build.openSourceModels'),
    value: t('prototype.customCloud.dialog.build.allAllowed'),
    detail: t(
      'prototype.customCloud.dialog.build.preInstalled',
      MATTE_PASS.models.length
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
      MATTE_PASS.nodePacks.length
    )
  },
  {
    label: t('prototype.customCloud.dialog.build.pythonPackages'),
    value: t('prototype.customCloud.dialog.build.nonePinned')
  }
])
</script>
