<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/workspace.md §"Identity" — workspace is
            the single billing entity; project usage is read-only attribution.
    open-q: ../IA_Plan/wiki/open-questions.md#per-member-credit-limits
            — working: an optional per-member cap on each project
    log:    ../prototype/design-decisions.md (2026-10-07) — credit
            attribution per member on the project page

  This month's credits for the project, split by member: a donut for the
  share, and a table with runs, credits and each member's progress against
  their limit in this project. Export is a client-side CSV.
-->
<template>
  <div class="flex max-w-4xl flex-col gap-6">
    <div class="flex items-end justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h2 class="m-0 text-base font-medium">
          {{ t('prototype.projectPage.usage.heading') }}
        </h2>
        <p class="m-0 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{{
            t('prototype.projectPage.usage.thisMonth', {
              credits: total.toLocaleString()
            })
          }}</span>
          <span
            v-if="deltaPct !== null && deltaPct !== 0"
            :class="
              cn(
                'inline-flex items-center gap-1 text-xs',
                deltaPct > 0
                  ? 'text-warning-background'
                  : 'text-success-background'
              )
            "
          >
            <i
              :class="
                cn(
                  'size-3.5',
                  deltaPct > 0
                    ? 'icon-[lucide--trending-up]'
                    : 'icon-[lucide--trending-down]'
                )
              "
            />
            {{
              t('prototype.views.project.settings.usage.delta', {
                pct: Math.abs(deltaPct)
              })
            }}
          </span>
        </p>
      </div>
      <Button
        variant="secondary"
        size="md"
        :disabled="!total"
        @click="exportCsv"
      >
        <i class="icon-[lucide--download] size-4" />
        {{ t('prototype.settings.usage.export') }}
      </Button>
    </div>

    <div class="flex items-start gap-8">
      <svg
        viewBox="0 0 42 42"
        class="size-36 shrink-0 -rotate-90"
        role="img"
        :aria-label="t('prototype.projectPage.usage.chart')"
      >
        <circle
          cx="21"
          cy="21"
          r="15.915"
          fill="none"
          class="stroke-secondary-background-hover"
          stroke-width="5"
        />
        <circle
          v-for="segment in segments"
          :key="segment.id"
          cx="21"
          cy="21"
          r="15.915"
          fill="none"
          :stroke="segment.color"
          stroke-width="5"
          :stroke-dasharray="`${segment.percent} ${100 - segment.percent}`"
          :stroke-dashoffset="-segment.offset"
        />
      </svg>

      <div
        class="min-w-0 flex-1 overflow-hidden rounded-lg border border-border-subtle"
      >
        <Table
          class="[&_td]:border-b [&_td]:border-border-subtle/50 [&_td]:px-4 [&_th]:px-4"
        >
          <TableHeader>
            <TableRow class="bg-secondary-background/50">
              <TableHead class="w-2/5">
                {{ t('prototype.projectPage.usage.member') }}
              </TableHead>
              <TableHead class="text-right">
                {{ t('prototype.projectPage.usage.runs') }}
              </TableHead>
              <TableHead class="text-right">
                {{ t('prototype.projectPage.usage.credits') }}
              </TableHead>
              <TableHead class="w-60 text-right">
                {{ t('prototype.projectPage.usage.limit') }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="row in rows"
              :key="row.id"
              class="h-14 hover:bg-secondary-background/20"
            >
              <TableCell>
                <span class="flex items-center gap-2.5">
                  <span
                    class="size-2 shrink-0 rounded-full"
                    :style="{ backgroundColor: row.color }"
                  />
                  <span class="flex min-w-0 flex-col">
                    <span class="truncate">{{ row.name }}</span>
                    <span
                      v-if="row.detail"
                      class="truncate text-xs text-muted-foreground"
                    >
                      {{ row.detail }}
                    </span>
                  </span>
                </span>
              </TableCell>
              <TableCell class="text-right text-muted-foreground tabular-nums">
                {{ row.runs.toLocaleString() }}
              </TableCell>
              <TableCell class="text-right tabular-nums">
                {{ row.credits.toLocaleString() }}
              </TableCell>
              <TableCell class="text-right whitespace-nowrap">
                <span
                  v-if="row.limit"
                  class="inline-flex items-center justify-end gap-3"
                >
                  <span class="text-xs text-muted-foreground tabular-nums">
                    {{
                      t('prototype.projectPage.usage.ofLimit', {
                        used: row.credits.toLocaleString(),
                        limit: row.limit.toLocaleString()
                      })
                    }}
                  </span>
                  <span
                    class="h-1.5 w-24 overflow-hidden rounded-full bg-secondary-background-hover"
                  >
                    <span
                      :class="
                        cn(
                          'block h-full rounded-full',
                          row.credits >= row.limit
                            ? 'bg-destructive-background'
                            : row.credits >= row.limit * 0.8
                              ? 'bg-warning-background'
                              : 'bg-base-foreground'
                        )
                      "
                      :style="{
                        width: `${Math.min(100, (row.credits / row.limit) * 100)}%`
                      }"
                    />
                  </span>
                </span>
                <span v-else class="text-xs text-muted-foreground">
                  {{ t('prototype.projectPage.usage.noLimit') }}
                </span>
              </TableCell>
            </TableRow>
            <TableRow v-if="!total">
              <TableCell
                :colspan="4"
                class="py-8 text-center text-muted-foreground"
              >
                {{ t('prototype.projectPage.usage.empty') }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <div v-if="recentMonths.length" class="flex flex-col gap-2">
      <p class="m-0 text-xs text-muted-foreground">
        {{ t('prototype.views.project.settings.usage.recentHeading') }}
      </p>
      <div class="grid max-w-md grid-cols-3 gap-2">
        <div
          v-for="m in recentMonths"
          :key="m.month"
          class="flex flex-col gap-0.5 rounded-lg bg-secondary-background-hover px-3 py-2"
        >
          <span
            class="text-[10px] tracking-wide text-muted-foreground uppercase"
          >
            {{ formatMonth(m.month) }}
          </span>
          <span class="text-sm font-semibold tabular-nums">
            {{ m.credits.toLocaleString() }}
          </span>
        </div>
      </div>
    </div>

    <p class="m-0 text-xs text-muted-foreground">
      {{ t('prototype.views.project.settings.usage.note') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import Table from '@/components/ui/table/Table.vue'
import TableBody from '@/components/ui/table/TableBody.vue'
import TableCell from '@/components/ui/table/TableCell.vue'
import TableHead from '@/components/ui/table/TableHead.vue'
import TableHeader from '@/components/ui/table/TableHeader.vue'
import TableRow from '@/components/ui/table/TableRow.vue'
import { useToastStore } from '@/platform/updates/common/toastStore'

import { usePrototypePersonaStore } from '../stores/personaStore'
import type { Project } from '../types'
import { sampleUsage, usageCsv } from '../utils/workspaceUsage'

const { project } = defineProps<{
  project: Project
}>()

const CURRENT_MONTH = '2026-10'
const UNATTRIBUTED_COLOR = '#6b6b6b'

const { t } = useI18n()
const toast = useToastStore()
const { fixture } = storeToRefs(usePrototypePersonaStore())

const records = computed(() =>
  sampleUsage(fixture.value, project.workspaceId).filter(
    (r) => r.projectId === project.id && r.month === CURRENT_MONTH
  )
)

const total = computed(() =>
  records.value.reduce((sum, r) => sum + r.credits, 0)
)

// Month-over-month change against the prior month; null when there isn't a
// prior month (or it was zero) to compare against.
const deltaPct = computed(() => {
  const previous = project.monthlyUsage?.at(-2)?.credits
  if (!previous) return null
  return Math.round(((total.value - previous) / previous) * 100)
})

const recentMonths = computed(() => project.monthlyUsage?.slice(-3) ?? [])

const rows = computed(() =>
  records.value
    .map((record) => {
      const member = fixture.value.members.find((m) => m.id === record.memberId)
      const projectMember = project.members?.find(
        (m) => m.userId === record.memberId
      )
      const workspaceLimit = fixture.value.memberCreditLimits.find(
        (l) => l.memberId === record.memberId
      )?.limit
      return {
        id: record.memberId ?? 'unattributed',
        name: member?.name ?? t('prototype.settings.usage.unattributed'),
        detail: member?.email ?? '',
        color: member?.avatarColor ?? UNATTRIBUTED_COLOR,
        runs: record.runs,
        credits: record.credits,
        limit: projectMember?.creditLimit ?? workspaceLimit ?? null
      }
    })
    .slice()
    .sort((a, b) => b.credits - a.credits)
)

// Donut arcs: each member's share as a dash on a circle with a
// circumference of 100 units, offset by the shares before it.
const segments = computed(() => {
  let offset = 0
  return rows.value
    .filter((row) => row.credits > 0)
    .map((row) => {
      const percent = total.value ? (row.credits / total.value) * 100 : 0
      const segment = { id: row.id, color: row.color, percent, offset }
      offset += percent
      return segment
    })
})

function formatMonth(month: string): string {
  const [year, m] = month.split('-').map(Number)
  return new Date(year, m - 1, 1).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric'
  })
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function exportCsv() {
  const headers = [
    t('prototype.projectPage.usage.member'),
    t('prototype.settings.email'),
    t('prototype.projectPage.usage.runs'),
    t('prototype.projectPage.usage.credits'),
    t('prototype.settings.usage.share')
  ]
  const csv = usageCsv(headers, rows.value, total.value)
  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' })
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `${slugify(project.name) || 'project'}-usage-${CURRENT_MONTH}.csv`
  link.click()
  URL.revokeObjectURL(url)
  toast.add({
    severity: 'success',
    summary: t('prototype.views.project.settings.usage.exportedSummary'),
    detail: t('prototype.views.project.settings.usage.exportedDetail', {
      count: rows.value.length,
      project: project.name
    }),
    life: 2800
  })
}
</script>
