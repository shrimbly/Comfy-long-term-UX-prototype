<!--
  A folder tile for the My Workflows / project grids. Click to open; hover
  reveals a kebab, and right-click opens the same menu (Rename / Delete).
  Delete is non-destructive — contained workflows fall back to the container
  root. Self-contained: owns its rename/delete dialogs.
-->
<template>
  <div
    class="group/folder relative"
    @contextmenu.prevent.stop="openMenu"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <button
      type="button"
      :class="
        cn(
          'flex w-full cursor-pointer items-center gap-2.5 rounded-lg border bg-secondary-background px-3 py-2.5 text-left transition-colors',
          isDragOver
            ? 'border-primary-background bg-secondary-background-hover'
            : 'border-border-subtle hover:border-muted-foreground'
        )
      "
      @click="emit('open', folder.id)"
    >
      <i class="icon-[lucide--folder] size-5 shrink-0 text-muted-foreground" />
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-medium text-base-foreground">{{
          folder.name
        }}</span>
        <span class="block text-xs text-muted-foreground">{{
          t('prototype.folders.count', { count })
        }}</span>
      </span>
    </button>

    <div
      class="pointer-events-none absolute top-1.5 right-1.5 opacity-0 transition-opacity group-focus-within/folder:opacity-100 group-hover/folder:opacity-100"
    >
      <Button
        variant="secondary"
        size="unset"
        class="pointer-events-auto grid size-6 place-items-center rounded-md"
        :aria-label="t('prototype.workflowCard.moreActions')"
        @click.stop="openMenu"
      >
        <i class="icon-[lucide--ellipsis-vertical] size-3.5" />
      </Button>
    </div>

    <ContextMenu
      ref="contextMenu"
      :model="items"
      :pt="{
        root: {
          class: cn(
            'rounded-lg border border-border-default',
            'bg-secondary-background text-base-foreground shadow-lg'
          )
        }
      }"
      @hide="onHide"
    >
      <template #item="{ item, props }">
        <Button
          variant="secondary"
          :class="
            cn(
              'w-full justify-start gap-2',
              item.danger && 'text-destructive-background'
            )
          "
          v-bind="props.action"
        >
          <i v-if="item.icon" :class="cn('size-4', item.icon)" />
          <span class="flex-1 text-left">{{ item.label }}</span>
        </Button>
      </template>
    </ContextMenu>

    <PromptDialog
      v-if="dialog === 'rename'"
      :title="t('prototype.folders.renameTitle')"
      :initial-value="folder.name"
      :confirm-label="t('g.rename')"
      @confirm="confirmRename"
      @cancel="dialog = null"
    />

    <ConfirmDialog
      v-if="dialog === 'delete'"
      :title="t('prototype.folders.deleteTitle')"
      :message="t('prototype.folders.deleteConfirm', { name: folder.name })"
      :confirm-label="t('g.delete')"
      danger
      @confirm="confirmDelete"
      @cancel="dialog = null"
    />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import ContextMenu from 'primevue/contextmenu'
import type { MenuItem } from 'primevue/menuitem'
import { useToast } from 'primevue/usetoast'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import ConfirmDialog from './ConfirmDialog.vue'
import PromptDialog from './PromptDialog.vue'
import { useActiveContextMenu } from '../composables/useActiveContextMenu'
import { useWorkflowDrag } from '../composables/useWorkflowDrag'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { Folder } from '../types'

const { folder, count } = defineProps<{ folder: Folder; count: number }>()

const emit = defineEmits<{ open: [folderId: string] }>()

const { t } = useI18n()
const toast = useToast()
const personaStore = usePrototypePersonaStore()
const { draggingWorkflowIds } = useWorkflowDrag()

// Drop target: highlight + accept the dragged workflows that belong to this
// container and aren't already in this folder.
const isDragOver = ref(false)

const acceptableIds = computed(() =>
  draggingWorkflowIds.value.filter((id) => {
    const wf = personaStore.fixture.workflows.find((w) => w.id === id)
    return (
      !!wf && wf.projectId === folder.projectId && wf.folderId !== folder.id
    )
  })
)
const canAcceptDrag = computed(() => acceptableIds.value.length > 0)

function onDragOver(event: DragEvent) {
  if (!canAcceptDrag.value) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  isDragOver.value = true
}

function onDragLeave(event: DragEvent) {
  const root = event.currentTarget as HTMLElement
  if (!root.contains(event.relatedTarget as Node | null)) {
    isDragOver.value = false
  }
}

function onDrop(event: DragEvent) {
  isDragOver.value = false
  if (!canAcceptDrag.value) return
  event.preventDefault()
  const ids = acceptableIds.value
  for (const id of ids) personaStore.moveWorkflowToFolder(id, folder.id)
  const first = personaStore.fixture.workflows.find((w) => w.id === ids[0])
  toast.add({
    severity: 'success',
    summary: t('prototype.folders.movedSummary'),
    detail:
      ids.length === 1
        ? t('prototype.folders.movedToDetail', {
            name: first?.name ?? '',
            folder: folder.name
          })
        : t('prototype.folders.movedCountToDetail', {
            count: ids.length,
            folder: folder.name
          }),
    life: 2200
  })
}

type ContextMenuHandle = { show: (event: MouseEvent) => void; hide: () => void }
const contextMenu = ref<ContextMenuHandle | null>(null)

// Mirror the workflow/project cards: the shared coordinator dismisses whichever
// menu was open before this one (the card stops the contextmenu event).
const { activate, deactivate } = useActiveContextMenu()

function hide() {
  contextMenu.value?.hide()
}

function openMenu(event: MouseEvent) {
  activate(hide)
  contextMenu.value?.show(event)
}

function onHide() {
  deactivate(hide)
}

const dialog = ref<'rename' | 'delete' | null>(null)

function confirmRename(name: string) {
  dialog.value = null
  personaStore.renameFolder(folder.id, name)
}

function confirmDelete() {
  dialog.value = null
  personaStore.deleteFolder(folder.id)
}

const items = computed<MenuItem[]>(() => [
  {
    label: t('prototype.folders.rename'),
    icon: 'icon-[lucide--pencil]',
    command: () => (dialog.value = 'rename')
  },
  {
    label: t('prototype.folders.delete'),
    icon: 'icon-[lucide--trash-2]',
    command: () => (dialog.value = 'delete'),
    danger: true
  }
])
</script>
