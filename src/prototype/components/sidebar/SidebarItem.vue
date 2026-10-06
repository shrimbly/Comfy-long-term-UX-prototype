<!--
  Implements:
    Modeled on ../../../../../ComfyUI_frontend/src/components/widget/nav/NavItem.vue
    (templates-gallery sidebar nav item).
-->
<template>
  <button
    type="button"
    :aria-current="active ? 'page' : undefined"
    :class="
      cn(
        'flex h-9 w-full cursor-pointer items-center gap-2 rounded-xl px-3 text-left text-sm text-base-foreground transition-colors outline-none select-none focus-visible:ring-1 focus-visible:ring-border-default',
        active ? 'bg-secondary-background' : 'hover:bg-secondary-background',
        muted && 'text-muted-foreground'
      )
    "
    @click="emit('click')"
  >
    <i v-if="icon" :class="cn(icon, 'size-4 shrink-0')" />
    <span class="min-w-0 flex-1 truncate">{{ label }}</span>
    <span
      v-if="count != null"
      class="ml-auto min-h-5 min-w-5 rounded-full bg-base-foreground px-1.5 text-center text-xs/5 text-base-background"
    >
      {{ count }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'

const {
  label,
  icon,
  count,
  active = false,
  muted = false
} = defineProps<{
  label: string
  icon?: string
  count?: number | null
  active?: boolean
  muted?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()
</script>
