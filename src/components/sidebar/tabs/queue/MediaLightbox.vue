<template>
  <Teleport to="body">
    <div
      v-if="galleryVisible"
      ref="dialogRef"
      role="dialog"
      aria-modal="true"
      :aria-label="$t('g.gallery')"
      tabindex="-1"
      class="fixed inset-0 z-9999 flex items-center justify-center bg-black/90 outline-none"
      data-mask
      @mousedown="onMaskMouseDown"
      @mouseup="onMaskMouseUp"
      @keydown.stop="handleKeyDown"
    >
      <!-- Close Button -->
      <Button
        variant="secondary"
        size="icon-lg"
        class="absolute top-4 right-4 z-10 rounded-full"
        :aria-label="$t('g.close')"
        @click="close"
      >
        <i class="icon-[lucide--x] size-5" />
      </Button>

      <!-- Single-item mode -->
      <template v-if="!isCompareMode">
        <Button
          v-if="hasMultiple"
          variant="secondary"
          size="icon-lg"
          class="fixed top-1/2 left-4 z-10 -translate-y-1/2 rounded-full"
          :aria-label="$t('g.previous')"
          @click="navigateImage(-1)"
        >
          <i class="icon-[lucide--chevron-left] size-6" />
        </Button>

        <div class="flex max-h-full max-w-full items-center justify-center">
          <LightboxAssetView
            v-if="activeItem"
            :item="activeItem"
            class="max-h-[90vh] max-w-[90vw]"
          />
        </div>

        <Button
          v-if="hasMultiple"
          variant="secondary"
          size="icon-lg"
          class="fixed top-1/2 right-4 z-10 -translate-y-1/2 rounded-full"
          :aria-label="$t('g.next')"
          @click="navigateImage(1)"
        >
          <i class="icon-[lucide--chevron-right] size-6" />
        </Button>
      </template>

      <!-- Compare mode (modal) -->
      <template v-else>
        <div
          class="flex h-[min(900px,90vh)] w-[min(1400px,92vw)] overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 text-white shadow-2xl"
        >
          <!-- Sidebar -->
          <aside
            class="flex w-56 shrink-0 flex-col border-r border-border-subtle bg-modal-panel-background text-base-foreground"
          >
            <header
              class="flex h-18 w-full shrink-0 items-center-safe gap-2 px-6"
            >
              <i
                class="text-neutral icon-[lucide--columns-2] size-5 shrink-0"
              />
              <h2 class="m-0 flex-1 text-base font-semibold select-none">
                {{ $t('mediaAsset.compare.action') }}
              </h2>
            </header>
            <nav
              class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3"
            >
              <button
                v-for="mode in compareModes"
                :key="mode"
                type="button"
                :class="
                  cn(
                    'flex w-full cursor-pointer items-center-safe gap-2 rounded-md border-none px-4 py-3 text-left text-sm text-base-foreground transition-colors select-none',
                    compareMode === mode
                      ? 'bg-interface-menu-component-surface-selected'
                      : 'bg-transparent hover:bg-interface-menu-component-surface-hovered'
                  )
                "
                :aria-label="$t(`mediaAsset.compare.mode.${mode}`)"
                :aria-pressed="compareMode === mode"
                @click="setMode(mode)"
              >
                <i
                  :class="cn(modeIcon[mode], 'text-neutral shrink-0 text-sm')"
                />
                <span class="min-w-0 truncate">{{
                  $t(`mediaAsset.compare.mode.${mode}`)
                }}</span>
              </button>
            </nav>
            <p
              v-if="modeHint"
              class="m-0 px-6 pt-3 pb-5 text-xs/snug text-muted-foreground"
            >
              {{ modeHint }}
            </p>
          </aside>

          <!-- Content -->
          <main
            class="relative flex flex-1 items-center justify-center overflow-hidden"
          >
            <!-- Side-by-side -->
            <div
              v-if="compareMode === 'side-by-side'"
              class="flex size-full items-stretch justify-center"
            >
              <div
                :class="
                  cn(
                    'flex h-full flex-1 flex-col items-center overflow-hidden p-6 transition-colors',
                    showPinHighlight && pinnedSide === 'left' && 'bg-white/8',
                    showPinHighlight &&
                      pinnedSide !== 'left' &&
                      'cursor-pointer hover:bg-white/3'
                  )
                "
                @click="showPinHighlight && setPin('left')"
              >
                <div
                  class="mb-3 flex h-7 items-center gap-2 self-start text-base font-semibold text-white"
                >
                  <i
                    :class="
                      pinnedSide === 'left'
                        ? 'icon-[ph--push-pin-fill] size-5 text-white'
                        : 'icon-[ph--push-pin] size-5 text-white/55'
                    "
                  />
                  <span v-if="pinnedSide === 'left'">{{
                    $t('mediaAsset.compare.pinned')
                  }}</span>
                </div>
                <div
                  class="flex flex-1 items-center justify-center overflow-hidden"
                >
                  <LightboxAssetView
                    v-if="leftItem"
                    :item="leftItem"
                    class="max-h-full max-w-full"
                  />
                </div>
                <div
                  v-if="showPinHighlight"
                  class="mt-3 flex h-10 items-center justify-center gap-3"
                  @click.stop
                >
                  <template v-if="pinnedSide !== 'left'">
                    <Button
                      variant="secondary"
                      size="icon"
                      class="rounded-full"
                      :aria-label="$t('g.previous')"
                      @click="advanceCursor(-1)"
                    >
                      <i class="icon-[lucide--chevron-left] size-4" />
                    </Button>
                    <span
                      class="min-w-12 text-center text-sm text-white/80 tabular-nums"
                    >
                      {{ cursorPositionLabel }}
                    </span>
                    <Button
                      variant="secondary"
                      size="icon"
                      class="rounded-full"
                      :aria-label="$t('g.next')"
                      @click="advanceCursor(1)"
                    >
                      <i class="icon-[lucide--chevron-right] size-4" />
                    </Button>
                  </template>
                </div>
              </div>
              <div
                :class="
                  cn(
                    'flex h-full flex-1 flex-col items-center overflow-hidden p-6 transition-colors',
                    showPinHighlight && pinnedSide === 'right' && 'bg-white/8',
                    showPinHighlight &&
                      pinnedSide !== 'right' &&
                      'cursor-pointer hover:bg-white/3'
                  )
                "
                @click="showPinHighlight && setPin('right')"
              >
                <div
                  class="mb-3 flex h-7 items-center gap-2 self-end text-base font-semibold text-white"
                >
                  <i
                    :class="
                      pinnedSide === 'right'
                        ? 'icon-[ph--push-pin-fill] size-5 text-white'
                        : 'icon-[ph--push-pin] size-5 text-white/55'
                    "
                  />
                  <span v-if="pinnedSide === 'right'">{{
                    $t('mediaAsset.compare.pinned')
                  }}</span>
                </div>
                <div
                  class="flex flex-1 items-center justify-center overflow-hidden"
                >
                  <LightboxAssetView
                    v-if="rightItem"
                    :item="rightItem"
                    class="max-h-full max-w-full"
                  />
                </div>
                <div
                  v-if="showPinHighlight"
                  class="mt-3 flex h-10 items-center justify-center gap-3"
                  @click.stop
                >
                  <template v-if="pinnedSide !== 'right'">
                    <Button
                      variant="secondary"
                      size="icon"
                      class="rounded-full"
                      :aria-label="$t('g.previous')"
                      @click="advanceCursor(-1)"
                    >
                      <i class="icon-[lucide--chevron-left] size-4" />
                    </Button>
                    <span
                      class="min-w-12 text-center text-sm text-white/80 tabular-nums"
                    >
                      {{ cursorPositionLabel }}
                    </span>
                    <Button
                      variant="secondary"
                      size="icon"
                      class="rounded-full"
                      :aria-label="$t('g.next')"
                      @click="advanceCursor(1)"
                    >
                      <i class="icon-[lucide--chevron-right] size-4" />
                    </Button>
                  </template>
                </div>
              </div>
            </div>

            <!-- Wipe -->
            <div
              v-else-if="compareMode === 'wipe'"
              class="relative flex size-full flex-col items-center justify-center p-6 select-none"
            >
              <div
                class="relative w-full flex-1 overflow-hidden"
                @pointerdown="onWipePointerDown"
              >
                <div ref="wipeBoxRef" class="relative size-full">
                  <img
                    v-if="leftItem?.isImage"
                    :src="leftItem.url"
                    :alt="leftItem.filename"
                    class="pointer-events-none absolute inset-0 size-full object-contain"
                  />
                  <video
                    v-else-if="leftItem?.isVideo"
                    :src="leftItem.url"
                    muted
                    loop
                    autoplay
                    playsinline
                    class="pointer-events-none absolute inset-0 size-full object-contain"
                  />
                  <div
                    class="absolute inset-0"
                    :style="{
                      clipPath: `inset(0 0 0 ${wipePosition * 100}%)`
                    }"
                  >
                    <img
                      v-if="rightItem?.isImage"
                      :src="rightItem.url"
                      :alt="rightItem.filename"
                      class="pointer-events-none absolute inset-0 size-full object-contain"
                    />
                    <video
                      v-else-if="rightItem?.isVideo"
                      :src="rightItem.url"
                      muted
                      loop
                      autoplay
                      playsinline
                      class="pointer-events-none absolute inset-0 size-full object-contain"
                    />
                  </div>
                  <div
                    class="pointer-events-none absolute inset-y-0 w-0.5 bg-white/80"
                    :style="{ left: `${wipePosition * 100}%` }"
                  >
                    <div
                      class="pointer-events-auto absolute top-1/2 left-1/2 flex size-8 -translate-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-black shadow-lg"
                    >
                      <i class="icon-[lucide--chevrons-left-right] size-4" />
                    </div>
                  </div>
                </div>
                <button
                  v-if="showPinHighlight"
                  type="button"
                  class="absolute top-3 right-3 z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-full border-none bg-white px-3 py-1 text-sm font-medium text-neutral-900 shadow-md transition-colors hover:bg-white/90"
                  :aria-label="$t('mediaAsset.compare.pin')"
                  @pointerdown.stop
                  @pointermove.stop
                  @click.stop="togglePin"
                >
                  <i class="icon-[ph--push-pin] size-4" />
                  <span>{{ $t('mediaAsset.compare.pin') }}</span>
                </button>
              </div>
              <div
                v-if="showPinHighlight"
                class="mt-4 flex items-center justify-center gap-2"
              >
                <button
                  v-if="pinnedItem"
                  type="button"
                  class="size-8 cursor-pointer overflow-hidden rounded-sm border-none p-0 opacity-60 transition-all hover:opacity-100"
                  :aria-label="pinnedItem.filename"
                >
                  <img
                    :src="pinnedItem.url"
                    :alt="pinnedItem.filename"
                    class="size-full object-cover"
                  />
                </button>
                <div
                  v-if="otherFlipItems.length > 0"
                  class="h-6 w-px bg-white/20"
                />
                <div
                  v-for="other in otherFlipItems"
                  :key="other.index"
                  class="relative flex flex-col items-center"
                >
                  <span
                    v-if="cursorIndex === other.index"
                    class="absolute -top-2 size-1.5 rounded-full bg-white"
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    :class="
                      cn(
                        'size-8 cursor-pointer overflow-hidden rounded-sm border-none p-0 transition-all',
                        cursorIndex === other.index
                          ? 'ring-2 ring-white'
                          : 'opacity-60 hover:opacity-100'
                      )
                    "
                    :aria-label="other.item.filename"
                    :aria-pressed="cursorIndex === other.index"
                    @click="cursorIndex = other.index"
                  >
                    <img
                      :src="other.item.url"
                      :alt="other.item.filename"
                      class="size-full object-cover"
                    />
                  </button>
                </div>
              </div>
            </div>

            <!-- Flip -->
            <div
              v-else-if="compareMode === 'flip'"
              class="relative flex size-full flex-col items-center justify-center p-6"
            >
              <div
                class="relative flex w-full flex-1 items-center justify-center overflow-hidden"
              >
                <LightboxAssetView
                  v-if="flipItem"
                  :item="flipItem"
                  class="max-h-full max-w-full"
                />
                <div
                  class="absolute top-3 left-3 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold text-white"
                >
                  {{ flipShowingRight ? 'B' : 'A' }}
                </div>
                <button
                  v-if="showPinHighlight && flipItem && flipItem !== pinnedItem"
                  type="button"
                  class="absolute top-3 right-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full border-none bg-white px-3 py-1 text-sm font-medium text-neutral-900 shadow-md transition-colors hover:bg-white/90"
                  :aria-label="$t('mediaAsset.compare.pin')"
                  @click="togglePin"
                >
                  <i class="icon-[ph--push-pin] size-4" />
                  <span>{{ $t('mediaAsset.compare.pin') }}</span>
                </button>
              </div>
              <div class="mt-4 flex items-center justify-center gap-2">
                <button
                  v-if="pinnedItem"
                  type="button"
                  :class="
                    cn(
                      'size-8 cursor-pointer overflow-hidden rounded-sm border-none p-0 transition-all',
                      flipItem === pinnedItem
                        ? 'ring-2 ring-white'
                        : 'opacity-60 hover:opacity-100'
                    )
                  "
                  :aria-label="pinnedItem.filename"
                  :aria-pressed="flipItem === pinnedItem"
                  @click="flipShowingRight = pinnedSide === 'right'"
                >
                  <img
                    :src="pinnedItem.url"
                    :alt="pinnedItem.filename"
                    class="size-full object-cover"
                  />
                </button>
                <div
                  v-if="otherFlipItems.length > 0"
                  class="h-6 w-px bg-white/20"
                />
                <div
                  v-for="other in otherFlipItems"
                  :key="other.index"
                  class="relative flex flex-col items-center"
                >
                  <span
                    v-if="cursorIndex === other.index"
                    class="absolute -top-2 size-1.5 rounded-full bg-white"
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    :class="
                      cn(
                        'size-8 cursor-pointer overflow-hidden rounded-sm border-none p-0 transition-all',
                        flipItem === other.item && cursorIndex === other.index
                          ? 'ring-2 ring-white'
                          : 'opacity-60 hover:opacity-100'
                      )
                    "
                    :aria-label="other.item.filename"
                    :aria-pressed="
                      flipItem === other.item && cursorIndex === other.index
                    "
                    @click="selectFlipCursor(other.index)"
                  >
                    <img
                      :src="other.item.url"
                      :alt="other.item.filename"
                      class="size-full object-cover"
                    />
                  </button>
                </div>
              </div>
            </div>

            <!-- Cursor navigation (wipe/flip with 3+ items) -->
            <template
              v-if="
                compareMode !== 'side-by-side' &&
                compareItems &&
                compareItems.length > 2
              "
            >
              <Button
                variant="secondary"
                size="icon-lg"
                class="absolute top-1/2 left-3 z-10 -translate-y-1/2 rounded-full"
                :aria-label="$t('g.previous')"
                @click="advanceCursor(-1)"
              >
                <i class="icon-[lucide--chevron-left] size-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon-lg"
                class="absolute top-1/2 right-3 z-10 -translate-y-1/2 rounded-full"
                :aria-label="$t('g.next')"
                @click="advanceCursor(1)"
              >
                <i class="icon-[lucide--chevron-right] size-6" />
              </Button>
            </template>
          </main>
        </div>
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import type { ResultItemImpl } from '@/stores/queueStore'
import { cn } from '@/utils/tailwindUtil'

