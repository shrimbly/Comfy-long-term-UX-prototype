<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/workflow.md §"Runtime compatibility"
             — soft / advisory recommendation, never blocking
    log:     ../prototype/design-decisions.md 2026-05-19 — recommended-min
             version is a soft labeling signal alongside the hard
             identity-based install gate.

  Lightweight modal triggered by clicking the amber recommended-mismatch
  badge on a WorkflowCard. Surfaces the recommended-minimum ComfyUI
  version + the user's active install version so the user has something
  actionable to react to. Single dismiss button — never blocks the run.
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
        class="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border-subtle bg-base-background p-6 shadow-2xl"
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
            <h2 class="m-0 text-lg font-semibold">
              {{ t('prototype.runtimeRecommendation.title') }}
            </h2>
            <p class="m-0 text-sm text-muted-foreground">
              {{
                t('prototype.runtimeRecommendation.subtitle', {
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
              {{ t('prototype.runtimeRecommendation.recommendedLabel') }}
            </span>
            <span class="text-base-foreground">
              {{
                t('prototype.runtimeRecommendation.versionLine', {
                  version: compat.recommendedComfyUIVersion ?? '—'
                })
              }}
            </span>
          </div>
          <div class="flex flex-col gap-1 border-t border-border-subtle pt-3">
            <span
              class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
            >
              {{ t('prototype.runtimeRecommendation.currentLabel') }}
            </span>
            <span class="text-base-foreground">
              {{ currentLine }}
            </span>
          </div>
        </section>

        <p class="m-0 text-sm text-muted-foreground">
          {{ t('prototype.runtimeRecommendation.body') }}
        </p>

        <footer class="flex justify-end gap-2 pt-2">
          <Button variant="primary" size="lg" @click="emit('close')">
            {{ t('prototype.runtimeRecommendation.acknowledge') }}
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
}>()

const { t } = useI18n()

const currentLine = computed(() => {
  const c = compat.current
  if (!c) return t('prototype.runtimeRecommendation.currentNone')
  return t('prototype.runtimeRecommendation.currentLine', {
    name: c.displayName,
    version: c.comfyUIVersion
  })
})
</script>
