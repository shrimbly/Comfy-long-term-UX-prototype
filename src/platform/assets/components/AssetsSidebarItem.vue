<template>
  <button
    type="button"
    :title="compact ? label : undefined"
    :aria-label="compact ? label : undefined"
    :class="
      cn(
        'flex w-full cursor-pointer items-center-safe rounded-md border-none text-left text-sm text-base-foreground transition-colors select-none',
        compact ? 'justify-center p-2' : 'gap-2 px-2 py-1.5',
        active
          ? 'bg-interface-menu-component-surface-selected'
          : 'bg-transparent hover:bg-interface-menu-component-surface-hovered'
      )
    "
    @click="emit('click')"
  >
    <i :class="cn(icon, 'text-neutral shrink-0 text-sm')" />
    <span v-if="!compact" class="min-w-0 truncate">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'

const { compact = false } = defineProps<{
  active: boolean
  icon: string
  label: string
  compact?: boolean
}>()

const emit = defineEmits<{ click: [] }>()
</script>
