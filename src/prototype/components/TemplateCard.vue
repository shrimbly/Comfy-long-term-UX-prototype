<!--
  Implements:
    Templates discovery grid item. Bare thumbnail + caption.
-->
<template>
  <article
    class="group flex cursor-pointer flex-col gap-2 text-base-foreground select-none"
  >
    <span
      class="relative block aspect-square w-full overflow-hidden rounded-md"
      :style="{ background: thumbnail }"
    />
    <span class="flex flex-col gap-0.5">
      <span class="truncate text-sm/tight">{{ template.name }}</span>
      <span
        v-if="template.description"
        class="line-clamp-2 text-xs text-muted-foreground"
      >
        {{ template.description }}
      </span>
    </span>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { thumbnailGradient } from '../utils/thumbnail'
import type { Template } from '../types'

const { template } = defineProps<{
  template: Template
}>()

const thumbnail = computed(() => thumbnailGradient(template.id))
</script>
