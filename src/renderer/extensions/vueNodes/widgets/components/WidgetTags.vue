<template>
  <div class="col-span-2 grid grid-cols-subgrid gap-y-1">
    <WidgetLayoutField :widget="layoutWidget" root-class="col-span-2">
      <div ref="anchorRef" class="relative w-full">
        <div
          :class="
            cn(
              WidgetInputBaseClass,
              'flex w-full items-center gap-2 px-4',
              size === 'large' ? 'py-3 text-sm' : 'py-2 text-xs',
              isReadOnly && 'cursor-not-allowed opacity-50'
            )
          "
        >
          <i
            class="pointer-events-none icon-[lucide--search] size-3.5 shrink-0 text-muted-foreground"
          />
          <input
            ref="inputEl"
            v-model="typedQuery"
            type="text"
            :placeholder="t('mediaAsset.tags.addPlaceholder')"
            :aria-label="widget.name"
            :readonly="isReadOnly"
            class="min-w-0 flex-1 border-none bg-transparent p-0 outline-none placeholder:text-muted-foreground"
            @focus="onFocus"
            @blur="onBlur"
            @keydown.enter.prevent="onEnter"
            @keydown.escape.prevent="closeDropdown"
            @keydown.down.prevent="onArrow(1)"
            @keydown.up.prevent="onArrow(-1)"
            @keydown.backspace="onBackspace"
            @pointerdown.stop
          />
        </div>
      </div>
    </WidgetLayoutField>

    <div v-if="tags.length > 0" class="col-start-2 flex flex-wrap gap-1 px-1">
      <span
        v-for="tag in tags"
        :key="tag"
        class="flex h-6 items-center gap-1 rounded-sm bg-modal-card-tag-background py-1 pr-1 pl-2 text-xs text-modal-card-tag-foreground"
      >
        <span class="truncate">{{ tag }}</span>
        <button
          type="button"
          class="flex size-4 cursor-pointer items-center justify-center rounded-sm border-none bg-transparent p-0 text-modal-card-tag-foreground opacity-70 transition-opacity hover:opacity-100"
          :aria-label="t('mediaAsset.tags.removeTag', { name: tag })"
          :disabled="isReadOnly"
          @click="removeTag(tag)"
          @pointerdown.stop
        >
          <i class="icon-[lucide--x] size-3" />
        </button>
      </span>
    </div>

    <Teleport to="body">
      <div
        v-if="dropdownVisible && dropdownStyle"
        class="fixed overflow-y-auto rounded-lg border border-border-default bg-base-background p-1 shadow-lg"
        :style="dropdownStyle"
        data-capture-wheel="true"
        @pointerdown.stop.prevent
      >
        <button
          v-for="(item, idx) in dropdownItems"
          :key="item.kind === 'create' ? '__create__' : item.name"
          type="button"
          :data-highlighted="highlightedIndex === idx ? '' : null"
          :class="
            cn(
              'flex w-full cursor-pointer items-center gap-2 rounded-sm border-none bg-transparent px-2 py-1.5 text-left text-sm transition-colors',
              highlightedIndex === idx
                ? 'bg-secondary-background-hover text-text-primary'
                : 'hover:bg-secondary-background-hover'
            )
          "
          @pointerdown.prevent.stop="selectItem(item)"
          @pointerenter="highlightedIndex = idx"
        >
          <template v-if="item.kind === 'create'">
            <i
              class="icon-[lucide--plus] size-3.5 shrink-0 text-muted-foreground"
            />
            <span class="truncate text-xs">
              {{ t('mediaAsset.tags.createTag', { name: item.name }) }}
            </span>
          </template>
          <template v-else>
            <span
              class="inline-flex shrink-0 items-center rounded-sm bg-modal-card-tag-background px-1.5 py-px font-mono text-2xs text-modal-card-tag-foreground"
            >
              {{ item.name }}
            </span>
            <span class="truncate text-xs text-muted-foreground">
              {{
                t(
                  'mediaAsset.tags.assetCount',
                  { count: item.count },
                  item.count
                )
              }}
            </span>
          </template>
        </button>
        <div
          v-if="dropdownItems.length === 0"
          class="px-2 py-1.5 text-xs text-muted-foreground"
        >
          {{ t('mediaAsset.tags.noMatches') }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useElementBounding, useWindowSize } from '@vueuse/core'
import type { CSSProperties } from 'vue'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  isUserTag,
  useAssetTags
} from '@/platform/assets/composables/useAssetTags'
import type { SimplifiedWidget } from '@/types/simplifiedWidget'
import { cn } from '@/utils/tailwindUtil'

import { WidgetInputBaseClass } from './layout'
import WidgetLayoutField from './layout/WidgetLayoutField.vue'

interface SuggestionItem {
  kind: 'suggestion'
  name: string
  count: number
}
interface CreateItem {
  kind: 'create'
  name: string
}
type DropdownItem = SuggestionItem | CreateItem

