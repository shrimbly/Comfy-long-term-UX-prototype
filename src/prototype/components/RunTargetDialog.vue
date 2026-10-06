<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
              step 5
    flow:     ../prototype/flows/07-custom-cloud-happy-path.md
    decision: prototype/design-decisions.md — 2026-10-07 "Flow 07: the
              incompatible-workflow dialog, redesigned on a canvas"

  "Choose where it runs": the positive replacement for the missing-nodes
  error toast. Step 1 picks where the workflow runs; the "New project" step
  names the project and sets its access; a new deployment then goes on to
  Platform's build summary and its deploy dialog. The
  agent prompt is an alternative to step 3. Everything Platform owns (build
  settings, updating a deployment) opens there.
-->
<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @click.self="close"
      @keydown.escape="close"
    >
      <div
        ref="panel"
        tabindex="-1"
        :class="
          cn(
            'relative my-auto flex w-full flex-col rounded-2xl border border-border-default bg-base-background text-base-foreground shadow-2xl outline-none',
            step === 'deploy'
              ? 'max-w-[1020px] overflow-hidden'
              : 'max-w-[640px] gap-6 p-9'
          )
        "
      >
        <Button
          variant="muted-textonly"
          size="icon"
          class="absolute top-3 right-3 z-10"
          :aria-label="t('prototype.customCloud.dialog.close')"
          @click="close"
        >
          <i class="icon-[lucide--x] size-4" />
        </Button>

        <RunTargetChoose
          v-if="step === 'choose'"
          :title-id="titleId"
          @close="close"
        />
        <RunTargetProject
          v-else-if="step === 'project'"
          :title-id="titleId"
          @close="close"
        />
        <RunTargetBuildSummary
          v-else-if="step === 'build'"
          :title-id="titleId"
          @customise="customising = $event"
        />
        <RunTargetAgent v-else-if="step === 'agent'" :title-id="titleId" />
        <RunTargetDeploy v-else :title-id="titleId" @close="close" />
      </div>
    </div>
    <ConfirmDialog
      v-if="customising"
      :title="t('prototype.customCloud.dialog.build.customiseTitle')"
      :message="
        t('prototype.customCloud.dialog.build.customiseBody', {
          setting: customising
        })
      "
      :confirm-label="t('prototype.customCloud.dialog.build.openPlatform')"
      @confirm="openPlatform"
      @cancel="customising = null"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed, onMounted, ref, useId, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import { useToastStore } from '@/platform/updates/common/toastStore'

import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'

import ConfirmDialog from './ConfirmDialog.vue'
import RunTargetAgent from './RunTargetAgent.vue'
import RunTargetBuildSummary from './RunTargetBuildSummary.vue'
import RunTargetChoose from './RunTargetChoose.vue'
import RunTargetDeploy from './RunTargetDeploy.vue'
import RunTargetProject from './RunTargetProject.vue'

const { t } = useI18n()
const toast = useToastStore()
const customCloud = usePrototypeCustomCloudStore()
const titleId = useId()
const panel = useTemplateRef('panel')

const step = computed(() => customCloud.dialogStep)
// The build setting whose "customise on Platform?" question is open.
const customising = ref<string | null>(null)

// Keyboard focus starts in the dialog so Escape reaches it; popovers and the
// confirmation portal out of it and handle their own Escape.
onMounted(() => panel.value?.focus())

function close() {
  customCloud.dialogStep = null
}

function openPlatform() {
  customising.value = null
  toast.add({
    severity: 'info',
    summary: t('prototype.customCloud.settings.platformToast'),
    detail: t('prototype.customCloud.dialog.build.customiseToastDetail'),
    life: 3000
  })
}
</script>
