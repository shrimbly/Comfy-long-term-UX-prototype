<template>
  <div
    class="flex size-full flex-col overflow-hidden bg-modal-panel-background"
  >
    <div
      :class="
        cn(
          'flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto',
          compact ? 'px-2' : 'px-3'
        )
      "
    >
      <SidebarItem
        :active="generatedActive"
        icon="icon-[comfy--image-ai-edit]"
        :label="t('sideToolbar.mediaAssets.foldersSidebar.generatedHeader')"
        :compact="compact"
        @click="emit('selectGenerated')"
      />

      <SidebarItem
        :active="importedActive"
        icon="icon-[lucide--upload]"
        :label="t('sideToolbar.mediaAssets.foldersSidebar.importedHeader')"
        :compact="compact"
        @click="emit('selectImported')"
      />

      <SidebarItem
        :active="tempActive"
        icon="icon-[lucide--clock]"
        :label="t('sideToolbar.labels.temp')"
        :compact="compact"
        @click="emit('selectTemp')"
      />

      <SidebarItem
        :active="favoritesActive"
        icon="icon-[lucide--star]"
        :label="t('sideToolbar.mediaAssets.foldersSidebar.favorites')"
        :compact="compact"
        @click="emit('selectFavorites')"
      />

      <div v-if="!compact" class="mt-5 flex flex-col gap-1">
        <button
          type="button"
          class="flex w-full cursor-pointer items-center-safe gap-3 rounded-md border-none bg-transparent px-4 py-2 text-left text-sm text-base-foreground transition-colors select-none hover:bg-interface-menu-component-surface-hovered"
          :aria-expanded="!tagsCollapsed"
          :aria-label="t('sideToolbar.mediaAssets.tagsHeader')"
          @click="toggleTagsCollapsed"
        >
          <i class="text-neutral icon-[lucide--tags] shrink-0 text-sm" />
          <span class="min-w-0 flex-1 truncate">
            {{ t('sideToolbar.mediaAssets.tagsHeader') }}
          </span>
          <i
            :class="
              cn(
                'text-neutral shrink-0 text-sm transition-transform',
                tagsCollapsed
                  ? 'icon-[lucide--chevron-right]'
                  : 'icon-[lucide--chevron-down]'
              )
            "
          />
        </button>
        <div
          v-if="!tagsCollapsed"
          class="flex max-h-90 flex-col gap-1 overflow-y-auto"
        >
          <p
            v-if="availableTags.length === 0"
            class="px-3 py-2 text-xs text-muted-foreground"
          >
            {{ t('sideToolbar.mediaAssets.noTagsHint') }}
          </p>
          <div
            v-if="groupNaming.kind === 'naming' && groupNaming.target === null"
            class="flex w-full items-center gap-2 rounded-md bg-interface-menu-component-surface-selected px-3 py-2 text-sm text-base-foreground"
          >
            <i class="icon-[lucide--folder-plus] size-3.5 shrink-0" />
            <input
              ref="groupNameInputRef"
              v-model="groupNameDraft"
              type="text"
              :placeholder="
                t('sideToolbar.mediaAssets.tagGroup.namePlaceholder')
              "
              class="min-w-0 flex-1 rounded-sm border border-comfy-input bg-transparent px-1 text-sm text-base-foreground outline-none focus:border-primary"
              @keydown.enter.prevent="commitGroupNaming"
              @keydown.escape.prevent="cancelGroupNaming"
              @blur="commitGroupNaming"
              @click.stop
            />
          </div>
          <div
            v-for="group in visibleGroups"
            :key="`group:${group.name}`"
            class="mt-2 flex flex-col gap-1 first:mt-0"
          >
            <div
              v-if="editingGroup === group.name"
              class="flex w-full items-center gap-2 rounded-md bg-interface-menu-component-surface-selected px-3 py-1.5 text-xs font-medium tracking-wide text-base-foreground"
            >
              <i class="icon-[lucide--folder] size-3 shrink-0" />
              <input
                ref="groupRenameInputRef"
                v-model="editingGroupDraft"
                type="text"
                class="min-w-0 flex-1 rounded-sm border border-comfy-input bg-transparent px-1 text-xs text-base-foreground outline-none focus:border-primary"
                @keydown.enter.prevent="commitGroupRename"
                @keydown.escape.prevent="cancelGroupRename"
                @blur="commitGroupRename"
                @click.stop
              />
            </div>
            <button
              v-else
              type="button"
              :class="
                cn(
                  'flex w-full cursor-pointer items-center gap-1 rounded-md border-none px-3 py-1.5 text-left text-xs font-medium tracking-wide text-muted-foreground transition-colors',
                  isGroupHeaderDragOver(group.name)
                    ? 'ring-1 ring-primary'
                    : 'bg-transparent hover:bg-interface-menu-component-surface-hovered'
                )
              "
              :aria-label="
                t('sideToolbar.mediaAssets.tagGroup.collapseAriaLabel', {
                  name: group.name
                })
              "
              @click="toggleGroupCollapsed(group.name)"
              @contextmenu.prevent="onGroupContextMenu($event, group.name)"
              @dragover="onGroupHeaderDragOver($event, group.name)"
              @dragleave="onGroupHeaderDragLeave(group.name)"
              @drop.prevent="onGroupHeaderDrop($event, group.name)"
            >
              <i
                :class="
                  cn(
                    'size-3 shrink-0 transition-transform',
                    isGroupCollapsed(group.name)
                      ? 'icon-[lucide--chevron-right]'
                      : 'icon-[lucide--chevron-down]'
                  )
                "
              />
              <span class="truncate">{{ group.name }}</span>
              <span class="ml-auto text-xs text-muted-foreground">
                {{ group.tags.length }}
              </span>
            </button>
            <div
              v-if="
                groupNaming.kind === 'naming' &&
                groupNaming.target === group.name
              "
              class="ml-2 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-md bg-interface-menu-component-surface-selected px-3 py-2 text-sm text-base-foreground"
            >
              <i class="icon-[lucide--folder-plus] size-3.5 shrink-0" />
              <input
                ref="groupNameInputRef"
                v-model="groupNameDraft"
                type="text"
                :placeholder="
                  t('sideToolbar.mediaAssets.tagGroup.namePlaceholder')
                "
                class="min-w-0 flex-1 rounded-sm border border-comfy-input bg-transparent px-1 text-sm text-base-foreground outline-none focus:border-primary"
                @keydown.enter.prevent="commitGroupNaming"
                @keydown.escape.prevent="cancelGroupNaming"
                @blur="commitGroupNaming"
                @click.stop
              />
            </div>
            <template v-if="!isGroupCollapsed(group.name)">
              <AssetsSidebarTagRow
                v-for="tag in tagsInGroup(group.name)"
                :key="`grouped:${group.name}:${tag.name}`"
                :tag="tag"
                :section="`group:${group.name}`"
                :selected="tagSelection.isSelected(tag.name)"
                :is-editing="editingTag === tag.name"
                :editing-draft="editingTagDraft"
                :is-drag-over="dragOverTagId === tag.name"
                :is-context-target="contextTagTarget === tag.name"
                @tag-click="onTagSelect"
                @start-rename="startTagEdit"
                @update-draft="(value: string) => (editingTagDraft = value)"
                @commit-rename="commitTagEdit"
                @cancel-rename="cancelTagEdit"
                @context-menu="onTagContextMenu"
                @drag-start="onTagDragStart"
                @drag-over="onTagDragOver"
                @drag-leave="onTagDragLeave"
                @drop="onTagDrop"
              />
            </template>
          </div>
          <button
            v-if="visibleGroups.length > 0"
            type="button"
            :class="
              cn(
                'mt-2 flex w-full cursor-pointer items-center gap-1 rounded-md border-none px-3 py-1.5 text-left text-xs font-medium tracking-wide text-muted-foreground transition-colors',
                isAllHeaderDragOver
                  ? 'ring-1 ring-primary'
                  : 'bg-transparent hover:bg-interface-menu-component-surface-hovered'
              )
            "
            @dragover="onAllHeaderDragOver"
            @dragleave="isAllHeaderDragOver = false"
            @drop.prevent="onAllHeaderDrop"
          >
            <span class="truncate">{{
              t('sideToolbar.mediaAssets.tagGroup.allHeader')
            }}</span>
            <span class="ml-auto text-xs text-muted-foreground">
              {{ visibleAllTags.length }}
            </span>
          </button>
          <AssetsSidebarTagRow
            v-for="tag in visibleAllTags"
            :key="`all:${tag.name}`"
            :tag="tag"
            section="all"
            :selected="tagSelection.isSelected(tag.name)"
            :is-editing="editingTag === tag.name"
            :editing-draft="editingTagDraft"
            :is-drag-over="dragOverTagId === tag.name"
            :is-context-target="contextTagTarget === tag.name"
            @tag-click="onTagSelect"
            @start-rename="startTagEdit"
            @update-draft="(value: string) => (editingTagDraft = value)"
            @commit-rename="commitTagEdit"
            @cancel-rename="cancelTagEdit"
            @context-menu="onTagContextMenu"
            @drag-start="onTagDragStart"
            @drag-over="onTagDragOver"
            @drag-leave="onTagDragLeave"
            @drop="onTagDrop"
          />
        </div>
      </div>

      <div
        v-if="!compact && availableDirectories.length > 0"
        class="mt-3 flex flex-col gap-1"
      >
        <button
          type="button"
          class="flex w-full cursor-pointer items-center-safe gap-3 rounded-md border-none bg-transparent px-4 py-2 text-left text-sm text-base-foreground transition-colors select-none hover:bg-interface-menu-component-surface-hovered"
          :aria-expanded="!directoryCollapsed"
          :aria-label="t('sideToolbar.mediaAssets.directoryHeader')"
          @click="toggleDirectoryCollapsed"
        >
          <i class="text-neutral icon-[lucide--folder] shrink-0 text-sm" />
          <span class="min-w-0 flex-1 truncate">
            {{ t('sideToolbar.mediaAssets.directoryHeader') }}
          </span>
          <i
            :class="
              cn(
                'text-neutral shrink-0 text-sm transition-transform',
                directoryCollapsed
                  ? 'icon-[lucide--chevron-right]'
                  : 'icon-[lucide--chevron-down]'
              )
            "
          />
        </button>
        <div
          v-if="!directoryCollapsed"
          class="flex max-h-90 flex-col gap-1 overflow-y-auto"
        >
          <button
            v-for="dir in availableDirectories"
            :key="dir.path"
            type="button"
            :class="
              cn(
                'flex w-full cursor-pointer items-center gap-3 rounded-md border-none py-1.5 pr-3 pl-7 text-left text-sm text-base-foreground transition-colors select-none',
                selectedDirectory === dir.path
                  ? 'bg-interface-menu-component-surface-selected'
                  : 'bg-transparent hover:bg-interface-menu-component-surface-hovered'
              )
            "
            @click="onDirectoryClick(dir.path)"
          >
            <i class="text-neutral icon-[lucide--folder] shrink-0 text-sm" />
            <span class="min-w-0 flex-1 truncate">{{ dir.name }}</span>
            <span class="shrink-0 text-xs text-muted-foreground">
              {{ dir.itemCount }}
            </span>
          </button>
        </div>
      </div>
    </div>
    <AssetsSidebarTagContextMenu
      ref="contextMenuRef"
      @rename="startTagEdit"
      @group="onContextGroup"
      @delete="onContextDelete"
      @hide="contextTagTarget = null"
    />
    <AssetsSidebarGroupContextMenu
      ref="groupContextMenuRef"
      @rename="startGroupRename"
      @delete-group="onContextDeleteGroup"
      @delete-all-tags="onContextDeleteAllTags"
    />
  </div>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAssetTagGroups } from '@/platform/assets/composables/useAssetTagGroups'
