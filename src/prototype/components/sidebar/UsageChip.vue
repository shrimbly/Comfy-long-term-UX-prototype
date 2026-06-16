<!--
  Implements:
    persistent footer credit indicator. Shows the workspace's available
    credits + a Top up CTA, using the main-app credits icon. Free plan / no
    credits surfaces the prominent gradient Upgrade CTA instead.
-->
<template>
  <Button
    v-if="isUpgradeMode"
    variant="gradient"
    size="lg"
    class="w-full gap-2"
  >
    <i class="icon-[lucide--zap] size-4" />
    {{ t('prototype.sidebar.upgradeCta') }}
  </Button>
  <div
    v-else
    class="flex items-center justify-between rounded-md bg-modal-card-background px-2 py-1.5 text-xs text-base-foreground"
  >
    <span class="flex items-center gap-1.5">
      <i class="icon-[comfy--credits] size-3.5 text-warning-background" />
      <span>{{
        t('prototype.sidebar.creditsAvailable', { credits: formattedCredits })
      }}</span>
    </span>
    <Button variant="link" size="unset" class="text-xs">
      {{ t('prototype.sidebar.topUp') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import type { WorkspacePlan } from '../../types'

const { credits = 0, plan } = defineProps<{
  credits?: number
  plan?: WorkspacePlan
}>()

const { t } = useI18n()

const isUpgradeMode = computed(() => plan === 'free' || credits <= 0)
const formattedCredits = computed(() => credits.toLocaleString())
</script>
