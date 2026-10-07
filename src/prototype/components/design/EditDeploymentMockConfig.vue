<!-- Static configuration card for the Edit deployment design review. -->
<template>
  <div
    class="flex flex-col rounded-xl border border-border-subtle bg-secondary-background/40 px-4 py-1"
  >
    <div
      v-for="(row, i) in rows"
      :key="row.label"
      :class="
        cn(
          'flex h-11.5 items-center justify-between gap-3 px-3 text-sm',
          i > 0 && 'border-t border-border-subtle'
        )
      "
    >
      <span class="text-muted-foreground">{{ row.label }}</span>
      <span class="flex items-center gap-2">
        {{ row.value }}
        <span v-if="row.detail" class="text-xs text-muted-foreground">
          {{ row.detail }}
        </span>
        <i :class="cn(row.icon, 'size-3.5 text-muted-foreground')" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'

const rows = [
  {
    label: 'Name',
    value: 'Acme Studio pipeline',
    icon: 'icon-[lucide--pencil]'
  },
  {
    label: 'ComfyUI',
    value: 'v0.39.1',
    detail: 'Latest stable',
    icon: 'icon-[lucide--chevron-down]'
  },
  {
    label: 'Models',
    value: '3 pinned',
    icon: 'icon-[lucide--chevron-right]'
  },
  {
    label: 'Custom nodes',
    value: '3 packs',
    icon: 'icon-[lucide--chevron-right]'
  }
]
</script>
