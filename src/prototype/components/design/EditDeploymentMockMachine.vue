<!-- Static machine card for the Edit deployment design review. -->
<template>
  <div class="flex flex-col gap-3">
    <div
      class="overflow-hidden rounded-xl border border-border-subtle bg-secondary-background/40"
    >
      <div
        v-for="gpu in compact ? gpus.slice(0, 2) : gpus"
        :key="gpu.label"
        :class="
          cn(
            'grid h-10 grid-cols-[1.5rem_minmax(0,1fr)_5rem_4.5rem] items-center gap-3 border-b border-border-subtle/60 pr-4 pl-4.5 text-sm last:border-b-0',
            gpu.selected &&
              'bg-secondary-background-hover shadow-[inset_3px_0_0_var(--color-white)]'
          )
        "
      >
        <span
          :class="
            cn(
              'grid size-4.5 place-items-center rounded-full border',
              gpu.selected ? 'border-base-foreground' : 'border-border-default'
            )
          "
        >
          <span
            v-if="gpu.selected"
            class="size-2 rounded-full bg-base-foreground"
          />
        </span>
        <span class="font-medium">{{ gpu.label }}</span>
        <span class="text-right text-muted-foreground tabular-nums">
          {{ gpu.vram }}
        </span>
        <span class="text-right tabular-nums">{{ gpu.price }}</span>
      </div>
    </div>
    <div
      class="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-secondary-background/40 px-4 py-3 text-sm"
    >
      <span>{{ warmLabel }}</span>
      <span
        class="inline-flex h-7 items-center rounded-md border border-border-default px-3 text-[13px] tabular-nums"
      >
        {{ warmValue }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'

const { compact = false } = defineProps<{
  compact?: boolean
}>()

const warmLabel = 'Keep warm after a run'
const warmValue = '2 min'

const gpus = [
  { label: 'RTX PRO 6000', vram: '96 GB', price: '$4.54', selected: true },
  { label: 'H100 SXM', vram: '80 GB', price: '$6.23', selected: false },
  { label: 'H200 SXM', vram: '141 GB', price: '$7.71', selected: false },
  { label: 'B200', vram: '180 GB', price: '$11.23', selected: false }
]
</script>
