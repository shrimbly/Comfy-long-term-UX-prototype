<!--
  Template gallery card, modeled on the ComfyHub / production template-library
  card: a 1:1 square thumbnail (the real upstream animated-webp media) with a
  use-case pill, then title + description beneath. Square ratio matches the
  source media (≈350²/400²) so previews aren't cropped.

  `compareSlider` templates get the prod before/after "wipe": the `-2` overlay
  is clip-revealed to the pointer's X position with a divider line (ported from
  components/templates/thumbnails/CompareSliderThumbnail.vue). Others get a
  plain image with a slow hover zoom.

  Typography/spacing mirror the prod gallery card: title `text-sm`/clamp-1,
  description `text-sm` muted/clamp-2, `gap-2 pt-3`.

  The pill scrim + wipe divider sit ON TOP of arbitrary media for legibility,
  so they are intentionally theme-independent (not a `dark:`/token concern).
-->
<template>
  <button
    type="button"
    class="group flex cursor-pointer flex-col text-left text-base-foreground"
    @click="emit('open')"
  >
    <span
      class="relative block aspect-square w-full overflow-hidden rounded-xl bg-secondary-background ring-1 ring-border-subtle transition-shadow select-none group-hover:ring-2 group-hover:ring-border-default"
      @mousemove="onMouseMove"
    >
      <template v-if="isWipe">
        <img
          :src="templateThumbnailUrl(template.id)"
          :alt="template.name"
          loading="lazy"
          draggable="false"
          class="size-full object-cover"
        />
        <img
          :src="templateOverlayThumbnailUrl(template.id)"
          :alt="template.name"
          loading="lazy"
          draggable="false"
          class="absolute inset-0 size-full object-cover"
          :style="{ clipPath: `inset(0 ${100 - wipe}% 0 0)` }"
        />
        <span
          class="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white/50 backdrop-blur-sm"
          :style="{ left: `${wipe}%` }"
        />
      </template>
      <img
        v-else
        :src="templateThumbnailUrl(template.id)"
        :alt="template.name"
        loading="lazy"
        draggable="false"
        class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      <TemplateProviderBadge
        v-if="template.provider"
        :provider="template.provider"
      />

      <span
        v-if="primaryUseCase"
        class="absolute bottom-2 left-2 z-20 rounded-md bg-black/55 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm"
      >
        {{ primaryUseCase }}
      </span>
    </span>

    <span class="flex flex-col gap-2 pt-3">
      <span class="line-clamp-1 text-sm" :title="template.name">{{
        template.name
      }}</span>
      <span
        class="line-clamp-2 text-sm text-muted-foreground"
        :title="template.description"
        >{{ template.description }}</span
      >
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import type { WorkflowTemplate } from '../types'
import {
  templateOverlayThumbnailUrl,
  templateThumbnailUrl
} from '../utils/thumbnail'
import TemplateProviderBadge from './TemplateProviderBadge.vue'

const { template } = defineProps<{ template: WorkflowTemplate }>()

const emit = defineEmits<{ open: [] }>()

const primaryUseCase = computed(() => template.useCases[0] ?? '')
const isWipe = computed(() => template.thumbnailVariant === 'compareSlider')

const wipe = ref(50)

function onMouseMove(event: MouseEvent) {
  if (!isWipe.value) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  if (rect.width === 0) return
  const raw = ((event.clientX - rect.left) / rect.width) * 100
  wipe.value = Math.max(0, Math.min(100, raw))
}
</script>
