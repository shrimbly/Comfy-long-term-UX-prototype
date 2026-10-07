<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
              — reversed here: the agent leads
    decision: prototype/design-decisions.md — 2026-10-08 "Flow 07: the
              coding agent leads 'choose where it runs'"

  The prompt for the user's own coding agent, on the machine where the
  workflow runs: a new deployment, or the next release of this project's.
  Once it is copied, Comfy Cloud's part is done until the agent finishes.
-->
<template>
  <header class="flex flex-col gap-2.5 pr-8">
    <h2 :id="titleId" class="m-0 text-2xl font-semibold">{{ title }}</h2>
    <p class="m-0 text-sm text-muted-foreground">{{ intro }}</p>
  </header>

  <pre
    class="m-0 max-h-75 overflow-y-auto rounded-lg border border-border-subtle bg-secondary-background/40 p-4 font-mono text-xs/5 whitespace-pre-wrap text-base-foreground"
    >{{ agentPrompt }}</pre>

  <div
    v-if="customCloud.agentWorking"
    role="status"
    class="flex items-start gap-2.5 rounded-lg border border-border-subtle bg-secondary-background/40 px-3.5 py-3 text-sm text-muted-foreground"
  >
    <i
      class="mt-0.5 icon-[lucide--check] size-4 shrink-0 text-success-background"
    />
    <span class="flex flex-col gap-0.5">
      <span class="font-medium text-base-foreground">
        {{ t('prototype.customCloud.dialog.agent.handedOff') }}
      </span>
      {{ handedOffDetail }}
    </span>
  </div>

  <footer class="flex items-center gap-2.5">
    <Button
      variant="muted-textonly"
      size="lg"
      class="mr-auto"
      @click="customCloud.dialogStep = 'choose'"
    >
      <i class="icon-[lucide--arrow-left] size-4" />
      {{ t('prototype.customCloud.dialog.back') }}
    </Button>
    <Button
      v-if="customCloud.agentWorking"
      variant="muted-textonly"
      size="lg"
      @click="emit('close')"
    >
      {{ t('prototype.customCloud.dialog.close') }}
    </Button>
    <Button variant="inverted" size="lg" @click="onCopy">
      <i
        :class="
          cn(
            'size-4',
            customCloud.agentWorking
              ? 'icon-[lucide--check]'
              : 'icon-[lucide--copy]'
          )
        "
      />
      {{
        customCloud.agentWorking
          ? t('prototype.customCloud.dialog.agent.copied')
          : t('prototype.customCloud.dialog.agent.copy')
      }}
    </Button>
  </footer>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { useClipboard } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { useTextT } from '../composables/useTextT'
import { DEFAULT_BUILD_PROJECT_NAME } from '../fixtures/customCloud'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { missingFrom, nextRelease } from '../utils/deployment'

