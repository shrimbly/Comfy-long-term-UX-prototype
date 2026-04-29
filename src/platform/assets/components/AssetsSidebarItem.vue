<template>
  <button
    type="button"
    :class="
      cn(
        'flex w-full cursor-pointer items-center gap-2 rounded-md border-none px-3 py-2 text-left text-sm text-base-foreground transition-colors',
        active
          ? 'bg-interface-menu-component-surface-selected'
          : 'bg-transparent hover:bg-interface-menu-component-surface-hovered'
      )
    "
    @click="emit('click')"
  >
    <i :class="cn(icon, 'size-3.5 shrink-0')" />
    <span class="truncate">{{ label }}</span>
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
