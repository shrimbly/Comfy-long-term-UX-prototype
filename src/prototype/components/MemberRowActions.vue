<!--
  Implements:
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md — workspace level

  Per-row action menu. Role changes that cross the Admin boundary
  (promote to Admin, demote Admin → Member) are Admin-only. Members can
  promote Guest → Member, but not promote anyone to or from Admin.
-->
<template>
  <div ref="containerRef" class="relative inline-flex">
    <button
      type="button"
      class="grid size-8 cursor-pointer appearance-none place-items-center rounded-lg border-0 bg-transparent text-muted-foreground transition-colors hover:bg-secondary-background hover:text-base-foreground focus:outline-none"
      :aria-label="t('prototype.sidebar.members')"
      @click="open = !open"
    >
      <span class="icon-[lucide--more-horizontal] size-4" />
    </button>
    <div
      v-if="open"
      class="absolute top-full right-0 z-20 mt-1 flex w-56 flex-col gap-0.5 rounded-lg border border-border-default bg-interface-menu-surface p-1 text-sm shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
    >
      <button
        v-for="target in availableRoles"
        :key="target"
        type="button"
        class="w-full cursor-pointer appearance-none rounded-sm border-0 bg-transparent px-3 py-2 text-left text-base-foreground transition-colors hover:bg-interface-menu-component-surface-hovered focus:bg-interface-menu-component-surface-hovered focus:outline-none"
        @click="onChangeRole(target)"
      >
        {{
          t('prototype.views.members.actions.changeRoleTo', {
            role: t(`prototype.sidebar.role.${target}`)
          })
        }}
      </button>
      <div
        v-if="availableRoles.length && canRemove"
        class="my-0.5 h-px bg-border-default"
      />
      <button
        v-if="canRemove"
        type="button"
        class="text-danger-foreground w-full cursor-pointer appearance-none rounded-sm border-0 bg-transparent px-3 py-2 text-left transition-colors hover:bg-interface-menu-component-surface-hovered focus:bg-interface-menu-component-surface-hovered focus:outline-none"
        @click="onRemove"
      >
        {{ t('prototype.views.members.actions.remove') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import type { WorkspaceRole } from '../types'

const { currentRole, viewerRole } = defineProps<{
  currentRole: WorkspaceRole
  viewerRole: WorkspaceRole
}>()

const emit = defineEmits<{
  changeRole: [role: WorkspaceRole]
  remove: []
}>()

const { t } = useI18n()
const containerRef = useTemplateRef<HTMLElement>('containerRef')
const open = ref(false)

onClickOutside(containerRef, () => {
  open.value = false
})

const allRoles: WorkspaceRole[] = ['admin', 'member', 'guest']

// Member can act on Guest <-> Member but not on Admin in either direction.
// Admin can act on everyone.
const availableRoles = computed<WorkspaceRole[]>(() => {
  const candidates = allRoles.filter((r) => r !== currentRole)
  if (viewerRole === 'admin') return candidates
  if (viewerRole === 'member') {
    if (currentRole === 'admin') return []
    return candidates.filter((r) => r !== 'admin')
  }
  return []
})

const canRemove = computed(() => {
  if (viewerRole === 'admin') return true
  if (viewerRole === 'member') return currentRole !== 'admin'
  return false
})

function onChangeRole(role: WorkspaceRole) {
  open.value = false
  emit('changeRole', role)
}

function onRemove() {
  open.value = false
  emit('remove')
}
</script>
