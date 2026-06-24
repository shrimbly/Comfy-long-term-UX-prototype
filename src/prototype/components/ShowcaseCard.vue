<!--
  Large media tile for the Home featured gallery and the Templates gallery.
  Real image thumbnail when `image` is given, else a gradient placeholder, plus
  title + optional subtitle. Mirrors the raw-button card pattern of
  WorkflowCard / ProjectCard. Thumbnail aspect defaults to video (16:9);
  callers pass '3/2' for denser grids. `imagePosition` sets object-position so a
  square source crops well into the landscape tile.
-->
<template>
  <button
    type="button"
    class="group flex cursor-pointer flex-col gap-2 text-left text-base-foreground"
    @click="emit('open')"
  >
    <span
      :class="
        cn(
          'block w-full overflow-hidden rounded-xl transition-shadow group-hover:ring-2 group-hover:ring-border-subtle group-hover:ring-offset-2 group-hover:ring-offset-base-background',
          aspect === '3/2' ? 'aspect-3/2' : 'aspect-video'
        )
      "
      :style="image ? undefined : { background: thumbnail }"
    >
      <img
        v-if="image"
        :src="image"
        :alt="title"
        loading="lazy"
        draggable="false"
        class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        :style="{ objectPosition: imagePosition }"
      />
    </span>
    <span class="flex flex-col gap-0.5 px-0.5">
      <span class="truncate text-sm font-medium">{{ title }}</span>
      <span v-if="subtitle" class="truncate text-xs text-muted-foreground">{{
        subtitle
      }}</span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'

import { thumbnailGradient } from '../utils/thumbnail'

const {
  title,
  seed,
  subtitle,
  image,
  imagePosition,
  aspect = 'video'
} = defineProps<{
  title: string
  seed: string
  subtitle?: string
  image?: string
  imagePosition?: string
  aspect?: 'video' | '3/2'
}>()

const emit = defineEmits<{ open: [] }>()

const thumbnail = computed(() => thumbnailGradient(seed))
</script>
