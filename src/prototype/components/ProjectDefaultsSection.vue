<!--
  Implements:
    log:      ../prototype/design-decisions.md (2026-05-15) — filename
              prefix as a *prefill seed* for save-node widgets; the
              widget itself remains the source of truth at run time.
    extends:  ../IA_Plan/wiki/decisions/save-destination-workflow-level.md
              — save nodes carry no behavioral control of their own; the
              project supplies a starting value rather than a runtime
              constraint.

  Owner-only editor for project-level defaults. Currently just the
  filename prefix; structured as a single SettingsPanel so additional
  defaults (resolution, sampler, etc.) can slot in without restyling.
-->
<template>
  <SettingsPanel
    :title="t('prototype.views.project.settings.defaults.heading')"
    :description="t('prototype.views.project.settings.defaults.description')"
  >
    <div class="flex flex-col gap-2">
      <label class="text-xs text-muted" :for="inputId">
        {{ t('prototype.views.project.settings.defaults.filenamePrefixLabel') }}
      </label>
      <input
        :id="inputId"
        :value="filenamePrefix"
        type="text"
        :disabled="!canEdit"
        :placeholder="
          t(
            'prototype.views.project.settings.defaults.filenamePrefixPlaceholder'
          )
        "
        class="h-10 w-full rounded-lg border border-interface-stroke bg-base-background px-3 text-sm text-text-primary outline-none focus:border-text-primary disabled:cursor-not-allowed disabled:opacity-60"
        @change="onChange(($event.target as HTMLInputElement).value)"
      />
      <p class="m-0 text-xs text-muted">
        {{ t('prototype.views.project.settings.defaults.filenamePrefixHint') }}
      </p>
    </div>
  </SettingsPanel>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import { useI18n } from 'vue-i18n'

import SettingsPanel from './settings/SettingsPanel.vue'

const { filenamePrefix, canEdit = false } = defineProps<{
  filenamePrefix: string
  canEdit?: boolean
}>()

const emit = defineEmits<{
  'update:filename-prefix': [value: string]
}>()

const { t } = useI18n()
const inputId = useId()

function onChange(value: string) {
  emit('update:filename-prefix', value)
}
</script>
