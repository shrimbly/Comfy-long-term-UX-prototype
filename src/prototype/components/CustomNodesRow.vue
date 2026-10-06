<!--
  Implements:
    decision: prototype/design-decisions.md — 2026-10-07 "Custom nodes
              modal: Platform's table, with pinned versions"

  One node pack in the Custom nodes table: its name links to GitHub (a
  private pack has a Private badge instead), then publisher, installs,
  stars, its version picker, and what you can do with it.
-->
<template>
  <div
    role="row"
    :class="cn(grid, 'min-h-12 border-t border-border-subtle py-1.5')"
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
    <span role="cell" class="flex flex-col items-end gap-0.5">
      <template v-if="row.state === 'installed'">
        <span class="flex items-center gap-1.5 text-muted-foreground">
          <i class="icon-[lucide--check] size-3.5" aria-hidden="true" />
          {{ t('prototype.customNodes.status.installed') }}
        </span>
        <span v-if="row.newer" class="text-xs text-muted-foreground">
          {{ t('prototype.customNodes.status.newer', { version: row.newer }) }}
        </span>
      </template>
      <template v-else-if="row.state === 'adding' || row.state === 'changing'">
        <span class="flex items-center gap-1.5 text-muted-foreground">
          <i
            class="icon-[lucide--loader-circle] size-3.5 animate-spin"
            aria-hidden="true"
          />
          {{
            row.state === 'adding'
              ? t('prototype.customNodes.status.adding', {
                  release: store.rebuild?.release
                })
              : t('prototype.customNodes.status.changing', {
                  release: store.rebuild?.release
                })
          }}
        </span>
        <span v-if="minutesLeft != null" class="text-xs text-muted-foreground">
          {{ t('prototype.customNodes.status.minutes', minutesLeft) }}
        </span>
      </template>
      <span
        v-else-if="row.state === 'blocked'"
        class="flex items-center gap-1.5 text-muted-foreground"
      >
        <i class="icon-[lucide--lock] size-3.5" aria-hidden="true" />
        {{ t('prototype.customNodes.status.notAllowed') }}
      </span>
      <Button
        v-else-if="store.canInstall"
        variant="secondary"
        :disabled="!!store.rebuild || !store.isCustom"
        @click="store.requestInstall(row.id)"
      >
        {{ t('prototype.customNodes.status.install') }}
      </Button>
      <Button
        v-else
        variant="secondary"
        :disabled="requested || !store.isCustom"
        @click="store.askAdmin(row.id)"
      >
        {{
          requested
            ? t('prototype.customNodes.status.requested')
            : t('prototype.customNodes.status.askAdmin')
        }}
      </Button>
    </span>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Badge from '@/components/ui/badge/Badge.vue'
import Button from '@/components/ui/button/Button.vue'

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
const requested = computed(() => store.requested.includes(row.id))
const minutesLeft = computed(() =>
  store.progress ? Math.ceil(store.progress.remainingSeconds / 60) : undefined
)

function onPick(version: string | null) {
  if (row.state === 'installed') store.requestVersion(row.id, version)
  else store.pickDraftVersion(row.id, version)
}
</script>