const DROPDOWN_MAX_HEIGHT = 288
const DROPDOWN_GAP = 4

const { widget, size = 'medium' } = defineProps<{
  widget: SimplifiedWidget<string[] | undefined>
  size?: 'medium' | 'large'
}>()

const modelValue = defineModel<string[] | undefined>({ default: () => [] })

const { t } = useI18n()
const { allTags } = useAssetTags()

const isFocused = ref(false)
const typedQuery = ref('')
const highlightedIndex = ref(0)
const inputEl = useTemplateRef<HTMLInputElement>('inputEl')
const anchorRef = useTemplateRef<HTMLElement>('anchorRef')
const { left, top, bottom, width } = useElementBounding(anchorRef)
const { height: windowHeight } = useWindowSize()

const tags = computed<string[]>(() => modelValue.value ?? [])

const isReadOnly = computed(() =>
  Boolean(widget.options?.read_only || widget.options?.disabled)
)

const filteredSuggestions = computed<SuggestionItem[]>(() => {
  const query = typedQuery.value.trim().toLowerCase()
  const available = allTags.value.filter((s) => !tags.value.includes(s.name))
  const matches = query
    ? available.filter((s) => s.name.toLowerCase().includes(query))
    : available
  return matches.map((s) => ({
    kind: 'suggestion',
    name: s.name,
    count: s.count
  }))
})

const canCreateTyped = computed(() => {
  const trimmed = typedQuery.value.trim()
  if (!isUserTag(trimmed)) return false
  if (tags.value.includes(trimmed)) return false
  if (allTags.value.some((s) => s.name === trimmed)) return false
  return true
})

const dropdownItems = computed<DropdownItem[]>(() => {
  const items: DropdownItem[] = [...filteredSuggestions.value]
  if (canCreateTyped.value) {
    items.push({ kind: 'create', name: typedQuery.value.trim() })
  }
  return items
})

const dropdownVisible = computed(() => isFocused.value && !isReadOnly.value)

const dropdownStyle = computed<CSSProperties | null>(() => {
  if (!dropdownVisible.value || width.value === 0) return null
  const spaceBelow = windowHeight.value - bottom.value
  const placeAbove =
    spaceBelow < DROPDOWN_MAX_HEIGHT && top.value > DROPDOWN_MAX_HEIGHT
  const maxHeight = placeAbove
    ? Math.min(DROPDOWN_MAX_HEIGHT, top.value - DROPDOWN_GAP)
    : Math.min(DROPDOWN_MAX_HEIGHT, spaceBelow - DROPDOWN_GAP)
  return {
    left: `${left.value}px`,
    top: placeAbove
      ? `${top.value - maxHeight - DROPDOWN_GAP}px`
      : `${bottom.value + DROPDOWN_GAP}px`,
    width: `${width.value}px`,
    maxHeight: `${maxHeight}px`,
    zIndex: 2147483000
  }
})

const layoutWidget = computed(() => ({
  name: widget.name,
  label: widget.label,
  borderStyle: widget.borderStyle
}))

watch(dropdownItems, (items) => {
  if (highlightedIndex.value >= items.length) {
    highlightedIndex.value = Math.max(0, items.length - 1)
  }
})

watch(typedQuery, () => {
  highlightedIndex.value = 0
})

function addTag(name: string) {
  const trimmed = name.trim()
  if (!isUserTag(trimmed)) return
  if (tags.value.includes(trimmed)) return
  modelValue.value = [...tags.value, trimmed]
  typedQuery.value = ''
  highlightedIndex.value = 0
  inputEl.value?.focus()
}

function selectItem(item: DropdownItem) {
  addTag(item.name)
}

function removeTag(name: string) {
  if (isReadOnly.value) return
  modelValue.value = tags.value.filter((t) => t !== name)
}

function onArrow(delta: number) {
  if (!dropdownVisible.value) return
  const count = dropdownItems.value.length
  if (count === 0) return
  highlightedIndex.value = (highlightedIndex.value + delta + count) % count
}

function onEnter() {
  if (isReadOnly.value) return
  const item = dropdownItems.value[highlightedIndex.value]
  if (item) {
    selectItem(item)
    return
  }
  const trimmed = typedQuery.value.trim()
  if (trimmed && canCreateTyped.value) addTag(trimmed)
}

function onBackspace() {
  if (typedQuery.value.length > 0) return
  if (tags.value.length === 0) return
  removeTag(tags.value[tags.value.length - 1])
}

function onFocus() {
  isFocused.value = true
  highlightedIndex.value = 0
}

function onBlur() {
  isFocused.value = false
  typedQuery.value = ''
}

function closeDropdown() {
  isFocused.value = false
  typedQuery.value = ''
  inputEl.value?.blur()
}
</script>
