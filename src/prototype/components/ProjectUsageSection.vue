<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/workspace.md §"Identity" — workspace is
            the single billing entity; project usage is read-only attribution.
    open-q: ../IA_Plan/wiki/open-questions.md#per-member-credit-limits
            — working: an optional per-member cap on each project
    log:    ../prototype/design-decisions.md (2026-10-07) — credit
            attribution per member on the project page

  Credits the project spent in a range, split by member: a range switcher,
  the total, and a table with runs, credits and each member's progress
  against their monthly limit in this project. Export is a client-side CSV.
-->
<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div
        role="radiogroup"
        :aria-label="t('prototype.projectPage.usage.rangeLabel')"
        class="flex items-center gap-0.5 rounded-lg border border-border-subtle p-0.5"
      >
        <button
          v-for="option in USAGE_RANGES"
          :key="option"
          type="button"
          role="radio"
          :aria-checked="range === option"
          :class="
            cn(
              'h-8 cursor-pointer rounded-md px-3 text-sm transition-colors',
              range === option
                ? 'bg-secondary-background-hover text-base-foreground'
                : 'text-muted-foreground hover:text-base-foreground'
            )
          "
          @click="range = option"
        >
          {{ t(`prototype.projectPage.usage.range.${option}`) }}
        </button>
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

    <div v-if="range === 'custom'" class="flex items-center gap-2 text-sm">
      <input
        v-model="customFrom"
        type="date"
        :max="customTo"
        :aria-label="t('prototype.projectPage.usage.from')"
        :class="dateInputClass"
      />
      <span class="text-muted-foreground">
        {{ t('prototype.projectPage.usage.to') }}
      </span>
      <input
        v-model="customTo"
        type="date"
        :min="customFrom"
        :aria-label="t('prototype.projectPage.usage.to')"
        :class="dateInputClass"
      />
    </div>

    <div class="flex flex-col gap-1">
      <span class="text-4xl font-semibold tracking-tight tabular-nums">
        {{ total.toLocaleString() }}
      </span>
      <span class="text-sm text-muted-foreground">
        {{ t('prototype.projectPage.usage.creditsSpent') }}
      </span>
    </div>

    <div class="overflow-hidden rounded-lg border border-border-subtle">
      <Table
        class="[&_td]:border-b [&_td]:border-border-subtle/50 [&_td]:px-4 [&_th]:px-4"
      >
        <TableHeader>
          <TableRow class="bg-secondary-background/50">
            <TableHead class="w-1/2">
              {{ t('prototype.projectPage.usage.member') }}
            </TableHead>
            <TableHead class="text-right">
              {{ t('prototype.projectPage.usage.runs') }}
            </TableHead>
            <TableHead class="text-right">
              {{ t('prototype.projectPage.usage.credits') }}
            </TableHead>
            <TableHead v-if="showsLimit" class="w-72 text-right">
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
              <span class="flex min-w-0 flex-col">
                <span class="truncate">{{ row.name }}</span>
                <span
                  v-if="row.detail"
                  class="truncate text-xs text-muted-foreground"
                >
                  {{ row.detail }}
                </span>
              </span>
            </TableCell>
            <TableCell class="text-right text-muted-foreground tabular-nums">
              {{ row.runs.toLocaleString() }}
            </TableCell>
            <TableCell class="text-right tabular-nums">
              {{ row.credits.toLocaleString() }}
            </TableCell>
            <TableCell v-if="showsLimit" class="text-right whitespace-nowrap">
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
              :colspan="showsLimit ? 4 : 3"
              class="py-8 text-center text-muted-foreground"
            >
              {{ t('prototype.projectPage.usage.empty') }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
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
import {
  USAGE_RANGES,
  daysBetween,
  usageRangeFactor
} from '../utils/usageRange'
import type { UsageRange } from '../utils/usageRange'
import { sampleUsage, usageCsv } from '../utils/workspaceUsage'

const { project } = defineProps<{
  project: Project
}>()

const CURRENT_MONTH = '2026-10'

const dateInputClass =
  'h-8 rounded-md border border-border-subtle bg-base-background px-2 text-sm text-base-foreground outline-none focus:border-base-foreground'

const { t } = useI18n()
const toast = useToastStore()
const { fixture } = storeToRefs(usePrototypePersonaStore())

const range = ref<UsageRange>('thisMonth')
const customFrom = ref('2026-09-22')
const customTo = ref('2026-10-06')

const monthRecords = computed(() =>
  sampleUsage(fixture.value, project.workspaceId).filter(
    (r) => r.projectId === project.id && r.month === CURRENT_MONTH
  )
)

const monthTotal = computed(() =>
  monthRecords.value.reduce((sum, r) => sum + r.credits, 0)
)

const factor = computed(() =>
  usageRangeFactor(
    range.value,
    monthTotal.value,
    project.monthlyUsage ?? [],
    daysBetween(customFrom.value, customTo.value)
  )
)

// Limits are monthly, so the bar only makes sense against a month.
const showsLimit = computed(
  () => range.value === 'thisMonth' || range.value === 'month30'
)

const rows = computed(() =>
  monthRecords.value
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
        runs: Math.round(record.runs * factor.value),
        credits: Math.round(record.credits * factor.value),
        limit: projectMember?.creditLimit ?? workspaceLimit ?? null
      }
    })
    .slice()
    .sort((a, b) => b.credits - a.credits)
)

const total = computed(() =>
  rows.value.reduce((sum, row) => sum + row.credits, 0)
)

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
  link.download = `${slugify(project.name) || 'project'}-usage-${range.value}.csv`
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