import LightboxAssetView from './LightboxAssetView.vue'

const { t } = useI18n()

type CompareMode = 'side-by-side' | 'wipe' | 'flip'

const compareModes: CompareMode[] = ['side-by-side', 'wipe', 'flip']

const modeIcon: Record<CompareMode, string> = {
  'side-by-side': 'icon-[lucide--columns-2]',
  wipe: 'icon-[lucide--chevrons-left-right]',
  flip: 'icon-[lucide--arrow-left-right]'
}

const emit = defineEmits<{
  (e: 'update:activeIndex', value: number): void
}>()

const props = defineProps<{
  allGalleryItems: ResultItemImpl[]
  activeIndex: number
  compareItems?: ResultItemImpl[]
}>()

const isCompareMode = computed(() => (props.compareItems?.length ?? 0) >= 2)

const galleryVisible = ref(false)
const dialogRef = ref<HTMLElement>()
let previouslyFocusedElement: HTMLElement | null = null

// Single-item flow
const hasMultiple = computed(() => props.allGalleryItems.length > 1)
const activeItem = computed(() => props.allGalleryItems[props.activeIndex])

// Compare-mode state
const compareMode = ref<CompareMode>('side-by-side')
const pinnedSide = ref<'left' | 'right'>('left')
const pinnedIndex = ref(0)
const cursorIndex = ref(1)
const wipePosition = ref(0.5)
const flipShowingRight = ref(false)

