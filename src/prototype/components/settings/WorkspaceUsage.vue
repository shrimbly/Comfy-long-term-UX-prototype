<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <span class="inline-flex items-center gap-2 text-xs text-muted-foreground"
        ><i class="icon-[lucide--flask-conical] size-3.5" />{{
          t('prototype.settings.sampleUsage')
        }}</span
      >
      <UsageRangePicker
        v-model="range"
        v-model:from="customFrom"
        v-model:to="customTo"
      />
    </div>
    <div>
      <p class="m-0 text-sm text-muted-foreground">
        {{ t('prototype.settings.usage.spent') }}
      </p>
      <p class="mt-1 mb-0 text-4xl font-semibold tabular-nums">
        {{ total.toLocaleString() }}
      </p>
    </div>
    <Tabs v-model="group" class="gap-5">
      <TabsList
        variant="bordered"
        class="justify-start border-b border-border-subtle"
        :aria-label="t('prototype.settings.usage.group')"
        ><TabsTrigger
          variant="flush"
          class="border-b-2 border-solid border-transparent data-[state=active]:border-base-foreground"
          value="members"
          >{{ t('prototype.settings.usage.members') }}</TabsTrigger
        ><TabsTrigger
          variant="flush"
          class="border-b-2 border-solid border-transparent data-[state=active]:border-base-foreground"
          value="projects"
          >{{ t('prototype.settings.usage.projects') }}</TabsTrigger
        ></TabsList
      >
      <TabsContent :value="group" class="space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 class="m-0 text-base font-medium">
              {{ t(`prototype.settings.usage.${group}Heading`) }}
            </h3>
            <p class="mt-2 mb-0 text-sm text-muted-foreground">
              {{ t(`prototype.projectPage.usage.range.${range}`) }} ·
              {{
                t('prototype.settings.usage.total', {
                  count: total.toLocaleString()
                })
              }}
            </p>
          </div>
          <Button
            variant="secondary"
            :disabled="!rows.length"
            @click="exportCsv"
            ><i class="icon-[lucide--download] size-4" />{{
              t('prototype.settings.usage.export')
            }}</Button
          >
        </div>
        <div class="overflow-hidden rounded-lg border border-border-subtle">
          <Table
            class="[&_table]:min-w-xl [&_td]:border-b [&_td]:border-border-subtle/50 [&_td]:px-4 [&_th]:px-4"
            ><TableHeader
              ><TableRow class="bg-secondary-background/50"
                ><TableHead class="w-1/2">{{
                  t(`prototype.settings.usage.${group}`)
                }}</TableHead
                ><TableHead class="text-right">{{
                  t('prototype.settings.usage.runs')
                }}</TableHead
                ><TableHead class="text-right">{{
                  t('prototype.settings.credits')
                }}</TableHead
                ><TableHead class="text-right">{{
                  t('prototype.settings.usage.share')
                }}</TableHead></TableRow
              ></TableHeader
            ><TableBody
              ><TableRow
                v-for="row in rows"
                :key="row.id"
                class="h-16 hover:bg-secondary-background/20"
                ><TableCell
                  ><p class="m-0 font-medium">{{ row.name }}</p>
                  <p
                    v-if="row.detail"
                    class="mt-1 mb-0 truncate text-xs text-muted-foreground"
                  >
                    {{ row.detail }}
                  </p></TableCell
                ><TableCell
                  class="text-right text-muted-foreground tabular-nums"
                  >{{ row.runs.toLocaleString() }}</TableCell
                ><TableCell class="text-right font-medium tabular-nums">{{
                  row.credits.toLocaleString()
                }}</TableCell
                ><TableCell
                  class="text-right text-muted-foreground tabular-nums"
                  >{{
                    percent.format(total ? row.credits / total : 0)
                  }}</TableCell
                ></TableRow
              ><TableRow v-if="!total"
                ><TableCell
                  :colspan="4"
                  class="py-8 text-center text-muted-foreground"
                  >{{ t('prototype.settings.usage.empty') }}</TableCell
                ></TableRow
              ></TableBody
            ></Table
          >
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import Tabs from '@/components/ui/tabs/Tabs.vue'
import TabsList from '@/components/ui/tabs/TabsList.vue'
import TabsTrigger from '@/components/ui/tabs/TabsTrigger.vue'
import TabsContent from '@/components/ui/tabs/TabsContent.vue'
import Table from '@/components/ui/table/Table.vue'
import TableHeader from '@/components/ui/table/TableHeader.vue'
import TableHead from '@/components/ui/table/TableHead.vue'
import TableBody from '@/components/ui/table/TableBody.vue'
import TableRow from '@/components/ui/table/TableRow.vue'
import TableCell from '@/components/ui/table/TableCell.vue'
import { usePrototypePersonaStore } from '../../stores/personaStore'
import { daysBetween, usageRangeFactor } from '../../utils/usageRange'
import type { UsageRange } from '../../utils/usageRange'
import {
  sampleUsage,
  summarizeUsage,
  usageCsv
} from '../../utils/workspaceUsage'
import UsageRangePicker from '../UsageRangePicker.vue'
const { t } = useI18n()
const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1
})
const personas = usePrototypePersonaStore()
const CURRENT_MONTH = '2026-10'
const range = ref<UsageRange>('thisMonth')
const customFrom = ref('2026-09-22')
const customTo = ref('2026-10-06')
const group = ref('members')
const allRecords = computed(() =>
  sampleUsage(personas.fixture, personas.fixture.currentWorkspaceId)
)
const records = computed(() =>
  allRecords.value.filter((record) => record.month === CURRENT_MONTH)
)
const monthTotal = computed(() =>
  records.value.reduce((sum, record) => sum + record.credits, 0)
)
const history = computed(() => {
  const byMonth = new Map<string, number>()
  for (const record of allRecords.value) {
    byMonth.set(record.month, (byMonth.get(record.month) ?? 0) + record.credits)
  }
  return [...byMonth]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, credits]) => ({ month, credits }))
})
const factor = computed(() =>
  usageRangeFactor(
    range.value,
    monthTotal.value,
    history.value,
    daysBetween(customFrom.value, customTo.value)
  )
)
const rows = computed(() =>
  summarizeUsage(
    records.value,
    group.value === 'members' ? 'members' : 'projects',
    personas.fixture,
    personas.fixture.currentWorkspaceId,
    t('prototype.settings.usage.unattributed')
  ).map((row) => ({
    ...row,
    credits: Math.round(row.credits * factor.value),
    runs: Math.round(row.runs * factor.value)
  }))
)
const total = computed(() =>
  rows.value.reduce((sum, row) => sum + row.credits, 0)
)
function exportCsv() {
  const headers = [
    t(`prototype.settings.usage.${group.value}`),
    t('prototype.settings.email'),
    t('prototype.settings.usage.runs'),
    t('prototype.settings.credits'),
    t('prototype.settings.usage.share')
  ]
  const url = URL.createObjectURL(
    new Blob([usageCsv(headers, rows.value, total.value)], {
      type: 'text/csv;charset=utf-8'
    })
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `${personas.fixture.currentWorkspaceId}-${group.value}-${range.value}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
</script>
