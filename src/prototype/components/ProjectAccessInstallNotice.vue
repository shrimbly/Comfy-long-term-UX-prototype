<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/team-locked-install.md
              — warn at project access (touchpoint 1 of 3: warn at access →
                hard-gate at branch creation → final check at publish)

  Shown on entering an install-locked project, to EVERY actor with a local
  install (including Admins) — install-based, not role-exempt. Content
  adapts: a compliant user just acknowledges; a non-compliant user is
  offered the switch (installing the blessed bundle locally if needed).
  Cloud-only personas (no installs) never see it — they're out of the
  install gate's scope. No Save-to-My-Workflows / cloud-runtime option
  here; that lives on the workflow ⋯ menu.
-->
<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <div
        class="my-auto flex w-full max-w-md flex-col gap-5 rounded-2xl border border-border-subtle bg-base-background p-6 shadow-2xl"
      >
        <div class="flex items-start gap-3">
          <span
            :class="
              cn(
                'mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-secondary-background',
                compliant ? 'text-success' : 'text-warning'
              )
            "
          >
            <span
              :class="
                cn(
                  'size-5',
                  compliant
                    ? 'icon-[lucide--shield-check]'
                    : 'icon-[lucide--shield-alert]'
                )
              "
            />
          </span>
          <div class="flex flex-col gap-1">
            <h2 class="m-0 text-lg/tight font-semibold">
              {{ t('prototype.installNotice.title') }}
            </h2>
            <p class="m-0 text-sm text-muted-foreground">
              {{
                t(
                  compliant
                    ? 'prototype.installNotice.bodyCompliant'
                    : 'prototype.installNotice.bodyLocked',
                  { project: project.name, install: requiredName }
                )
              }}
            </p>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="inline-flex h-10 cursor-pointer items-center rounded-lg bg-secondary-background px-4 text-sm transition-colors hover:bg-secondary-background-hover"
            @click="emit('close')"
          >
            {{ t('prototype.installNotice.continue') }}
          </button>
          <button
            v-if="!compliant"
            type="button"
            class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary-background px-4 text-sm font-medium text-button-surface-contrast transition-colors hover:bg-primary-background-hover"
            @click="onSwitch"
          >
            <span class="icon-[lucide--refresh-cw] size-4" />
            {{ t('prototype.installNotice.switch', { install: requiredName }) }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePrototypePersonaStore } from '../stores/personaStore'
import type { Project } from '../types'

const { project } = defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { activeInstall } = storeToRefs(personaStore)

const requiredId = computed(() => project.allowedInstallIds?.[0])

const requiredName = computed(
  () =>
    project.installLockDisplayName ??
    t('prototype.installNotice.requiredFallback')
)

const compliant = computed(
  () =>
    !!activeInstall.value &&
    !!project.allowedInstallIds?.includes(activeInstall.value.id)
)

function onSwitch() {
  const id = requiredId.value
  if (!id) return
  personaStore.installBlessedToLocal(id)
  personaStore.setActiveInstall(id)
  emit('close')
}
</script>
