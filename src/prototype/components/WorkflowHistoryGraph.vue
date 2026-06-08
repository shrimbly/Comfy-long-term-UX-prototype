<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
              — full published-version timeline + fork lineage

  VS Code-style history graph: a vertical main line of published versions
  (newest at top, latest tagged Current) with fork offshoots hanging off
  the version each fork diverged from (`forkedFrom.atVersion`). Read-only.
-->
<template>
  <div class="flex flex-col gap-3">
    <h2
      class="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
    >
      {{ t('prototype.history.heading') }}
    </h2>

    <p
      v-if="!rows.length"
      class="rounded-xl border border-dashed border-border-subtle p-6 text-center text-sm text-muted-foreground"
    >
      {{ t('prototype.history.empty') }}
    </p>

    <ul v-else class="m-0 grid list-none grid-cols-[1.25rem_1fr] gap-x-2 p-0">
      <template v-for="row in rows" :key="row.key">
        <li class="relative flex justify-center py-1.5">
          <span
            class="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border-default"
            :class="cn(row.isFirst && 'top-1/2', row.isLast && 'bottom-1/2')"
            aria-hidden="true"
          />
          <span
            v-if="row.type === 'version'"
            :class="
              cn(
                'relative z-10 mt-1 size-2.5 rounded-full ring-2 ring-base-background',
                row.isLatest ? 'bg-primary-background' : 'bg-muted-foreground'
              )
            "
          />
        </li>
        <li class="flex min-w-0 items-start py-1.5">
          <div v-if="row.type === 'version'" class="flex min-w-0 flex-col">
            <span class="flex items-center gap-1.5 text-sm font-medium">
              {{ t('prototype.history.version', { number: row.version }) }}
              <span
                v-if="row.isLatest"
                class="rounded-sm bg-secondary-background px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground"
              >
                {{ t('prototype.history.current') }}
              </span>
            </span>
            <span class="truncate text-xs text-muted-foreground">
              {{
                t('prototype.history.versionMeta', {
                  date: row.at,
                  user: ownerName(row.byUserId)
                })
              }}
            </span>
          </div>
          <div v-else class="flex min-w-0 items-center gap-2">
            <span
              class="-ml-2 size-3 shrink-0 -translate-y-1.5 rounded-bl-md border-b border-l border-border-default"
              aria-hidden="true"
            />
            <span
              class="size-2 shrink-0 rounded-full bg-base-foreground/50"
              aria-hidden="true"
            />
            <span class="flex min-w-0 items-center gap-1.5 text-sm">
              <span
                class="icon-[lucide--git-fork] size-3.5 text-muted-foreground"
              />
              <span class="truncate text-muted-foreground">{{
                ownerName(row.ownerUserId)
              }}</span>
            </span>
          </div>
        </li>
      </template>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePrototypePersonaStore } from '../stores/personaStore'

const { canonicalId } = defineProps<{
  canonicalId: string
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()

const canonical = computed(() =>
  personaStore.fixture.workflows.find((w) => w.id === canonicalId)
)

const versions = computed(() =>
  [...(canonical.value?.publishedVersions ?? [])].reverse()
)

const forks = computed(() =>
  personaStore.fixture.workflows.filter(
    (w) => w.forkedFrom?.workflowId === canonicalId
  )
)

type VersionRowData = {
  type: 'version'
  key: string
  version: number
  byUserId: string
  at: string
  isLatest: boolean
}
type ForkRowData = { type: 'fork'; key: string; ownerUserId?: string }
type RowData = VersionRowData | ForkRowData
type Row = RowData & { isFirst: boolean; isLast: boolean }

const rows = computed<Row[]>(() => {
  const matched = new Set<string>()
  const out: RowData[] = []
  const total = versions.value.length
  versions.value.forEach((v, i) => {
    out.push({
      type: 'version',
      key: `v-${v.at}-${i}`,
      version: total - i,
      byUserId: v.byUserId,
      at: v.at,
      isLatest: i === 0
    })
    for (const f of forks.value) {
      if (f.forkedFrom?.atVersion === v.at) {
        matched.add(f.id)
        out.push({ type: 'fork', key: `f-${f.id}`, ownerUserId: f.ownerUserId })
      }
    }
  })
  for (const f of forks.value) {
    if (!matched.has(f.id)) {
      out.push({ type: 'fork', key: `f-${f.id}`, ownerUserId: f.ownerUserId })
    }
  }
  return out.map(
    (row, i): Row => ({
      ...row,
      isFirst: i === 0,
      isLast: i === out.length - 1
    })
  )
})

function ownerName(userId?: string) {
  if (!userId) return ''
  return (
    personaStore.fixture.members.find((m) => m.id === userId)?.name ?? userId
  )
}
</script>
