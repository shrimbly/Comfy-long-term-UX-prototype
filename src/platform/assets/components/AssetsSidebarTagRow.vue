<template>
  <div
    v-if="isEditing"
    class="flex w-full items-center gap-2 rounded-md bg-interface-menu-component-surface-selected py-2 pr-3 pl-5 text-sm text-base-foreground"
  >
    <i class="icon-[lucide--hash] size-3.5 shrink-0" />
    <input
      ref="editInputRef"
      :value="editingDraft"
      type="text"
      class="min-w-0 flex-1 rounded-sm border border-comfy-input bg-transparent px-1 text-sm text-base-foreground outline-none focus:border-primary"
      @input="emit('updateDraft', ($event.target as HTMLInputElement).value)"
      @keydown.enter.prevent="emit('commitRename')"
      @keydown.escape.prevent="emit('cancelRename')"
      @blur="emit('commitRename')"
      @click.stop
    />
  </div>
  <button
    v-else
    type="button"
    draggable="true"
    :class="
      cn(
        'group flex w-full cursor-pointer items-center gap-2 rounded-md border-none py-2 pr-3 pl-5 text-left text-sm text-base-foreground transition-colors',
        selected
          ? 'bg-interface-menu-component-surface-selected'
          : 'bg-transparent hover:bg-interface-menu-component-surface-hovered',
        isContextTarget && 'outline-1 outline-primary outline-dashed',
        isDragOver && 'ring-1 ring-primary'
      )
    "
    :aria-pressed="selected"
    @click="emit('tagClick', $event, tag.name, section)"
    @contextmenu.prevent="emit('contextMenu', $event, tag.name)"
    @dragstart="emit('dragStart', $event, tag.name)"
    @dragover="emit('dragOver', $event, tag.name)"
    @dragleave="emit('dragLeave', tag.name)"
    @drop.prevent="emit('drop', $event, tag.name)"
  >
    <i class="icon-[lucide--hash] size-3.5 shrink-0" />
    <span class="truncate">{{ tag.name }}</span>
    <span v-if="!selected" class="ml-auto text-xs text-muted-foreground">
      {{ tag.count }}
    </span>
    <i
      v-if="selected"
      class="ml-auto icon-[lucide--pencil] size-3 shrink-0 cursor-pointer opacity-60 transition-opacity hover:opacity-100"
      :aria-label="$t('sideToolbar.mediaAssets.renameTag')"
      role="button"
      tabindex="0"
      @click.stop="emit('startRename', tag.name)"
      @keydown.enter.stop.prevent="emit('startRename', tag.name)"
    />
  </button>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

import type { TagWithCount } from '@/platform/assets/composables/useAssetTags'
import { cn } from '@comfyorg/tailwind-utils'

const {
  tag,
  section,
  selected,
  isEditing,
  editingDraft,
  isDragOver,
  isContextTarget = false
} = defineProps<{
  tag: TagWithCount
  /** Identifies which section the row lives in — used to scope shift-click range. */
  section: string
  selected: boolean
  isEditing: boolean
  editingDraft: string
  isDragOver: boolean
  isContextTarget?: boolean
}>()

const emit = defineEmits<{
  tagClick: [event: MouseEvent, tag: string, section: string]
  startRename: [tag: string]
  updateDraft: [value: string]
  commitRename: []
  cancelRename: []
  contextMenu: [event: MouseEvent, tag: string]
  dragStart: [event: DragEvent, tag: string]
  dragOver: [event: DragEvent, tag: string]
  dragLeave: [tag: string]
  drop: [event: DragEvent, tag: string]
}>()

const editInputRef = ref<HTMLInputElement | null>(null)

watch(
  () => isEditing,
  (active) => {
    if (!active) return
    void nextTick(() => {
      editInputRef.value?.focus()
      editInputRef.value?.select()
    })
  },
  { immediate: true }
)
</script>
