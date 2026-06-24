<!--
  Multi-select wrapper for a workflow grid. Renders the cards via the default
  slot inside a marquee-selectable container, and owns the bulk context menu +
  move/delete dialogs. The slot is handed { isSelected, selectionActive,
  onSelect, onContextMenu } to bind onto each WorkflowCard.
-->
<template>
  <div ref="containerRef" class="relative" @mousedown="onMouseDown">
    <div :class="layoutClass">
      <slot
        :is-selected="isSelected"
        :selection-active="isMulti"
        :on-select="onSelect"
        :on-context-menu="onContextMenu"
        :on-drag-start="onCardDragStart"
      />
    </div>

    <div
      v-if="rect"
      class="pointer-events-none absolute z-20 rounded-xs border border-primary-background bg-primary-background/10"
      :style="{
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.w}px`,
        height: `${rect.h}px`
      }"
    />

    <ContextMenu
      ref="menuRef"
      :model="items"
      :pt="{
        root: {
          class: cn(
            'rounded-lg border border-border-default',
            'bg-secondary-background text-base-foreground shadow-lg'
          )
        }
      }"
    >
      <template #item="{ item, props }">
        <Button
          variant="secondary"
          :class="
            cn('w-full justify-start gap-2', item.danger && 'text-danger')
          "
          v-bind="props.action"
        >
          <i v-if="item.icon" :class="cn('size-4', item.icon)" />
          <span class="flex-1 text-left">{{ item.label }}</span>
        </Button>
      </template>
    </ContextMenu>

    <MoveToFolderDialog
      v-if="dialog === 'move'"
      :workflow-ids="selectedIds"
      @moved="onMovedDone"
      @cancel="dialog = null"
    />

    <ConfirmDialog
      v-if="dialog === 'delete'"
      :title="t('prototype.selection.deleteTitle')"
      :message="
        t('prototype.selection.deleteConfirm', { count: selectionCount })
      "
      :confirm-label="t('g.delete')"
      danger
      @confirm="onDeleteConfirm"
      @cancel="dialog = null"
    />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import ContextMenu from 'primevue/contextmenu'
import type { MenuItem } from 'primevue/menuitem'
import { useToast } from 'primevue/usetoast'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import ConfirmDialog from './ConfirmDialog.vue'
import MoveToFolderDialog from './MoveToFolderDialog.vue'
import { useMarquee } from '../composables/useMarquee'
import { useMultiSelect } from '../composables/useMultiSelect'
import { useWorkflowDrag } from '../composables/useWorkflowDrag'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { Workflow } from '../types'

const { workflows, containerId, layoutClass } = defineProps<{
  workflows: Workflow[]
  containerId: string
  layoutClass: string
}>()

const { t } = useI18n()
const toast = useToast()
const personaStore = usePrototypePersonaStore()

const orderedIds = computed(() => workflows.map((w) => w.id))
const {
  selected,
  selectionCount,
  hasSelection,
  isMulti,
  isSelected,
  onSelect,
  setSelection,
  clear
} = useMultiSelect(orderedIds)

const selectedIds = computed(() => [...selected.value])

const containerRef = useTemplateRef<HTMLElement>('containerRef')
const { rect, onMouseDown } = useMarquee(containerRef, {
  onSelect: setSelection,
  onClickEmpty: clear
})

type MenuHandle = { show: (event: MouseEvent) => void }
const menuRef = ref<MenuHandle | null>(null)
function onContextMenu(event: MouseEvent) {
  menuRef.value?.show(event)
}

// Dragging a selected card drags the whole selection; an unselected card
// drags just itself.
const { startDrag } = useWorkflowDrag()
function onCardDragStart(id: string, event: DragEvent) {
  const ids =
    selected.value.has(id) && selected.value.size > 1
      ? [...selected.value]
      : [id]
  startDrag(ids, event)
}

const dialog = ref<'move' | 'delete' | null>(null)

const hasFolders = computed(() =>
  (personaStore.fixture.folders ?? []).some((f) => f.projectId === containerId)
)

const items = computed<MenuItem[]>(() => {
  const out: MenuItem[] = []
  if (hasFolders.value) {
    out.push({
      label: t('prototype.selection.moveToFolder', {
        count: selectionCount.value
      }),
      icon: 'icon-[lucide--folder-input]',
      command: () => (dialog.value = 'move')
    })
  }
  out.push({
    label: t('prototype.selection.delete', { count: selectionCount.value }),
    icon: 'icon-[lucide--trash-2]',
    command: () => (dialog.value = 'delete'),
    danger: true
  })
  out.push({ separator: true })
  out.push({
    label: t('prototype.selection.deselect'),
    icon: 'icon-[lucide--x]',
    command: clear
  })
  return out
})

function onMovedDone() {
  dialog.value = null
  const count = selectionCount.value
  clear()
  toast.add({
    severity: 'success',
    summary: t('prototype.folders.movedSummary'),
    detail: t('prototype.selection.movedDetail', { count }),
    life: 2200
  })
}

function onDeleteConfirm() {
  dialog.value = null
  const count = selectionCount.value
  for (const id of selectedIds.value) personaStore.deleteWorkflow(id)
  clear()
  toast.add({
    severity: 'success',
    summary: t('prototype.selection.deletedSummary'),
    detail: t('prototype.selection.deletedDetail', { count }),
    life: 2200
  })
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && hasSelection.value) clear()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>
