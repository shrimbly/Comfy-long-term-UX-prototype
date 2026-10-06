<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
              step 6
    open-q:   ../IA_Plan/wiki/open-questions.md#build-wait-acceptable
    decision: prototype/design-decisions.md — 2026-10-07 "Flow 07: the
              project opens only once its deployment is done"

  The dialog's build step: build then deploy progress with stage times, for
  a new deployment. Nothing is locked; "Keep working" closes it and the tab
  strip's "Building" chip opens it again. When the deployment is done the
  dialog asks to name the project, and only then opens it.
-->
<template>
  <header class="flex flex-col gap-2.5 pr-8">
    <h2 :id="titleId" class="m-0 text-2xl font-semibold">
      {{
        tText('prototype.customCloud.lock.title', {
          deployment: deployment.name
        })
      }}
    </h2>
    <p class="m-0 text-sm text-muted-foreground">
      {{ timeLeft }}
      {{
        t(
          customCloud.editingDeployment
            ? 'prototype.customCloud.lock.rebuildBody'
            : 'prototype.customCloud.lock.body'
        )
      }}
    </p>
  </header>

  <section
    v-for="phase in phases"
    :key="phase.id"
    class="flex flex-col gap-3 rounded-lg border border-border-subtle bg-secondary-background/40 px-4 py-3"
  >
    <div class="flex items-center justify-between gap-4">
      <h3 class="m-0 text-sm font-medium">{{ phase.label }}</h3>
      <span class="text-xs text-muted-foreground">{{ phase.status }}</span>
    </div>
    <div
      v-if="phase.showBar"
      class="h-1 overflow-hidden rounded-full bg-secondary-background-hover"
    >
      <div
        class="h-full rounded-full bg-primary-background transition-[width] duration-200"
        :style="{ width: `${phase.fraction * 100}%` }"
      />
    </div>
    <ol class="m-0 flex list-none flex-col gap-2 p-0">
      <li
        v-for="stage in phase.stages"
        :key="stage.id"
        class="flex items-center gap-3 text-sm"
      >
        <i
          :class="
            cn(
              'size-4 shrink-0',
              stage.state === 'done' &&
                'icon-[lucide--check] text-success-background',
              stage.state === 'active' &&
                'icon-[lucide--loader-circle] animate-spin text-primary-background',
              stage.state === 'pending' &&
                'icon-[lucide--circle] scale-50 text-muted-foreground'
            )
          "
        />
        <span
          :class="
            cn('flex-1', stage.state === 'pending' && 'text-muted-foreground')
          "
        >
          {{ stageLabel(stage.id, stage.state) }}
        </span>
        <span
          v-if="stage.state !== 'pending'"
          class="text-xs text-muted-foreground tabular-nums"
        >
          {{ clock(stage.elapsed) }}
        </span>
      </li>
    </ol>
  </section>

  <footer class="flex items-center gap-2.5">
    <Button
      variant="link"
      size="lg"
      class="mr-auto px-0"
      @click="onViewOnPlatform"
    >
      {{ t('prototype.customCloud.lock.viewOnPlatform') }}
      <i class="icon-[lucide--external-link] size-4" />
    </Button>
    <Button variant="inverted" size="lg" @click="emit('close')">
      {{ t('prototype.customCloud.lock.keepWorking') }}
    </Button>
  </footer>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import { useToastStore } from '@/platform/updates/common/toastStore'

import { useTextT } from '../composables/useTextT'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { MATTE_PASS } from '../fixtures/customCloud'
import type { BuildPhase, BuildStage } from '../fixtures/customCloud'
import type { Deployment } from '../types'
import type { BuildProgress } from '../utils/deployment'

const { titleId, deployment, progress } = defineProps<{
  titleId: string
  deployment: Deployment
  progress: BuildProgress
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const tText = useTextT()
const customCloud = usePrototypeCustomCloudStore()
const toast = useToastStore()

function minutes(seconds: number) {
  return Math.max(1, Math.ceil(seconds / 60))
}

function clock(seconds: number) {
  const whole = Math.floor(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

const timeLeft = computed(() =>
  t(
    'prototype.customCloud.lock.minutesLeft',
    minutes(progress.remainingSeconds)
  )
)

function phaseStatus(phase: BuildPhase) {
  const { fraction, remainingSeconds } = progress[phase]
  if (fraction >= 1) return t('prototype.customCloud.lock.phaseDone')
  if (phase === 'deploy' && progress.build.fraction < 1) {
    return t('prototype.customCloud.lock.deployAfterBuild', {
      minutes: minutes(remainingSeconds)
    })
  }
  return t('prototype.customCloud.lock.phaseLeft', {
    minutes: minutes(remainingSeconds)
  })
}

const PHASE_KEYS: Record<BuildPhase, string> = {
  build: 'prototype.customCloud.lock.phase.build',
  deploy: 'prototype.customCloud.lock.phase.deploy'
}

// [in progress or pending, done]
const STAGE_KEYS: Record<BuildStage['id'], [string, string]> = {
  resolve: [
    'prototype.customCloud.lock.stages.resolve.active',
    'prototype.customCloud.lock.stages.resolve.done'
  ],
  upload: [
    'prototype.customCloud.lock.stages.upload.active',
    'prototype.customCloud.lock.stages.upload.done'
  ],
  install: [
    'prototype.customCloud.lock.stages.install.active',
    'prototype.customCloud.lock.stages.install.done'
  ],
  bake: [
    'prototype.customCloud.lock.stages.bake.active',
    'prototype.customCloud.lock.stages.bake.done'
  ],
  worker: [
    'prototype.customCloud.lock.stages.worker.active',
    'prototype.customCloud.lock.stages.worker.done'
  ],
  models: [
    'prototype.customCloud.lock.stages.models.active',
    'prototype.customCloud.lock.stages.models.done'
  ]
}

const phases = computed(() =>
  (['build', 'deploy'] as const).map((id) => ({
    id,
    label: t(PHASE_KEYS[id]),
    status: phaseStatus(id),
    fraction: progress[id].fraction,
    showBar: progress[id].fraction > 0,
    stages: progress.stages.filter((stage) => stage.phase === id)
  }))
)

function stageLabel(id: BuildStage['id'], state: string) {
  const [inProgress, done] = STAGE_KEYS[id]
  return t(state === 'done' ? done : inProgress, {
    model: MATTE_PASS.localOnlyModels.join(', '),
    packs: MATTE_PASS.nodePacks.join(', '),
    gpu: deployment.gpu
  })
}

function onViewOnPlatform() {
  toast.add({
    severity: 'info',
    summary: t('prototype.customCloud.settings.platformToast'),
    detail: t('prototype.customCloud.lock.platformToastDetail'),
    life: 3000
  })
}
</script>
