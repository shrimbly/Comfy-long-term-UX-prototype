<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/workspace.md
             §"Identity" — workspace is the single billing entity.
    log:     ../prototype/design-decisions.md (2026-05-15) — project
             usage is read-only attribution; no per-project budget.

  Renders this-month spend for the project as a slice of the workspace
  total. Workspace total is derived by summing creditsThisMonth across
  every project in the workspace so the bar can never overrun.
-->
<template>
  <SettingsPanel
    :title="t('prototype.views.project.settings.usage.heading')"
    :description="t('prototype.views.project.settings.usage.description')"
  >
    <SettingsSubCard>
      <div class="flex flex-col gap-3">
        <div class="flex items-baseline justify-between gap-4">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-muted">
              {{ t('prototype.views.project.settings.usage.projectLabel') }}
            </span>
            <span class="text-2xl font-bold text-text-primary">
              {{ formatCredits(projectCredits) }}
            </span>
          </div>
          <div class="flex flex-col items-end gap-0.5">
            <span class="text-xs text-muted">
              {{ t('prototype.views.project.settings.usage.workspaceLabel') }}
            </span>
            <span class="text-sm font-medium text-text-primary">
              {{ formatCredits(workspaceCredits) }}
            </span>
          </div>
        </div>
        <div
          class="h-2 w-full overflow-hidden rounded-full bg-secondary-background"
        >
          <div
            class="h-full rounded-full bg-text-primary transition-[width] duration-300"
            :style="{ width: `${sharePct}%` }"
          />
        </div>
        <div class="flex justify-between text-xs text-text-secondary">
          <span>
            {{
              t('prototype.views.project.settings.usage.shareLabel', {
                pct: sharePctRounded
              })
            }}
          </span>
          <span>
            {{ t('prototype.views.project.settings.usage.periodLabel') }}
          </span>
        </div>
      </div>
    </SettingsSubCard>
    <p class="m-0 text-xs text-muted italic">
      {{ t('prototype.views.project.settings.usage.note') }}
    </p>
  </SettingsPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import SettingsPanel from './settings/SettingsPanel.vue'
import SettingsSubCard from './settings/SettingsSubCard.vue'

const { projectCredits, workspaceCredits } = defineProps<{
  projectCredits: number
  workspaceCredits: number
}>()

const { t } = useI18n()

const sharePct = computed(() => {
  if (workspaceCredits <= 0) return 0
  return Math.min(100, (projectCredits / workspaceCredits) * 100)
})

const sharePctRounded = computed(() => Math.round(sharePct.value))

function formatCredits(value: number): string {
  return t('prototype.views.project.settings.usage.creditsValue', {
    value: value.toLocaleString()
  })
}
</script>
