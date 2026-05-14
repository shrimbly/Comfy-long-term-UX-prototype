<template>
  <div
    ref="wrapperRef"
    :class="
      cn(
        '@container pointer-events-none sticky z-50 mt-auto flex justify-center',
        offsetClass
      )
    "
  >
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="translate-y-3 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-3 opacity-0"
    >
      <div
        v-if="visible"
        class="pointer-events-auto flex max-w-full items-center gap-2 rounded-xl border border-border-subtle bg-secondary-background/95 px-3 py-2 shadow-2xl backdrop-blur-sm @md:gap-6"
        @click.stop
      >
        <div class="flex items-center gap-1">
          <Button
            v-tooltip.top="{
              value: t('mediaAsset.selection.selectAll'),
              disabled: labelsVisible
            }"
            variant="textonly"
            size="lg"
            :aria-label="t('mediaAsset.selection.selectAll')"
            @click="emit('selectAll')"
          >
            <i class="icon-[lucide--list-checks] size-4.5 @md:hidden" />
            <span class="hidden @md:inline">
              {{ t('mediaAsset.selection.selectAll') }}
            </span>
          </Button>
          <Button
            v-tooltip.top="{
              value: t('mediaAsset.selection.deselectAll'),
              disabled: labelsVisible
            }"
            variant="textonly"
            size="lg"
            :aria-label="t('mediaAsset.selection.deselectAll')"
            @click="emit('deselectAll')"
          >
            <i class="icon-[lucide--list-x] size-4.5 @md:hidden" />
            <span class="hidden @md:inline">
              {{ t('mediaAsset.selection.deselectAll') }}
            </span>
          </Button>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="inverted"
            size="lg"
            data-testid="assets-download-selected"
            :aria-label="t('mediaAsset.selection.downloadSelected')"
            @click="emit('download')"
          >
            <i class="icon-[lucide--download] size-4.5" />
            <span class="hidden @md:inline">
              {{ t('mediaAsset.selection.downloadSelected') }} ({{ count }})
            </span>
            <span class="@md:hidden">{{ count }}</span>
          </Button>
          <Button
            v-if="showDelete"
            variant="destructive"
            size="icon-lg"
            data-testid="assets-delete-selected"
            :aria-label="t('mediaAsset.selection.deleteSelected')"
            @click="emit('deleteSelected')"
          >
            <i class="icon-[lucide--trash-2] size-4.5" />
          </Button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import { cn } from '@comfyorg/tailwind-utils'

const {
  visible,
  count,
  showDelete = true,
  bottomOffset = 'md'
} = defineProps<{
  visible: boolean
  count: number
  showDelete?: boolean
  bottomOffset?: 'xs' | 'sm' | 'md' | 'lg'
}>()

const emit = defineEmits<{
  selectAll: []
  deselectAll: []
  download: []
  deleteSelected: []
}>()

const { t } = useI18n()

const wrapperRef = ref<HTMLElement | null>(null)
const { width } = useElementSize(wrapperRef)
// Mirrors the @md container-query breakpoint (28rem = 448px) used to swap
// icons for text labels — tooltip is suppressed once labels are visible.
const LABEL_BREAKPOINT_PX = 448
const labelsVisible = computed(() => width.value >= LABEL_BREAKPOINT_PX)

const OFFSET_CLASSES = {
  xs: 'bottom-1',
  sm: 'bottom-2',
  md: 'bottom-4',
  lg: 'bottom-6'
} as const

const offsetClass = computed(() => OFFSET_CLASSES[bottomOffset])
</script>