const compareItemsSafe = computed(() => props.compareItems ?? [])

const leftItem = computed<ResultItemImpl | undefined>(() =>
  pinnedSide.value === 'left'
    ? compareItemsSafe.value[pinnedIndex.value]
    : compareItemsSafe.value[cursorIndex.value]
)

const rightItem = computed<ResultItemImpl | undefined>(() =>
  pinnedSide.value === 'right'
    ? compareItemsSafe.value[pinnedIndex.value]
    : compareItemsSafe.value[cursorIndex.value]
)

const flipItem = computed<ResultItemImpl | undefined>(() =>
  flipShowingRight.value ? rightItem.value : leftItem.value
)

const pinnedItem = computed<ResultItemImpl | undefined>(
  () => compareItemsSafe.value[pinnedIndex.value]
)

const otherFlipItems = computed(() =>
  compareItemsSafe.value
    .map((item, index) => ({ item, index }))
    .filter((entry) => entry.index !== pinnedIndex.value)
)

const showPinHighlight = computed(() => compareItemsSafe.value.length > 2)

const cursorPositionLabel = computed(() => {
  const total = compareItemsSafe.value.length
  if (total <= 2) return ''
  return `${cursorIndex.value + 1} / ${total}`
})

const modeHint = computed(() => {
  const total = compareItemsSafe.value.length
  const parts: string[] = []
  if (compareMode.value === 'wipe')
    parts.push(t('mediaAsset.compare.hint.wipe'))
  if (compareMode.value === 'flip')
    parts.push(t('mediaAsset.compare.hint.flip'))
  if (total > 2 && compareMode.value !== 'side-by-side')
    parts.push(t('mediaAsset.compare.hint.navigate', { count: total }))
  return parts.join(' · ')
})

