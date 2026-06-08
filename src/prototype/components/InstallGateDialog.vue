<!--
  Implements:
    journey:  ../IA_Plan/wiki/concepts/install-journeys.md §6 — freelancer
              hits the install gate
    concept:  ../IA_Plan/wiki/concepts/install-switcher.md §"Project install
              constraints"
    decision: ../IA_Plan/wiki/decisions/team-locked-install.md — allowed-set
              is a hard lock, not advisory
    log:      ../prototype/design-decisions.md 2026-05-19 — install gate is
              identity-based; recommended-version is a separate soft signal.

  Modal intercepting workflow Open when the active install's identity is
  not in the project's allowed-install set. Per Journey 6 the gate must
  surface (a) what's required, (b) what the active install is, (c) the
  remediation path.

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
              class="icon-[lucide--lock] size-4.5 text-button-surface-contrast"
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

        <footer class="flex flex-nowrap justify-end gap-2 pt-2">
          <Button variant="textonly" size="lg" @click="emit('close')">
            {{ t('prototype.installGate.close') }}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            @click="emit('use-cloud-runtime')"
          >
            <i class="icon-[lucide--cloud]" aria-hidden="true" />
            {{ t('prototype.installGate.actionUseCloudRuntime') }}
          </Button>
          <Button
            variant="primary"
            size="lg"
            @click="emit('install-team-build')"
          >
            <i class="icon-[lucide--download]" aria-hidden="true" />
            {{ t('prototype.installGate.actionInstallTeamBuild') }}
          </Button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import type { WorkflowCompatResult } from '../composables/useWorkflowCompat'
import type { Workflow } from '../types'

const { workflow, compat } = defineProps<{
  workflow: Workflow
  compat: WorkflowCompatResult
}>()

const emit = defineEmits<{
  close: []
  'install-team-build': []
  'use-cloud-runtime': []
}>()

const { t } = useI18n()

const requiredName = computed(
  () =>
    compat.requiredInstallName ?? t('prototype.installGate.requiredFallback')
)
const currentName = computed(
  () => compat.current?.displayName ?? t('prototype.installGate.currentNone')
)
</script>
