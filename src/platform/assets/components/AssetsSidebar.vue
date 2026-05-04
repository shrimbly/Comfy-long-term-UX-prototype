<template>
  <div class="flex size-full flex-col overflow-hidden bg-(--comfy-menu-bg)">
    <div class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3">
      <SidebarItem
        :active="recentsActive"
        icon="icon-[lucide--clock]"
        :label="t('sideToolbar.mediaAssets.foldersSidebar.recent')"
        @click="emit('selectRecents')"
      />

      <SidebarItem
        :active="favoritesActive && favoriteColorFilter === null"
        icon="icon-[lucide--star]"
        :label="t('sideToolbar.mediaAssets.foldersSidebar.favorites')"
        @click="emit('selectFavorites')"
      />

      <div v-if="favoritesActive" class="flex flex-col">
        <template v-for="color in FAVORITE_COLORS" :key="color">
          <div
            v-if="editingColor === color"
            class="flex w-full items-center gap-2 rounded-md bg-interface-menu-component-surface-selected py-1.5 pr-3 pl-7 text-sm text-base-foreground"
          >
            <i
              :class="
                cn(
                  'icon-[ph--circle-fill] size-3 shrink-0',
                  favoriteSwatchColorClass(color)
                )
              "
            />
            <input
              ref="colorEditInput"
              v-model="editingDraft"
              type="text"
              class="min-w-0 flex-1 rounded-sm border border-comfy-input bg-transparent px-1 text-sm text-base-foreground outline-none focus:border-primary"
              @keydown.enter.prevent="commitColorEdit"
              @keydown.escape.prevent="cancelColorEdit"
              @blur="commitColorEdit"
              @click.stop
            />
          </div>
          <button
            v-else
            type="button"
            :class="
              cn(
                'group flex w-full cursor-pointer items-center gap-2 rounded-md border-none py-1.5 pr-3 pl-7 text-left text-sm text-base-foreground transition-colors',
                favoriteColorFilter === color
                  ? 'bg-interface-menu-component-surface-selected'
                  : 'bg-transparent hover:bg-interface-menu-component-surface-hovered'
              )
            "
            :aria-pressed="favoriteColorFilter === color"
            @click="
              emit(
                'selectFavoriteColor',
                favoriteColorFilter === color ? null : color
              )
            "
          >
            <i
              :class="
                cn(
                  'icon-[ph--circle-fill] size-3 shrink-0',
                  favoriteSwatchColorClass(color)
                )
              "
            />
            <span class="truncate">
              {{ favoriteColorLabel(color) }}
            </span>
            <i
              class="ml-auto icon-[lucide--pencil] size-3 shrink-0 cursor-pointer opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100"
              :aria-label="
                $t('sideToolbar.mediaAssets.foldersSidebar.renameFavoriteColor')
              "
              role="button"
              tabindex="0"
              @click.stop="startColorEdit(color)"
              @keydown.enter.stop.prevent="startColorEdit(color)"
            />
          </button>
        </template>
      </div>

      <SidebarItem
        :active="generatedActive"
        icon="icon-[comfy--image-ai-edit]"
        :label="t('sideToolbar.mediaAssets.foldersSidebar.generatedHeader')"
        @click="emit('selectGenerated')"
      />

      <SidebarItem
        :active="importedActive"
        icon="icon-[lucide--upload]"
        :label="t('sideToolbar.mediaAssets.foldersSidebar.importedHeader')"
        @click="emit('selectImported')"
      />

      <div class="mt-4 flex flex-col gap-1">
        <div class="relative flex h-7 items-center px-3">
          <p
            v-show="!searchExpanded"
            class="flex-1 truncate text-xs font-medium tracking-wide text-muted-foreground"
          >
            {{ t('sideToolbar.mediaAssets.tagsHeader') }}
          </p>
          <input
            v-show="searchExpanded"
            ref="searchInputRef"
            v-model="tagSearch"
            type="text"
            :placeholder="t('sideToolbar.mediaAssets.tagSearchPlaceholder')"
            :aria-label="t('sideToolbar.mediaAssets.tagSearchAriaLabel')"
            class="min-w-0 flex-1 rounded-sm border border-comfy-input bg-transparent px-1 text-sm text-base-foreground outline-none focus:border-primary"
            @keydown.escape.prevent="collapseSearch"
            @blur="onSearchBlur"
          />
          <button
            type="button"
            class="ml-1 flex size-6 cursor-pointer items-center justify-center rounded-sm border-none bg-transparent text-muted-foreground hover:bg-interface-menu-component-surface-hovered hover:text-base-foreground"
            :aria-label="t('sideToolbar.mediaAssets.tagSearchAriaLabel')"
            @click="toggleSearch"
          >
            <i
              :class="
                searchExpanded
                  ? 'icon-[lucide--x] size-4'
                  : 'icon-[lucide--search] size-4'
              "
            />
          </button>
        </div>
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
            :placeholder="t('sideToolbar.mediaAssets.tagGroup.namePlaceholder')"
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
              groupNaming.kind === 'naming' && groupNaming.target === group.name
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

import { FAVORITE_COLORS } from '@/platform/assets/composables/useAssetFavorites'
import type { FavoriteColor } from '@/platform/assets/composables/useAssetFavorites'
import { useAssetTagGroups } from '@/platform/assets/composables/useAssetTagGroups'
import { useAssetTagSelectionStore } from '@/platform/assets/composables/useAssetTagSelectionStore'
import type { TagWithCount } from '@/platform/assets/composables/useAssetTags'
import { cn } from '@/utils/tailwindUtil'

