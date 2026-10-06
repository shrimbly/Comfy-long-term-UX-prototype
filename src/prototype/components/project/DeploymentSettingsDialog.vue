<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — a deployment
              is a build: ComfyUI version, runtime, models, packs
    decision: ../IA_Plan/wiki/decisions/build-locks-project-until-ready.md
    log:      ../prototype/design-decisions.md (2026-10-07 — edit a
              deployment in the dashboard, rebuilt from Willie's editor
              dialog)

  Edit a deployment: its name, ComfyUI version, runtime, models, custom
  nodes and Python packages, then rebuild it or hand the build to a coding
  agent. Saving bumps the release and starts the same build the demo uses.
-->
<template>
  <Dialog :open="true" @update:open="emit('close')">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent class="shadow-none" size="md">
        <DialogHeader>
          <DialogTitle>{{ t('prototype.deploymentDialog.title') }}</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <div class="flex flex-col gap-5 px-6 py-4">
          <template v-if="step === 'settings'">
            <div
              class="flex flex-col gap-4 rounded-xl border border-border-subtle bg-secondary-background/40 p-5"
            >
              <div class="flex items-center gap-2 text-sm">
                <i
                  class="icon-[lucide--circle-check] size-4 text-success-background"
                />
                <span>{{ deployment.name }}</span>
                <span class="text-muted-foreground">{{
                  deployment.release
                }}</span>
              </div>

              <h3
                class="m-0 border-b border-border-subtle pb-2 text-xs font-medium tracking-widest text-muted-foreground uppercase"
              >
                {{ t('prototype.deploymentDialog.settings') }}
              </h3>

              <dl
                class="m-0 flex flex-col divide-y divide-border-subtle text-sm"
              >
                <div :class="rowClass">
                  <dt :class="labelClass">
                    {{ t('prototype.deploymentDialog.name') }}
                  </dt>
                  <dd class="m-0 flex items-center gap-2">
                    <input
                      v-model="name"
                      type="text"
                      :aria-label="t('prototype.deploymentDialog.name')"
                      :class="inputClass"
                    />
                  </dd>
                </div>

                <div :class="rowClass">
                  <dt :class="labelClass">
                    {{ t('prototype.deploymentDialog.comfy') }}
                  </dt>
                  <dd class="m-0 flex items-center gap-2">
                    <select
                      v-model="comfyVersion"
                      :aria-label="t('prototype.deploymentDialog.comfy')"
                      :class="inputClass"
                    >
                      <option
                        v-for="version in COMFY_VERSIONS"
                        :key="version"
                        :value="version"
                      >
                        {{ version }}
                      </option>
                    </select>
                    <span
                      v-if="comfyVersion === COMFY_VERSIONS[0]"
                      class="text-xs text-muted-foreground"
                    >
                      {{ t('prototype.deploymentDialog.latestStable') }}
                    </span>
                  </dd>
                </div>

                <div :class="rowClass">
                  <dt :class="labelClass">
                    {{ t('prototype.deploymentDialog.runtime') }}
                  </dt>
                  <dd class="m-0">{{ runtime }}</dd>
                </div>

                <div class="flex flex-col py-3">
                  <button
                    type="button"
                    :class="disclosureClass"
                    :aria-expanded="showModels"
                    @click="showModels = !showModels"
                  >
                    <span :class="labelClass">
                      {{ t('prototype.deploymentDialog.ossModels') }}
                    </span>
                    <span class="flex items-center gap-2">
                      <span>{{
                        t('prototype.deploymentDialog.allAllowed')
                      }}</span>
                      <span class="text-xs text-muted-foreground">
                        {{
                          t(
                            'prototype.deploymentDialog.preinstalled',
                            deployment.models.length
                          )
                        }}
                      </span>
                      <i
                        :class="
                          cn(
                            'size-3.5 text-muted-foreground transition-transform',
                            showModels && 'rotate-90'
                          )
                        "
                        class="icon-[lucide--chevron-right]"
                      />
                    </span>
                  </button>
                  <ul v-if="showModels" :class="listClass">
                    <li
                      v-for="model in deployment.models"
                      :key="model"
                      class="px-3 py-1.5 font-mono text-xs"
                    >
                      {{ model }}
                    </li>
                  </ul>
                </div>

                <div :class="rowClass">
                  <dt :class="labelClass">
                    {{ t('prototype.deploymentDialog.partnerModels') }}
                  </dt>
                  <dd class="m-0">
                    {{ t('prototype.deploymentDialog.allAllowed') }}
                  </dd>
                </div>

                <div class="flex flex-col py-3">
                  <button
                    type="button"
                    :class="disclosureClass"
                    :aria-expanded="showPacks"
                    @click="showPacks = !showPacks"
                  >
                    <span :class="labelClass">
                      {{ t('prototype.deploymentDialog.customNodes') }}
                    </span>
                    <span class="flex items-center gap-2">
                      <span>{{
                        t(
                          'prototype.deploymentDialog.packs',
                          deployment.nodePacks.length
                        )
                      }}</span>
                      <i
                        :class="
                          cn(
                            'size-3.5 text-muted-foreground transition-transform',
                            showPacks && 'rotate-90'
                          )
                        "
                        class="icon-[lucide--chevron-right]"
                      />
                    </span>
                  </button>
                  <ul v-if="showPacks" :class="listClass">
                    <li
                      v-for="pack in deployment.nodePacks"
                      :key="pack"
                      class="px-3 py-1.5 font-mono text-xs"
                    >
                      {{ pack }}
                    </li>
                  </ul>
                </div>

                <div :class="rowClass">
                  <dt :class="labelClass">
                    {{ t('prototype.deploymentDialog.pythonPackages') }}
                  </dt>
                  <dd class="m-0">
                    {{ t('prototype.deploymentDialog.nonePinned') }}
                  </dd>
                </div>
              </dl>
            </div>
          </template>

          <template v-else>
            <DialogDescription>
              {{ t('prototype.deploymentDialog.agentIntro') }}
            </DialogDescription>
            <pre
              class="m-0 overflow-x-auto rounded-lg border border-border-subtle bg-secondary-background/40 p-4 font-mono text-xs/5 whitespace-pre-wrap text-base-foreground"
              >{{ agentPrompt }}</pre>
          </template>
        </div>

        <DialogFooter>
          <Button
            variant="muted-textonly"
            class="mr-auto"
            @click="step === 'settings' ? emit('close') : (step = 'settings')"
          >
            {{ t('prototype.deploymentDialog.back') }}
          </Button>
          <template v-if="step === 'settings'">
            <Button variant="secondary" @click="step = 'agent'">
              <i class="icon-[lucide--bot] size-4" />
              {{ t('prototype.customCloud.dialog.withAgent') }}
            </Button>
            <Button variant="inverted" :disabled="!name.trim()" @click="save">
              {{ t('prototype.deploymentDialog.save') }}
            </Button>
          </template>
          <Button v-else variant="inverted" @click="copy(agentPrompt)">
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
        </DialogFooter>
      </DialogContent>
    </DialogPortal>
  </Dialog>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { useClipboard } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogClose from '@/components/ui/dialog/DialogClose.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogDescription from '@/components/ui/dialog/DialogDescription.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogOverlay from '@/components/ui/dialog/DialogOverlay.vue'
