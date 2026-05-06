<template>
  <button
    type="button"
    :title="compact ? label : undefined"
    :aria-label="compact ? label : undefined"
    :class="
      cn(
        'flex w-full cursor-pointer items-center-safe rounded-md border-none text-left text-base text-base-foreground transition-colors select-none',
        compact ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3',
        active
          ? 'bg-interface-menu-component-surface-selected'
          : 'bg-transparent hover:bg-interface-menu-component-surface-hovered'
      )
    "
    @click="emit('click')"
  >
    <i :class="cn(icon, 'text-neutral shrink-0 text-base')" />
    <span v-if="!compact" class="min-w-0 truncate">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { cn } from '@/utils/tailwindUtil'

const { compact = false } = defineProps<{
  active: boolean
  icon: string
  label: string
  compact?: boolean
}>()

const emit = defineEmits<{ click: [] }>()
</script>
