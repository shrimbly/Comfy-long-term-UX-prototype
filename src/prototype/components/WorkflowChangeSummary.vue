<!--
  Implements:
    prototype: semantic workflow diff presentation
               (prototype/design-decisions.md 2026-06-10 semantic workflow diff)

  Compact, categorised change summary for a SemanticDiff. One row per
  (entity × action) — Nodes / Subgraphs added · removed · skipped · moved,
  Widgets edited — plus an "Other changes" catch-all for everything else
  (connections, groups). Each row is a count with its own chevron that
  expands to the specifics: the new subgraph titles, the edited widgets
  ("Prompt edited · +6 / −2 words", "denoise 1.00 → 0.85"), etc. Pure
  presentation: feed it a SemanticDiff, no store.
-->
<template>
  <div v-if="categories.length" class="flex flex-col gap-0.5">
    <div v-for="cat in categories" :key="cat.key" class="flex flex-col">
      <Button
        variant="textonly"
        size="unset"
        class="w-fit justify-start gap-2 rounded-md px-1 py-0.5 hover:bg-secondary-background-hover"
        @click="toggle(cat.key)"
      >
        <i :class="cn('size-3.5 shrink-0', cat.icon, cat.iconClass)" />
        <span
          :class="
            cn(
              'text-xs',
              cat.muted ? 'text-muted-foreground' : 'text-base-foreground'
            )
          "
        >
          {{ cat.label }}
        </span>
        <i
          :class="
            cn(
              'icon-[lucide--chevron-down] size-3.5 shrink-0 text-muted-foreground transition-transform',
              expanded.has(cat.key) && 'rotate-180'
            )
          "
        />
      </Button>

      <ul
        v-if="expanded.has(cat.key)"
        class="m-0 flex list-none flex-col gap-0.5 p-0 pt-0.5 pl-6.5"
      >
        <li
          v-for="(line, i) in cat.items"
          :key="i"
          class="flex items-baseline gap-1.5 text-xs"
        >
          <span class="truncate text-base-foreground">{{ line.text }}</span>
          <span v-if="line.detail" class="shrink-0 text-muted-foreground">
            · {{ line.detail }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import type { DiffEntry, SemanticDiff } from '../utils/workflowDiff'

const { diff } = defineProps<{ diff: SemanticDiff }>()

const { t } = useI18n()

const expanded = reactive(new Set<string>())
function toggle(key: string) {
  if (expanded.has(key)) expanded.delete(key)
  else expanded.add(key)
}

interface DetailLine {
  text: string
  detail?: string
}

interface Category {
  key: string
  icon: string
  iconClass?: string
  muted?: boolean
  label: string
  items: DetailLine[]
}

// A prompt entry's label is a bare word-delta ("+6 / −2 words"); show it
// as a muted suffix. Anything that isn't a pure delta is ignored.
function promptDelta(label: string): string {
  return /^\s*[+−-]/.test(label) ? label : ''
}

function entityLine(e: DiffEntry): DetailLine {
  return { text: e.nodeType ?? '—' }
}

const ADD = { icon: 'icon-[lucide--plus]', iconClass: 'text-jade-400' }
const REMOVE = { icon: 'icon-[lucide--minus]', iconClass: 'text-danger-200' }
const SKIP = { icon: 'icon-[lucide--circle-slash]' }
const MOVE = { icon: 'icon-[lucide--move]', muted: true }

const categories = computed<Category[]>(() => {
  const d = diff.details
  const inChannel = (ch: DiffEntry['channel']) =>
    d.filter((e) => e.channel === ch)
  const subs = (entries: DiffEntry[]) => entries.filter((e) => e.isSubgraph)
  const nodes = (entries: DiffEntry[]) => entries.filter((e) => !e.isSubgraph)

  const out: Category[] = []

  // Subgraphs lead each action (a whole sub-pipeline outweighs one node).
  function pushAction(
    channel: DiffEntry['channel'],
    look: { icon: string; iconClass?: string; muted?: boolean },
    subKey: string,
    nodeKey: string,
    keyBase: string
  ) {
    const entries = inChannel(channel)
    const s = subs(entries)
    const n = nodes(entries)
    if (s.length) {
      out.push({
        ...look,
        key: `${keyBase}-sub`,
        label: t(subKey, s.length),
        items: s.map(entityLine)
      })
    }
    if (n.length) {
      out.push({
        ...look,
        key: `${keyBase}-node`,
        label: t(nodeKey, n.length),
        items: n.map(entityLine)
      })
    }
  }

  pushAction(
    'added',
    ADD,
    'prototype.changeSummary.subgraphsAdded',
    'prototype.changeSummary.nodesAdded',
    'add'
  )
  pushAction(
    'removed',
    REMOVE,
    'prototype.changeSummary.subgraphsRemoved',
    'prototype.changeSummary.nodesRemoved',
    'rm'
  )

  const widgets = d.filter((e) => e.widgetKind)
  if (widgets.length) {
    out.push({
      key: 'widgets',
      icon: 'icon-[lucide--square-pen]',
      label: t('prototype.changeSummary.widgetsEdited', widgets.length),
      items: widgets.map((e) => {
        if (e.widgetKind === 'prompt') {
          return {
            text: t('prototype.changeSummary.promptEdited'),
            detail: promptDelta(e.label)
          }
        }
        if (e.widgetKind === 'seed') {
          return {
            text: t('prototype.changeSummary.seedChanged'),
            detail: e.nodeType
          }
        }
        return { text: e.label }
      })
    })
  }

  pushAction(
    'mode',
    SKIP,
    'prototype.changeSummary.subgraphsSkipped',
    'prototype.changeSummary.nodesSkipped',
    'skip'
  )
  pushAction(
    'layout',
    MOVE,
    'prototype.changeSummary.subgraphsMoved',
    'prototype.changeSummary.nodesMoved',
    'mv'
  )

  // Everything else lives behind a single "Other changes" row.
  const other: DetailLine[] = []
  const rewired = inChannel('rewired').length
  if (rewired) {
    other.push({
      text: t('prototype.changeSummary.connectionsRewired', rewired)
    })
  }
  const groups = inChannel('group').length
  if (groups) {
    other.push({ text: t('prototype.changeSummary.groupsChanged', groups) })
  }
  if (other.length) {
    out.push({
      key: 'other',
      icon: 'icon-[lucide--ellipsis]',
      muted: true,
      label: t('prototype.changeSummary.moreDetails'),
      items: other
    })
  }

  return out
})
</script>
