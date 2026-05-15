<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/workflow.md §"Default home"
    open-q:  ../IA_Plan/wiki/open-questions.md#my-workflows-move-permissions
             Proposed answer is "re-confirm asset invitees on promotion";
             the prototype takes the simpler stance of move-only-no-re-
             confirm (see prototype/design-decisions.md 2026-05-15
             Workflow context menu entry).

  Compact project picker. Lists accessible non-Drafts projects in the
  same workspace as the source workflow. Drafts is the source for
  promotion and not a valid target.
-->
<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      @click.self="$emit('close')"
    >
      <div
        class="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border-subtle bg-base-background p-6 shadow-2xl"
      >
        <header class="flex flex-col gap-1">
          <h2 class="text-lg font-semibold">
            {{ t('prototype.workflowMenu.move.title') }}
          </h2>
          <p class="text-sm text-muted-foreground">
            {{
              t('prototype.workflowMenu.move.subtitle', {
                name: workflow.name
              })
            }}
          </p>
        </header>

        <ul
          v-if="targets.length"
          class="m-0 flex max-h-72 list-none flex-col gap-1 overflow-y-auto p-0"
        >
          <li v-for="p in targets" :key="p.id">
            <button
              type="button"
              :class="
                cn(
                  'flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  selectedId === p.id
                    ? 'border-base-foreground bg-secondary-background'
                    : 'border-border-subtle hover:bg-secondary-background'
                )
              "
              @click="selectedId = p.id"
            >
              <span class="flex flex-col">
                <span class="truncate">{{ p.name }}</span>
                <span class="text-xs text-muted-foreground">
                  {{ t(`prototype.projectTier.${p.tier}`) }}
                </span>
              </span>
              <i
                v-if="selectedId === p.id"
                class="icon-[lucide--check] size-4"
              />
            </button>
          </li>
        </ul>

        <p
          v-else
          class="m-0 rounded-lg border border-dashed border-border-subtle p-4 text-center text-sm text-muted-foreground"
        >
          {{ t('prototype.workflowMenu.move.noTargets') }}
        </p>

        <footer class="flex justify-end gap-2">
          <button
            type="button"
            class="inline-flex h-9 cursor-pointer items-center rounded-lg bg-secondary-background px-3 text-sm transition-colors hover:bg-secondary-background-hover"
            @click="$emit('close')"
          >
            {{ t('prototype.workflowMenu.move.cancel') }}
          </button>
          <button
            type="button"
            class="inline-flex h-9 cursor-pointer items-center rounded-lg bg-primary-background px-3 text-sm font-medium text-button-surface-contrast transition-colors hover:bg-primary-background-hover disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!selectedId"
            @click="submit"
          >
            {{ t('prototype.workflowMenu.move.confirm') }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePrototypePersonaStore } from '../stores/personaStore'
import type { Workflow } from '../types'

const { workflow } = defineProps<{
  workflow: Workflow
}>()

const emit = defineEmits<{
  close: []
  moved: [targetProjectId: string]
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture } = storeToRefs(personaStore)

const selectedId = ref<string>('')

const sourceProject = computed(() =>
  fixture.value.projects.find((p) => p.id === workflow.projectId)
)

const targets = computed(() => {
  const ws = sourceProject.value?.workspaceId
  if (!ws) return []
  return fixture.value.projects.filter(
    (p) =>
      p.workspaceId === ws &&
      !p.isDrafts &&
      p.id !== workflow.projectId &&
      p.currentUserHasAccess
  )
})

function submit() {
  if (!selectedId.value) return
  personaStore.moveWorkflowToProject(workflow.id, selectedId.value)
  emit('moved', selectedId.value)
  emit('close')
}
</script>
