<!--
  Styled hover/focus tooltip — the design-system (reka-ui) tooltip used across
  the prototype (see InfoTooltip), as a drop-in replacement for a native
  `title`. Wrap the trigger element in the default slot and pass the copy via
  `text`. The slot must have a single root element (rendered as the trigger).
-->
<template>
  <TooltipProvider :delay-duration="150">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal v-if="text">
        <TooltipContent
          :side-offset="6"
          class="z-50 max-w-xs rounded-lg border border-border-default bg-interface-menu-surface px-2.5 py-1.5 text-xs/tight text-base-foreground shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
        >
          {{ text }}
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

const { text } = defineProps<{ text?: string }>()
</script>
