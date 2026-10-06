<!--
  Time range for a usage table: 24h to 12 months, or two dates. Shared by
  the project Usage tab and the workspace Usage page.
-->
<template>
  <div class="flex flex-wrap items-center gap-3">
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
            'h-8 cursor-pointer rounded-md px-3 text-sm transition-colors active:scale-[0.96]',
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

    <div v-if="range === 'custom'" class="flex items-center gap-2 text-sm">
      <input
        v-model="from"
        type="date"
        :max="to"
        :aria-label="t('prototype.projectPage.usage.from')"
        :class="dateInputClass"
      />
      <span class="text-muted-foreground">
        {{ t('prototype.projectPage.usage.to') }}
      </span>
      <input
        v-model="to"
        type="date"
        :min="from"
        :aria-label="t('prototype.projectPage.usage.to')"
        :class="dateInputClass"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { useI18n } from 'vue-i18n'

import { USAGE_RANGES } from '../utils/usageRange'
import type { UsageRange } from '../utils/usageRange'

const range = defineModel<UsageRange>({ required: true })
const from = defineModel<string>('from', { required: true })
const to = defineModel<string>('to', { required: true })

const dateInputClass =
  'h-8 rounded-md border border-border-subtle bg-base-background px-2 text-sm text-base-foreground outline-none focus:border-base-foreground'

const { t } = useI18n()
</script>
