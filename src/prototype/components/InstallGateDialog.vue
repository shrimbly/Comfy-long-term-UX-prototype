<!--
  Implements:
    journey:  ../IA_Plan/wiki/concepts/install-journeys.md §6 — freelancer
              hits the install gate
    concept:  ../IA_Plan/wiki/concepts/install-switcher.md §"Project install
              constraints"
    decision: ../IA_Plan/wiki/decisions/team-locked-install.md — allowed-set
              is a hard lock on publish, not on use
    log:      ../prototype/design-decisions.md 2026-05-27 — install lock
              gates publish, not use; "Save to My Workflows" escape hatch.

  Modal intercepting workflow Open when the active install's identity is
  not in the project's allowed-install set. The lock no longer blocks
  use — per fork-on-open (published-workflow-model) the user can always
  work on their own copy. What the lock blocks is publishing back to the
  team. So the gate WARNS and offers two paths: take a private copy
  ("Save to My Workflows", primary), or get onto the team build so a
  later publish is possible (install / switch, secondary).

  The "Required" line renders the *workspace-canonical* install name set
  by the Install Governor when the lock was configured — not whatever
  local label any user happens to have applied to the same bundle.
-->
<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <div
        class="flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-border-subtle bg-base-background p-6 shadow-2xl"
      >
        <header class="flex items-start gap-3">
          <span
            class="grid size-9 shrink-0 place-items-center rounded-full bg-warning-background"
          >
            <i
              class="icon-[lucide--triangle-alert] size-4.5 text-button-surface-contrast"
            />
          </span>
          <div class="flex flex-col gap-1">
            <h2 class="text-lg font-semibold">
              {{ t('prototype.installGate.title') }}
            </h2>
            <p class="text-sm text-muted-foreground">
              {{
                t('prototype.installGate.subtitle', {
                  workflow: workflow.name
                })
              }}
            </p>
          </div>
        </header>

        <section
          class="flex flex-col gap-3 rounded-lg border border-border-subtle bg-secondary-background p-4 text-sm"
        >
          <div class="flex flex-col gap-1">
            <span
              class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
            >
              {{ t('prototype.installGate.requiredLabel') }}
            </span>
            <span class="text-base-foreground">
              {{ requiredName }}
            </span>
            <span class="pt-1 text-xs text-muted-foreground">
              {{ t('prototype.installGate.requiredReason') }}
            </span>
          </div>
          <div class="flex flex-col gap-1 border-t border-border-subtle pt-3">
            <span
              class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
            >
              {{ t('prototype.installGate.currentLabel') }}
            </span>
            <span class="text-base-foreground">
              {{ currentName }}
            </span>
          </div>
        </section>

        <section class="flex flex-col gap-2">
          <span
            class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            {{ t('prototype.installGate.remediationLabel') }}
          </span>
          <p class="text-sm text-muted-foreground">
            {{ t('prototype.installGate.remediationHint') }}
          </p>
        </section>

        <footer
          class="flex flex-nowrap items-center justify-between gap-2 pt-2"
        >
          <Button variant="textonly" size="lg" @click="emit('close')">
            {{ t('prototype.installGate.close') }}
          </Button>
          <div class="flex flex-nowrap gap-2">
            <Button
              variant="secondary"
              size="lg"
              @click="emit('save-to-my-workflows')"
            >
              <i class="icon-[lucide--copy-plus]" aria-hidden="true" />
              {{ t('prototype.installGate.actionSaveToMyWorkflows') }}
            </Button>
            <Button variant="primary" size="lg" @click="onSatisfy">
              <i
                :class="
                  alreadyHasInstall
                    ? 'icon-[lucide--arrow-right]'
                    : 'icon-[lucide--download]'
                "
                aria-hidden="true"
              />
              {{
                alreadyHasInstall
                  ? t('prototype.installGate.actionSwitchTo', {
                      name: targetInstallName
                    })
                  : t('prototype.installGate.actionInstall', {
                      name: targetInstallName
                    })
              }}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import type { WorkflowCompatResult } from '../composables/useWorkflowCompat'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { Workflow } from '../types'

const { workflow, compat } = defineProps<{
  workflow: Workflow
  compat: WorkflowCompatResult
}>()

const emit = defineEmits<{
  close: []
  satisfy: [installId: string]
  'save-to-my-workflows': []
}>()

const { t } = useI18n()

const personaStore = usePrototypePersonaStore()
const { fixture, currentWorkspace } = storeToRefs(personaStore)

// The target install to install / switch to in order to satisfy the
// gate. Picks the first ID in the project's allowed-install set — for a
// single-pin project that's "the team build"; during a version-bump
// transition where the set carries multiple identities, this resolves
// to the first one, which is fine for the prototype's narrative.
const targetInstallId = computed(() => compat.allowedInstallIds?.[0])

// Canonical name to render on the action button. Prefer the workspace
// registry entry's canonical name; fall back to the project's
// `installLockDisplayName`; finally the i18n fallback. The registry
// entry is the source of truth for the name once an install has been
// blessed (per workspace-install-registry concept).
const targetInstallName = computed(() => {
  const id = targetInstallId.value
  if (id) {
    const blessed = currentWorkspace.value?.blessedInstalls?.find(
      (b) => b.installId === id
    )
    if (blessed) return blessed.canonicalDisplayName
  }
  return (
    compat.requiredInstallName ?? t('prototype.installGate.requiredFallback')
  )
})

const alreadyHasInstall = computed(() => {
  const id = targetInstallId.value
  if (!id) return false
  return fixture.value.installs.some((i) => i.id === id)
})

const requiredName = computed(() => targetInstallName.value)
const currentName = computed(
  () => compat.current?.displayName ?? t('prototype.installGate.currentNone')
)

function onSatisfy() {
  const id = targetInstallId.value
  if (!id) return
  emit('satisfy', id)
}
</script>
