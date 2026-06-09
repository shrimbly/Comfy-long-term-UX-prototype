<!--
  Implements:
    open-q:   ../IA_Plan/wiki/open-questions.md#workflow-promotion-flow
    decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
              — promotion is the initial Publish: seeds the canonical's V1.
    log:      ../prototype/design-decisions.md (2026-06-09 workflow promotion)

  Pick a shared project to publish a My Workflows workflow into as its
  canonical. Install-locked targets the user isn't blessed for are shown
  but not selectable (publishing into a locked project needs the blessed
  install — same gate as Publish to workspace). Built on the shared
  design-system Dialog so it matches the rest of the Comfy Cloud surface.
-->
<template>
  <Dialog :open="true" @update:open="(v) => !v && emit('close')">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent size="sm">
        <DialogHeader class="items-start">
          <div class="flex flex-col gap-1">
            <DialogTitle>{{
              t('prototype.promoteToProject.title')
            }}</DialogTitle>
            <DialogDescription>
              {{
                t('prototype.promoteToProject.subtitle', {
                  workflow: workflow.name
                })
              }}
            </DialogDescription>
          </div>
          <DialogClose />
        </DialogHeader>

        <fieldset class="m-0 flex flex-col gap-1 border-0 px-4 py-2">
          <legend class="sr-only">
            {{ t('prototype.promoteToProject.pickerLabel') }}
          </legend>
          <div
            v-if="candidates.length"
            class="flex max-h-60 flex-col gap-1 overflow-y-auto"
          >
            <label
              v-for="p in candidates"
              :key="p.id"
              :class="
                cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  lockedReason(p) && 'cursor-not-allowed opacity-60',
                  selectedId === p.id
                    ? 'bg-interface-menu-component-surface-selected'
                    : 'hover:bg-interface-menu-component-surface-hovered'
                )
              "
            >
              <input
                v-model="selectedId"
                type="radio"
                :value="p.id"
                :disabled="!!lockedReason(p)"
                class="accent-base-foreground"
              />
              <span class="min-w-0 flex-1 truncate text-base-foreground">{{
                p.name
              }}</span>
              <i
                v-if="lockInfo(p)"
                :title="lockInfo(p) ?? undefined"
                class="icon-[lucide--lock] size-3.5 shrink-0 text-muted-foreground"
              />
            </label>
          </div>

          <label
            :class="
              cn(
                'flex cursor-pointer flex-col gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                selectedId === NEW_PROJECT
                  ? 'bg-interface-menu-component-surface-selected'
                  : 'hover:bg-interface-menu-component-surface-hovered'
              )
            "
          >
            <span class="flex items-center gap-2">
              <input
                v-model="selectedId"
                type="radio"
                :value="NEW_PROJECT"
                class="accent-base-foreground"
              />
              <span class="flex items-center gap-1.5 text-base-foreground">
                <i class="icon-[lucide--plus] size-4" aria-hidden="true" />
                {{ t('prototype.promoteToProject.newProjectOption') }}
              </span>
            </span>
            <input
              v-if="selectedId === NEW_PROJECT"
              v-model="newProjectName"
              type="text"
              class="ml-6 rounded-md border border-border-default bg-base-background px-2.5 py-1.5 text-sm text-base-foreground outline-none focus:border-primary-background"
              :placeholder="
                t('prototype.promoteToProject.newProjectPlaceholder')
              "
            />
          </label>
        </fieldset>

        <DialogFooter>
          <Button variant="textonly" @click="emit('close')">
            {{ t('prototype.promoteToProject.cancel') }}
          </Button>
          <Button variant="primary" :disabled="!canConfirm" @click="onConfirm">
            <i class="icon-[lucide--upload]" aria-hidden="true" />
            {{ t('prototype.promoteToProject.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogPortal>
  </Dialog>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
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

const NEW_PROJECT = '__new__'

const candidates = computed(() => visibleProjects.value)

const selectedId = ref<string>('')
const newProjectName = ref<string>('')

const canConfirm = computed(() =>
  selectedId.value === NEW_PROJECT
    ? !!newProjectName.value.trim()
    : !!selectedId.value
)

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

// Tooltip for the row's lock icon: the install-lock reason if the user
// can't publish here, otherwise a note that the project is restricted.
function lockInfo(project: Project): string | null {
  return (
    lockedReason(project) ??
    (project.tier === 'restricted'
      ? t('prototype.promoteToProject.restrictedHint')
      : null)
  )
}

function onConfirm() {
  if (!canConfirm.value) return
  const projectId =
    selectedId.value === NEW_PROJECT
      ? personaStore.createProject(newProjectName.value)
      : selectedId.value
  emit('promote', projectId)
}
</script>
