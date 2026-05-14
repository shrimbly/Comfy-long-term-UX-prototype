<!--
  Implements:
    persistent footer credit-usage indicator. When the user is on the free
    plan or out of credits, surface the prominent Upgrade CTA from the main
    app (gradient variant) instead of the muted credits chip.
-->
<template>
  <button
    v-if="isUpgradeMode"
    type="button"
    class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-(image:--subscription-button-gradient) px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
  >
    <span class="icon-[lucide--zap] size-4" />
    {{ t('prototype.sidebar.upgradeCta') }}
  </button>
  <div
    v-else
    class="flex items-center justify-between rounded-md bg-modal-card-background px-2 py-1.5 text-xs text-base-foreground"
  >
    <span class="flex items-center gap-1.5">
      <span class="icon-[lucide--zap] size-3.5 text-warning-background" />
      <span>{{
        t('prototype.sidebar.creditsLeft', { pct: usage.creditsRemainingPct })
      }}</span>
    </span>
    <button
      v-if="usage.showUpgrade"
      type="button"
      class="cursor-pointer text-muted-foreground hover:text-base-foreground"
    >
      {{ t('prototype.sidebar.upgrade') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { UsageState, WorkspacePlan } from '../../types'

const { usage, plan } = defineProps<{
  usage: UsageState
  plan?: WorkspacePlan
}>()

const { t } = useI18n()

const isUpgradeMode = computed(
  () => plan === 'free' || usage.creditsRemainingPct <= 0
)
</script>
