<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
              — one deployment backs many projects, so a change is a release
    log:      prototype/design-decisions.md — 2026-10-07 "Edit deployment:
              its own dialog, two modes, a change counter"

  Edit deployment, apart from the editor's "Create a deployment" steps so
  the two can change on their own. Two modes, Configuration and Machine,
  switch at the top; the primary CTA stays off until something changed;
  Review shows the impact, then updates the deployment or forks it.
-->
<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @click.self="customCloud.cancelEdit()"
      @keydown.escape="customCloud.cancelEdit()"
    >
      <div
        ref="panel"
        tabindex="-1"
        class="relative my-auto flex w-full max-w-[640px] flex-col gap-6 rounded-2xl border border-border-default bg-base-background p-9 text-base-foreground shadow-2xl outline-none"
      >
        <Button
          variant="muted-textonly"
          size="icon"
          class="absolute top-3 right-3 z-10"
          :aria-label="t('prototype.customCloud.dialog.close')"
          @click="customCloud.cancelEdit()"
        >
          <i class="icon-[lucide--x] size-4" />
        </Button>

        <template v-if="step === 'config' || step === 'machine'">
          <header class="flex flex-col gap-1 pr-8">
            <h2 :id="titleId" class="m-0 text-2xl font-semibold">
              {{ t('prototype.customCloud.edit.title') }}
            </h2>
            <p
              class="m-0 flex items-center gap-2 text-sm text-muted-foreground"
            >
              <i
                class="icon-[lucide--circle-check] size-4 text-success-background"
              />
              {{ editing?.name }}
              <span v-if="editing?.release">{{ editing.release }}</span>
              <span>·</span>
              {{
                t(
                  'prototype.customCloud.edit.usedBy',
                  customCloud.editingProjects.length
                )
              }}
            </p>
          </header>

          <div
            role="tablist"
            class="grid grid-cols-2 gap-1 rounded-xl bg-secondary-background/40 p-1"
          >
            <button
              v-for="mode in modes"
              :key="mode.step"
              type="button"
              role="tab"
              :aria-selected="step === mode.step"
              :class="
                cn(
                  'flex cursor-pointer flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors',
                  step === mode.step
                    ? 'border-base-foreground bg-base-background'
                    : 'border-transparent bg-transparent hover:bg-secondary-background-hover'
                )
              "
              @click="customCloud.editStep = mode.step"
            >
              <span class="flex items-center gap-2 text-sm font-medium">
                {{ mode.label }}
                <span
                  v-if="mode.changes"
                  class="rounded-full bg-base-foreground px-1.5 text-[11px] text-base-background tabular-nums"
                >
                  {{ mode.changes }}
                </span>
              </span>
              <span class="text-xs text-muted-foreground">{{ mode.hint }}</span>
            </button>
          </div>

          <EditDeploymentConfig v-if="step === 'config'" />
          <EditDeploymentMachine v-else />

          <EnvironmentSwitchCard
            v-if="customCloud.editingFromProjectId"
            icon="icon-[lucide--cloud]"
            :title="t('prototype.customCloud.switch.cloudTitle')"
            :body="t('prototype.customCloud.switch.cloudBody')"
            :action="t('prototype.customCloud.switch.cloudAction')"
            @switch="customCloud.editStep = 'cloud'"
          />

          <footer class="flex items-center gap-2.5">
            <Button
              variant="muted-textonly"
              size="lg"
              class="mr-auto"
              @click="customCloud.cancelEdit()"
            >
              {{ t('prototype.customCloud.edit.cancel') }}
            </Button>
            <Button
              variant="outline"
              size="lg"
              @click="
                customCloud.editStep = step === 'config' ? 'machine' : 'config'
              "
            >
              {{
                t(
                  step === 'config'
                    ? 'prototype.customCloud.edit.toMachine'
                    : 'prototype.customCloud.edit.toConfig'
                )
              }}
            </Button>
            <Button
              variant="inverted"
              size="lg"
              :disabled="!changeCount"
              @click="customCloud.reviewEdit()"
            >
              {{
                changeCount
                  ? t('prototype.customCloud.edit.reviewCount', changeCount)
                  : t('prototype.customCloud.edit.noChanges')
              }}
            </Button>
          </footer>
        </template>

        <RunTargetEditItems v-else-if="step === 'items'" :title-id="titleId" />
        <EditDeploymentCloudSwitch
          v-else-if="step === 'cloud'"
          :title-id="titleId"
        />
        <RunTargetImpact v-else-if="step === 'impact'" :title-id="titleId" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed, onMounted, useId, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'

import EditDeploymentCloudSwitch from './EditDeploymentCloudSwitch.vue'
import EditDeploymentConfig from './EditDeploymentConfig.vue'
import EditDeploymentMachine from './EditDeploymentMachine.vue'
import EnvironmentSwitchCard from './EnvironmentSwitchCard.vue'
import RunTargetEditItems from './RunTargetEditItems.vue'
import RunTargetImpact from './RunTargetImpact.vue'

const { t } = useI18n()
const customCloud = usePrototypeCustomCloudStore()
const titleId = useId()
const panel = useTemplateRef('panel')

const step = computed(() => customCloud.editStep)
const editing = computed(() => customCloud.editingDeployment)
const changeCount = computed(() => customCloud.editingChangeCount)

const configChanges = computed(() => {
  const c = customCloud.editingChanges
  return (
    [c.name, c.comfyVersion].filter(Boolean).length +
    [c.addedPacks, c.removedPacks, c.addedModels, c.removedModels].filter(
      (items) => items.length
    ).length
  )
})

const modes = computed(() => [
  {
    step: 'config' as const,
    label: t('prototype.customCloud.edit.modeConfig'),
    hint: t('prototype.customCloud.edit.modeConfigHint'),
    changes: configChanges.value
  },
  {
    step: 'machine' as const,
    label: t('prototype.customCloud.edit.modeMachine'),
    hint: t('prototype.customCloud.edit.modeMachineHint'),
    changes: changeCount.value - configChanges.value
  }
])

onMounted(() => panel.value?.focus())
</script>
