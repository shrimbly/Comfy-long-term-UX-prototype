<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
              — GPU and cost idle vs running
    decision: ../IA_Plan/wiki/decisions/build-locks-project-until-ready.md
              — "Create deployment" starts the build that locks the project
    decision: prototype/design-decisions.md — 2026-10-07 "Flow 07: the
              incompatible-workflow dialog, redesigned on a canvas"

  Step 3: Platform's deploy dialog, copied as it is live (7 Oct 2026): the
  GPU, the worker counts, location and startup flags on the left; the
  estimated cost and time on the right. Only the GPU reaches the demo build.
-->
<template>
  <div class="grid grid-cols-[minmax(0,1fr)_26rem] max-md:grid-cols-1">
    <div class="flex flex-col p-6">
      <h2 :id="titleId" class="m-0 mb-5 text-base font-medium">
        {{ title }}
      </h2>

      <div class="overflow-hidden rounded-xl bg-secondary-background/40">
        <div
          class="grid h-10 grid-cols-[1.5rem_minmax(0,1fr)_5rem_4.5rem] items-center gap-3 border-b border-border-subtle pr-4 pl-4.5 text-xs tracking-wide text-muted-foreground uppercase"
        >
          <span />
          <span>{{ t('prototype.customCloud.dialog.deploy.gpu') }}</span>
          <span class="text-right">
            {{ t('prototype.customCloud.dialog.deploy.vram') }}
          </span>
          <span class="text-right">
            {{ t('prototype.customCloud.dialog.deploy.pricePerHour') }}
          </span>
        </div>
        <div
          role="radiogroup"
          :aria-label="t('prototype.customCloud.dialog.deploy.gpu')"
        >
          <label
            v-for="gpu in PLATFORM_GPUS"
            :key="gpu.label"
            :class="
              cn(
                'grid h-10 cursor-pointer grid-cols-[1.5rem_minmax(0,1fr)_5rem_4.5rem] items-center gap-3 border-b border-border-subtle/60 pr-4 pl-4.5 text-sm hover:bg-secondary-background-hover',
                gpu.label === gpuLabel &&
                  'bg-secondary-background-hover shadow-[inset_3px_0_0_var(--color-white)]'
              )
            "
          >
            <input
              v-model="gpuLabel"
              type="radio"
              class="peer sr-only"
              name="deploy-gpu"
              :value="gpu.label"
            />
            <span
              :class="
                cn(
                  'grid size-4.5 place-items-center rounded-full border peer-focus-visible:ring-1 peer-focus-visible:ring-border-default',
                  gpu.label === gpuLabel
                    ? 'border-base-foreground'
                    : 'border-border-default'
                )
              "
              aria-hidden="true"
            >
              <span
                v-if="gpu.label === gpuLabel"
                class="size-2 rounded-full bg-base-foreground"
              />
            </span>
            <span class="font-medium">{{ gpu.label }}</span>
            <span class="text-right text-muted-foreground tabular-nums">
              {{
                t('prototype.customCloud.dialog.deploy.vramValue', {
                  gb: gpu.vramGb
                })
              }}
            </span>
            <span class="text-right tabular-nums">
              {{ usd(gpu.pricePerHourUsd) }}
            </span>
          </label>
        </div>
        <Button
          variant="textonly"
          size="unset"
          class="h-10.5 w-full justify-between rounded-none pr-3.5 pl-3 text-xs font-normal"
          @click="onPlatform"
        >
          {{ t('prototype.customCloud.dialog.deploy.needGpu') }}
          <i class="icon-[lucide--arrow-right] size-4.5" />
        </Button>
      </div>

      <div
        v-for="stepper in steppers"
        :key="stepper.key"
        class="flex items-center justify-between border-b border-border-subtle px-2 py-5"
      >
        <span class="flex items-center gap-2 text-sm">
          {{ stepper.label }}
          <InfoTooltip :label="stepper.label">{{ stepper.hint }}</InfoTooltip>
        </span>
        <span
          class="inline-flex h-6 overflow-hidden rounded-sm border border-border-default"
        >
          <Button
            variant="textonly"
            size="unset"
            class="w-10 rounded-none"
            :disabled="stepper.value <= stepper.min"
            :aria-label="t('prototype.customCloud.dialog.deploy.decrease')"
            @click="stepper.set(stepper.value - 1)"
          >
            <i class="icon-[lucide--minus] size-3.5" />
          </Button>
          <span
            class="grid w-14 place-items-center border-x border-border-default text-[13px] tabular-nums"
            aria-live="polite"
          >
            {{ stepper.value }}
          </span>
          <Button
            variant="textonly"
            size="unset"
            class="w-10 rounded-none"
            :disabled="stepper.value >= stepper.max"
            :aria-label="t('prototype.customCloud.dialog.deploy.increase')"
            @click="stepper.set(stepper.value + 1)"
          >
            <i class="icon-[lucide--plus] size-3.5" />
          </Button>
        </span>
      </div>

      <div
        class="flex items-center justify-between border-b border-border-subtle px-2 py-5"
      >
        <span class="text-sm">
          {{ t('prototype.customCloud.dialog.deploy.location') }}
        </span>
        <span
          class="inline-flex gap-0.5 rounded-lg border border-border-subtle p-0.5"
        >
          <Button
            v-for="option in locations"
            :key="option.value"
            :variant="
              location === option.value ? 'secondary' : 'muted-textonly'
            "
            size="md"
            class="px-3 text-[13px] font-normal"
            :aria-pressed="location === option.value"
            @click="location = option.value"
          >
            {{ option.label }}
          </Button>
        </span>
      </div>

      <label class="flex flex-col gap-1.5 px-2 pt-5">
        <span class="flex items-center gap-2 text-sm">
          {{ t('prototype.customCloud.dialog.deploy.startupFlags') }}
          <InfoTooltip
            :label="t('prototype.customCloud.dialog.deploy.startupFlags')"
          >
            {{ t('prototype.customCloud.dialog.deploy.startupFlagsHint') }}
          </InfoTooltip>
        </span>
        <span class="text-xs text-muted-foreground">
          {{ t('prototype.customCloud.dialog.deploy.startupFlagsHelp') }}
        </span>
        <input
          v-model="startupFlags"
          type="text"
          :placeholder="
            t('prototype.customCloud.dialog.deploy.startupFlagsPlaceholder')
          "
          class="mt-1.5 h-8 rounded-md border border-border-default bg-transparent px-3 font-mono text-[13px] text-base-foreground outline-none placeholder:text-muted-foreground focus:border-muted-foreground"
        />
      </label>
    </div>

    <div
      class="flex flex-col border-l border-border-subtle bg-secondary-background/30 px-6 pt-14 pb-6 max-md:border-t max-md:border-l-0"
    >
      <h3 class="m-0 mb-3 ml-4 text-sm font-medium">
        {{ t('prototype.customCloud.dialog.deploy.estimatedCost') }}
      </h3>
      <div class="rounded-xl border border-border-subtle bg-base-background">
        <div class="flex flex-col gap-2.5 px-4 py-3.5">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm">
              {{ t('prototype.customCloud.dialog.deploy.gpuTime') }}
            </span>
            <span class="text-xs text-muted-foreground">
              {{
                selectedGpu
                  ? t('prototype.customCloud.dialog.deploy.perWorker', {
                      price: usd(selectedGpu.pricePerHourUsd)
                    })
                  : t('prototype.customCloud.dialog.deploy.chooseGpu')
              }}
            </span>
          </div>
          <div v-if="selectedGpu" class="grid grid-cols-2 gap-2">
            <div
              v-for="tile in costTiles"
              :key="tile.label"
              class="rounded-md border border-border-subtle px-3 py-2"
            >
              <div class="text-[13px] text-muted-foreground">
                {{ tile.label }}
              </div>
              <div class="text-lg font-semibold tabular-nums">
                {{ tile.value }}
                <span class="text-xs font-normal text-muted-foreground">
                  {{ t('prototype.customCloud.dialog.deploy.perHourUnit') }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div
          class="flex items-start justify-between gap-3 border-t border-border-subtle px-4 py-3.5"
        >
          <span class="flex flex-col gap-0.5">
            <span class="text-sm">
              {{ t('prototype.customCloud.dialog.deploy.modelStorage') }}
            </span>
            <span class="text-xs text-muted-foreground">
              {{
                t('prototype.customCloud.dialog.deploy.storageDetail', {
                  gb: MATTE_PASS.modelsGb,
                  rate: usd(STORAGE_USD_PER_GB_MONTH)
                })
              }}
            </span>
          </span>
          <span class="flex flex-col items-end gap-0.5">
            <span class="text-sm font-semibold tabular-nums">
              {{ usd(MATTE_PASS.modelsGb * STORAGE_USD_PER_GB_MONTH) }}
            </span>
            <span class="text-xs text-muted-foreground">
              {{ t('prototype.customCloud.dialog.deploy.perMonth') }}
            </span>
          </span>
        </div>
      </div>
      <p class="m-0 mx-4 mt-3 text-xs/normal text-muted-foreground">
        {{ t('prototype.customCloud.dialog.deploy.costNote') }}
      </p>
      <p class="m-0 mx-4 mt-2.5 text-[11px] text-muted-foreground italic">
        {{ t('prototype.customCloud.dialog.deploy.currency') }}
      </p>

      <template v-if="selectedGpu">
        <h3 class="m-0 mt-6 mb-3 ml-4 text-sm font-medium">
          {{ t('prototype.customCloud.dialog.deploy.estimatedTime') }}
        </h3>
        <div
          class="flex items-start justify-between gap-3 rounded-xl border border-border-subtle bg-base-background px-4 py-3.5"
        >
          <span class="flex flex-col gap-0.5">
            <span class="text-sm">
              {{ t('prototype.customCloud.dialog.deploy.untilReady') }}
            </span>
            <span class="text-xs text-muted-foreground">
              {{
                t('prototype.customCloud.dialog.deploy.toDownload', {
                  gb: MATTE_PASS.modelsGb
                })
              }}
            </span>
          </span>
          <span class="text-sm font-semibold tabular-nums">
            {{
              t('prototype.customCloud.dialog.deploy.minutes', {
                min: MATTE_PASS.readyMinutes[0],
                max: MATTE_PASS.readyMinutes[1]
              })
            }}
          </span>
        </div>
        <p class="m-0 mx-4 mt-3 text-xs/normal text-muted-foreground">
          {{ t('prototype.customCloud.dialog.deploy.timeNote') }}
        </p>
      </template>

      <footer class="mt-auto flex items-center justify-end gap-2 pt-8">
        <Button variant="muted-textonly" size="md" @click="emit('close')">
          {{ t('prototype.customCloud.dialog.deploy.cancel') }}
        </Button>
        <Button
          variant="inverted"
          size="md"
          :disabled="!selectedGpu"
          @click="onCreate"
        >
          {{
            t(
              customCloud.editingDeployment
                ? 'prototype.customCloud.dialog.deploy.saveRebuild'
                : 'prototype.customCloud.dialog.deploy.create'
            )
          }}
        </Button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import { useToastStore } from '@/platform/updates/common/toastStore'

import { useTextT } from '../composables/useTextT'
import {
  DEFAULT_MAX_WORKERS,
  MATTE_PASS,
  MAX_WORKERS,
  PLATFORM_GPUS,
  STORAGE_USD_PER_GB_MONTH
} from '../fixtures/customCloud'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { nextRelease } from '../utils/deployment'

import InfoTooltip from './InfoTooltip.vue'

const { titleId } = defineProps<{
  titleId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const tText = useTextT()
const toast = useToastStore()
const customCloud = usePrototypeCustomCloudStore()

const gpuLabel = ref<string | null>(customCloud.editingDeployment?.gpu ?? null)
const warmWorkers = ref(0)
const maxWorkers = ref(DEFAULT_MAX_WORKERS)
const location = ref<'anywhere' | 'us'>('anywhere')
const startupFlags = ref('')

const name = computed(() => customCloud.newDeploymentName.trim())

// Editing cuts the next release of the deployment; a new one is release 1.
const title = computed(() => {
  const editing = customCloud.editingDeployment
  return editing
    ? tText('prototype.customCloud.dialog.deploy.editTitle', {
        name: name.value,
        release: nextRelease(editing.release)
      })
    : tText('prototype.customCloud.dialog.deploy.title', { name: name.value })
})
const selectedGpu = computed(() =>
  PLATFORM_GPUS.find((gpu) => gpu.label === gpuLabel.value)
)

function usd(amount: number) {
  return `$${amount.toFixed(2)}`
}

const steppers = computed(() => [
  {
    key: 'warm',
    label: t('prototype.customCloud.dialog.deploy.warmWorkers'),
    hint: t('prototype.customCloud.dialog.deploy.warmHint'),
    value: warmWorkers.value,
    min: 0,
    max: maxWorkers.value,
    set: (value: number) => (warmWorkers.value = value)
  },
  {
    key: 'max',
    label: t('prototype.customCloud.dialog.deploy.maxWorkers'),
    hint: t('prototype.customCloud.dialog.deploy.maxHint'),
    value: maxWorkers.value,
    min: Math.max(1, warmWorkers.value),
    max: MAX_WORKERS,
    set: (value: number) => (maxWorkers.value = value)
  }
])

const locations = computed(() => [
  {
    value: 'anywhere' as const,
    label: t('prototype.customCloud.dialog.deploy.anywhere')
  },
  {
    value: 'us' as const,
    label: t('prototype.customCloud.dialog.deploy.unitedStates')
  }
])

const costTiles = computed(() => {
  const price = selectedGpu.value?.pricePerHourUsd ?? 0
  return [
    {
      label: t('prototype.customCloud.dialog.deploy.whenIdle'),
      value: usd(price * warmWorkers.value)
    },
    {
      label: t('prototype.customCloud.dialog.deploy.atFullLoad'),
      value: usd(price * maxWorkers.value)
    }
  ]
})

function onCreate() {
  if (!selectedGpu.value) return
  if (customCloud.editingDeployment)
    customCloud.requestSaveEdit(selectedGpu.value)
  else customCloud.buildAndDeploy(selectedGpu.value)
}

function onPlatform() {
  toast.add({
    severity: 'info',
    summary: t('prototype.customCloud.settings.platformToast'),
    life: 3000
  })
}
</script>
