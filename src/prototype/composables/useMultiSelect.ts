// Multi-selection over an ordered list of workflow ids (one grid). Supports
// toggle (checkbox / cmd-click), shift-range, marquee (setSelection), and
// drops ids that leave the list.
import { computed, ref, watch } from 'vue'

import type { ComputedRef, Ref } from 'vue'

export function useMultiSelect(
  orderedIds: Ref<string[]> | ComputedRef<string[]>
) {
  const selected = ref<Set<string>>(new Set())
  const anchor = ref<string | null>(null)

  const selectionCount = computed(() => selected.value.size)
  const hasSelection = computed(() => selected.value.size > 0)
  // 2+ selected routes right-click to the bulk menu.
  const isMulti = computed(() => selected.value.size >= 2)

  function isSelected(id: string): boolean {
    return selected.value.has(id)
  }

  function toggle(id: string) {
    const next = new Set(selected.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selected.value = next
    anchor.value = id
  }

  function selectRange(toId: string) {
    const ids = orderedIds.value
    const from = anchor.value
    const i = from ? ids.indexOf(from) : -1
    const j = ids.indexOf(toId)
    if (i < 0 || j < 0) {
      toggle(toId)
      return
    }
    const [lo, hi] = i < j ? [i, j] : [j, i]
    const next = new Set(selected.value)
    for (let k = lo; k <= hi; k++) next.add(ids[k])
    selected.value = next
  }

  // A select gesture from a card/checkbox: shift extends the range, otherwise
  // toggle the single item.
  function onSelect(id: string, event: { shiftKey?: boolean }) {
    if (event.shiftKey && anchor.value) selectRange(id)
    else toggle(id)
  }

  function setSelection(ids: string[]) {
    selected.value = new Set(ids)
  }

  function clear() {
    selected.value = new Set()
    anchor.value = null
  }

  // Drop ids that leave the list (deleted, moved into a folder, filtered out).
  watch(orderedIds, (ids) => {
    const valid = new Set(ids)
    const next = new Set<string>()
    let changed = false
    for (const id of selected.value) {
      if (valid.has(id)) next.add(id)
      else changed = true
    }
    if (changed) selected.value = next
  })

  return {
    selected,
    selectionCount,
    hasSelection,
    isMulti,
    isSelected,
    onSelect,
    setSelection,
    clear
  }
}
