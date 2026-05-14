<!--
  Per-row project role dropdown. Three options + "Remove from project."
  Owner option only appears when the viewer is themselves a project Owner
  (project Collaborators can't promote others to Owner).
-->
<template>
  <div ref="containerRef" class="relative inline-flex">
    <button
      type="button"
      class="inline-flex h-7 cursor-pointer appearance-none items-center gap-1 rounded-md border-0 bg-transparent px-2 text-xs text-muted-foreground transition-colors hover:bg-secondary-background hover:text-base-foreground focus:outline-none"
      @click="open = !open"
    >
      {{ t(`prototype.views.projectRole.${role}`) }}
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
            'flex w-full cursor-pointer appearance-none items-center justify-between rounded-sm border-0 bg-transparent px-3 py-2 text-left text-base-foreground transition-colors hover:bg-interface-menu-component-surface-hovered focus:bg-interface-menu-component-surface-hovered focus:outline-none',
            opt === role && 'text-base-foreground'
          )
        "
        @click="onSelect(opt)"
      >
        <span>{{ t(`prototype.views.projectRole.${opt}`) }}</span>
        <span
          v-if="opt === role"
          class="icon-[lucide--check] size-3.5 text-muted-foreground"
        />
      </button>
      <div class="my-0.5 h-px bg-border-default" />
      <button
        type="button"
        class="text-danger-foreground w-full cursor-pointer appearance-none rounded-sm border-0 bg-transparent px-3 py-2 text-left transition-colors hover:bg-interface-menu-component-surface-hovered focus:bg-interface-menu-component-surface-hovered focus:outline-none"
        @click="onRemove"
      >
        {{ t('prototype.views.project.sharing.removeFromProject') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { onClickOutside } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import type { ProjectRole } from '../types'

const { role, viewerCanSetOwner = false } = defineProps<{
  role: ProjectRole
  viewerCanSetOwner?: boolean
}>()

const emit = defineEmits<{
  select: [role: ProjectRole]
  remove: []
}>()

const { t } = useI18n()
const containerRef = useTemplateRef<HTMLElement>('containerRef')
const open = ref(false)

onClickOutside(containerRef, () => {
  open.value = false
})

const options = computed<ProjectRole[]>(() => {
  // Project Guest is intentionally omitted: per
  // ../IA_Plan/wiki/concepts/three-level-permissions.md, a Project Guest
  // cannot view the project at all — they arrive at that role via
  // asset-level invites, not by being demoted from inside this panel.
  const base: ProjectRole[] = ['collaborator']
  if (viewerCanSetOwner) base.unshift('owner')
  return base
})

function onSelect(next: ProjectRole) {
  open.value = false
  emit('select', next)
}

function onRemove() {
  open.value = false
  emit('remove')
}
</script>
