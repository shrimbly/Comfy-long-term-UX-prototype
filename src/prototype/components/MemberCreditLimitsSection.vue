<!--
  Implements:
    open-q:  ../IA_Plan/wiki/open-questions.md#per-member-credit-limits
             — Proposed: UI surface required regardless of mechanism.
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md
             §"Workspace level" — Admin-only, not delegable.
-->
<template>
  <SettingsPanel
    :title="t('prototype.views.settings.creditLimits.heading')"
    :description="t('prototype.views.settings.creditLimits.description')"
  >
    <SettingsSubCard>
      <p class="m-0 text-sm text-text-secondary italic">
        {{ t('prototype.views.settings.creditLimits.mechanismNote') }}
      </p>
    </SettingsSubCard>

    <SettingsTable>
      <thead class="bg-secondary-background">
        <tr>
          <th
            class="px-3 py-2 text-left text-xs font-medium tracking-wide text-muted uppercase"
          >
            {{ t('prototype.views.settings.creditLimits.col.member') }}
          </th>
          <th
            class="px-3 py-2 text-left text-xs font-medium tracking-wide text-muted uppercase"
          >
            {{ t('prototype.views.settings.creditLimits.col.limit') }}
          </th>
          <th
            class="px-3 py-2 text-left text-xs font-medium tracking-wide text-muted uppercase"
          >
            {{ t('prototype.views.settings.creditLimits.col.period') }}
          </th>
          <th
            class="px-3 py-2 text-left text-xs font-medium tracking-wide text-muted uppercase"
          >
            {{ t('prototype.views.settings.creditLimits.col.usage') }}
          </th>
          <th class="w-24 px-3 py-2" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.memberId"
          class="border-t border-interface-stroke"
        >
          <td class="px-3 py-2 align-middle">
            <div class="flex flex-col gap-0.5">
              <span class="text-sm text-text-primary">{{ row.name }}</span>
              <span class="text-xs text-muted">{{ row.email }}</span>
            </div>
          </td>
          <td class="px-3 py-2 align-middle">
            <input
              :value="row.limit"
              type="number"
              min="0"
              step="50"
              class="h-8 w-24 rounded-md border border-interface-stroke bg-base-background px-2 text-sm text-text-primary outline-none focus:border-text-primary"
              @change="onLimitChange(row.memberId, row.period, $event)"
            />
          </td>
          <td class="px-3 py-2 align-middle">
            <select
              :value="row.period"
              class="h-8 rounded-md border border-interface-stroke bg-base-background px-2 text-sm text-text-primary outline-none focus:border-text-primary"
              @change="onPeriodChange(row.memberId, row.limit, $event)"
            >
              <option value="monthly">
                {{ t('prototype.views.settings.creditLimits.period.monthly') }}
              </option>
              <option value="weekly">
                {{ t('prototype.views.settings.creditLimits.period.weekly') }}
              </option>
              <option value="one-time">
                {{ t('prototype.views.settings.creditLimits.period.oneTime') }}
              </option>
            </select>
          </td>
          <td class="px-3 py-2 align-middle">
            <div class="flex flex-col gap-1">
              <div class="flex items-baseline gap-1 text-sm">
                <span class="text-text-primary">
                  {{ row.used.toLocaleString() }}
                </span>
                <span class="text-xs text-muted">
                  /
                  {{
                    row.limit > 0
                      ? row.limit.toLocaleString()
                      : t('prototype.views.settings.creditLimits.unlimited')
                  }}
                </span>
              </div>
              <div
                v-if="row.limit > 0"
                class="h-1 w-32 overflow-hidden rounded-full bg-base-background"
              >
                <div
                  class="h-full"
                  :class="
                    row.used >= row.limit
                      ? 'bg-warning-background'
                      : 'bg-text-primary'
                  "
                  :style="{ width: `${row.usagePct}%` }"
                />
              </div>
            </div>
          </td>
          <td class="px-3 py-2 text-right align-middle">
            <Button
              v-if="row.hasLimit"
              variant="muted-textonly"
              size="sm"
              @click="emit('remove', row.memberId)"
            >
              {{ t('prototype.views.settings.creditLimits.clear') }}
            </Button>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td
            colspan="5"
            class="px-3 py-6 text-center text-sm text-text-secondary"
          >
            {{ t('prototype.views.settings.creditLimits.noMembers') }}
          </td>
        </tr>
      </tbody>
    </SettingsTable>
  </SettingsPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import SettingsPanel from './settings/SettingsPanel.vue'
import SettingsSubCard from './settings/SettingsSubCard.vue'
import SettingsTable from './settings/SettingsTable.vue'
import type {
  CreditLimitPeriod,
  MemberCreditLimit,
  WorkspaceMember
} from '../types'

const { members, limits } = defineProps<{
  members: WorkspaceMember[]
  limits: MemberCreditLimit[]
}>()

const emit = defineEmits<{
  set: [memberId: string, limit: number, period: CreditLimitPeriod]
  remove: [memberId: string]
}>()

const { t } = useI18n()

const rows = computed(() =>
  members
    .filter((m) => m.role !== 'admin')
    .map((m) => {
      const existing = limits.find((l) => l.memberId === m.id)
      const limit = existing?.limit ?? 0
      const used = existing?.used ?? 0
      const usagePct =
        limit > 0 ? Math.max(0, Math.min(100, (used / limit) * 100)) : 0
      return {
        memberId: m.id,
        name: m.name,
        email: m.email,
        limit,
        period: existing?.period ?? ('monthly' as CreditLimitPeriod),
        used,
        usagePct,
        hasLimit: !!existing
      }
    })
)

function onLimitChange(
  memberId: string,
  period: CreditLimitPeriod,
  event: Event
) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isNaN(value) || value <= 0) {
    emit('remove', memberId)
    return
  }
  emit('set', memberId, value, period)
}

function onPeriodChange(memberId: string, limit: number, event: Event) {
  const period = (event.target as HTMLSelectElement).value as CreditLimitPeriod
  if (limit <= 0) return
  emit('set', memberId, limit, period)
}
</script>