// Reset compare state whenever the compare set changes identity or the dialog opens fresh
watch(
  () => [props.compareItems, props.activeIndex] as const,
  ([items, idx]) => {
    if (!items || items.length < 2 || idx === -1) return
    compareMode.value = 'side-by-side'
    pinnedSide.value = 'left'
    pinnedIndex.value = 0
    cursorIndex.value = items.length >= 2 ? 1 : 0
    wipePosition.value = 0.5
    flipShowingRight.value = false
  }
)

watch(
  () => props.activeIndex,
  (index) => {
    galleryVisible.value = index !== -1
    if (index !== -1) {
      previouslyFocusedElement = document.activeElement as HTMLElement | null
      void nextTick(() => dialogRef.value?.focus())
    }
  },
  { immediate: true }
)

function close() {
  galleryVisible.value = false
  emit('update:activeIndex', -1)
  previouslyFocusedElement?.focus()
  previouslyFocusedElement = null
}

function navigateImage(direction: number) {
  const newIndex =
    (props.activeIndex + direction + props.allGalleryItems.length) %
    props.allGalleryItems.length
  emit('update:activeIndex', newIndex)
}

function advanceCursor(direction: number) {
  const total = compareItemsSafe.value.length
  if (total <= 2) return
  let next = cursorIndex.value
  for (let i = 0; i < total; i++) {
    next = (next + direction + total) % total
    if (next !== pinnedIndex.value) break
  }
  cursorIndex.value = next
}

