<template>
  <div class="flex w-full flex-col gap-2">
    <div class="relative w-full">
      <TagsInput
        v-model="editorTags"
        :always-editing="alwaysEditing"
        :class="
          cn(
            'min-h-9 w-full gap-1 rounded-lg border border-comfy-input bg-secondary-background px-3 py-1',
            $attrs.class as string
          )
        "
      >
        <template #default="{ isEmpty }">
          <i
            class="pointer-events-none icon-[lucide--search] size-3.5 shrink-0 text-white"
          />
          <TagsInputInput
            :is-empty="isEmpty"
            :placeholder="placeholder ?? t('mediaAsset.tags.addPlaceholder')"
            class="h-6 min-w-24 flex-1"
            @input="onInput"
            @focus="isFocused = true"
            @blur="onBlur"
          />
        </template>
      </TagsInput>

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
          @click="addSuggestion(suggestion.name)"
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
          @click="addSuggestion(typedQuery)"
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

    <TransitionGroup
      v-if="editorTags.length > 0"
      tag="div"
      class="flex flex-wrap gap-1"
      enter-active-class="transition-[opacity,transform] duration-150 ease-out"
      enter-from-class="opacity-0 scale-90"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-[opacity,transform] duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-90"
    >
      <TagChip
        v-for="tag in editorTags"
        :key="tag"
        :name="tag"
        removable
        @remove="removeEditorTag(tag)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import TagsInput from '@/components/ui/tags-input/TagsInput.vue'
import TagsInputInput from '@/components/ui/tags-input/TagsInputInput.vue'
import type { AssetItem } from '@/platform/assets/schemas/assetSchema'
import { cn } from '@/utils/tailwindUtil'

import { isUserTag, useAssetTags } from '../composables/useAssetTags'
import TagChip from './TagChip.vue'

defineOptions({ inheritAttrs: false })

const {
  assets,
  alwaysEditing = false,
  placeholder
} = defineProps<{
  assets: readonly AssetItem[]
  alwaysEditing?: boolean
  placeholder?: string
}>()

const { t } = useI18n()
const { getTags, setTags, addTag, removeTag, allTags } = useAssetTags()

const isFocused = ref(false)
const typedQuery = ref('')

const sharedTags = computed<string[]>(() => {
  if (assets.length === 0) return []
  const [first, ...rest] = assets
  let shared = new Set(getTags(first))
  for (const asset of rest) {
    const next = new Set(getTags(asset))
    shared = new Set([...shared].filter((t) => next.has(t)))
    if (shared.size === 0) break
  }
  return [...shared].sort()
})

const editorTags = computed<string[]>({
  get: () => sharedTags.value,
  set: (next) => {
    if (assets.length === 0) return
    const cleaned = next.map((t) => t.trim()).filter(isUserTag)
    const before = new Set(sharedTags.value)
    const after = new Set(cleaned)
    const added = cleaned.filter((t) => !before.has(t))
    const removed = [...before].filter((t) => !after.has(t))

    if (assets.length === 1) {
      const only = assets[0]
      const merged = new Set(getTags(only))
      for (const tag of added) merged.add(tag)
      for (const tag of removed) merged.delete(tag)
      setTags(only, [...merged])
      return
    }

    for (const asset of assets) {
      for (const tag of added) addTag(asset, tag)
      for (const tag of removed) removeTag(asset, tag)
    }
  }
})

const filteredSuggestions = computed(() => {
  const query = typedQuery.value.trim().toLowerCase()
  const available = allTags.value.filter(
    (s) => !sharedTags.value.includes(s.name)
  )
  if (!query) return available
  return available.filter((s) => s.name.toLowerCase().includes(query))
})

const canCreateTyped = computed(() => {
  const trimmed = typedQuery.value.trim()
  if (!isUserTag(trimmed)) return false
  if (sharedTags.value.includes(trimmed)) return false
  if (allTags.value.some((s) => s.name === trimmed)) return false
  return true
})

const dropdownVisible = computed(() => isFocused.value)

function onInput(event: Event) {
  typedQuery.value = (event.target as HTMLInputElement).value
}

function onBlur() {
  isFocused.value = false
  typedQuery.value = ''
}

function addSuggestion(name: string) {
  const trimmed = name.trim()
  if (!isUserTag(trimmed)) return
  if (sharedTags.value.includes(trimmed)) return
  editorTags.value = [...sharedTags.value, trimmed]
  typedQuery.value = ''
}

function removeEditorTag(tag: string) {
  editorTags.value = sharedTags.value.filter((t) => t !== tag)
}
</script>