import { useAssetTagSelectionStore } from '@/platform/assets/composables/useAssetTagSelectionStore'
import type { TagWithCount } from '@/platform/assets/composables/useAssetTags'
import { cn } from '@comfyorg/tailwind-utils'

import AssetsSidebarGroupContextMenu from './AssetsSidebarGroupContextMenu.vue'
import AssetsSidebarTagContextMenu from './AssetsSidebarTagContextMenu.vue'
import AssetsSidebarTagRow from './AssetsSidebarTagRow.vue'
import SidebarItem from './AssetsSidebarItem.vue'

const TAG_DRAG_MIME = 'application/x-comfy-tag-names'

const { t } = useI18n()

const {
  availableTags,
  tempActive = false,
  favoritesActive = false,
  generatedActive = false,
  importedActive = false,
  compact = false,
  availableDirectories = [],
  selectedDirectory = null
} = defineProps<{
  availableTags: readonly TagWithCount[]
  tempActive?: boolean
  favoritesActive?: boolean
  generatedActive?: boolean
  importedActive?: boolean
  compact?: boolean
  availableDirectories?: readonly DirectoryItem[]
  selectedDirectory?: string | null
}>()

interface DirectoryItem {
  name: string
  path: string
  itemCount?: number
}

const emit = defineEmits<{
  selectTemp: []
  selectFavorites: []
  selectGenerated: []
  selectImported: []
  selectDirectory: [path: string | null]
  selectionChanged: []
  renameTag: [oldName: string, newName: string]
  deleteTags: [tags: string[]]
}>()

