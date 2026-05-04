import { useElementSize } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'

export interface MasonryPosition {
  left: number
  top: number
  width: number
}

export interface MasonryLayoutOptions {
  /** Reactive reference to the masonry container element. */
  containerRef: Ref<HTMLElement | null>
  /** Stable list of item ids in display order. */
  itemIds: Ref<readonly string[]>
  /** Target column width in pixels. Actual columns stretch to fill. */
  columnWidth: Ref<number>
  /** Gap between columns and rows in pixels. */
  gap?: Ref<number> | number
  /**
   * Estimated aspect ratio (height / width) for items whose height
   * has not yet been measured. Defaults to 1 (square).
   */
  estimatedAspectRatio?: number
}

export interface MasonryLayoutResult {
  /** Map from item id to absolute position within the container. */
  positions: ComputedRef<Map<string, MasonryPosition>>
  /** Total height the container must be to fit all items. */
  containerHeight: ComputedRef<number>
  /** Number of columns currently rendered. */
  columnCount: ComputedRef<number>
  /** Width of each column in pixels. */
  actualColumnWidth: ComputedRef<number>
  /** Report the measured height of an item. */
  reportItemHeight: (id: string, height: number) => void
  /** Forget any cached height for an item (e.g. when removed). */
  releaseItem: (id: string) => void
}

const DEFAULT_GAP = 12

export function useMasonryLayout(
  options: MasonryLayoutOptions
): MasonryLayoutResult {
  const {
    containerRef,
    itemIds,
    columnWidth,
    gap: gapInput = DEFAULT_GAP,
    estimatedAspectRatio = 1
  } = options

  const gap = computed(() =>
    typeof gapInput === 'number' ? gapInput : gapInput.value
  )

  const { width: containerWidth } = useElementSize(containerRef)

  const measuredHeights = shallowRef(new Map<string, number>())

  function reportItemHeight(id: string, height: number) {
    if (height <= 0) return
    const current = measuredHeights.value.get(id)
    if (current !== undefined && Math.abs(current - height) < 0.5) return
    const next = new Map(measuredHeights.value)
    next.set(id, height)
    measuredHeights.value = next
  }

  function releaseItem(id: string) {
    if (!measuredHeights.value.has(id)) return
    const next = new Map(measuredHeights.value)
    next.delete(id)
    measuredHeights.value = next
  }

  const columnCount = computed(() => {
    const w = containerWidth.value
    if (w <= 0) return 1
    const target = Math.max(1, columnWidth.value)
    const computed = Math.floor((w + gap.value) / (target + gap.value))
    return Math.max(1, computed)
  })

  const actualColumnWidth = computed(() => {
    const w = containerWidth.value
    if (w <= 0) return columnWidth.value
    const cols = columnCount.value
    return (w - gap.value * (cols - 1)) / cols
  })

  const layout = computed(() => {
    const cols = columnCount.value
    const colW = actualColumnWidth.value
    const ids = itemIds.value
    const heights = measuredHeights.value
    const g = gap.value

    const columnHeights = new Array<number>(cols).fill(0)
    const positions = new Map<string, MasonryPosition>()

    const fallbackHeight = Math.max(1, colW * estimatedAspectRatio)

    for (const id of ids) {
      const measured = heights.get(id)
      const itemHeight = measured && measured > 0 ? measured : fallbackHeight

      let shortest = 0
      for (let i = 1; i < cols; i++) {
        if (columnHeights[i] < columnHeights[shortest]) shortest = i
      }

      const left = shortest * (colW + g)
      const top = columnHeights[shortest]
      positions.set(id, { left, top, width: colW })
      columnHeights[shortest] = top + itemHeight + g
    }

    const maxHeight = columnHeights.reduce((acc, h) => (h > acc ? h : acc), 0)
    const containerHeight = Math.max(0, maxHeight - g)

    return { positions, containerHeight }
  })

  const positions = computed(() => layout.value.positions)
  const containerHeight = computed(() => layout.value.containerHeight)

  // Drop measurements for items no longer in the list.
  const knownIds = ref(new Set<string>())
  watch(
    itemIds,
    (ids) => {
      const next = new Set(ids)
      for (const id of measuredHeights.value.keys()) {
        if (!next.has(id)) {
          releaseItem(id)
        }
      }
      knownIds.value = next
    },
    { immediate: true }
  )

  return {
    positions,
    containerHeight,
    columnCount,
    actualColumnWidth,
    reportItemHeight,
    releaseItem
  }
}
