<template>
  <button
    type="button"
    :class="
      cn(
        'flex w-full cursor-pointer items-center-safe gap-2 rounded-md border-none px-4 py-3 text-left text-sm text-base-foreground transition-colors select-none',
        active
          ? 'bg-interface-menu-component-surface-selected'
          : 'bg-transparent hover:bg-interface-menu-component-surface-hovered'
      )
    "
    @click="emit('click')"
  >
    <i :class="cn(icon, 'text-neutral shrink-0 text-sm')" />
    <span class="min-w-0 truncate">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { cn } from '@/utils/tailwindUtil'

defineProps<{
  active: boolean
  icon: string
  label: string
}>()

const emit = defineEmits<{ click: [] }>()
</script>
