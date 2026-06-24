<!--
  Pick a destination folder for a workflow within its container (My Workflows
  or a project). "No folder" returns it to the container root. Folders are
  created from the container's "New folder" button, not here.
-->
<template>
  <Dialog :open="true" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{{ t('prototype.folders.moveTitle') }}</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <div class="px-4 py-2">
          <div
            class="flex max-h-72 flex-col gap-0.5 overflow-y-auto rounded-lg bg-secondary-background p-1.5"
          >
            <Button
              v-for="opt in options"
              :key="opt.id"
              variant="textonly"
              size="unset"
              :class="rowClass(selected === opt.id)"
              @click="selected = opt.id"
            >
              <i
                class="icon-[lucide--folder] size-4 shrink-0 text-muted-foreground"
              />
              <span
                class="min-w-0 flex-1 truncate text-sm text-base-foreground"
                >{{ opt.label }}</span
              >
              <i
                v-if="selected === opt.id"
                class="icon-[lucide--check] size-4 shrink-0 text-base-foreground"
              />
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="textonly" @click="emit('cancel')">
            {{ t('g.cancel') }}
          </Button>
          <Button variant="primary" :disabled="!selected" @click="onConfirm">
            {{ t('prototype.folders.moveConfirm') }}
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

const { workflowIds } = defineProps<{ workflowIds: string[] }>()

const emit = defineEmits<{ moved: []; cancel: [] }>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture } = storeToRefs(personaStore)

// All ids share a container (same grid); key folder options off the first.
const firstWorkflow = computed(() =>
  fixture.value.workflows.find((w) => w.id === workflowIds[0])
)
const containerId = computed(() => firstWorkflow.value?.projectId)
const containerFolders = computed(() =>
  (fixture.value.folders ?? []).filter((f) => f.projectId === containerId.value)
)

// Pre-select the current folder only when moving a single workflow.
const selected = ref<string | null>(
  workflowIds.length === 1 ? (firstWorkflow.value?.folderId ?? null) : null
)

const options = computed<Array<{ id: string; label: string }>>(() =>
  containerFolders.value.map((f) => ({ id: f.id, label: f.name }))
)

function rowClass(isSelected: boolean): string {
  return cn(
    'w-full items-center gap-3 rounded-lg p-2 text-left',
    isSelected
      ? 'bg-interface-menu-component-surface-selected hover:bg-interface-menu-component-surface-selected'
      : 'hover:bg-interface-menu-component-surface-hovered'
  )
}

function onConfirm() {
  if (!selected.value) return
  for (const id of workflowIds) {
    personaStore.moveWorkflowToFolder(id, selected.value)
  }
  emit('moved')
}

function onOpenChange(open: boolean) {
  if (!open) emit('cancel')
}
</script>
