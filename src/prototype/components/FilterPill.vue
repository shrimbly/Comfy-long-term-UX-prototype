<!--
  Filter pill for list-toolbar filter rows (Recents, Projects). Active =
  inverted, inactive = secondary, with an optional count badge. Built on the
  design-system Button so every filter row reads identically.
-->
<template>
  <Button
    :variant="active ? 'inverted' : 'secondary'"
    size="unset"
    class="h-8 gap-1.5 rounded-full px-3 text-sm"
    @click="emit('click')"
  >
    <span>{{ label }}</span>
    <span
      v-if="count != null"
      :class="
        cn(
          'rounded-full px-1.5 text-xs',
          active
            ? 'bg-base-background text-base-foreground'
            : 'bg-secondary-background-hover text-muted-foreground'
        )
      "
    >
      {{ count }}
    </span>
  </Button>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'

import Button from '@/components/ui/button/Button.vue'

const {
  label,
  count = null,
  active = false
} = defineProps<{
  label: string
  count?: number | null
  active?: boolean
}>()

const emit = defineEmits<{ click: [] }>()
</script>