const directoryCollapsed = useStorage<boolean>(
  'Comfy.Assets.DirectorySectionCollapsed.v1',
  true
)

function toggleDirectoryCollapsed() {
  directoryCollapsed.value = !directoryCollapsed.value
}

function onDirectoryClick(path: string) {
  emit('selectDirectory', selectedDirectory === path ? null : path)
}

const tagSelection = useAssetTagSelectionStore()
const groups = useAssetTagGroups()

const groupCollapsed = useStorage<Record<string, boolean>>(
  'Comfy.Assets.TagGroupCollapsed.v1',
  {}
)

const tagsCollapsed = useStorage<boolean>(
  'Comfy.Assets.TagsSectionCollapsed.v1',
  true
)

function toggleTagsCollapsed() {
  tagsCollapsed.value = !tagsCollapsed.value
}

const editingTag = ref<string | null>(null)
const editingTagDraft = ref('')

type GroupNamingState =
  | { kind: 'idle' }
  | { kind: 'naming'; pendingTags: string[]; target: string | null }
const groupNaming = ref<GroupNamingState>({ kind: 'idle' })
const groupNameDraft = ref('')
const groupNameInputRef = ref<HTMLInputElement | HTMLInputElement[] | null>(
  null
)

const dragOverTagId = ref<string | null>(null)
const dragOverGroupHeader = ref<string | null>(null)
const isAllHeaderDragOver = ref(false)
const draggingTags = ref<string[]>([])

