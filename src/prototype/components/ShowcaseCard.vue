<!--
  Large media tile for the Home featured gallery and the Templates gallery.
  Gradient placeholder thumbnail + title + optional subtitle. Mirrors the
  raw-button card pattern of WorkflowCard / ProjectCard. Thumbnail aspect
  defaults to video (16:9); callers pass '3/2' for denser grids.
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
      :style="{ background: thumbnail }"
    />
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
  aspect = 'video'
} = defineProps<{
  title: string
  seed: string
  subtitle?: string
  aspect?: 'video' | '3/2'
}>()

const emit = defineEmits<{ open: [] }>()

const thumbnail = computed(() => thumbnailGradient(seed))
</script>
