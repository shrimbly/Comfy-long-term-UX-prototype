<!--
  Breadcrumb trail for prototype pages. Items render left→right with chevron
  separators; the last item is the current location (non-interactive) and every
  earlier item is a link that emits `navigate` with its index.

  Link segments can also be folder drop targets: `dropFolderIds[i]` gives the
  destination folder id for dropping workflows onto item i (`null` = the
  container root), or `undefined` when that segment accepts no drops. This lets
  a workflow be dragged from inside a folder up onto the breadcrumb to move it
  back out to the project / My Workflows root.
-->
<template>
  <nav
    class="flex items-center gap-1.5 text-sm"
    :aria-label="t('prototype.breadcrumb.aria')"
  >
    <template v-for="(item, i) in items" :key="i">
      <i
        v-if="i > 0"
        class="icon-[lucide--chevron-right] size-4 text-muted-foreground"
      />
      <span
        v-if="i === items.length - 1"
        class="font-medium text-base-foreground"
      >
        {{ item }}
      </span>
      <button
        v-else
        type="button"
        :class="
          cn(
            '-mx-1.5 -my-0.5 cursor-pointer rounded-md px-1.5 py-0.5 transition-colors',
            dragOverIndex === i
              ? 'bg-secondary-background-hover text-base-foreground ring-1 ring-primary-background'
              : 'text-muted-foreground hover:text-base-foreground'
          )
        "
        @click="emit('navigate', i)"
        @dragover="onDragOver(i, $event)"
        @dragleave="onDragLeave(i, $event)"
        @drop="onDrop(i, $event)"
      >
        {{ item }}
      </button>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { useToast } from 'primevue/usetoast'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useWorkflowDrag } from '../composables/useWorkflowDrag'
import { usePrototypePersonaStore } from '../stores/personaStore'

const { items, dropFolderIds } = defineProps<{
  items: string[]
  dropFolderIds?: (string | null | undefined)[]
}>()

const emit = defineEmits<{ navigate: [index: number] }>()

const { t } = useI18n()
const toast = useToast()
const personaStore = usePrototypePersonaStore()
const { draggingWorkflowIds } = useWorkflowDrag()

const dragOverIndex = ref<number | null>(null)

// `undefined` → not a drop target; `null` → container root; string → a folder.
function targetFor(index: number): string | null | undefined {
  return dropFolderIds?.[index]
}

// Dragged workflows that aren't already at the destination level.
function acceptableFor(target: string | null): string[] {
  return draggingWorkflowIds.value.filter((id) => {
    const wf = personaStore.fixture.workflows.find((w) => w.id === id)
    return !!wf && (wf.folderId ?? null) !== target
  })
}

function onDragOver(index: number, event: DragEvent) {
  const target = targetFor(index)
  if (target === undefined || !acceptableFor(target).length) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dragOverIndex.value = index
}

function onDragLeave(index: number, event: DragEvent) {
  const el = event.currentTarget as HTMLElement
  if (
    dragOverIndex.value === index &&
    !el.contains(event.relatedTarget as Node | null)
  ) {
    dragOverIndex.value = null
  }
}

function onDrop(index: number, event: DragEvent) {
  dragOverIndex.value = null
  const target = targetFor(index)
  if (target === undefined) return
  const ids = acceptableFor(target)
  if (!ids.length) return
  event.preventDefault()
  for (const id of ids) personaStore.moveWorkflowToFolder(id, target)
  const first = personaStore.fixture.workflows.find((w) => w.id === ids[0])
  toast.add({
    severity: 'success',
    summary: t('prototype.folders.movedSummary'),
    detail:
      ids.length === 1
        ? t('prototype.folders.movedToDetail', {
            name: first?.name ?? '',
            folder: items[index]
          })
        : t('prototype.folders.movedCountToDetail', {
            count: ids.length,
            folder: items[index]
          }),
    life: 2200
  })
}
</script>
