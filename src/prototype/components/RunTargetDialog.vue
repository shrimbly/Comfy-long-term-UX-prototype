<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
              step 5
    flow:     ../prototype/flows/07-custom-cloud-happy-path.md

  "Choose where it runs": the positive replacement for the missing-nodes
  error toast. Step 1 picks where matte_pass runs (a project that already
  runs it, or a new project on a new build). Step 2 reviews the build;
  "Customise on Platform" hands detail off, and "Build with your agent" is
  secondary only. The agent step shows the prompt to paste.
-->
<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 sm:p-8 [@media(max-height:50rem)]:py-3"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @click.self="close"
    >
      <div
        class="relative my-auto flex w-full max-w-[640px] flex-col gap-6 rounded-2xl border border-border-default bg-base-background p-9 text-base-foreground shadow-2xl [@media(max-height:50rem)]:gap-4 [@media(max-height:50rem)]:p-7"
      >
        <Button
          variant="muted-textonly"
          size="icon"
          class="absolute top-3 right-3"
          :aria-label="t('prototype.customCloud.dialog.close')"
          @click="close"
        >
          <i class="icon-[lucide--x] size-4" />
        </Button>

        <header class="flex flex-col gap-2.5">
          <span
            class="text-xs font-medium tracking-widest text-muted-foreground uppercase"
          >
            {{ eyebrow }}
          </span>
          <h2 :id="titleId" class="m-0 text-2xl font-semibold">{{ title }}</h2>
          <p class="m-0 text-sm text-muted-foreground">{{ intro }}</p>
        </header>

        <template v-if="step === 'choose'">
          <ul class="m-0 flex list-none flex-col gap-2.5 p-0 text-sm">
            <li
              v-for="benefit in benefits"
              :key="benefit"
              class="flex items-start gap-2.5"
            >
              <i
                class="mt-0.5 icon-[lucide--check] size-4 shrink-0 text-success-background"
              />
              {{ benefit }}
            </li>
          </ul>

          <div class="flex flex-col gap-2">
            <span class="text-sm text-muted-foreground">
              {{ t('prototype.customCloud.dialog.openIn') }}
            </span>
            <RunTargetSelect
              v-model="customCloud.runTarget"
              :targets="customCloud.runTargets"
              :workflow="MATTE_PASS.name"
              :current-project-id="customCloud.currentProject?.id"
            />
          </div>

          <div class="flex flex-col gap-2">
            <span :class="summaryLabelClass">
              {{
                tText('prototype.customCloud.dialog.missingFrom', {
                  deployment: customCloud.currentDeployment.name
                })
              }}
            </span>
            <dl :class="summaryClass">
              <div v-if="missing.nodePacks.length" :class="summaryRowClass">
                <dt class="flex flex-col gap-1">
                  <span class="text-base">{{
                    t('prototype.customCloud.dialog.customNodes')
                  }}</span>
                  <span class="text-xs text-muted-foreground">{{
                    missing.nodePacks.join(', ')
                  }}</span>
                </dt>
                <dd class="m-0 text-base">
                  {{
                    t(
                      'prototype.customCloud.dialog.packs',
                      missing.nodePacks.length
                    )
                  }}
                </dd>
              </div>
              <div v-if="missing.models.length" :class="summaryRowClass">
                <dt class="flex flex-col gap-1">
                  <span class="text-base">{{
                    t('prototype.customCloud.dialog.models')
                  }}</span>
                  <span class="text-xs text-muted-foreground">{{
                    missing.models.join(', ')
                  }}</span>
                </dt>
                <dd class="m-0 text-base tabular-nums">
                  {{ missing.models.length }}
                </dd>
              </div>
            </dl>
          </div>

          <footer class="flex items-center gap-2.5">
            <span
              v-if="targetsExistingProject"
              class="mr-auto text-xs text-muted-foreground"
            >
              {{ t('prototype.customCloud.dialog.switchHint') }}
            </span>
            <span v-else class="mr-auto" />
            <Button variant="muted-textonly" size="lg" @click="close">
              {{ t('prototype.customCloud.dialog.notNow') }}
            </Button>
            <Button
              v-if="targetsExistingProject"
              variant="inverted"
              size="lg"
              @click="customCloud.openInProject(customCloud.runTarget)"
            >
              {{ t('prototype.customCloud.dialog.switchAndReload') }}
            </Button>
            <Button
              v-else
              variant="inverted"
              size="lg"
              @click="customCloud.dialogStep = 'review'"
            >
              {{ t('prototype.customCloud.dialog.reviewBuild') }}
            </Button>
          </footer>
        </template>

        <template v-else-if="step === 'review'">
          <label class="flex flex-col gap-2">
            <span class="text-sm text-muted-foreground">
              {{ t('prototype.customCloud.dialog.nameLabel') }}
            </span>
            <input
              v-model="customCloud.newProjectName"
              type="text"
              class="h-10 rounded-lg border border-border-default bg-secondary-background px-3 text-sm outline-none focus:border-muted-foreground"
              @keydown.enter="customCloud.buildAndDeploy()"
            />
          </label>

          <dl :class="summaryClass">
            <div
              v-for="row in buildSummary"
              :key="row.label"
              :class="summaryRowClass"
            >
              <dt class="flex min-w-0 flex-col gap-1">
                <span class="text-base">{{ row.label }}</span>
                <span class="text-xs text-muted-foreground">{{
                  row.detail
                }}</span>
              </dt>
              <dd
                :class="
                  cn(
                    'm-0 text-base whitespace-nowrap tabular-nums',
                    row.attention && 'text-warning-background'
                  )
                "
              >
                {{ row.value }}
              </dd>
            </div>
          </dl>

          <footer class="flex items-center gap-2.5">
            <Button
              variant="link"
              size="lg"
              class="mr-auto px-0"
              @click="onCustomiseOnPlatform"
            >
              {{ t('prototype.customCloud.dialog.customise') }}
              <i class="icon-[lucide--external-link] size-4" />
            </Button>
            <Button
              variant="muted-textonly"
              size="lg"
              @click="customCloud.dialogStep = 'agent'"
            >
              <i class="icon-[lucide--bot] size-4" />
              {{ t('prototype.customCloud.dialog.withAgent') }}
            </Button>
            <Button
              variant="inverted"
              size="lg"
              @click="customCloud.buildAndDeploy()"
            >
              {{ t('prototype.customCloud.dialog.buildAndDeploy') }}
            </Button>
          </footer>
        </template>

        <template v-else>
          <div class="relative">
            <pre
              class="overflow-x-auto rounded-lg border border-border-subtle bg-secondary-background/40 p-4 font-mono text-xs/5 whitespace-pre-wrap text-base-foreground"
              >{{ agentPrompt }}</pre
            >
          </div>

          <footer class="flex items-center gap-2.5">
            <Button
              variant="link"
              size="lg"
              class="mr-auto px-0"
              @click="customCloud.dialogStep = 'review'"
            >
              <i class="icon-[lucide--arrow-left] size-4" />
              {{ t('prototype.customCloud.dialog.backToSummary') }}
            </Button>
            <Button variant="muted-textonly" size="lg" @click="close">
              {{ t('prototype.customCloud.dialog.close') }}
            </Button>
            <Button variant="inverted" size="lg" @click="copy(agentPrompt)">
              <i
                :class="
                  cn(
                    'size-4',
                    copied ? 'icon-[lucide--check]' : 'icon-[lucide--copy]'
                  )
                "
              />
              {{
                copied
                  ? t('prototype.customCloud.dialog.copied')
                  : t('prototype.customCloud.dialog.copyPrompt')
              }}
            </Button>
          </footer>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { onKeyStroke, useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { useTextT } from '../composables/useTextT'
import { MATTE_PASS, WARM_MINUTES } from '../fixtures/customCloud'
import {
  NEW_BUILD_TARGET,
  usePrototypeCustomCloudStore
} from '../stores/customCloudStore'
import { missingFrom } from '../utils/deployment'

import RunTargetSelect from './RunTargetSelect.vue'

const { t } = useI18n()
const tText = useTextT()
const toast = useToast()
const customCloud = usePrototypeCustomCloudStore()
const { copy, copied } = useClipboard({ legacy: true })
const titleId = useId()

const summaryLabelClass =
  'text-xs font-medium tracking-widest text-muted-foreground uppercase'
const summaryClass =
  'm-0 flex flex-col rounded-lg border border-border-subtle bg-secondary-background/40 p-2'
const summaryRowClass =
  'flex min-h-14 items-center justify-between gap-6 px-4 py-3 [&+&]:border-t [&+&]:border-border-subtle [@media(max-height:50rem)]:min-h-0 [@media(max-height:50rem)]:py-2'

const step = computed(() => customCloud.dialogStep)
const workflow = MATTE_PASS.name
const projectName = computed(() => customCloud.newProjectName.trim())

const targetsExistingProject = computed(
  () => customCloud.runTarget !== NEW_BUILD_TARGET
)

const missing = computed(() =>
  missingFrom(customCloud.currentDeployment, MATTE_PASS)
)

const EYEBROW_KEYS = {
  choose: 'prototype.customCloud.dialog.eyebrow.choose',
  review: 'prototype.customCloud.dialog.eyebrow.review',
  agent: 'prototype.customCloud.dialog.eyebrow.agent'
}

const eyebrow = computed(() => t(EYEBROW_KEYS[step.value ?? 'choose']))

const title = computed(() => {
  if (step.value === 'review') {
    return tText('prototype.customCloud.dialog.reviewTitle', {
      project: projectName.value,
      workflow
    })
  }
  if (step.value === 'agent') {
    return t('prototype.customCloud.dialog.agentTitle')
  }
  return t('prototype.customCloud.dialog.title', { workflow })
})

const intro = computed(() => {
  if (step.value === 'review') {
    return t('prototype.customCloud.dialog.reviewIntro', { workflow })
  }
  if (step.value === 'agent') {
    return t('prototype.customCloud.dialog.agentIntro', { workflow })
  }
  return tText('prototype.customCloud.dialog.intro', {
    deployment: customCloud.currentDeployment.name
  })
})

const benefits = computed(() => [
  t('prototype.customCloud.dialog.benefits.pinned'),
  t('prototype.customCloud.dialog.benefits.ownProject'),
  t('prototype.customCloud.dialog.benefits.builtForYou')
])

const remoteModels = MATTE_PASS.models.filter(
  (m) => !MATTE_PASS.localOnlyModels.includes(m)
)

const buildSummary = computed(() => [
  {
    label: t('prototype.customCloud.dialog.summary.project'),
    detail: t('prototype.customCloud.dialog.summary.projectDetail', {
      workflow
    }),
    value: tText('prototype.customCloud.dialog.summary.projectValue', {
      name: projectName.value
    })
  },
  {
    label: t('prototype.customCloud.dialog.customNodes'),
    detail: t('prototype.customCloud.dialog.summary.nodesDetail', {
      packs: MATTE_PASS.nodePacks.join(', ')
    }),
    value: t(
      'prototype.customCloud.dialog.summary.nodesValue',
      MATTE_PASS.nodePacks.length
    )
  },
  {
    label: t('prototype.customCloud.dialog.models'),
    detail: t('prototype.customCloud.dialog.summary.modelsDetail', {
      remote: remoteModels.join(', '),
      local: MATTE_PASS.localOnlyModels.join(', ')
    }),
    value: t(
      'prototype.customCloud.dialog.summary.modelsValue',
      MATTE_PASS.localOnlyModels.length
    ),
    attention: true
  },
  {
    label: t('prototype.customCloud.dialog.summary.gpu'),
    detail: t('prototype.customCloud.dialog.summary.gpuDetail', {
      model: remoteModels[0],
      minutes: WARM_MINUTES
    }),
    value: MATTE_PASS.gpu
  },
  {
    label: t('prototype.customCloud.dialog.summary.cost'),
    detail: t('prototype.customCloud.dialog.summary.costDetail', {
      storage: MATTE_PASS.monthlyStorageUsd.toFixed(2)
    }),
    value: t('prototype.customCloud.dialog.summary.costValue', {
      hourly: MATTE_PASS.hourlyCostUsd.toFixed(2)
    })
  }
])

const agentPrompt = computed(() =>
  [
    t('prototype.customCloud.agentPrompt.goal', { workflow }),
    '',
    t('prototype.customCloud.agentPrompt.lacks'),
    t('prototype.customCloud.agentPrompt.nodes', {
      packs: MATTE_PASS.nodePacks.join(', ')
    }),
    t('prototype.customCloud.agentPrompt.models', {
      models: MATTE_PASS.models.join(', '),
      local: MATTE_PASS.localOnlyModels.join(', ')
    }),
    '',
    t('prototype.customCloud.agentPrompt.skill', {
      command: 'comfy skills show comfy-build'
    }),
    t('prototype.customCloud.agentPrompt.build'),
    `  comfy build from-workflow --from ${workflow}.json --name "${projectName.value}"`,
    '',
    tText('prototype.customCloud.agentPrompt.ready', {
      project: projectName.value
    })
  ].join('\n')
)

function close() {
  customCloud.dialogStep = null
}

onKeyStroke('Escape', close)

function onCustomiseOnPlatform() {
  toast.add({
    severity: 'info',
    summary: t('prototype.customCloud.settings.platformToast'),
    detail: t('prototype.customCloud.dialog.customiseToastDetail'),
    life: 3000
  })
}
</script>
