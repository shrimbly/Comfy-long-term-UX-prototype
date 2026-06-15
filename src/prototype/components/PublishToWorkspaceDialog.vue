<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
              — Publish to workspace overwrites the canonical in place;
                no diff/merge; confirm-overwrite, not a merge UI.
    log:      ../prototype/design-decisions.md 2026-06-16 (MVP scope)

  Confirm dialog for Publish to workspace. Per the MVP model overwrite is
  ungated (any member can publish; version history is the safety net), so
  this is a simple confirm. In the real product this is triggered from the
  node-graph menu; the prototype has no editor, so it's triggered from the
  workflow's dashboard context menu on a copy.
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
            class="grid size-9 shrink-0 place-items-center rounded-full bg-secondary-background"
          >
            <i class="icon-[lucide--upload] size-4.5 text-base-foreground" />
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

        <p class="text-sm text-muted-foreground">
          {{ t('prototype.publishToWorkspace.confirmBody') }}
        </p>

        <footer
          class="flex flex-nowrap items-center justify-between gap-2 pt-2"
        >
          <Button variant="textonly" size="lg" @click="emit('close')">
            {{ t('prototype.publishToWorkspace.cancel') }}
          </Button>
          <Button variant="primary" size="lg" @click="onPublish">
            <i class="icon-[lucide--upload]" aria-hidden="true" />
            {{ t('prototype.publishToWorkspace.publish') }}
          </Button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'

import type { WorkflowPublishState } from '../composables/useWorkflowPublish'
import { useI18n } from 'vue-i18n'

const { state } = defineProps<{
  state: WorkflowPublishState
}>()

const emit = defineEmits<{
  close: []
  publish: []
}>()

const { t } = useI18n()

function onPublish() {
  emit('publish')
}
</script>
