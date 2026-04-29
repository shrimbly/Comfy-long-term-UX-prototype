<template>
  <WidgetLayoutField :widget="layoutWidget">
    <div class="flex w-full flex-col gap-2">
      <div class="relative w-full">
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
            @focus="isFocused = true"
            @blur="onBlur"
            @keydown.enter.prevent="onEnter"
            @keydown.escape.prevent="closeDropdown"
            @keydown.backspace="onBackspace"
            @pointerdown.stop
          />
        </div>
        <div
          v-if="dropdownVisible"
          class="absolute inset-x-0 top-full z-1200 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border-default bg-base-background p-1 shadow-lg"
          @mousedown.prevent
        >
          <button
            v-for="suggestion in filteredSuggestions"
            :key="suggestion.name"
            type="button"
            class="flex w-full cursor-pointer items-center gap-2 rounded-sm border-none bg-transparent px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary-background-hover"
            @click="addTag(suggestion.name)"
          >
            <span
              class="inline-flex shrink-0 items-center rounded-sm bg-modal-card-tag-background px-1.5 py-px font-mono text-2xs text-modal-card-tag-foreground"
            >
              {{ suggestion.name }}
            </span>
            <span class="truncate text-xs text-muted-foreground">
              {{
                t(
                  'mediaAsset.tags.assetCount',
                  { count: suggestion.count },
                  suggestion.count
                )
              }}
            </span>
          </button>
          <button
            v-if="canCreateTyped"
            type="button"
            class="flex w-full cursor-pointer items-center gap-2 rounded-sm border-none bg-transparent px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary-background-hover"
            @click="addTag(typedQuery)"
          >
            <i
              class="icon-[lucide--plus] size-3.5 shrink-0 text-muted-foreground"
            />
            <span class="truncate text-xs">
              {{ t('mediaAsset.tags.createTag', { name: typedQuery }) }}
            </span>
          </button>
          <div
            v-if="filteredSuggestions.length === 0 && !canCreateTyped"
            class="px-2 py-1.5 text-xs text-muted-foreground"
          >
            {{ t('mediaAsset.tags.noMatches') }}
          </div>
        </div>
      </div>

      <div v-if="tags.length > 0" class="flex flex-wrap gap-1">
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
    </div>
  </WidgetLayoutField>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  isUserTag,
  useAssetTags
} from '@/platform/assets/composables/useAssetTags'
import type { SimplifiedWidget } from '@/types/simplifiedWidget'
import { cn } from '@/utils/tailwindUtil'

import { WidgetInputBaseClass } from './layout'
import WidgetLayoutField from './layout/WidgetLayoutField.vue'

const { widget, size = 'medium' } = defineProps<{
  widget: SimplifiedWidget<string[] | undefined>
  size?: 'medium' | 'large'
}>()

const modelValue = defineModel<string[] | undefined>({ default: () => [] })

const { t } = useI18n()
const { allTags } = useAssetTags()

const isFocused = ref(false)
const typedQuery = ref('')
const inputEl = useTemplateRef<HTMLInputElement>('inputEl')

const tags = computed<string[]>(() => modelValue.value ?? [])

const isReadOnly = computed(() =>
  Boolean(widget.options?.read_only || widget.options?.disabled)
)

const filteredSuggestions = computed(() => {
  const query = typedQuery.value.trim().toLowerCase()
  const available = allTags.value.filter((s) => !tags.value.includes(s.name))
  if (!query) return available
  return available.filter((s) => s.name.toLowerCase().includes(query))
})

const canCreateTyped = computed(() => {
  const trimmed = typedQuery.value.trim()
  if (!isUserTag(trimmed)) return false
  if (tags.value.includes(trimmed)) return false
  if (allTags.value.some((s) => s.name === trimmed)) return false
  return true
})

const dropdownVisible = computed(() => isFocused.value && !isReadOnly.value)

const layoutWidget = computed(() => ({
  name: widget.name,
  label: widget.label,
  borderStyle: widget.borderStyle
}))

function addTag(name: string) {
  const trimmed = name.trim()
  if (!isUserTag(trimmed)) return
  if (tags.value.includes(trimmed)) return
  modelValue.value = [...tags.value, trimmed]
  typedQuery.value = ''
  inputEl.value?.focus()
}

function removeTag(name: string) {
  if (isReadOnly.value) return
  modelValue.value = tags.value.filter((t) => t !== name)
}

function onEnter() {
  if (isReadOnly.value) return
  const trimmed = typedQuery.value.trim()
  if (!trimmed) return
  if (canCreateTyped.value) {
    addTag(trimmed)
    return
  }
  const suggestion = filteredSuggestions.value[0]
  if (suggestion) addTag(suggestion.name)
}

function onBackspace() {
  if (typedQuery.value.length > 0) return
  if (tags.value.length === 0) return
  removeTag(tags.value[tags.value.length - 1])
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
