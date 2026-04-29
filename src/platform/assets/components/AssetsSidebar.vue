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
        <p class="px-3 text-xs font-medium tracking-wide text-muted-foreground">
          {{ t('sideToolbar.mediaAssets.tagsHeader') }}
        </p>
        <p
          v-if="availableTags.length === 0"
          class="px-3 py-2 text-xs text-muted-foreground"
        >
          {{ t('sideToolbar.mediaAssets.noTagsHint') }}
        </p>
        <template v-for="tag in availableTags" :key="tag.name">
          <div
            v-if="editingTag === tag.name"
            class="flex w-full items-center gap-2 rounded-md bg-interface-menu-component-surface-selected px-3 py-2 text-sm text-base-foreground"
          >
            <i class="icon-[lucide--hash] size-3.5 shrink-0" />
            <input
              ref="tagEditInput"
              v-model="editingTagDraft"
              type="text"
              class="min-w-0 flex-1 rounded-sm border border-comfy-input bg-transparent px-1 text-sm text-base-foreground outline-none focus:border-primary"
              @keydown.enter.prevent="commitTagEdit"
              @keydown.escape.prevent="cancelTagEdit"
              @blur="commitTagEdit"
              @click.stop
            />
          </div>
          <button
            v-else
            type="button"
            :class="
              cn(
                'group flex w-full cursor-pointer items-center gap-2 rounded-md border-none px-3 py-2 text-left text-sm text-base-foreground transition-colors',
                selectedTag === tag.name
                  ? 'bg-interface-menu-component-surface-selected'
                  : 'bg-transparent hover:bg-interface-menu-component-surface-hovered'
              )
            "
            @click="
              emit('selectTag', selectedTag === tag.name ? null : tag.name)
            "
          >
            <i class="icon-[lucide--hash] size-3.5 shrink-0" />
            <span class="truncate">{{ tag.name }}</span>
            <span
              v-if="selectedTag !== tag.name"
              class="ml-auto text-xs text-muted-foreground"
            >
              {{ tag.count }}
            </span>
            <i
              v-if="selectedTag === tag.name"
              class="ml-auto icon-[lucide--pencil] size-3 shrink-0 cursor-pointer opacity-60 transition-opacity hover:opacity-100"
              :aria-label="$t('sideToolbar.mediaAssets.renameTag')"
              role="button"
              tabindex="0"
              @click.stop="startTagEdit(tag.name)"
              @keydown.enter.stop.prevent="startTagEdit(tag.name)"
            />
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { FAVORITE_COLORS } from '@/platform/assets/composables/useAssetFavorites'
import type { FavoriteColor } from '@/platform/assets/composables/useAssetFavorites'
import type { TagWithCount } from '@/platform/assets/composables/useAssetTags'
import { cn } from '@/utils/tailwindUtil'

import SidebarItem from './AssetsSidebarItem.vue'

const { t } = useI18n()

const {
  selectedTag,
  availableTags,
  recentsActive = false,
  favoritesActive = false,
  generatedActive = false,
  importedActive = false,
  favoriteColorFilter = null
} = defineProps<{
  selectedTag: string | null
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
  selectTag: [tag: string | null]
  renameTag: [oldName: string, newName: string]
}>()

const customColorNames = useStorage<Partial<Record<FavoriteColor, string>>>(
  'Comfy.Assets.FavoriteColorNames',
  {}
)

const editingColor = ref<FavoriteColor | null>(null)
const editingDraft = ref('')
const colorEditInput = ref<HTMLInputElement[] | HTMLInputElement | null>(null)

const editingTag = ref<string | null>(null)
const editingTagDraft = ref('')
const tagEditInput = ref<HTMLInputElement[] | HTMLInputElement | null>(null)

function startTagEdit(name: string) {
  editingTag.value = name
  editingTagDraft.value = name
  void nextTick(() => {
    const el = Array.isArray(tagEditInput.value)
      ? tagEditInput.value[0]
      : tagEditInput.value
    el?.focus()
    el?.select()
  })
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
