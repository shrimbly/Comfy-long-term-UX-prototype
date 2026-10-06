<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
              — "Build with your agent" is secondary only

  The agent alternative to deploying from the dialog: a prompt to paste into
  a coding agent on the machine where the workflow runs.
-->
<template>
  <header class="flex flex-col gap-2.5 pr-8">
    <h2 :id="titleId" class="m-0 text-2xl font-semibold">
      {{ t('prototype.customCloud.dialog.agentTitle') }}
    </h2>
    <p class="m-0 text-sm text-muted-foreground">
      {{ t('prototype.customCloud.dialog.agentIntro', { workflow }) }}
    </p>
  </header>

  <pre
    class="m-0 overflow-x-auto rounded-lg border border-border-subtle bg-secondary-background/40 p-4 font-mono text-xs/5 whitespace-pre-wrap text-base-foreground"
    >{{ agentPrompt }}</pre>

  <footer class="flex items-center gap-2.5">
    <Button
      variant="muted-textonly"
      size="lg"
      class="mr-auto"
      @click="customCloud.dialogStep = 'build'"
    >
      <i class="icon-[lucide--arrow-left] size-4" />
      {{ t('prototype.customCloud.dialog.backToSummary') }}
    </Button>
    <Button variant="inverted" size="lg" @click="copy(agentPrompt)">
      <i
        :class="
          cn('size-4', copied ? 'icon-[lucide--check]' : 'icon-[lucide--copy]')
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

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { useClipboard } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { useTextT } from '../composables/useTextT'
import { MATTE_PASS } from '../fixtures/customCloud'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'

const { titleId } = defineProps<{
  titleId: string
}>()

const { t } = useI18n()
const tText = useTextT()
const customCloud = usePrototypeCustomCloudStore()
const { copy, copied } = useClipboard({ legacy: true })

const workflow = MATTE_PASS.name
const projectName = computed(() => customCloud.newProjectName.trim())
const deploymentName = computed(() => customCloud.newDeploymentName.trim())

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
    `  comfy build from-workflow --from ${workflow}.json --name "${deploymentName.value}"`,
    '',
    tText('prototype.customCloud.agentPrompt.ready', {
      project: projectName.value
    })
  ].join('\n')
)
</script>
