<!--
  Project visibility tier dropdown. Same trigger style as RoleDropdown so
  the Sharing modal reads as one cohesive surface. Two options only:
  Restricted ↔ Workspace-wide; Private (Drafts) is sticky and never
  surfaced here.
-->
<template>
  <div ref="containerRef" class="relative inline-flex">
    <button
      type="button"
      class="inline-flex h-7 cursor-pointer appearance-none items-center gap-1 rounded-md border-0 bg-transparent px-2 text-xs text-muted-foreground transition-colors hover:bg-secondary-background hover:text-base-foreground focus:outline-none"
      @click="open = !open"
    >
      {{ t(`prototype.projectTier.${tier}`) }}
      <span class="icon-[lucide--chevron-down] size-3" />
    </button>
    <div
      v-if="open"
      class="absolute top-full right-0 z-20 mt-1 flex w-56 flex-col gap-0.5 rounded-lg border border-border-default bg-interface-menu-surface p-1 text-sm shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
    >
      <button
        v-for="opt in options"
        :key="opt"
        type="button"
        :class="
          cn(
            'flex w-full cursor-pointer appearance-none items-center justify-between rounded-sm border-0 bg-transparent px-3 py-2 text-left text-base-foreground transition-colors hover:bg-interface-menu-component-surface-hovered focus:bg-interface-menu-component-surface-hovered focus:outline-none'
          )
        "
        @click="onSelect(opt)"
      >
        <span>{{ t(`prototype.projectTier.${opt}`) }}</span>
        <span
          v-if="opt === tier"
          class="icon-[lucide--check] size-3.5 text-muted-foreground"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { onClickOutside } from '@vueuse/core'
import { ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import type { ProjectTier } from '../types'

defineProps<{
  tier: ProjectTier
}>()

const emit = defineEmits<{
  select: [tier: ProjectTier]
}>()

const { t } = useI18n()
const containerRef = useTemplateRef<HTMLElement>('containerRef')
const open = ref(false)

onClickOutside(containerRef, () => {
  open.value = false
})

const options: ProjectTier[] = ['restricted', 'workspace-wide']

function onSelect(next: ProjectTier) {
  open.value = false
  emit('select', next)
}
</script>
