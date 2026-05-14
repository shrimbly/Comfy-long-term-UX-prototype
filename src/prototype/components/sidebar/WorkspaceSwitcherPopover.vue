<!--
  Implements:
    Figma: Team Plan / Workspaces / "Workspaces Menu / 10 workspaces (owner)"
      https://www.figma.com/design/CkFTD4c20PyRGpNVAJgpfV/?node-id=2028-4352

  Workspace switcher popover. Lists the user's workspaces with avatar, name,
  and role (Owner / Admin / Member / Guest / Personal), separated by full-
  width dividers. Footer is a "+ New workspace" action.
-->
<template>
  <div
    class="absolute top-full left-0 z-20 mt-2 w-60 rounded-lg border border-border-default bg-interface-menu-surface py-2 text-base-foreground shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
  >
    <ul class="flex flex-col gap-2">
      <template v-for="(ws, i) in workspaces" :key="ws.id">
        <li class="px-2">
          <button
            type="button"
            :aria-current="ws.id === currentWorkspaceId ? 'true' : undefined"
            :class="
              cn(
                'flex h-[54px] w-full cursor-pointer items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-interface-menu-component-surface-hovered',
                ws.id === currentWorkspaceId &&
                  'bg-interface-menu-component-surface-hovered'
              )
            "
            @click="emit('select', ws.id)"
          >
            <span
              class="grid size-8 shrink-0 place-items-center rounded-sm text-sm font-semibold text-button-surface-contrast"
              :style="{ backgroundColor: ws.avatarColor }"
            >
              {{ initialFor(ws) }}
            </span>
            <span class="flex min-w-0 flex-1 flex-col gap-1">
              <span class="truncate text-sm leading-none">{{ ws.name }}</span>
              <span class="truncate text-sm leading-none text-muted-foreground">
                {{ roleLabel(ws) }}
              </span>
            </span>
          </button>
        </li>
        <li
          v-if="i < workspaces.length - 1"
          aria-hidden="true"
          class="h-px w-full bg-border-default"
        />
      </template>

      <li aria-hidden="true" class="h-px w-full bg-border-default" />
      <li class="px-2">
        <button
          type="button"
          class="flex h-12 w-full cursor-pointer items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-interface-menu-component-surface-hovered"
          @click="emit('createWorkspace')"
        >
          <span
            class="grid size-8 shrink-0 place-items-center rounded-full bg-modal-card-placeholder-background"
          >
            <span class="icon-[lucide--plus] size-4 text-base-foreground" />
          </span>
          <span class="min-w-0 flex-1 text-sm text-base-foreground">
            {{ t('prototype.sidebar.createWorkspace') }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { useI18n } from 'vue-i18n'

import type { User, Workspace } from '../../types'

const { workspaces, currentUser, currentWorkspaceId } = defineProps<{
  workspaces: Workspace[]
  currentUser: User
  currentWorkspaceId: string
}>()

const emit = defineEmits<{
  select: [workspaceId: string]
  createWorkspace: []
}>()

const { t } = useI18n()

function initialFor(ws: Workspace) {
  return ws.name.charAt(0).toUpperCase()
}

function roleLabel(ws: Workspace) {
  if (ws.tier === 'personal') return t('prototype.sidebar.role.personal')
  if (ws.ownerUserId === currentUser.id)
    return t('prototype.sidebar.role.owner')
  return t(`prototype.sidebar.role.${ws.currentUserRole}`)
}
</script>
