<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/build-locks-project-until-ready.md
              — "I don't think you should be able to use the project until
              it's actually ready"; full-screen over the project, node graph
              disabled, "switch to other projects as a CTA"
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
              step 6
    open-q:   ../IA_Plan/wiki/open-questions.md#build-lockout-acceptable
    open-q:   ../IA_Plan/wiki/open-questions.md#build-wait-acceptable

  Covers everything below the tab strip while the current project's
  deployment builds: build then deploy progress with stage times. The graph
  needs the deployment to load at all, so behind the progress there is only
  a grey, inactive canvas. The tab strip stays live, so the project switcher
  is the way out.
-->
<template>
  <div
    class="absolute inset-0 z-40 flex items-start justify-center overflow-y-auto bg-secondary-background p-4 sm:p-8"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
  >
    <div
      class="my-auto flex w-full max-w-[640px] flex-col gap-6 rounded-2xl border border-border-default bg-base-background p-9 text-base-foreground shadow-2xl"
    >
      <header class="flex flex-col gap-2.5">
        <span
          class="text-xs font-medium tracking-widest text-muted-foreground uppercase"
        >
          {{ t('prototype.customCloud.lock.eyebrow') }}
        </span>
        <h2 :id="titleId" class="m-0 text-2xl font-semibold">
          {{
            tText('prototype.customCloud.lock.title', { project: project.name })
          }}
        </h2>
        <p class="m-0 text-sm text-muted-foreground">
          {{ timeLeft }}
          {{
            tText('prototype.customCloud.lock.body', { project: project.name })
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
                cn(
                  'flex-1',
                  stage.state === 'pending' && 'text-muted-foreground'
                )
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
        <Button
          variant="inverted"
          size="lg"
          @click="customCloud.switcherOpen = true"
        >
          <i class="icon-[lucide--arrow-left-right] size-4" />
          {{ t('prototype.customCloud.lock.switchProject') }}
        </Button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { useToast } from 'primevue/usetoast'
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { useTextT } from '../composables/useTextT'
import { MATTE_PASS } from '../fixtures/customCloud'
import type { BuildPhase, BuildStage } from '../fixtures/customCloud'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import type { BuildProgress } from '../utils/deployment'
import type { Project } from '../types'

const { project, progress } = defineProps<{
  project: Project
  progress: BuildProgress
}>()

const { t } = useI18n()
const tText = useTextT()
const toast = useToast()
const customCloud = usePrototypeCustomCloudStore()
const titleId = useId()

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
    gpu: customCloud.currentDeployment.gpu
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
