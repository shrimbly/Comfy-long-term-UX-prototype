<!--
  Implements:
    decision: prototype/design-decisions.md — 2026-10-07 "Custom nodes
              modal: Platform's table, with pinned versions"

  One node pack in the Custom nodes table, laid out like Platform's
  builder: name (linked to GitHub, or a Private badge), publisher,
  installs, stars, version, license, and a checkbox to install it with the
  others ticked. An installed pack shows a check there, a pack the
  workspace policy blocks a lock, and a pack in the building release a
  spinner.
-->
<template>
  <div
    role="row"
    :class="
      cn(
        grid,
        'group h-11 border-t border-l-2 border-t-border-subtle border-l-transparent px-4 hover:bg-secondary-background/30',
        isInstalled && 'border-l-base-foreground'
      )
    "
  >
    <span
      role="cell"
      :class="cn('flex min-w-0 items-center gap-2', dimmed && 'opacity-50')"
    >
      <a
        v-if="row.repoUrl"
        :href="row.repoUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex min-w-0 items-center gap-1.5 text-base-foreground no-underline hover:underline"
        :title="tText('prototype.customNodes.openRepo', { pack: row.name })"
      >
        <span class="truncate">{{ row.name }}</span>
        <i
          class="icon-[lucide--external-link] size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100"
          aria-hidden="true"
        />
      </a>
      <span v-else class="truncate">{{ row.name }}</span>
      <Badge
        v-if="row.private"
        variant="compact"
        severity="secondary"
        class="text-muted-foreground"
      >
        <i class="icon-[lucide--lock] size-2.5" aria-hidden="true" />
        {{ t('prototype.customNodes.private') }}
      </Badge>
    </span>
    <span
      role="cell"
      :class="cn('truncate text-muted-foreground', dimmed && 'opacity-50')"
    >
      {{ row.publisher }}
    </span>
    <span
      role="cell"
      :class="cn('text-muted-foreground tabular-nums', dimmed && 'opacity-50')"
      :title="row.installs ? row.installs.toLocaleString() : undefined"
    >
      {{ formatCount(row.installs || undefined) }}
    </span>
    <span
      role="cell"
      :class="cn('text-muted-foreground tabular-nums', dimmed && 'opacity-50')"
      :title="
        row.stars == null
          ? t('prototype.customNodes.privateStars')
          : t('prototype.customNodes.stars', {
              count: row.stars.toLocaleString()
            })
      "
    >
      {{ formatCount(row.stars) }}
    </span>
    <span role="cell">
      <span
        v-if="row.state === 'blocked'"
        class="text-muted-foreground opacity-50"
      >
        -
      </span>
      <PackVersionSelect
        v-else
        :row
        :disabled="
          !!store.rebuild ||
          (store.isCustom ? !store.canInstall : row.state === 'installed')
        "
        @pick="onPick"
      />
    </span>
    <span
      role="cell"
      :class="cn('truncate text-muted-foreground', dimmed && 'opacity-50')"
      :title="row.license"
    >
      {{ row.license }}
    </span>
    <span role="cell" class="flex justify-end">
      <i
        v-if="row.state === 'blocked'"
        class="icon-[lucide--lock] size-4 text-muted-foreground"
        :aria-label="t('prototype.customNodes.status.notAllowed')"
        :title="t('prototype.customNodes.status.blockedHint')"
      />
      <i
        v-else-if="isBuilding"
        class="icon-[lucide--loader-circle] size-4 animate-spin text-muted-foreground"
        :aria-label="buildingLabel"
        :title="buildingLabel"
      />
      <i
        v-else-if="row.state === 'installed'"
        class="icon-[lucide--check] size-4 text-base-foreground"
        :aria-label="t('prototype.customNodes.status.installed')"
        :title="t('prototype.customNodes.status.installed')"
      />
      <Checkbox
        v-else
        :model-value="isRequested || store.selected.includes(row.id)"
        :disabled="!selectable"
        class="border-base-foreground data-[state=checked]:border-base-foreground data-[state=checked]:bg-base-foreground"
        :aria-label="checkboxLabel"
        :title="checkboxLabel"
        @update:model-value="(on) => store.setSelected(row.id, on === true)"
      />
    </span>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Badge from '@/components/ui/badge/Badge.vue'
import Checkbox from '@/components/ui/checkbox/Checkbox.vue'

import { useTextT } from '../composables/useTextT'
import { usePrototypeCustomNodesStore } from '../stores/customNodesStore'
import { formatCount } from '../utils/customNodes'
import type { PackRow } from '../utils/customNodes'

import PackVersionSelect from './PackVersionSelect.vue'

const { row, grid } = defineProps<{
  row: PackRow
  grid: string
}>()

const { t } = useI18n()
const tText = useTextT()
const store = usePrototypeCustomNodesStore()

const dimmed = computed(() => row.state === 'blocked')
const isBuilding = computed(
  () => row.state === 'adding' || row.state === 'changing'
)
const isInstalled = computed(
  () => row.state === 'installed' || row.state === 'changing'
)
const isRequested = computed(() => store.requested.includes(row.id))
const selectable = computed(() => !isRequested.value && !store.rebuild)

const buildingLabel = computed(() => {
  const params = {
    release: store.rebuild?.release,
    minutes: t(
      'prototype.customNodes.status.minutes',
      store.progress ? Math.ceil(store.progress.remainingSeconds / 60) : 0
    )
  }
  return row.state === 'adding'
    ? t('prototype.customNodes.status.adding', params)
    : t('prototype.customNodes.status.changing', params)
})

const checkboxLabel = computed(() =>
  isRequested.value
    ? t('prototype.customNodes.status.requested')
    : tText('prototype.customNodes.status.select', { pack: row.name })
)

function onPick(version: string | null) {
  if (row.state === 'installed') store.requestVersion(row.id, version)
  else store.pickDraftVersion(row.id, version)
}
</script>
