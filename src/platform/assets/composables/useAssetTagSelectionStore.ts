import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'

const STORAGE_KEY = 'Comfy.Assets.SelectedTags.v1'

export const useAssetTagSelectionStore = defineStore(
  'assetTagSelection',
  () => {
    const persisted = useStorage<string[]>(STORAGE_KEY, [])

    const selectedSet = computed(() => new Set(persisted.value))
    const hasSelection = computed(() => persisted.value.length > 0)
    const size = computed(() => persisted.value.length)
    const asArray = computed(() => persisted.value.slice())

    function isSelected(tag: string): boolean {
      return selectedSet.value.has(tag)
    }

    function add(tag: string) {
      const trimmed = tag.trim()
      if (!trimmed || selectedSet.value.has(trimmed)) return
      persisted.value = [...persisted.value, trimmed]
    }

    function remove(tag: string) {
      persisted.value = persisted.value.filter((t) => t !== tag)
    }

    function toggle(tag: string) {
      if (selectedSet.value.has(tag)) remove(tag)
      else add(tag)
    }

    function clear() {
      persisted.value = []
    }

    function setMany(tags: readonly string[]) {
      persisted.value = Array.from(
        new Set(tags.map((t) => t.trim()).filter(Boolean))
      )
    }

    function pruneMissing(existing: ReadonlySet<string>) {
      persisted.value = persisted.value.filter((t) => existing.has(t))
    }

    return {
      hasSelection,
      size,
      asArray,
      isSelected,
      add,
      remove,
      toggle,
      clear,
      setMany,
      pruneMissing
    }
  }
)
