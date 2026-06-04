<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
              — Publish to workspace overwrites the canonical in place;
                no diff/merge; confirm-overwrite, not a merge UI.
    decision: ../IA_Plan/wiki/decisions/team-locked-install.md
              — publish gated on install identity (+ permission).
    log:      ../prototype/design-decisions.md 2026-05-27

  Confirm / blocked dialog for Publish to workspace. When both the
  permission and install gates fail, BOTH reasons are shown (the gates
  are independent — knowing only one is misleading). In the real
  product this is triggered from the node-graph menu; the prototype has
  no editor, so it's triggered from the workflow's dashboard context
  menu on a fork.
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
            :class="
              cn(
                'grid size-9 shrink-0 place-items-center rounded-full',
                state.canPublish
                  ? 'bg-secondary-background'
                  : 'bg-warning-background'
              )
            "
          >
            <i
              :class="
                cn(
                  'size-4.5',
                  state.canPublish
                    ? 'icon-[lucide--upload] text-base-foreground'
                    : 'icon-[lucide--triangle-alert] text-button-surface-contrast'
                )
              "
            />
          </span>
          <div class="flex flex-col gap-1">
            <h2 class="text-lg font-semibold">
              {{ t('prototype.publishToWorkspace.title') }}
            </h2>
            <p class="text-sm text-muted-foreground">
              {{
                t('prototype.publishToWorkspace.target', {
                  workflow: state.targetWorkflowName ?? '',
                  project: state.targetProjectName ?? ''
                })
              }}
            </p>
          </div>
        </header>

        <p v-if="state.canPublish" class="text-sm text-muted-foreground">
          {{ t('prototype.publishToWorkspace.confirmBody') }}
        </p>

        <section v-else class="flex flex-col gap-3">
          <div
            v-if="state.blockedReasons.includes('permission')"
            class="flex flex-col gap-1 rounded-lg border border-border-subtle bg-secondary-background p-4 text-sm"
          >
            <span class="flex items-center gap-2 font-medium">
              <i class="icon-[lucide--lock] size-4 text-muted-foreground" />
              {{ t('prototype.publishToWorkspace.permissionTitle') }}
            </span>
            <span class="text-muted-foreground">
              {{
                state.targetOwnerName
                  ? t('prototype.publishToWorkspace.permissionBodyOwner', {
                      owner: state.targetOwnerName
                    })
                  : t('prototype.publishToWorkspace.permissionBody')
              }}
            </span>
          </div>

          <div
            v-if="state.blockedReasons.includes('install')"
            class="flex flex-col gap-1 rounded-lg border border-border-subtle bg-secondary-background p-4 text-sm"
          >
            <span class="flex items-center gap-2 font-medium">
              <i class="icon-[lucide--box] size-4 text-muted-foreground" />
              {{ t('prototype.publishToWorkspace.installTitle') }}
            </span>
            <span class="text-muted-foreground">
              {{
                t('prototype.publishToWorkspace.installBody', {
                  required: state.requiredInstallName ?? '',
                  current:
                    state.currentInstallName ??
                    t('prototype.publishToWorkspace.noInstall')
                })
              }}
            </span>
          </div>
        </section>

        <footer
          class="flex flex-nowrap items-center justify-between gap-2 pt-2"
        >
          <Button variant="textonly" size="lg" @click="emit('close')">
            {{ t('prototype.publishToWorkspace.cancel') }}
          </Button>
          <div class="flex flex-nowrap gap-2">
            <Button
              v-if="
                !state.canPublish && state.blockedReasons.includes('permission')
              "
              variant="secondary"
              size="lg"
              @click="onAskOwner"
            >
              <i class="icon-[lucide--send]" aria-hidden="true" />
              {{ t('prototype.publishToWorkspace.askOwner') }}
            </Button>
            <Button
              v-if="state.canPublish"
              variant="primary"
              size="lg"
              @click="onPublish"
            >
              <i class="icon-[lucide--upload]" aria-hidden="true" />
              {{ t('prototype.publishToWorkspace.publish') }}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'

import Button from '@/components/ui/button/Button.vue'

import type { WorkflowPublishState } from '../composables/useWorkflowPublish'
import { useI18n } from 'vue-i18n'

const { state } = defineProps<{
  state: WorkflowPublishState
}>()

const emit = defineEmits<{
  close: []
  publish: []
  'ask-owner': []
}>()

const { t } = useI18n()

function onPublish() {
  emit('publish')
}

function onAskOwner() {
  emit('ask-owner')
}
</script>
