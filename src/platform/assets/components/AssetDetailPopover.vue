<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-[transform,opacity] duration-150 ease-out"
      leave-active-class="transition-[transform,opacity] duration-100 ease-in"
      enter-from-class="scale-[0.98] opacity-0"
      leave-to-class="scale-[0.98] opacity-0"
    >
      <div
        v-if="asset && anchor"
        ref="popoverRef"
        class="fixed z-1500 max-h-[80vh] w-80 origin-top-left overflow-y-auto rounded-lg border border-border-default bg-secondary-background text-base-foreground shadow-lg"
        :style="positionStyle"
        role="dialog"
        :aria-label="$t('mediaAsset.details.assetDetails')"
        @pointerdown.stop
        @click.stop
      >
        <Transition
          mode="out-in"
          enter-active-class="transition-[transform,opacity] duration-150 ease-out"
          leave-active-class="transition-[transform,opacity] duration-100 ease-in"
          enter-from-class="scale-[0.98] opacity-0"
          leave-to-class="scale-[0.98] opacity-0"
        >
          <div :key="asset.id">
            <header
              class="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-2"
            >
              <h3 class="m-0 text-sm font-semibold">
                {{ $t('mediaAsset.details.assetDetails') }}
              </h3>
              <Button
                variant="textonly"
                size="icon-sm"
                :aria-label="$t('g.close')"
                @click="emit('close')"
              >
                <i class="icon-[lucide--x] size-4" />
              </Button>
            </header>
            <AssetDetailPanel
              :assets="[asset]"
              :prompt-metadata="promptMetadata"
            />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useEventListener, useResizeObserver } from '@vueuse/core'
import { computed, nextTick, ref, toRef, watch } from 'vue'
import type { CSSProperties } from 'vue'

import Button from '@/components/ui/button/Button.vue'

import { useAssetPromptMetadata } from '../composables/useAssetPromptMetadata'
import type { AssetItem } from '../schemas/assetSchema'
import type { PromptMetadata } from '../utils/promptMetadataParser'
import AssetDetailPanel from './AssetDetailPanel.vue'

const POPOVER_GAP = 8
const POPOVER_WIDTH = 320

const props = defineProps<{
  asset: AssetItem | null
  anchor: HTMLElement | null
}>()

const assetRef = toRef(props, 'asset')
const anchorRef = toRef(props, 'anchor')

const emit = defineEmits<{
  close: []
}>()

const popoverRef = ref<HTMLElement | null>(null)
const positionStyle = ref<CSSProperties>({})

const metadataExtractor = useAssetPromptMetadata()
const promptMetadata = ref<PromptMetadata | null>(null)

watch(
  assetRef,
  async (newAsset, _old, onCleanup) => {
    if (!newAsset) {
      promptMetadata.value = null
      return
    }
    promptMetadata.value = metadataExtractor.getCached(newAsset.id)
    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })
    const result = await metadataExtractor.extractMetadata(newAsset)
    if (!cancelled) promptMetadata.value = result
  },
  { immediate: true }
)

function updatePosition() {
  const anchor = anchorRef.value
  if (!anchor) return
  const rect = anchor.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const showOnRight = rect.right + POPOVER_GAP + POPOVER_WIDTH <= viewportWidth
  const left = showOnRight
    ? rect.right + POPOVER_GAP
    : Math.max(POPOVER_GAP, rect.left - POPOVER_GAP - POPOVER_WIDTH)
  const popoverHeight = popoverRef.value?.offsetHeight ?? 0
  const maxTop = Math.max(
    POPOVER_GAP,
    viewportHeight - popoverHeight - POPOVER_GAP
  )
  const top = Math.min(Math.max(rect.top, POPOVER_GAP), maxTop)
  positionStyle.value = { left: `${left}px`, top: `${top}px` }
}

watch(
  [assetRef, anchorRef],
  async ([newAsset, newAnchor]) => {
    if (!newAsset || !newAnchor) return
    await nextTick()
    updatePosition()
  },
  { immediate: true, flush: 'post' }
)

useResizeObserver(popoverRef, () => updatePosition())
useEventListener(window, 'resize', updatePosition)
useEventListener(window, 'scroll', updatePosition, {
  capture: true,
  passive: true
})

useEventListener(
  window,
  'pointerdown',
  (event: PointerEvent) => {
    if (!assetRef.value) return
    if (!(event.target instanceof Node)) return
    if (popoverRef.value?.contains(event.target)) return
    emit('close')
  },
  { capture: true }
)

useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (assetRef.value && event.key === 'Escape') {
    event.stopPropagation()
    emit('close')
  }
})

const isOpen = computed(() => !!assetRef.value && !!anchorRef.value)
defineExpose({ isOpen })
</script>