const { titleId } = defineProps<{
  titleId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const tText = useTextT()
const customCloud = usePrototypeCustomCloudStore()
const { copy } = useClipboard({ legacy: true })

const needs = computed(() => customCloud.needs)
const workflow = computed(() => needs.value.name)
const deployment = computed(() => customCloud.currentDeployment)
const updating = computed(() => customCloud.chooseMode === 'update')
const release = computed(() => nextRelease(deployment.value.release))

const title = computed(() =>
  updating.value
    ? tText('prototype.customCloud.dialog.agent.updateTitle', {
        deployment: deployment.value.name
      })
    : t('prototype.customCloud.dialog.agent.title')
)
const intro = computed(() => {
  if (customCloud.forPacks)
    return t('prototype.customCloud.dialog.agent.packsIntro')
  return t(
    updating.value
      ? 'prototype.customCloud.dialog.agent.updateIntro'
      : 'prototype.customCloud.dialog.agent.intro',
    { workflow: workflow.value }
  )
})
const handedOffDetail = computed(() =>
  updating.value
    ? t('prototype.customCloud.dialog.agent.handedOffUpdate', {
        release: release.value,
        workflow: workflow.value
      })
    : t('prototype.customCloud.dialog.agent.handedOffNew')
)

const skillCommands = [
  'pip install -U comfy-cli',
  'comfy skills show comfy-build',
  'comfy skills show comfy-deploy'
]

function deploymentName() {
  return customCloud.newDeploymentName.trim() || DEFAULT_BUILD_PROJECT_NAME
}

function packsPrompt() {
  const packs = needs.value.nodePacks.join(', ')
  return [
    tText('prototype.customCloud.agentPrompt.packsTitle', { packs }),
    '',
    t('prototype.customCloud.agentPrompt.packsGoal'),
    '',
    t('prototype.customCloud.agentPrompt.packsNodesTitle'),
    ...needs.value.nodePacks.map((pack) => `- ${pack}`),
    '',
    t('prototype.customCloud.agentPrompt.skillsTitle'),
    ...skillCommands,
    '',
    t('prototype.customCloud.agentPrompt.packsBuild'),
    `comfy build init --nodes ${needs.value.nodePacks.join(',')} --name "${deploymentName()}"`,
    '',
    t('prototype.customCloud.agentPrompt.readyTitle'),
    t('prototype.customCloud.agentPrompt.ready')
  ]
}

function newDeploymentPrompt() {
  const name = deploymentName()
  const workflowName = workflow.value
  return [
    tText('prototype.customCloud.agentPrompt.title', {
      workflow: workflowName
    }),
    '',
    tText('prototype.customCloud.agentPrompt.goal', { workflow: workflowName }),
    '',
    t('prototype.customCloud.agentPrompt.lacksTitle'),
    t('prototype.customCloud.agentPrompt.lacks'),
    tText('prototype.customCloud.agentPrompt.nodes', {
      packs: needs.value.nodePacks.join(', ')
    }),
    tText('prototype.customCloud.agentPrompt.models', {
      models: needs.value.models.join(', '),
      local: needs.value.localOnlyModels.join(', ')
    }),
    '',
    t('prototype.customCloud.agentPrompt.skillsTitle'),
    ...skillCommands,
    '',
    t('prototype.customCloud.agentPrompt.build'),
    `comfy build from-workflow --from ${workflowName}.json --name "${name}"`,
    '',
    t('prototype.customCloud.agentPrompt.readyTitle'),
    t('prototype.customCloud.agentPrompt.ready')
  ]
}

function updatePrompt() {
  const { id, name, release: from } = deployment.value
  const missing = missingFrom(deployment.value, needs.value)
  const packs = missing.nodePacks.join(', ')
  return [
    tText('prototype.customCloud.agentPrompt.updateTitle', {
      packs,
      deployment: name
    }),
    '',
    tText('prototype.customCloud.agentPrompt.updateGoal', {
      workflow: workflow.value,
      deployment: name
    }),
    '',
    t('prototype.customCloud.agentPrompt.deploymentTitle'),
    tText('prototype.customCloud.agentPrompt.deploymentId', { id }),
    tText('prototype.customCloud.agentPrompt.release', {
      from,
      to: release.value
    }),
    tText('prototype.customCloud.agentPrompt.everyProject', {
      deployment: name,
      to: release.value
    }),
    '',
    t('prototype.customCloud.agentPrompt.updateLacksTitle'),
    ...(missing.nodePacks.length
      ? [tText('prototype.customCloud.agentPrompt.updateLacks', { packs })]
      : []),
    ...(missing.models.length
      ? [
          tText('prototype.customCloud.agentPrompt.updateModels', {
            models: missing.models.join(', ')
          })
        ]
      : []),
    '',
    t('prototype.customCloud.agentPrompt.skillsTitle'),
    ...skillCommands,
    `comfy deploy show --deployment ${id}`,
    '',
    tText('prototype.customCloud.agentPrompt.updateReadyTitle', {
      release: release.value
    }),
    tText('prototype.customCloud.agentPrompt.updateReady', {
      workflow: workflow.value,
      release: release.value
    })
  ]
}

const agentPrompt = computed(() => {
  if (customCloud.forPacks) return packsPrompt().join('\n')
  return (updating.value ? updatePrompt() : newDeploymentPrompt()).join('\n')
})

async function onCopy() {
  await copy(agentPrompt.value)
  customCloud.handOffToAgent()
}
</script>
