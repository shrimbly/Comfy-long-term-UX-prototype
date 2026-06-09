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
        <DialogHeader class="items-start pb-0">
          <DialogTitle>{{ t('prototype.promoteToProject.title') }}</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <div class="flex flex-col px-2 py-1">
          <div
            v-if="candidates.length"
            class="flex max-h-64 flex-col gap-0.5 overflow-y-auto py-1 pr-0.5"
          >
            <Button
              v-for="p in candidates"
              :key="p.id"
              variant="textonly"
              size="unset"
              :disabled="!!lockedReason(p)"
              :class="
                cn(
                  'w-full items-center gap-3 rounded-lg p-2 text-left',
                  selectedId === p.id
                    ? 'bg-interface-menu-component-surface-selected hover:bg-interface-menu-component-surface-selected'
                    : 'hover:bg-interface-menu-component-surface-hovered'
                )
              "
              @click="selectedId = p.id"
            >
              <span
                class="grid size-8 shrink-0 grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-md"
                aria-hidden="true"
              >
                <span
                  v-for="(seed, i) in seedsFor(p)"
                  :key="i"
                  class="block rounded-[2px]"
                  :style="{ background: thumbnailGradient(seed) }"
                />
              </span>
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="truncate text-sm text-base-foreground">{{
                  p.name
                }}</span>
                <span class="truncate text-xs text-muted-foreground">{{
                  t(`prototype.projectTier.${p.tier}`)
                }}</span>
              </span>
              <i
                v-if="lockedReason(p)"
                :title="lockedReason(p) ?? undefined"
                class="icon-[lucide--lock] size-3.5 shrink-0 text-muted-foreground"
              />
              <i
                v-else-if="selectedId === p.id"
                class="icon-[lucide--check] size-4 shrink-0 text-base-foreground"
              />
            </Button>
          </div>

          <div class="mx-2 my-1 h-px bg-border-subtle" />

          <Button
            v-if="selectedId !== NEW_PROJECT"
            variant="textonly"
            size="unset"
            class="w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-interface-menu-component-surface-hovered"
            @click="selectedId = NEW_PROJECT"
          >
            <span
              class="grid size-8 shrink-0 place-items-center rounded-md border border-dashed border-border-default text-muted-foreground"
              aria-hidden="true"
            >
              <i class="icon-[lucide--plus] size-4" />
            </span>
            <span class="flex-1 text-sm text-base-foreground">{{
              t('prototype.promoteToProject.newProjectOption')
            }}</span>
          </Button>
          <div
            v-else
            class="flex items-center gap-3 rounded-lg bg-interface-menu-component-surface-selected p-2"
          >
            <span
              class="grid size-8 shrink-0 place-items-center rounded-md border border-dashed border-base-foreground text-base-foreground"
              aria-hidden="true"
            >
              <i class="icon-[lucide--plus] size-4" />
            </span>
            <input
              v-model="newProjectName"
              type="text"
              autofocus
              class="min-w-0 flex-1 rounded-md border border-border-default bg-base-background px-2.5 py-1.5 text-sm text-base-foreground outline-none placeholder:text-muted-foreground"
              :placeholder="
                t('prototype.promoteToProject.newProjectPlaceholder')
              "
              @keydown.enter="canConfirm && onConfirm()"
            />
            <i
              class="icon-[lucide--check] size-4 shrink-0 text-base-foreground"
            />
          </div>
        </div>

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
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogOverlay from '@/components/ui/dialog/DialogOverlay.vue'
import DialogPortal from '@/components/ui/dialog/DialogPortal.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'

import { usePrototypePersonaStore } from '../stores/personaStore'
import { thumbnailGradient } from '../utils/thumbnail'
import type { Project } from '../types'

const emit = defineEmits<{
  close: []
  promote: [projectId: string]
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { visibleProjects, activeInstall } = storeToRefs(personaStore)

const NEW_PROJECT = '__new__'

const candidates = computed(() => visibleProjects.value)

// Four colour-tile seeds per project — the same identity glyph used on
// project cards, so projects read as projects rather than plain rows.
function seedsFor(project: Project): string[] {
  return [0, 1, 2, 3].map((i) => `${project.id}-${i}`)
}

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

function onConfirm() {
  if (!canConfirm.value) return
  const projectId =
    selectedId.value === NEW_PROJECT
      ? personaStore.createProject(newProjectName.value)
      : selectedId.value
  emit('promote', projectId)
}
</script>