function setPin(side: 'left' | 'right') {
  if (pinnedSide.value === side) return
  const prevPin = pinnedIndex.value
  pinnedIndex.value = cursorIndex.value
  cursorIndex.value = prevPin
  pinnedSide.value = side
}

function togglePin() {
  setPin(pinnedSide.value === 'left' ? 'right' : 'left')
}

function selectFlipCursor(index: number) {
  if (index === pinnedIndex.value) return
  cursorIndex.value = index
  flipShowingRight.value = pinnedSide.value !== 'right'
}

function setMode(mode: CompareMode) {
  compareMode.value = mode
}

function cycleMode() {
  const i = compareModes.indexOf(compareMode.value)
  compareMode.value = compareModes[(i + 1) % compareModes.length]
}

const wipeBoxRef = ref<HTMLElement>()
let wipeDragging = false

function onWipePointerDown(event: PointerEvent) {
  if (!wipeBoxRef.value) return
  wipeDragging = true
  ;(event.target as HTMLElement).setPointerCapture?.(event.pointerId)
  updateWipePosition(event)
  window.addEventListener('pointermove', onWipePointerMove)
  window.addEventListener('pointerup', onWipePointerUp)
}

function onWipePointerMove(event: PointerEvent) {
  if (!wipeDragging) return
  updateWipePosition(event)
}

