<template>
  <div class="col-span-2 grid grid-cols-subgrid gap-y-1">
    <WidgetLayoutField :widget="layoutWidget" root-class="col-span-2">
      <PopoverRoot v-model:open="popoverOpen">
        <PopoverAnchor as-child>
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
        </PopoverAnchor>
        <PopoverPortal>
          <PopoverContent
            position="popper"
            side="bottom"
            align="start"
            :side-offset="4"
            :collision-padding="8"
            :style="{ zIndex: 2147483000 }"
            class="max-h-72 w-(--reka-popover-trigger-width) overflow-y-auto rounded-lg border border-border-default bg-base-background p-1 shadow-lg"
            data-capture-wheel="true"
            @open-auto-focus.prevent
            @close-auto-focus.prevent
            @pointerdown-outside="onPointerDownOutside"
          >
            <button
              v-for="(item, idx) in dropdownItems"
              :key="item.kind === 'create' ? '__create__' : item.name"
              type="button"
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
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
    </WidgetLayoutField>

    <div v-if="tags.length > 0" class="col-start-2 flex flex-wrap gap-1 px-1">
      <TagChip
        v-for="tag in tags"
        :key="tag"
        :name="tag"
        removable
        :disabled="isReadOnly"
        @remove="removeTag(tag)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PopoverAnchor,
  PopoverContent,
  PopoverPortal,
  PopoverRoot
} from 'reka-ui'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import TagChip from '@/platform/assets/components/TagChip.vue'
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

const popoverOpen = computed<boolean>({
  get: () => isFocused.value && !isReadOnly.value,
  set: (open) => {
    if (!open) closeDropdown()
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
  if (!popoverOpen.value) return
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

function onPointerDownOutside(event: Event) {
  // Let clicks on the input still focus it.
  if (event.target instanceof Node && inputEl.value?.contains(event.target)) {
    event.preventDefault()
  }
}
</script>
