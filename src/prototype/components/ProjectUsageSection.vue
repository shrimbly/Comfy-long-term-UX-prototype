<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/workspace.md §"Identity" — workspace is
            the single billing entity; project usage is read-only attribution.
    log:    ../prototype/design-decisions.md (2026-06-24) — usage tab: count,
            month-over-month delta, recent months, mocked export.

  This-month credit spend attributed to the project, with the month-over-month
  change, the last three months, and a (client-side mocked) full-history CSV
  export. Billing itself lives at the workspace level.
-->
<template>
  <div class="flex max-w-md flex-col gap-3">
    <SettingsPanel :title="t('prototype.views.project.settings.usage.heading')">
      <div class="flex flex-col gap-5">
        <div class="flex items-end gap-3">
          <span class="text-3xl font-bold text-base-foreground">
            {{ formatCredits(currentCredits) }}
          </span>
          <span
            v-if="deltaPct !== null && deltaPct !== 0"
            :class="
              cn(
                'mb-1 inline-flex items-center gap-1 text-xs font-medium',
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
        </div>

        <div v-if="recentMonths.length" class="flex flex-col gap-2">
          <p class="text-xs font-medium text-muted-foreground">
            {{ t('prototype.views.project.settings.usage.recentHeading') }}
          </p>
          <div class="grid grid-cols-3 gap-2">
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
              <span class="text-sm font-semibold text-base-foreground">
                {{ m.credits.toLocaleString() }}
              </span>
            </div>
          </div>
        </div>

        <Button
          v-if="usage.length"
          variant="secondary"
          size="sm"
          class="self-start"
          @click="exportHistory"
        >
          <i class="icon-[lucide--download] size-4" />
          {{ t('prototype.views.project.settings.usage.export') }}
        </Button>
      </div>
    </SettingsPanel>
    <p class="m-0 text-xs text-muted-foreground">
      {{ t('prototype.views.project.settings.usage.note') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { useToast } from 'primevue/usetoast'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import SettingsPanel from './settings/SettingsPanel.vue'
import type { MonthlyUsage } from '../types'

const { usage, projectName } = defineProps<{
  usage: MonthlyUsage[]
  projectName: string
}>()

const { t } = useI18n()
const toast = useToast()

const currentCredits = computed(() => usage.at(-1)?.credits ?? 0)

// Month-over-month change against the prior month; null when there isn't a
// prior month (or it was zero) to compare against.
const deltaPct = computed(() => {
  const current = usage.at(-1)?.credits
  const previous = usage.at(-2)?.credits
  if (current == null || !previous) return null
  return Math.round(((current - previous) / previous) * 100)
})

const recentMonths = computed(() => usage.slice(-3))

function formatCredits(value: number): string {
  return t('prototype.views.project.settings.usage.creditsValue', {
    value: value.toLocaleString()
  })
}

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

// Mocked export: build the full history as CSV and download it client-side —
// no backend. Real usage data would stream from the billing service.
function exportHistory() {
  const rows = [
    ['Month', 'Credits'],
    ...usage.map((u) => [u.month, String(u.credits)])
  ]
  const csv = rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${slugify(projectName) || 'project'}-usage-history.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  toast.add({
    severity: 'success',
    summary: t('prototype.views.project.settings.usage.exportedSummary'),
    detail: t('prototype.views.project.settings.usage.exportedDetail', {
      count: usage.length,
      project: projectName
    }),
    life: 2800
  })
}
</script>