const contextTagTarget = ref<string | null>(null)
const contextMenuRef = ref<InstanceType<
  typeof AssetsSidebarTagContextMenu
> | null>(null)

const groupContextMenuRef = ref<InstanceType<
  typeof AssetsSidebarGroupContextMenu
> | null>(null)
const editingGroup = ref<string | null>(null)
const editingGroupDraft = ref('')
const groupRenameInputRef = ref<HTMLInputElement | HTMLInputElement[] | null>(
  null
)

const visibleGroups = computed(() =>
  groups.allGroups.value.map((g) => ({ name: g.name, tags: [...g.tags] }))
)

const visibleAllTags = computed<TagWithCount[]>(() => [...availableTags])

const lastClickedTag = ref<string | null>(null)
const lastClickedSection = ref<string | null>(null)

// Tag names in render order for the section identified by `id`. Used as the
// range space for shift-click selection — scoped per-section so a shift-click
// inside a group only selects within that group, not the global flat list.
function namesForSection(id: string): string[] {
  if (id === 'all') return availableTags.map((t) => t.name)
  if (id.startsWith('group:')) {
    const groupName = id.slice('group:'.length)
    return tagsInGroup(groupName).map((t) => t.name)
  }
  return []
}

function tagsInGroup(name: string): TagWithCount[] {
  const tagsByName = new Map(availableTags.map((t) => [t.name, t]))
  const tagNames = groups.getTagsInGroup(name)
  const result: TagWithCount[] = []
  for (const tagName of tagNames) {
    const t = tagsByName.get(tagName)
    if (t) result.push(t)
  }
  return result
}

