<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
              — GPU and cost idle vs running
    log:      prototype/design-decisions.md — 2026-10-07 "Edit deployment:
              its own dialog, two modes, a change counter"

  Machine mode of Edit deployment: the GPU the workers run on and how long
  one stays warm after a run. Only these reach the demo build.
-->
<template>
  <div class="flex flex-col gap-4">
    <div
      class="overflow-hidden rounded-xl border border-border-subtle bg-secondary-background/40"
    >
      <div
        class="grid h-10 grid-cols-[1.5rem_minmax(0,1fr)_5rem_4.5rem] items-center gap-3 border-b border-border-subtle pr-4 pl-4.5 text-xs tracking-wide text-muted-foreground uppercase"
      >
        <span />
        <span class="flex items-center gap-2">
          {{ t('prototype.customCloud.edit.gpu') }}
          <ChangedBadge v-if="changes.gpu" />
        </span>
        <span class="text-right">{{
          t('prototype.customCloud.edit.vram')
        }}</span>
        <span class="text-right">
          {{ t('prototype.customCloud.edit.pricePerHour') }}
        </span>
      </div>
      <div role="radiogroup" :aria-label="t('prototype.customCloud.edit.gpu')">
        <label
          v-for="gpu in PLATFORM_GPUS"
          :key="gpu.label"
          :class="
            cn(
              'grid h-10 cursor-pointer grid-cols-[1.5rem_minmax(0,1fr)_5rem_4.5rem] items-center gap-3 border-b border-border-subtle/60 pr-4 pl-4.5 text-sm last:border-b-0 hover:bg-secondary-background-hover',
              gpu.label === selectedLabel &&
                'bg-secondary-background-hover shadow-[inset_3px_0_0_var(--color-white)]'
            )
          "
        >
          <input
            type="radio"
            class="peer sr-only"
            name="edit-gpu"
            :value="gpu.label"
            :checked="gpu.label === selectedLabel"
            @change="customCloud.editingGpu = gpu"
          />
          <span
            :class="
              cn(
                'grid size-4.5 place-items-center rounded-full border peer-focus-visible:ring-1 peer-focus-visible:ring-border-default',
                gpu.label === selectedLabel
                  ? 'border-base-foreground'
                  : 'border-border-default'
              )
            "
            aria-hidden="true"
          >
            <span
              v-if="gpu.label === selectedLabel"
              class="size-2 rounded-full bg-base-foreground"
            />
          </span>
          <span class="font-medium">{{ gpu.label }}</span>
          <span class="text-right text-muted-foreground tabular-nums">
            {{ t('prototype.customCloud.edit.vramValue', { gb: gpu.vramGb }) }}
          </span>
          <span class="text-right tabular-nums">
            {{ usd(gpu.pricePerHourUsd) }}
          </span>
        </label>
      </div>
    </div>

    <div
      class="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-secondary-background/40 px-4 py-3"
    >
      <span class="flex flex-col gap-0.5">
        <span class="flex items-center gap-2 text-sm">
          {{ t('prototype.customCloud.edit.keepWarm') }}
          <ChangedBadge v-if="changes.warmMinutes" />
        </span>
        <span class="text-xs text-muted-foreground">
          {{ t('prototype.customCloud.edit.keepWarmHint') }}
        </span>
      </span>
      <span
        class="inline-flex h-7 shrink-0 overflow-hidden rounded-md border border-border-default"
      >
        <Button
          variant="textonly"
          size="unset"
          class="w-9 rounded-none"
          :disabled="customCloud.editingWarmMinutes <= 0"
          :aria-label="t('prototype.customCloud.dialog.deploy.decrease')"
          @click="customCloud.editingWarmMinutes -= 1"
        >
          <i class="icon-[lucide--minus] size-3.5" />
        </Button>
        <span
          class="grid w-16 place-items-center border-x border-border-default text-[13px] tabular-nums"
          aria-live="polite"
        >
          {{
            t(
              'prototype.customCloud.edit.minutes',
              customCloud.editingWarmMinutes
            )
          }}
        </span>
        <Button
          variant="textonly"
          size="unset"
          class="w-9 rounded-none"
          :disabled="customCloud.editingWarmMinutes >= MAX_WARM_MINUTES"
          :aria-label="t('prototype.customCloud.dialog.deploy.increase')"
          @click="customCloud.editingWarmMinutes += 1"
        >
          <i class="icon-[lucide--plus] size-3.5" />
        </Button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { PLATFORM_GPUS } from '../fixtures/customCloud'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'

import ChangedBadge from './EditDeploymentChangedBadge.vue'

const MAX_WARM_MINUTES = 30

const { t } = useI18n()
const customCloud = usePrototypeCustomCloudStore()

const changes = computed(() => customCloud.editingChanges)
const selectedLabel = computed(() => customCloud.editingGpu?.label)

function usd(amount: number) {
  return `$${amount.toFixed(2)}`
}
</script>
