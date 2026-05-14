<template>
  <button
    type="button"
    :title="compact ? label : undefined"
    :aria-label="compact ? label : undefined"
    :class="
      cn(
        'flex w-full cursor-pointer items-center-safe rounded-md border-none text-left text-base-foreground transition-colors select-none',
        size === 'sm' ? 'text-sm' : 'text-base',
        compact
          ? size === 'sm'
            ? 'justify-center p-2'
            : 'justify-center px-2 py-3'
          : size === 'sm'
            ? 'gap-3 px-4 py-2'
            : 'gap-3 px-4 py-3',
        active
          ? 'bg-interface-menu-component-surface-selected'
          : 'bg-transparent hover:bg-interface-menu-component-surface-hovered'
      )
    "
    @click="emit('click')"
  >
    <i
      :class="
        cn(
          icon,
          'text-neutral shrink-0',
          size === 'sm' ? 'text-sm' : 'text-base'
        )
      "
    />
    <span v-if="!compact" class="min-w-0 truncate">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'

const { compact = false, size = 'default' } = defineProps<{
  active: boolean
  icon: string
  label: string
  compact?: boolean
  size?: 'default' | 'sm'
}>()

const emit = defineEmits<{ click: [] }>()
</script>