import AssetsSidebarGroupContextMenu from './AssetsSidebarGroupContextMenu.vue'
import AssetsSidebarTagContextMenu from './AssetsSidebarTagContextMenu.vue'
import AssetsSidebarTagRow from './AssetsSidebarTagRow.vue'
import SidebarItem from './AssetsSidebarItem.vue'

const TAG_DRAG_MIME = 'application/x-comfy-tag-names'

const { t } = useI18n()

const {
  availableTags,
  recentsActive = false,
  favoritesActive = false,
  generatedActive = false,
  importedActive = false,
  favoriteColorFilter = null
} = defineProps<{
  availableTags: readonly TagWithCount[]
  recentsActive?: boolean
  favoritesActive?: boolean
  generatedActive?: boolean
  importedActive?: boolean
  favoriteColorFilter?: FavoriteColor | null
}>()

const emit = defineEmits<{
  selectRecents: []
  selectFavorites: []
  selectFavoriteColor: [color: FavoriteColor | null]
  selectGenerated: []
  selectImported: []
  selectionChanged: []
  renameTag: [oldName: string, newName: string]
  deleteTags: [tags: string[]]
}>()

const tagSelection = useAssetTagSelectionStore()
const groups = useAssetTagGroups()

const customColorNames = useStorage<Partial<Record<FavoriteColor, string>>>(
  'Comfy.Assets.FavoriteColorNames',
  {}
)
const groupCollapsed = useStorage<Record<string, boolean>>(
  'Comfy.Assets.TagGroupCollapsed.v1',
  {}
)

const editingColor = ref<FavoriteColor | null>(null)
const editingDraft = ref('')
const colorEditInput = ref<HTMLInputElement[] | HTMLInputElement | null>(null)

const editingTag = ref<string | null>(null)
const editingTagDraft = ref('')

const tagSearch = ref('')
const searchExpanded = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

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

const filteredTags = computed<TagWithCount[]>(() => {
  const query = tagSearch.value.trim().toLowerCase()
  if (!query) return [...availableTags]
  return availableTags.filter((tag) => tag.name.toLowerCase().includes(query))
})

const visibleGroups = computed(() => {
  const visibleNames = new Set(filteredTags.value.map((t) => t.name))
  return groups.allGroups.value
    .map((g) => ({
      name: g.name,
      tags: g.tags.filter((t) => visibleNames.has(t))
    }))
    .filter((g) => g.tags.length > 0 || !tagSearch.value.trim())
})

// "All" section beneath the groups — every visible tag, including those that
// also appear under a group header.
const visibleAllTags = computed<TagWithCount[]>(() => [...filteredTags.value])

const lastClickedTag = ref<string | null>(null)
const lastClickedSection = ref<string | null>(null)

// Tag names in render order for the section identified by `id`. Used as the
// range space for shift-click selection — scoped per-section so a shift-click
// inside a group only selects within that group, not the global flat list.
function namesForSection(id: string): string[] {
  if (id === 'all') return filteredTags.value.map((t) => t.name)
  if (id.startsWith('group:')) {
    const groupName = id.slice('group:'.length)
    return tagsInGroup(groupName).map((t) => t.name)
  }
  return []
}

function tagsInGroup(name: string): TagWithCount[] {
  const visibleNames = new Map(filteredTags.value.map((t) => [t.name, t]))
  const tagNames = groups.getTagsInGroup(name)
  const result: TagWithCount[] = []
  for (const tagName of tagNames) {
    const t = visibleNames.get(tagName)
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

function toggleSearch() {
  if (searchExpanded.value) {
    if (!tagSearch.value) {
      collapseSearch()
      return
    }
    tagSearch.value = ''
    searchInputRef.value?.focus()
    return
  }
  searchExpanded.value = true
  void nextTick(() => searchInputRef.value?.focus())
}

function collapseSearch() {
  searchExpanded.value = false
  tagSearch.value = ''
}

function onSearchBlur() {
  if (!tagSearch.value) collapseSearch()
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

function favoriteColorLabel(color: FavoriteColor): string {
  const custom = customColorNames.value[color]?.trim()
  if (custom) return custom
  return t(`sideToolbar.mediaAssets.foldersSidebar.favoriteColors.${color}`)
}

function startColorEdit(color: FavoriteColor) {
  editingColor.value = color
  editingDraft.value = favoriteColorLabel(color)
  void nextTick(() => {
    const el = Array.isArray(colorEditInput.value)
      ? colorEditInput.value[0]
      : colorEditInput.value
    el?.focus()
    el?.select()
  })
}

function commitColorEdit() {
  if (!editingColor.value) return
  const color = editingColor.value
  const next = editingDraft.value.trim()
  const defaultLabel = t(
    `sideToolbar.mediaAssets.foldersSidebar.favoriteColors.${color}`
  )
  const updated = { ...customColorNames.value }
  if (!next || next === defaultLabel) {
    delete updated[color]
  } else {
    updated[color] = next
  }
  customColorNames.value = updated
  editingColor.value = null
  editingDraft.value = ''
}

function cancelColorEdit() {
  editingColor.value = null
  editingDraft.value = ''
}

function favoriteSwatchColorClass(color: FavoriteColor): string {
  switch (color) {
    case 'yellow':
      return 'text-citrine-400'
    case 'blue':
      return 'text-azure-400'
    case 'green':
      return 'text-jade-600'
  }
}
</script>
