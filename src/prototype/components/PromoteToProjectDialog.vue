<!--
  Implements:
    open-q:   ../IA_Plan/wiki/open-questions.md#workflow-promotion-flow
    decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
              — promotion is the initial Publish: seeds the canonical's V1.
    log:      ../prototype/design-decisions.md (2026-06-09 workflow promotion)

  Pick a shared project to publish a My Workflows workflow into as its
  canonical. Install-locked targets the user isn't blessed for are shown
  but not selectable (publishing into a locked project needs the blessed
  install — same gate as Publish to workspace).
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
        class="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-border-subtle bg-base-background p-6 shadow-2xl"
      >
        <div class="flex flex-col gap-1">
          <h2 class="m-0 text-lg font-semibold">
            {{ t('prototype.promoteToProject.title') }}
          </h2>
          <p class="m-0 text-sm text-muted-foreground">
            {{
              t('prototype.promoteToProject.subtitle', {
                workflow: workflow.name
              })
            }}
          </p>
        </div>

        <p
          v-if="!candidates.length"
          class="rounded-lg border border-dashed border-border-subtle p-4 text-center text-sm text-muted-foreground"
        >
          {{ t('prototype.promoteToProject.empty') }}
        </p>

        <fieldset
          v-else
          class="m-0 flex max-h-72 flex-col gap-2 overflow-y-auto border-0 p-0"
        >
          <legend class="sr-only">
            {{ t('prototype.promoteToProject.pickerLabel') }}
          </legend>
          <label
            v-for="p in candidates"
            :key="p.id"
            :class="
              cn(
                'flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 text-sm transition-colors',
                lockedReason(p) && 'cursor-not-allowed opacity-60',
                selectedId === p.id
                  ? 'border-primary-background bg-secondary-background'
                  : 'border-border-subtle hover:bg-secondary-background'
              )
            "
          >
            <span class="flex items-center gap-2">
              <input
                v-model="selectedId"
                type="radio"
                :value="p.id"
                :disabled="!!lockedReason(p)"
                class="accent-base-foreground"
              />
              <span class="font-medium text-base-foreground">{{ p.name }}</span>
            </span>
            <span
              v-if="lockedReason(p)"
              class="pl-6 text-xs text-muted-foreground"
            >
              {{ lockedReason(p) }}
            </span>
          </label>
        </fieldset>

        <footer class="flex justify-end gap-2">
          <Button variant="textonly" size="lg" @click="emit('close')">
            {{ t('prototype.promoteToProject.cancel') }}
          </Button>
          <Button
            variant="primary"
            size="lg"
            :disabled="!selectedId"
            @click="onConfirm"
          >
            <i class="icon-[lucide--upload]" aria-hidden="true" />
            {{ t('prototype.promoteToProject.confirm') }}
          </Button>
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

import Button from '@/components/ui/button/Button.vue'

import { usePrototypePersonaStore } from '../stores/personaStore'
import type { Project, Workflow } from '../types'

const { workflow } = defineProps<{
  workflow: Workflow
}>()

const emit = defineEmits<{
  close: []
  promote: [projectId: string]
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { visibleProjects, activeInstall } = storeToRefs(personaStore)

const candidates = computed(() => visibleProjects.value)

const selectedId = ref<string>('')

// Publishing into an install-locked project needs the blessed install —
// the same gate as Publish to workspace.
function lockedReason(project: Project): string | null {
  const allowed = project.allowedInstallIds
  if (!allowed || allowed.length === 0) return null
  if (activeInstall.value && allowed.includes(activeInstall.value.id)) {
    return null
  }
  return t('prototype.promoteToProject.lockedHint', {
    install: project.installLockDisplayName ?? allowed[0]
  })
}

function onConfirm() {
  if (!selectedId.value) return
  emit('promote', selectedId.value)
}
</script>
