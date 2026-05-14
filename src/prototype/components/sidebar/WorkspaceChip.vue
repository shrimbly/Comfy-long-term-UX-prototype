<!--
  Implements:
    concept:   ../IA_Plan/wiki/concepts/personas-and-flows.md
    reference: ../IA_Plan/wiki/references/competitive-sidebars.md — Flora chip

  Workspace identity at the top of the sidebar. Clicking opens the switcher
  popover.
-->
<template>
  <div ref="containerRef" class="relative">
    <button
      type="button"
      :class="
        cn(
          'flex w-full cursor-pointer items-center gap-2 rounded-md bg-base-background p-2 text-left text-base-foreground transition-colors',
          'hover:bg-secondary-background'
        )
      "
      @click="open = !open"
    >
      <span
        class="grid size-8 shrink-0 place-items-center rounded-sm text-sm font-semibold text-button-surface-contrast"
        :style="{ backgroundColor: workspace.avatarColor }"
      >
        {{ workspace.name.charAt(0) }}
      </span>
      <span class="flex min-w-0 flex-1 flex-col">
        <span class="truncate text-sm font-medium">{{ workspace.name }}</span>
        <span class="truncate text-xs text-muted-foreground">{{
          subtitle
        }}</span>
      </span>
      <span
        class="icon-[lucide--chevrons-up-down] size-4 text-muted-foreground"
      />
    </button>

    <WorkspaceSwitcherPopover
      v-if="open"
      :workspaces="workspaces"
      :current-user="currentUser"
      :current-workspace-id="workspace.id"
      @select="onSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { onClickOutside } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import WorkspaceSwitcherPopover from './WorkspaceSwitcherPopover.vue'
import type { User, Workspace } from '../../types'

const { workspace, workspaces, currentUser } = defineProps<{
  workspace: Workspace
  workspaces: Workspace[]
  currentUser: User
}>()

const emit = defineEmits<{
  selectWorkspace: [workspaceId: string]
}>()

const { t } = useI18n()
const open = ref(false)
const containerRef = useTemplateRef<HTMLDivElement>('containerRef')

onClickOutside(containerRef, () => {
  open.value = false
})

const subtitle = computed(() => {
  if (workspace.currentUserRole === 'guest') return t('prototype.sidebar.guest')
  return t(`prototype.sidebar.plan.${workspace.plan}`)
})

function onSelect(id: string) {
  emit('selectWorkspace', id)
  open.value = false
}
</script>
