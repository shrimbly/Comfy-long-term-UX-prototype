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

    <TransitionGroup
      v-if="tags.length > 0"
      tag="div"
      class="col-start-2 flex flex-wrap gap-1 px-1"
      enter-active-class="transition-[opacity,transform] duration-150 ease-out"
      enter-from-class="opacity-0 scale-90"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-[opacity,transform] duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-90"
    >
      <TagChip
        v-for="tag in tags"
        :key="tag"
        :name="tag"
        removable
        :disabled="isReadOnly"
        @remove="removeTag(tag)"
      />
    </TransitionGroup>

    <Teleport to="body">
      <div
        v-if="dropdownVisible && dropdownStyle"
        ref="dropdownEl"
        class="fixed overflow-y-auto rounded-lg border border-border-default bg-base-background p-1 shadow-lg"
        :style="dropdownStyle"
        data-capture-wheel="true"
        @pointerdown.stop.prevent
      >
        <button
          v-for="(item, idx) in dropdownItems"
          :key="item.kind === 'create' ? '__create__' : item.name"
          type="button"
          :data-index="idx"
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
import { useWindowSize } from '@vueuse/core'
import type { CSSProperties } from 'vue'
import {
  computed,
  nextTick,
  onScopeDispose,
  ref,
  useTemplateRef,
  watch
} from 'vue'
import { useI18n } from 'vue-i18n'

import {
  singleValueExtractor,
  useUpstreamValue
} from '@/composables/useUpstreamValue'
import TagChip from '@/platform/assets/components/TagChip.vue'
import {
  isUserTag,
  useAssetTags
} from '@/platform/assets/composables/useAssetTags'
import { parseTagsFromString } from '@/platform/assets/utils/parseTagsFromString'
import type { SimplifiedWidget } from '@/types/simplifiedWidget'
import { cn } from '@comfyorg/tailwind-utils'

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
const dropdownEl = useTemplateRef<HTMLElement>('dropdownEl')
const anchorRect = ref<DOMRect | null>(null)
const { height: windowHeight } = useWindowSize()

const tags = computed<string[]>(() => modelValue.value ?? [])

const isLinked = computed(() => Boolean(widget.linkedUpstream))

const isReadOnly = computed(
  () =>
    isLinked.value ||
    Boolean(widget.options?.read_only || widget.options?.disabled)
)

const isString = (v: unknown): v is string => typeof v === 'string'
const upstreamValue = useUpstreamValue(
  () => widget.linkedUpstream,
  singleValueExtractor(isString)
)

watch(
  upstreamValue,
  (upstream) => {
    if (upstream === undefined) return
    modelValue.value = parseTagsFromString(upstream)
  },
  { immediate: true }
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
  const rect = anchorRect.value
  if (!dropdownVisible.value || !rect || rect.width === 0) return null
  const spaceBelow = windowHeight.value - rect.bottom
  const placeAbove =
    spaceBelow < DROPDOWN_MAX_HEIGHT && rect.top > DROPDOWN_MAX_HEIGHT
  const maxHeight = placeAbove
    ? Math.min(DROPDOWN_MAX_HEIGHT, rect.top - DROPDOWN_GAP)
    : Math.min(DROPDOWN_MAX_HEIGHT, spaceBelow - DROPDOWN_GAP)
  return {
    left: `${rect.left}px`,
    top: placeAbove
      ? `${rect.top - maxHeight - DROPDOWN_GAP}px`
      : `${rect.bottom + DROPDOWN_GAP}px`,
    width: `${rect.width}px`,
    maxHeight: `${maxHeight}px`,
    zIndex: 2147483000
  }
})

const layoutWidget = computed(() => ({
  name: widget.name,
  label: widget.label,
  borderStyle: widget.borderStyle
}))

let rafId: number | null = null

function measureAnchor() {
  const el = anchorRef.value
  if (!el) {
    anchorRect.value = null
    return
  }
  const next = el.getBoundingClientRect()
  const prev = anchorRect.value
  if (
    !prev ||
    prev.left !== next.left ||
    prev.top !== next.top ||
    prev.right !== next.right ||
    prev.bottom !== next.bottom
  ) {
    anchorRect.value = next
  }
}

function startTracking() {
  if (rafId !== null) return
  const tick = () => {
    measureAnchor()
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

function stopTracking() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

watch(dropdownVisible, (visible) => {
  if (visible) {
    measureAnchor()
    startTracking()
  } else {
    stopTracking()
    anchorRect.value = null
  }
})

onScopeDispose(stopTracking)

watch(dropdownItems, (items) => {
  if (highlightedIndex.value >= items.length) {
    highlightedIndex.value = Math.max(0, items.length - 1)
  }
})

watch(typedQuery, () => {
  highlightedIndex.value = 0
})

watch(highlightedIndex, (idx) => {
  void nextTick(() => {
    const el = dropdownEl.value?.querySelector<HTMLElement>(
      `[data-index="${idx}"]`
    )
    el?.scrollIntoView({ block: 'nearest' })
  })
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
