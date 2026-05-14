<!--
  Implements:
    decision: ../IA_Plan/wiki/concepts/three-level-permissions.md
              — Project as the primary asset organizational axis.

  Compact project-filter dropdown rendered at the top of the
  MediaAssetsView sidebar (above the Generated button). Reads/writes the
  module-level filter state in usePrototypeAssetsProvider so changes
  ripple through to the asset stream without prop drilling.

  Hidden when no projects are available for the current persona.
-->
<template>
  <SingleSelect
    v-if="availableProjects.length > 0"
    :model-value="selectedProjectId ?? ALL_OPTION_VALUE"
    :label="t('prototype.mediaAssets.projectFilter.placeholder')"
    :options="options"
    size="lg"
    class="w-full"
    @update:model-value="onChange"
  >
    <template #icon>
      <i class="text-neutral icon-[lucide--briefcase] shrink-0 text-sm" />
    </template>
  </SingleSelect>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import SingleSelect from '@/components/ui/single-select/SingleSelect.vue'

import { usePrototypeProjectFilter } from '../composables/usePrototypeAssetsProvider'

const ALL_OPTION_VALUE = '__all__'

const { t } = useI18n()
const { selectedProjectId, availableProjects } = usePrototypeProjectFilter()

const options = computed(() => [
  {
    value: ALL_OPTION_VALUE,
    name: t('prototype.mediaAssets.projectFilter.allProjects')
  },
  ...availableProjects.value.map((p) => ({
    value: p.id,
    name: `${p.name} (${p.count})`
  }))
])

function onChange(value: string | undefined) {
  selectedProjectId.value = !value || value === ALL_OPTION_VALUE ? null : value
}
</script>
