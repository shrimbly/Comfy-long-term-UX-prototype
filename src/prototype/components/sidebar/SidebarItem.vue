<!--
  Implements:
    Modeled on ../../../../../ComfyUI_frontend/src/components/widget/nav/NavItem.vue
    (templates-gallery sidebar nav item).
-->
<template>
  <div
    role="button"
    tabindex="0"
    :class="
      cn(
        'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-base-foreground transition-colors select-none',
        active
          ? 'bg-interface-menu-component-surface-selected'
          : 'hover:bg-interface-menu-component-surface-hovered',
        muted && 'text-muted-foreground'
      )
    "
    @click="emit('click')"
    @keydown.enter.prevent="emit('click')"
    @keydown.space.prevent="emit('click')"
  >
    <i v-if="icon" :class="cn(icon, 'text-neutral shrink-0 text-sm')" />
    <span class="min-w-0 flex-1 truncate">{{ label }}</span>
    <span
      v-if="count != null"
      class="ml-auto min-h-5 min-w-5 rounded-full bg-base-foreground px-1.5 text-center text-xs/5 text-base-background"
    >
      {{ count }}
    </span>
  </div>
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
