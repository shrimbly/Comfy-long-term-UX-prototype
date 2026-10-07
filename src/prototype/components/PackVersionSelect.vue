<!--
  Implements:
    decision: prototype/design-decisions.md — 2026-10-07 "Custom nodes
              modal: Platform's table, with pinned versions"

  A node pack's version in the Custom nodes table, as Platform's builder
  picks one: follow the latest release, or pin a published one. A pin icon
  marks a pinned pack, an up arrow a newer release than its pin.
-->
<template>
  <Select
    :model-value="row.pinned ? row.version : LATEST"
    :disabled
    @update:model-value="onPick"
  >
    <SelectTrigger
      size="md"
      class="gap-2 border border-border-default bg-transparent px-2.5 hover:bg-secondary-background/40"
      :aria-label="
        tText('prototype.customNodes.version.label', { pack: row.name })
      "
    >
      <span class="flex min-w-0 items-center gap-1.5 text-muted-foreground">
        <span class="truncate font-mono text-xs">{{ row.version }}</span>
        <i
          v-if="row.pinned"
          class="icon-[lucide--pin] size-3 shrink-0"
          :aria-label="t('prototype.customNodes.version.pinned')"
          :title="t('prototype.customNodes.version.pinned')"
        />
        <i
          v-if="row.newer"
          class="icon-[lucide--circle-arrow-up] size-3 shrink-0"
          :aria-label="
            t('prototype.customNodes.status.newer', { version: row.newer })
          "
          :title="
            t('prototype.customNodes.status.newer', { version: row.newer })
          "
        />
      </span>
    </SelectTrigger>
    <SelectContent class="min-w-56">
      <SelectItem :value="LATEST" class="py-2">
        {{
          t('prototype.customNodes.version.followLatest', {
            version: row.latest
          })
        }}
      </SelectItem>
      <SelectItem
        v-for="release in row.releases"
        :key="release.version"
        :value="release.version"
        class="py-2 font-mono text-xs"
      >
        {{
          t('prototype.customNodes.version.release', {
            version: release.version,
            date: shortDate(release.date)
          })
        }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import { useI18n } from 'vue-i18n'

import Select from '@/components/ui/select/Select.vue'
import SelectContent from '@/components/ui/select/SelectContent.vue'
import SelectItem from '@/components/ui/select/SelectItem.vue'
import SelectTrigger from '@/components/ui/select/SelectTrigger.vue'

import { useTextT } from '../composables/useTextT'
import type { PackRow } from '../utils/customNodes'

const LATEST = 'latest'

const { row, disabled = false } = defineProps<{
  row: PackRow
  disabled?: boolean
}>()

const emit = defineEmits<{
  pick: [version: string | null]
}>()

const { t, locale } = useI18n()
const tText = useTextT()

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(locale.value, {
    month: 'short',
    day: 'numeric'
  })
}

function onPick(value: AcceptableValue) {
  if (typeof value !== 'string') return
  emit('pick', value === LATEST ? null : value)
}
</script>