function isGroupCollapsed(name: string): boolean {
  return groupCollapsed.value[name] === true
}

function toggleGroupCollapsed(name: string) {
  groupCollapsed.value = {
    ...groupCollapsed.value,
    [name]: !isGroupCollapsed(name)
  }
}

function isGroupHeaderDragOver(name: string): boolean {
  return dragOverGroupHeader.value === name
}

function onTagSelect(event: MouseEvent, tag: string, section: string) {
  // Shift-click: range within the same section as the anchor click. If the
  // anchor was in a different section (or absent), fall through to plain
  // replace — crossing sections is ambiguous.
  if (
    event.shiftKey &&
    lastClickedTag.value !== null &&
    lastClickedSection.value === section
  ) {
    const flat = namesForSection(section)
    const anchorIndex = flat.indexOf(lastClickedTag.value)
    const targetIndex = flat.indexOf(tag)
    if (anchorIndex !== -1 && targetIndex !== -1) {
      const [start, end] =
        anchorIndex <= targetIndex
          ? [anchorIndex, targetIndex]
          : [targetIndex, anchorIndex]
      tagSelection.setMany(flat.slice(start, end + 1))
      lastClickedTag.value = tag
      lastClickedSection.value = section
      emit('selectionChanged')
      return
    }
  }
  if (event.metaKey || event.ctrlKey) {
    tagSelection.toggle(tag)
  } else if (
    tagSelection.asArray.length === 1 &&
    tagSelection.isSelected(tag)
  ) {
    tagSelection.clear()
  } else {
    tagSelection.setMany([tag])
  }
  lastClickedTag.value = tag
  lastClickedSection.value = section
  emit('selectionChanged')
}

function startTagEdit(name: string) {
  cancelGroupNaming()
  editingTag.value = name
  editingTagDraft.value = name
}

function commitTagEdit() {
  if (!editingTag.value) return
  const from = editingTag.value
  const to = editingTagDraft.value.trim()
  editingTag.value = null
  editingTagDraft.value = ''
  if (!to || to === from) return
  emit('renameTag', from, to)
}

function cancelTagEdit() {
  editingTag.value = null
  editingTagDraft.value = ''
}

function onTagContextMenu(event: MouseEvent, tag: string) {
  const targets = tagSelection.isSelected(tag) ? tagSelection.asArray : [tag]
  contextTagTarget.value = !tagSelection.isSelected(tag) ? tag : null
  contextMenuRef.value?.show(event, targets)
}

function onContextGroup(tags: string[]) {
  if (tags.length === 0) return
  const sharedGroup = sharedGroupOf(tags)
  startGroupNaming(tags, sharedGroup)
}

function onContextDelete(tags: string[]) {
  if (tags.length === 0) return
  emit('deleteTags', tags)
}

function onGroupContextMenu(event: MouseEvent, group: string) {
  groupContextMenuRef.value?.show(event, group)
}

function startGroupRename(group: string) {
  cancelGroupNaming()
  editingGroup.value = group
  editingGroupDraft.value = group
  void nextTick(() => {
    const el = Array.isArray(groupRenameInputRef.value)
      ? groupRenameInputRef.value[0]
      : groupRenameInputRef.value
    el?.focus()
    el?.select()
  })
}

function commitGroupRename() {
  if (!editingGroup.value) return
  const from = editingGroup.value
  const to = editingGroupDraft.value.trim()
  editingGroup.value = null
  editingGroupDraft.value = ''
  if (!to || to === from) return
  groups.renameGroup(from, to)
}

function cancelGroupRename() {
  editingGroup.value = null
  editingGroupDraft.value = ''
}

function onContextDeleteGroup(group: string) {
  groups.removeTagsFromGroups(groups.getTagsInGroup(group))
}

