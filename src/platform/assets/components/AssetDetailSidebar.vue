<template>
  <aside
    :class="
      cn(
        'mt-5 flex shrink-0 flex-col overflow-hidden rounded-t-2xl bg-base-background transition-[width,margin-right] duration-300 ease-out',
        asset ? 'mr-3 w-96' : 'mr-0 w-0'
      )
    "
    role="complementary"
    :aria-label="$t('mediaAsset.details.assetDetails')"
    :aria-hidden="!asset"
  >
    <div v-if="displayAsset" class="flex h-full w-96 shrink-0 flex-col">
      <header
        class="flex h-22 shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-4"
      >
        <h3 class="text-sm font-semibold">
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
      <div class="scrollbar-custom flex-1 overflow-y-auto">
        <Transition
          mode="out-in"
          enter-active-class="transition-[transform,opacity] duration-150 ease-out"
          leave-active-class="transition-[transform,opacity] duration-100 ease-in"
          enter-from-class="scale-[0.98] opacity-0"
          leave-to-class="scale-[0.98] opacity-0"
        >
          <AssetDetailPanel
            :key="displayAsset.id"
            :assets="[displayAsset]"
            :prompt-metadata="promptMetadata"
          />
        </Transition>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, toRef, watch } from 'vue'

import Button from '@/components/ui/button/Button.vue'
import { cn } from '@comfyorg/tailwind-utils'

import { useAssetPromptMetadata } from '../composables/useAssetPromptMetadata'
import type { AssetItem } from '../schemas/assetSchema'
import type { PromptMetadata } from '../utils/promptMetadataParser'
import AssetDetailPanel from './AssetDetailPanel.vue'

const CLOSE_ANIMATION_MS = 300

const props = defineProps<{
  asset: AssetItem | null
}>()

const emit = defineEmits<{
  close: []
}>()

const assetRef = toRef(props, 'asset')

const displayAsset = ref<AssetItem | null>(props.asset)
let closeTimer: ReturnType<typeof setTimeout> | null = null

watch(assetRef, (newAsset) => {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  if (newAsset) {
    displayAsset.value = newAsset
  } else {
    closeTimer = setTimeout(() => {
      displayAsset.value = null
      closeTimer = null
    }, CLOSE_ANIMATION_MS)
  }
})

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
</script>
