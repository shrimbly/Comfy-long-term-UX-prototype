<!--
  Implements:
    Modeled on ../../../../../ComfyUI_frontend/src/components/widget/nav/NavTitle.vue
    (collapsible variant — same header style + chevron).
-->
<template>
  <section class="flex flex-col gap-1">
    <div
      role="button"
      tabindex="0"
      class="m-0 flex cursor-pointer items-center justify-between gap-2 px-3 pt-5 pb-0 select-none"
      @click="open = !open"
      @keydown.enter.prevent="open = !open"
      @keydown.space.prevent="open = !open"
    >
      <h3
        class="m-0 flex items-baseline gap-1.5 text-xs font-bold text-text-secondary uppercase"
      >
        <span>{{ label }}</span>
        <span v-if="count != null" class="text-text-secondary/70 normal-case">
          {{ count }}
        </span>
      </h3>
      <i
        :class="
          cn(
            'text-xs text-text-secondary transition-transform duration-200',
            open
              ? 'icon-[lucide--chevron-down]'
              : 'icon-[lucide--chevron-right]'
          )
        "
      />
    </div>
    <div v-if="open" class="flex flex-col gap-1">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { ref } from 'vue'

const { label, defaultOpen = true } = defineProps<{
  label: string
  count?: number | null
  defaultOpen?: boolean
}>()

const open = ref(defaultOpen)
</script>
