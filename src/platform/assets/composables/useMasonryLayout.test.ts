import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'

const containerWidth = ref(0)

vi.mock('@vueuse/core', () => ({
  useElementSize: () => ({
    width: containerWidth,
    height: ref(0)
  })
}))

import { useMasonryLayout } from './useMasonryLayout'

function setup(opts: {
  width?: number
  ids: string[]
  columnWidth: number
  gap?: number
}) {
  containerWidth.value = opts.width ?? 1000
  const containerRef = ref<HTMLElement | null>(document.createElement('div'))
  const itemIds = ref<readonly string[]>(opts.ids)
  const columnWidth = ref(opts.columnWidth)
  const layout = useMasonryLayout({
    containerRef,
    itemIds,
    columnWidth,
    gap: opts.gap ?? 10
  })
  return { layout, containerRef, itemIds, columnWidth }
}

describe('useMasonryLayout', () => {
  beforeEach(() => {
    containerWidth.value = 0
  })

  it('falls back to a single column when container width is unknown', () => {
    const { layout } = setup({ width: 0, ids: ['a'], columnWidth: 200 })
    expect(layout.columnCount.value).toBe(1)
  })

  it('chooses column count to fit target column width within container', () => {
    const { layout } = setup({
      width: 1000,
      ids: [],
      columnWidth: 240,
      gap: 10
    })
    // floor((1000 + 10) / (240 + 10)) = floor(4.04) = 4
    expect(layout.columnCount.value).toBe(4)
  })

  it('stretches column width to fill container exactly', () => {
    const { layout } = setup({
      width: 1000,
      ids: [],
      columnWidth: 240,
      gap: 10
    })
    // 4 cols, 3 gaps of 10 → (1000 - 30) / 4 = 242.5
    expect(layout.actualColumnWidth.value).toBeCloseTo(242.5, 5)
  })

  it('places items into the shortest column', () => {
    const { layout } = setup({
      width: 620,
      ids: ['a', 'b', 'c', 'd'],
      columnWidth: 200,
      gap: 10
    })
    // floor((620+10)/(200+10)) = 3 cols, colWidth = (620 - 20)/3 = 200
    expect(layout.columnCount.value).toBe(3)
    layout.reportItemHeight('a', 200)
    layout.reportItemHeight('b', 100)
    layout.reportItemHeight('c', 50)
    // After a,b,c are placed:
    //   col0 = 200+10 = 210
    //   col1 = 100+10 = 110
    //   col2 =  50+10 =  60   ← shortest
    // d should land in col2 at top=60.
    layout.reportItemHeight('d', 80)
    const d = layout.positions.value.get('d')
    expect(d?.top).toBeCloseTo(60, 5)
    const colW = layout.actualColumnWidth.value
    expect(d?.left).toBeCloseTo(2 * (colW + 10), 5)
  })

  it('reports container height as the tallest column minus the trailing gap', () => {
    const { layout } = setup({
      width: 400,
      ids: ['a', 'b'],
      columnWidth: 180,
      gap: 10
    })
    // 2 cols → each item gets its own column
    layout.reportItemHeight('a', 300)
    layout.reportItemHeight('b', 100)
    expect(layout.containerHeight.value).toBeCloseTo(300, 5)
  })

  it('uses estimated aspect ratio for unmeasured items', () => {
    const { layout } = setup({
      width: 400,
      ids: ['a'],
      columnWidth: 200,
      gap: 0
    })
    // colWidth = 200, square fallback → height 200
    expect(layout.containerHeight.value).toBeCloseTo(200, 5)
  })

  it('updates positions when an item height changes', async () => {
    const { layout } = setup({
      width: 400,
      ids: ['a', 'b'],
      columnWidth: 180,
      gap: 10
    })
    layout.reportItemHeight('a', 100)
    layout.reportItemHeight('b', 100)
    await nextTick()

    layout.reportItemHeight('a', 300)
    await nextTick()
    expect(layout.containerHeight.value).toBeCloseTo(300, 5)
  })

  it('drops cached heights for items removed from the list', async () => {
    const { layout, itemIds } = setup({
      width: 400,
      ids: ['a', 'b'],
      columnWidth: 180,
      gap: 10
    })
    layout.reportItemHeight('a', 200)
    layout.reportItemHeight('b', 200)
    itemIds.value = ['b']
    await nextTick()
    expect(layout.positions.value.has('a')).toBe(false)
    expect(layout.positions.value.get('b')?.top).toBe(0)
  })

  it('reacts to columnWidth changes', async () => {
    const { layout, columnWidth } = setup({
      width: 1000,
      ids: [],
      columnWidth: 200,
      gap: 0
    })
    expect(layout.columnCount.value).toBe(5)
    columnWidth.value = 100
    await nextTick()
    expect(layout.columnCount.value).toBe(10)
  })

  it('supports a static numeric gap', () => {
    const containerRef = ref<HTMLElement | null>(document.createElement('div'))
    containerWidth.value = 600
    const ids = ref<readonly string[]>(['a', 'b'])
    const layout = useMasonryLayout({
      containerRef,
      itemIds: ids,
      columnWidth: ref(280),
      gap: 20
    })
    // (600+20)/(280+20)=2.06 → 2 cols, colW = (600-20)/2 = 290
    expect(layout.columnCount.value).toBe(2)
    expect(layout.actualColumnWidth.value).toBeCloseTo(290, 5)
  })

  it('exposes a computed columnWidth via gap as a ref', async () => {
    const containerRef = ref<HTMLElement | null>(document.createElement('div'))
    containerWidth.value = 600
    const ids = ref<readonly string[]>([])
    const gap = ref(0)
    const layout = useMasonryLayout({
      containerRef,
      itemIds: ids,
      columnWidth: ref(150),
      gap: computed(() => gap.value)
    })
    expect(layout.columnCount.value).toBe(4)
    gap.value = 50
    await nextTick()
    // (600+50)/(150+50)=3.25 → 3 cols
    expect(layout.columnCount.value).toBe(3)
  })
})