function onWipePointerUp() {
  wipeDragging = false
  window.removeEventListener('pointermove', onWipePointerMove)
  window.removeEventListener('pointerup', onWipePointerUp)
}

function updateWipePosition(event: PointerEvent) {
  const el = wipeBoxRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const ratio = (event.clientX - rect.left) / rect.width
  wipePosition.value = Math.max(0, Math.min(1, ratio))
}

let maskMouseDownTarget: EventTarget | null = null

function onMaskMouseDown(event: MouseEvent) {
  maskMouseDownTarget = event.target
}

function onMaskMouseUp(event: MouseEvent) {
  if (
    maskMouseDownTarget === event.target &&
    (event.target as HTMLElement)?.hasAttribute('data-mask')
  ) {
    close()
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (isCompareMode.value) {
    const compareActions: Record<string, () => void> = {
      '/': () => cycleMode(),
      p: () => togglePin(),
      P: () => togglePin(),
      ' ': () => {
        if (compareMode.value === 'flip') {
          flipShowingRight.value = !flipShowingRight.value
        }
      },
      ArrowLeft: () => advanceCursor(-1),
      ArrowRight: () => advanceCursor(1),
      Escape: () => close()
    }
    const action = compareActions[event.key]
    if (action) {
      event.preventDefault()
      action()
    }
    return
  }

  const actions: Record<string, () => void> = {
    ArrowLeft: () => navigateImage(-1),
    ArrowRight: () => navigateImage(1),
    Escape: () => close()
  }

  const action = actions[event.key]
  if (action) {
    event.preventDefault()
    action()
  }
}
</script>