import DialogPortal from '@/components/ui/dialog/DialogPortal.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import { useToastStore } from '@/platform/updates/common/toastStore'

import { useTextT } from '../../composables/useTextT'
import {
  COMFY_VERSIONS,
  DEFAULT_RUNTIME,
  usePrototypeCustomCloudStore
} from '../../stores/customCloudStore'
import type { Deployment } from '../../types'

const { deployment } = defineProps<{
  deployment: Deployment
}>()

const emit = defineEmits<{
  close: []
}>()

const rowClass = 'flex items-center justify-between gap-6 py-3'
const labelClass = 'text-muted-foreground'
const inputClass =
  'h-8 rounded-md border border-border-subtle bg-base-background px-2 text-right text-sm text-base-foreground outline-none focus:border-base-foreground'
const disclosureClass =
  'flex w-full cursor-pointer items-center justify-between gap-6 bg-transparent p-0 text-left text-sm text-base-foreground'
const listClass =
  'm-0 mt-3 flex list-none flex-col divide-y divide-border-subtle rounded-lg border border-border-subtle p-0'

const { t } = useI18n()
const tText = useTextT()
const toast = useToastStore()
const customCloud = usePrototypeCustomCloudStore()
const { copy, copied } = useClipboard({ legacy: true })

const step = ref<'settings' | 'agent'>('settings')
const name = ref(deployment.name)
const comfyVersion = ref(deployment.comfyVersion ?? COMFY_VERSIONS[0])
const runtime = deployment.runtime ?? DEFAULT_RUNTIME
const showModels = ref(false)
const showPacks = ref(false)

const agentPrompt = computed(() =>
  [
    tText('prototype.deploymentDialog.agentGoal', {
      name: name.value.trim(),
      version: comfyVersion.value
    }),
    '',
    t('prototype.customCloud.agentPrompt.skill', {
      command: 'comfy skills show comfy-build'
    }),
    `  comfy build update --deployment "${name.value.trim()}" --comfy ${comfyVersion.value}`
  ].join('\n')
)

function save() {
  customCloud.rebuildDeployment(deployment.id, {
    name: name.value.trim(),
    comfyVersion: comfyVersion.value
  })
  toast.add({
    severity: 'info',
    summary: tText('prototype.deploymentDialog.rebuilding', {
      name: name.value.trim()
    }),
    detail: t('prototype.deploymentDialog.rebuildingDetail'),
    life: 4000
  })
  emit('close')
}
</script>
