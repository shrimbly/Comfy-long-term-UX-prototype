<!--
  A small "info" affordance: an info glyph that reveals a styled tooltip on
  hover/focus. Content is slotted so callers supply i18n'd copy. Built on the
  design-system base (reka-ui Tooltip) rather than a native title so the body
  can hold a few short lines and read at a glance.
-->
<template>
  <TooltipProvider :delay-duration="150">
    <TooltipRoot>
      <TooltipTrigger
        type="button"
        :aria-label="label"
        class="inline-flex cursor-default appearance-none items-center border-0 bg-transparent p-0 text-muted-foreground transition-colors hover:text-base-foreground focus-visible:text-base-foreground focus-visible:outline-none"
      >
        <i class="icon-[lucide--info] size-3.5" />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          :side-offset="6"
          class="z-50 flex max-w-80 flex-col gap-1 rounded-lg border border-border-default bg-interface-menu-surface p-3 text-xs/tight text-base-foreground shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
        >
          <slot />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

<script setup lang="ts">
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger
} from 'reka-ui'

const { label } = defineProps<{
  label: string
}>()
</script>