function onContextDeleteAllTags(group: string) {
  const tags = groups.getTagsInGroup(group)
  if (tags.length === 0) return
  emit('deleteTags', tags)
}

function sharedGroupOf(tags: readonly string[]): string | null {
  if (tags.length === 0) return null
  const first = groups.getGroupOf(tags[0])
  if (!first) return null
  for (let i = 1; i < tags.length; i++) {
    if (groups.getGroupOf(tags[i]) !== first) return null
  }
  return first
}

function startGroupNaming(tags: string[], prefill: string | null) {
  groupNaming.value = {
    kind: 'naming',
    pendingTags: tags.slice(),
    target: null
  }
  groupNameDraft.value = prefill ?? ''
  void nextTick(() => {
    const el = Array.isArray(groupNameInputRef.value)
      ? groupNameInputRef.value[0]
      : groupNameInputRef.value
    el?.focus()
    el?.select()
  })
}

function commitGroupNaming() {
  if (groupNaming.value.kind !== 'naming') return
  const { pendingTags } = groupNaming.value
  const name = groupNameDraft.value.trim()
  groupNaming.value = { kind: 'idle' }
  groupNameDraft.value = ''
  if (!name || pendingTags.length === 0) return
  groups.assignTagsToGroup(pendingTags, name)
}

function cancelGroupNaming() {
  groupNaming.value = { kind: 'idle' }
  groupNameDraft.value = ''
}

function dragPayloadHasTags(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes(TAG_DRAG_MIME)
}

function onTagDragStart(event: DragEvent, tag: string) {
  const tags = tagSelection.isSelected(tag) ? tagSelection.asArray : [tag]
  draggingTags.value = tags
  event.dataTransfer?.setData(TAG_DRAG_MIME, JSON.stringify(tags))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onTagDragOver(event: DragEvent, tag: string) {
  if (!dragPayloadHasTags(event)) return
  if (draggingTags.value.includes(tag) && draggingTags.value.length === 1)
    return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dragOverTagId.value = tag
}

function onTagDragLeave(tag: string) {
  if (dragOverTagId.value === tag) dragOverTagId.value = null
}

function onTagDrop(event: DragEvent, targetTag: string) {
  dragOverTagId.value = null
  const dragged = readDragTags(event)
  draggingTags.value = []
  if (dragged.length === 0) return
  if (dragged.length === 1 && dragged[0] === targetTag) return
  const targetGroup = groups.getGroupOf(targetTag)
  const tagsToMove = dragged.filter((t) => t !== targetTag)
  if (tagsToMove.length === 0) return
  if (targetGroup) {
    groups.assignTagsToGroup(tagsToMove, targetGroup)
    return
  }
  startGroupNaming([...new Set([...tagsToMove, targetTag])], null)
}

function onGroupHeaderDragOver(event: DragEvent, name: string) {
  if (!dragPayloadHasTags(event)) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dragOverGroupHeader.value = name
}

function onGroupHeaderDragLeave(name: string) {
  if (dragOverGroupHeader.value === name) dragOverGroupHeader.value = null
}

function onGroupHeaderDrop(event: DragEvent, name: string) {
  dragOverGroupHeader.value = null
  const dragged = readDragTags(event)
  draggingTags.value = []
  if (dragged.length === 0) return
  groups.assignTagsToGroup(dragged, name)
}

function onAllHeaderDragOver(event: DragEvent) {
  if (!dragPayloadHasTags(event)) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  isAllHeaderDragOver.value = true
}

function onAllHeaderDrop(event: DragEvent) {
  isAllHeaderDragOver.value = false
  const dragged = readDragTags(event)
  draggingTags.value = []
  if (dragged.length === 0) return
  groups.removeTagsFromGroups(dragged)
}

function readDragTags(event: DragEvent): string[] {
  const raw = event.dataTransfer?.getData(TAG_DRAG_MIME) ?? ''
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (
      Array.isArray(parsed) &&
      parsed.every((t): t is string => typeof t === 'string')
    ) {
      return parsed
    }
  } catch {
    // ignore
  }
  return []
}
</script>
