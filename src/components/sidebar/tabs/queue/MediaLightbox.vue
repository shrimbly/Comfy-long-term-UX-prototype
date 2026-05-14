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

      <!-- Compare mode (lightbox) -->
      <template v-else>
        <!-- Top-left mode buttons -->
        <div
          class="absolute top-4 left-4 z-10 flex items-center gap-1 rounded-lg bg-black/50 p-1 backdrop-blur-sm"
        >
          <Button
            v-for="mode in compareModes"
            :key="mode"
            :variant="compareMode === mode ? 'overlay-white' : 'textonly'"
            size="md"
            :class="
              cn(compareMode !== mode && 'text-white/80 hover:bg-white/10')
            "
            :aria-label="$t(`mediaAsset.compare.mode.${mode}`)"
            :aria-pressed="compareMode === mode"
            @click="setMode(mode)"
          >
            <i :class="cn(modeIcon[mode], 'size-4 shrink-0')" />
            <span class="hidden sm:inline">{{
              $t(`mediaAsset.compare.mode.${mode}`)
            }}</span>
          </Button>
        </div>

        <div class="relative flex size-full flex-col text-white">
          <!-- Side-by-side -->
          <div
            v-if="compareMode === 'side-by-side'"
            :class="
              cn(
                'flex size-full items-stretch gap-4 px-2 pt-14',
                showPinHighlight ? 'pb-16' : 'pb-4'
              )
            "
          >
            <div
              :class="
                cn(
                  'group/panel relative flex h-full flex-1 items-center justify-center',
                  showPinHighlight && pinnedSide !== 'left' && 'cursor-pointer'
                )
              "
              @click="
                showPinHighlight && pinnedSide !== 'left' && setPin('left')
              "
            >
              <div
                class="inline-grid max-h-full max-w-full grid-rows-[auto_minmax(0,1fr)]"
              >
                <div
                  class="flex h-6 shrink-0 items-center justify-end gap-1.5 text-sm select-none"
                >
                  <span
                    :class="
                      pinnedSide === 'left' ? 'text-white' : 'text-white/40'
                    "
                  >
                    {{
                      pinnedSide === 'left'
                        ? $t('mediaAsset.compare.pinned')
                        : $t('mediaAsset.compare.pinImage')
                    }}
                  </span>
                  <i
                    :class="
                      pinnedSide === 'left'
                        ? 'icon-[ph--push-pin-fill] size-4 text-white'
                        : 'icon-[ph--push-pin] size-4 text-white/40'
                    "
                  />
                </div>
                <div class="relative flex min-h-0 items-center justify-end">
                  <LightboxAssetView
                    v-if="leftItem"
                    :item="leftItem"
                    class="max-h-full max-w-full"
                  />
                  <div
                    class="absolute top-3 right-3 z-10 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover/panel:opacity-100"
                    @click.stop
                  >
                    <AssetFavoriteToggle
                      v-if="leftAsset"
                      :asset="leftAsset"
                      :pill="true"
                      :visible="true"
                    />
                    <Button
                      v-tooltip.top.pt:pointer-events-none="$t('g.remove')"
                      variant="overlay-white"
                      size="icon"
                      class="transition-transform duration-150 ease-out hover:scale-110"
                      :aria-label="$t('g.remove')"
                      @click.stop="removeFromCompare(leftIndex)"
                    >
                      <i class="icon-[lucide--circle-minus] size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div
              :class="
                cn(
                  'group/panel relative flex h-full flex-1 items-center justify-center',
                  showPinHighlight && pinnedSide !== 'right' && 'cursor-pointer'
                )
              "
              @click="
                showPinHighlight && pinnedSide !== 'right' && setPin('right')
              "
            >
              <div
                class="inline-grid max-h-full max-w-full grid-rows-[auto_minmax(0,1fr)]"
              >
                <div
                  class="flex h-6 shrink-0 items-center justify-start gap-1.5 text-sm select-none"
                >
                  <i
                    :class="
                      pinnedSide === 'right'
                        ? 'icon-[ph--push-pin-fill] size-4 text-white'
                        : 'icon-[ph--push-pin] size-4 text-white/40'
                    "
                  />
                  <span
                    :class="
                      pinnedSide === 'right' ? 'text-white' : 'text-white/40'
                    "
                  >
                    {{
                      pinnedSide === 'right'
                        ? $t('mediaAsset.compare.pinned')
                        : $t('mediaAsset.compare.pinImage')
                    }}
                  </span>
                </div>
                <div class="relative flex min-h-0 items-center justify-start">
                  <LightboxAssetView
                    v-if="rightItem"
                    :item="rightItem"
                    class="max-h-full max-w-full"
                  />
                  <div
                    class="absolute top-3 left-3 z-10 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover/panel:opacity-100"
                    @click.stop
                  >
                    <AssetFavoriteToggle
                      v-if="rightAsset"
                      :asset="rightAsset"
                      :pill="true"
                      :visible="true"
                    />
                    <Button
                      v-tooltip.top.pt:pointer-events-none="$t('g.remove')"
                      variant="overlay-white"
                      size="icon"
                      class="transition-transform duration-150 ease-out hover:scale-110"
                      :aria-label="$t('g.remove')"
                      @click.stop="removeFromCompare(rightIndex)"
                    >
                      <i class="icon-[lucide--circle-minus] size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-if="showPinHighlight"
              :class="
                cn(
                  'pointer-events-none absolute bottom-4 flex justify-center',
                  pinnedSide === 'left'
                    ? 'right-0 left-1/2'
                    : 'right-1/2 left-0'
                )
              "
            >
              <div
                class="pointer-events-auto flex items-center gap-2 rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm"
              >
                <Button
                  variant="textonly"
                  size="icon"
                  class="rounded-full text-white hover:bg-white/10"
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
                  variant="textonly"
                  size="icon"
                  class="rounded-full text-white hover:bg-white/10"
                  :aria-label="$t('g.next')"
                  @click="advanceCursor(1)"
                >
                  <i class="icon-[lucide--chevron-right] size-4" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Wipe -->
          <div
            v-else-if="compareMode === 'wipe'"
            class="flex size-full flex-col items-stretch px-4 pt-20 pb-6 select-none"
          >
            <div
              class="mb-2 flex h-7 shrink-0 items-center justify-between gap-2 px-1 text-sm select-none"
            >
              <button
                type="button"
                :class="
                  cn(
                    'flex items-center gap-1.5 border-0 bg-transparent p-0 text-inherit',
                    showPinHighlight && pinnedSide !== 'left'
                      ? 'cursor-pointer'
                      : 'cursor-default'
                  )
                "
                :disabled="!showPinHighlight || pinnedSide === 'left'"
                :aria-label="$t('mediaAsset.compare.pin')"
                @click="setPin('left')"
              >
                <i
                  :class="
                    pinnedSide === 'left'
                      ? 'icon-[ph--push-pin-fill] size-4 text-white'
                      : 'icon-[ph--push-pin] size-4 text-white/40'
                  "
                />
                <span
                  :class="
                    pinnedSide === 'left' ? 'text-white' : 'text-white/40'
                  "
                >
                  {{
                    pinnedSide === 'left'
                      ? $t('mediaAsset.compare.pinned')
                      : showPinHighlight
                        ? $t('mediaAsset.compare.pinImage')
                        : ''
                  }}
                </span>
              </button>
              <button
                type="button"
                :class="
                  cn(
                    'flex items-center gap-1.5 border-0 bg-transparent p-0 text-inherit',
                    showPinHighlight && pinnedSide !== 'right'
                      ? 'cursor-pointer'
                      : 'cursor-default'
                  )
                "
                :disabled="!showPinHighlight || pinnedSide === 'right'"
                :aria-label="$t('mediaAsset.compare.pin')"
                @click="setPin('right')"
              >
                <span
                  :class="
                    pinnedSide === 'right' ? 'text-white' : 'text-white/40'
                  "
                >
                  {{
                    pinnedSide === 'right'
                      ? $t('mediaAsset.compare.pinned')
                      : showPinHighlight
                        ? $t('mediaAsset.compare.pinImage')
                        : ''
                  }}
                </span>
                <i
                  :class="
                    pinnedSide === 'right'
                      ? 'icon-[ph--push-pin-fill] size-4 text-white'
                      : 'icon-[ph--push-pin] size-4 text-white/40'
                  "
                />
              </button>
            </div>
            <div
              ref="wipeAreaRef"
              class="flex min-h-0 w-full flex-1 items-center justify-center"
            >
              <div
                ref="wipeBoxRef"
                class="relative"
                :style="wipeBoxStyle"
                @pointerdown="onWipePointerDown"
              >
                <img
                  v-if="leftItem?.isImage"
                  :src="leftItem.url"
                  :alt="leftItem.filename"
                  class="pointer-events-none absolute inset-0 size-full object-contain"
                  @load="onLeftMediaLoad"
                />
                <video
                  v-else-if="leftItem?.isVideo"
                  :src="leftItem.url"
                  muted
                  loop
                  autoplay
                  playsinline
                  class="pointer-events-none absolute inset-0 size-full object-contain"
                  @loadedmetadata="onLeftMediaLoad"
                />
                <div
                  class="absolute inset-0 overflow-hidden"
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
                <div
                  class="absolute top-2 left-2 z-10 flex flex-col items-center gap-1"
                  @pointerdown.stop
                  @click.stop
                >
                  <AssetFavoriteToggle
                    v-if="leftAsset"
                    :asset="leftAsset"
                    :pill="true"
                    :visible="true"
                  />
                  <Button
                    v-tooltip.right.pt:pointer-events-none="$t('g.remove')"
                    variant="overlay-white"
                    size="icon"
                    class="transition-transform duration-150 ease-out hover:scale-110"
                    :aria-label="$t('g.remove')"
                    @click.stop="removeFromCompare(leftIndex)"
                  >
                    <i class="icon-[lucide--circle-minus] size-4" />
                  </Button>
                </div>
                <div
                  class="absolute top-2 right-2 z-10 flex flex-col items-center gap-1"
                  @pointerdown.stop
                  @click.stop
                >
                  <AssetFavoriteToggle
                    v-if="rightAsset"
                    :asset="rightAsset"
                    :pill="true"
                    :visible="true"
                  />
                  <Button
                    v-tooltip.left.pt:pointer-events-none="$t('g.remove')"
                    variant="overlay-white"
                    size="icon"
                    class="transition-transform duration-150 ease-out hover:scale-110"
                    :aria-label="$t('g.remove')"
                    @click.stop="removeFromCompare(rightIndex)"
                  >
                    <i class="icon-[lucide--circle-minus] size-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div
              v-if="showPinHighlight"
              class="mt-3 flex items-center justify-center gap-2"
            >
              <button
                v-if="pinnedItem"
                type="button"
                class="size-10 cursor-pointer overflow-hidden rounded-sm border-none p-0 opacity-60 transition-all hover:opacity-100"
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
                class="h-8 w-px bg-white/20"
              />
              <button
                v-for="other in otherFlipItems"
                :key="other.index"
                type="button"
                :class="
                  cn(
                    'size-10 cursor-pointer overflow-hidden rounded-sm border-none p-0 transition-all',
                    cursorIndex === other.index
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
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

          <!-- Flip -->
          <div
            v-else-if="compareMode === 'flip'"
            class="flex size-full flex-col items-center px-4 pt-20 pb-6"
          >
            <button
              type="button"
              :class="
                cn(
                  'mb-2 flex h-7 shrink-0 items-center justify-center gap-1.5 border-0 bg-transparent p-0 text-sm text-inherit select-none',
                  showPinHighlight && flipItem && flipItem !== pinnedItem
                    ? 'cursor-pointer'
                    : 'cursor-default'
                )
              "
              :disabled="
                !showPinHighlight || !flipItem || flipItem === pinnedItem
              "
              :aria-label="$t('mediaAsset.compare.pin')"
              @click="togglePin"
            >
              <i
                :class="
                  flipItem === pinnedItem
                    ? 'icon-[ph--push-pin-fill] size-4 text-white'
                    : 'icon-[ph--push-pin] size-4 text-white/40'
                "
              />
              <span
                :class="
                  flipItem === pinnedItem ? 'text-white' : 'text-white/40'
                "
              >
                {{
                  flipItem === pinnedItem
                    ? $t('mediaAsset.compare.pinned')
                    : showPinHighlight
                      ? $t('mediaAsset.compare.pinImage')
                      : ''
                }}
              </span>
            </button>
            <div
              class="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden"
            >
              <div class="relative inline-flex max-h-full max-w-full">
                <LightboxAssetView
                  v-if="flipItem"
                  :item="flipItem"
                  class="max-h-full max-w-full"
                />
                <span
                  class="absolute top-3 left-3 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold text-white"
                >
                  {{ flipShowingRight ? 'B' : 'A' }}
                </span>
                <div
                  class="absolute top-3 right-3 z-10 flex flex-col items-center gap-1"
                  @click.stop
                >
                  <AssetFavoriteToggle
                    v-if="flipAsset"
                    :asset="flipAsset"
                    :pill="true"
                    :visible="true"
                  />
                  <Button
                    v-tooltip.left.pt:pointer-events-none="$t('g.remove')"
                    variant="overlay-white"
                    size="icon"
                    class="transition-transform duration-150 ease-out hover:scale-110"
                    :aria-label="$t('g.remove')"
                    @click.stop="removeFromCompare(flipIndex)"
                  >
                    <i class="icon-[lucide--circle-minus] size-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div class="mt-3 flex items-center justify-center gap-2">
              <button
                v-if="pinnedItem"
                type="button"
                :class="
                  cn(
                    'size-10 cursor-pointer overflow-hidden rounded-sm border-none p-0 transition-all',
                    flipItem === pinnedItem
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
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
                class="h-8 w-px bg-white/20"
              />
              <button
                v-for="other in otherFlipItems"
                :key="other.index"
                type="button"
                :class="
                  cn(
                    'size-10 cursor-pointer overflow-hidden rounded-sm border-none p-0 transition-all',
                    flipItem === other.item && cursorIndex === other.index
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
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
        </div>
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'

import Button from '@/components/ui/button/Button.vue'
import AssetFavoriteToggle from '@/platform/assets/components/AssetFavoriteToggle.vue'
import type { AssetItem } from '@/platform/assets/schemas/assetSchema'
import type { ResultItemImpl } from '@/stores/queueStore'
import { cn } from '@comfyorg/tailwind-utils'

import LightboxAssetView from './LightboxAssetView.vue'

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
}>()

const compareItems = defineModel<ResultItemImpl[] | undefined>('compareItems')
const compareAssets = defineModel<AssetItem[] | undefined>('compareAssets')

const isCompareMode = computed(() => (compareItems.value?.length ?? 0) >= 2)

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

const compareItemsSafe = computed(() => compareItems.value ?? [])
const compareAssetsSafe = computed(() => compareAssets.value ?? [])

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

const leftIndex = computed(() =>
  pinnedSide.value === 'left' ? pinnedIndex.value : cursorIndex.value
)

const rightIndex = computed(() =>
  pinnedSide.value === 'right' ? pinnedIndex.value : cursorIndex.value
)

const leftAsset = computed<AssetItem | undefined>(
  () => compareAssetsSafe.value[leftIndex.value]
)

const rightAsset = computed<AssetItem | undefined>(
  () => compareAssetsSafe.value[rightIndex.value]
)

const flipItem = computed<ResultItemImpl | undefined>(() =>
  flipShowingRight.value ? rightItem.value : leftItem.value
)

const flipAsset = computed<AssetItem | undefined>(() =>
  flipShowingRight.value ? rightAsset.value : leftAsset.value
)

const flipIndex = computed(() =>
  flipShowingRight.value ? rightIndex.value : leftIndex.value
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

// Reset compare state on a fresh session (new compare set or new active item),
// but not when the user trims the current set via removeFromCompare.
let lastCompareItemIds = ''
watch(
  () => [compareItems.value, props.activeIndex] as const,
  ([items, idx]) => {
    if (!items || items.length < 2 || idx === -1) {
      lastCompareItemIds = ''
      return
    }
    const ids = items.map((i) => i.url).join('|')
    const isSubset =
      lastCompareItemIds.length > 0 &&
      ids.split('|').every((id) => lastCompareItemIds.includes(id))
    lastCompareItemIds = ids
    if (isSubset) return
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

function removeFromCompare(index: number) {
  const items = compareItemsSafe.value
  const assets = compareAssetsSafe.value
  if (items.length === 0) return
  if (items.length <= 2) {
    compareItems.value = []
    compareAssets.value = []
    close()
    return
  }
  const newItems = items.filter((_, i) => i !== index)
  const newAssets = assets.filter((_, i) => i !== index)
  let newPinned: number
  let newCursor: number
  if (index === pinnedIndex.value) {
    newPinned =
      cursorIndex.value < index ? cursorIndex.value : cursorIndex.value - 1
    newCursor = newPinned === 0 ? Math.min(1, newItems.length - 1) : 0
  } else if (index === cursorIndex.value) {
    newPinned =
      pinnedIndex.value < index ? pinnedIndex.value : pinnedIndex.value - 1
    newCursor = newPinned === 0 ? Math.min(1, newItems.length - 1) : 0
  } else {
    newPinned =
      pinnedIndex.value < index ? pinnedIndex.value : pinnedIndex.value - 1
    newCursor =
      cursorIndex.value < index ? cursorIndex.value : cursorIndex.value - 1
  }
  compareItems.value = newItems
  compareAssets.value = newAssets
  pinnedIndex.value = newPinned
  cursorIndex.value = newCursor
}

function setMode(mode: CompareMode) {
  compareMode.value = mode
}

function cycleMode() {
  const i = compareModes.indexOf(compareMode.value)
  compareMode.value = compareModes[(i + 1) % compareModes.length]
}

const wipeBoxRef = ref<HTMLElement>()
const wipeAreaRef = ref<HTMLElement | null>(null)
const { width: wipeAreaW, height: wipeAreaH } = useElementSize(wipeAreaRef)
const leftAspectRatio = ref<number | null>(null)

function onLeftMediaLoad(event: Event) {
  const target = event.target as HTMLImageElement | HTMLVideoElement | null
  if (!target) return
  const w =
    target instanceof HTMLImageElement ? target.naturalWidth : target.videoWidth
  const h =
    target instanceof HTMLImageElement
      ? target.naturalHeight
      : target.videoHeight
  if (w && h) leftAspectRatio.value = w / h
}

watch(
  () => leftItem.value?.url,
  () => {
    leftAspectRatio.value = null
  }
)

const wipeBoxStyle = computed(() => {
  const aspect = leftAspectRatio.value
  const aw = wipeAreaW.value
  const ah = wipeAreaH.value
  if (!aspect || aw === 0 || ah === 0) return {} as Record<string, string>
  const fitWidth = aspect >= aw / ah
  return fitWidth
    ? { width: `${aw}px`, height: `${aw / aspect}px` }
    : { width: `${ah * aspect}px`, height: `${ah}px` }
})

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
