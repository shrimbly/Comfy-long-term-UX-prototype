<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
              — what the deployment lacks

  The compact "n missing node packs / n missing models" table at the top of
  "choose where it runs".
-->
<template>
  <dl
    class="m-0 flex flex-col rounded-lg border border-border-subtle bg-secondary-background/40"
  >
    <div
      v-for="row in rows"
      :key="row.key"
      class="grid grid-cols-[9.5rem_minmax(0,1fr)] items-center gap-x-3 px-3.5 py-2.5 text-[13px] [&+&]:border-t [&+&]:border-border-subtle"
    >
      <dt class="text-muted-foreground">{{ row.label }}</dt>
      <dd class="m-0 truncate">{{ row.items }}</dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { missing, picked = false } = defineProps<{
  missing: { nodePacks: string[]; models: string[] }
  picked?: boolean
}>()

const { t } = useI18n()

const rows = computed(() =>
  [
    {
      key: 'packs',
      label: t(
        picked
          ? 'prototype.customCloud.dialog.chosenPacks'
          : 'prototype.customCloud.dialog.missingPacks',
        missing.nodePacks.length
      ),
      items: missing.nodePacks.join(', ')
    },
    {
      key: 'models',
      label: t(
        'prototype.customCloud.dialog.missingModels',
        missing.models.length
      ),
      items: missing.models.join(', ')
    }
  ].filter((row) => row.items)
)
</script>
