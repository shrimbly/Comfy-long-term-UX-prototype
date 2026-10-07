<!--
  Implements:
    decision: prototype/design-decisions.md — 2026-10-07 "Custom nodes
              modal: Platform's table, with pinned versions"

  One node pack in the Custom nodes table: its name links to GitHub (a
  private pack has a Private badge instead), then publisher, installs,
  stars and its version picker. The last column ticks packs to install
  together; an installed pack shows a plain check there.
-->
<template>
  <div
    role="row"
    :class="cn(grid, 'min-h-12 border-t border-border-subtle py-1.5')"
  >
    <span
      role="cell"
      :class="cn('flex min-w-0 flex-col gap-0.5', dimmed && 'opacity-50')"
    >
      <span class="flex min-w-0 items-center gap-2">
        <a
          v-if="row.repoUrl"
          :href="row.repoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex min-w-0 items-center gap-1.5 font-medium text-base-foreground no-underline hover:underline"
          :title="tText('prototype.customNodes.openRepo', { pack: row.name })"
        >
          <span class="truncate">{{ row.name }}</span>
          <i
            class="icon-[lucide--external-link] size-3 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </a>
        <template v-else>
          <span class="truncate font-medium">{{ row.name }}</span>
          <Badge
            variant="compact"
            severity="secondary"
            class="text-muted-foreground"
          >
            <i class="icon-[lucide--lock] size-2.5" aria-hidden="true" />
            {{ t('prototype.customNodes.private') }}
          </Badge>
        </template>
      </span>
      <span
        v-if="note"
        class="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <i
          v-if="isBuilding"
          class="icon-[lucide--loader-circle] size-3 animate-spin"
          aria-hidden="true"
        />
        {{ note }}
      </span>
    </span>
    <span
      role="cell"
      :class="cn('truncate text-muted-foreground', dimmed && 'opacity-50')"
    >
      {{ row.publisher }}
    </span>
    <span
      role="cell"
      :class="
        cn(
          'text-right text-muted-foreground tabular-nums',
          dimmed && 'opacity-50'
        )
      "
      :title="row.installs ? row.installs.toLocaleString() : undefined"
    >
      {{ formatCount(row.installs || undefined) }}
    </span>
    <span
      role="cell"
      :class="
        cn(
          'flex items-center justify-end gap-1 text-muted-foreground tabular-nums',
          dimmed && 'opacity-50'
        )
      "
      :title="
        row.stars == null
          ? t('prototype.customNodes.privateStars')
          : t('prototype.customNodes.stars', {
              count: row.stars.toLocaleString()
            })
      "
    >
      <i
        v-if="row.stars != null"
        class="icon-[lucide--star] size-3"
        aria-hidden="true"
      />
      {{ formatCount(row.stars) }}
    </span>
    <span role="cell">
      <span
        v-if="row.state === 'blocked'"
        class="pl-2.5 font-mono text-xs text-muted-foreground opacity-50"
      >
        —
      </span>
      <PackVersionSelect
        v-else
        :row
        :disabled="!!store.rebuild || !store.isCustom || !store.canInstall"
        @pick="onPick"
      />
    </span>
    <span role="cell" class="flex justify-center">
      <i
        v-if="row.state === 'blocked'"
        class="icon-[lucide--lock] size-3.5 text-muted-foreground"
        :aria-label="t('prototype.customNodes.status.notAllowed')"
        :title="t('prototype.customNodes.status.notAllowed')"
      />
      <i
        v-else-if="isInstalled"
        class="icon-[lucide--check] size-4 text-muted-foreground"
        :aria-label="t('prototype.customNodes.status.installed')"
        :title="t('prototype.customNodes.status.installed')"
      />
      <Checkbox
        v-else
        :model-value="isTicked"
        :disabled="!selectable"
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
const isRequested = computed(() => store.requested.includes(row.id))
const isInstalled = computed(
  () => row.state === 'installed' || row.state === 'changing'
)
const isTicked = computed(
  () => isBuilding.value || isRequested.value || store.selected.includes(row.id)
)
const selectable = computed(
  () =>
    row.state === 'available' &&
    !isRequested.value &&
    !store.rebuild &&
    store.isCustom
)

const minutesLeft = computed(() =>
  store.progress ? Math.ceil(store.progress.remainingSeconds / 60) : 0
)

// The line under the pack's name: a newer release, the build, or a request.
const note = computed(() => {
  const release = store.rebuild?.release
  if (row.state === 'adding')
    return t('prototype.customNodes.status.adding', {
      release,
      minutes: t('prototype.customNodes.status.minutes', minutesLeft.value)
    })
  if (row.state === 'changing')
    return t('prototype.customNodes.status.changing', {
      release,
      minutes: t('prototype.customNodes.status.minutes', minutesLeft.value)
    })
  if (isRequested.value) return t('prototype.customNodes.status.requested')
  if (row.newer)
    return t('prototype.customNodes.status.newer', { version: row.newer })
  return ''
})

const checkboxLabel = computed(() => {
  if (isRequested.value) return t('prototype.customNodes.status.requested')
  return tText('prototype.customNodes.status.select', { pack: row.name })
})

function onPick(version: string | null) {
  if (row.state === 'installed') store.requestVersion(row.id, version)
  else store.pickDraftVersion(row.id, version)
}
</script>
