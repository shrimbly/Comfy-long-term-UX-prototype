<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/project.md §"Roles" / "Lifecycle"
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md — project level
    log:     ../prototype/design-decisions.md (2026-06-24 Project context menu)

  Role-gated context menu for a project card in the projects listing. Everyone
  with access gets Open / Media assets / Copy link (+ Share unless private);
  Owners and workspace Admins (on workspace-wide projects) additionally get
  View usage / Rename / Delete; non-owner members get Leave.
-->
<template>
  <ContextMenu
    ref="contextMenu"
    :model="items"
    :pt="{
      root: {
        class: cn(
          'rounded-lg border border-border-default',
          'bg-secondary-background text-base-foreground shadow-lg'
        )
      }
    }"
    @hide="onHide"
  >
    <template #item="{ item, props }">
      <Button
        variant="secondary"
        :class="cn('w-full justify-start gap-2', item.danger && 'text-danger')"
        v-bind="props.action"
      >
        <i v-if="item.icon" :class="cn('size-4', item.icon)" />
        <span class="flex-1 text-left">{{ item.label }}</span>
      </Button>
    </template>
  </ContextMenu>

  <PromptDialog
    v-if="activeDialog === 'rename'"
    :title="t('prototype.projectMenu.renamePrompt')"
    :initial-value="project.name"
    :confirm-label="t('g.rename')"
    @confirm="confirmRename"
    @cancel="activeDialog = null"
  />

  <ConfirmDialog
    v-if="activeDialog === 'delete'"
    :title="t('prototype.projectMenu.delete')"
    :message="t('prototype.projectMenu.deleteConfirm', { name: project.name })"
    :confirm-label="t('g.delete')"
    danger
    @confirm="confirmDelete"
    @cancel="activeDialog = null"
  />

  <ConfirmDialog
    v-if="activeDialog === 'leave'"
    :title="t('prototype.projectMenu.leave')"
    :message="t('prototype.projectMenu.leaveConfirm', { name: project.name })"
    :confirm-label="t('prototype.projectMenu.leaveAction')"
    @confirm="confirmLeave"
    @cancel="activeDialog = null"
  />
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import ContextMenu from 'primevue/contextmenu'
import type { MenuItem } from 'primevue/menuitem'
import { useToast } from 'primevue/usetoast'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import ConfirmDialog from './ConfirmDialog.vue'
import PromptDialog from './PromptDialog.vue'
import { useActiveContextMenu } from '../composables/useActiveContextMenu'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import type { Project } from '../types'

const { project } = defineProps<{ project: Project }>()

const emit = defineEmits<{
  open: [projectId: string]
}>()

const { t } = useI18n()
const toast = useToast()
const personaStore = usePrototypePersonaStore()
const uiStore = usePrototypeUiStore()
const tabsStore = usePrototypeTabsStore()

type ContextMenuHandle = {
  show: (event: MouseEvent) => void
  hide: () => void
}
const contextMenu = ref<ContextMenuHandle | null>(null)

// Each card owns its own menu instance; the shared coordinator dismisses
// whichever menu was open before this one (the card stops the contextmenu
// event from reaching PrimeVue's outside-click dismissal).
const { activate, deactivate } = useActiveContextMenu()

const viewerId = computed(() => personaStore.fixture.currentUser.id)
const isOwner = computed(() => project.ownerUserId === viewerId.value)

// Owner, or a workspace Admin acting as owner on a workspace-wide project.
const canManage = computed(
  () =>
    isOwner.value ||
    (project.tier === 'workspace-wide' &&
      personaStore.currentWorkspace?.currentUserRole === 'admin')
)

const canShare = computed(() => project.tier !== 'private')

const canLeave = computed(
  () =>
    !isOwner.value &&
    project.tier !== 'workspace-wide' &&
    (project.members ?? []).some((m) => m.userId === viewerId.value)
)

const projectLink = computed(
  () => `${window.location.origin}/prototype/projects/${project.id}`
)

function onOpen() {
  emit('open', project.id)
}

function onMediaAssets() {
  uiStore.setProjectFilter(project.id)
  tabsStore.openMediaAssets(t('prototype.sidebar.libraryMedia'))
}

function onShare() {
  uiStore.requestShareSettings(project.id)
  uiStore.go({ kind: 'project', projectId: project.id })
}

function onCopyLink() {
  void navigator.clipboard?.writeText(projectLink.value)
  toast.add({
    severity: 'success',
    summary: t('prototype.projectMenu.toast.linkCopied'),
    detail: projectLink.value,
    life: 2200
  })
}

function onViewUsage() {
  uiStore.requestProjectTab(project.id, 'usage')
  uiStore.go({ kind: 'project', projectId: project.id })
}

type ActiveDialog = 'rename' | 'delete' | 'leave'
const activeDialog = ref<ActiveDialog | null>(null)

function onRename() {
  activeDialog.value = 'rename'
}

function confirmRename(name: string) {
  activeDialog.value = null
  personaStore.renameProject(project.id, name)
}

function onDelete() {
  activeDialog.value = 'delete'
}

function confirmDelete() {
  activeDialog.value = null
  personaStore.deleteProject(project.id)
  toast.add({
    severity: 'success',
    summary: t('prototype.projectMenu.toast.deleted'),
    detail: t('prototype.projectMenu.toast.deletedDetail', {
      name: project.name
    }),
    life: 2800
  })
}

function onLeave() {
  activeDialog.value = 'leave'
}

function confirmLeave() {
  activeDialog.value = null
  personaStore.leaveProject(project.id)
  toast.add({
    severity: 'success',
    summary: t('prototype.projectMenu.toast.left'),
    detail: t('prototype.projectMenu.toast.leftDetail', { name: project.name }),
    life: 2800
  })
}

const items = computed<MenuItem[]>(() => {
  const out: MenuItem[] = [
    {
      label: t('prototype.projectMenu.open'),
      icon: 'icon-[lucide--folder-open]',
      command: onOpen
    },
    {
      label: t('prototype.projectMenu.mediaAssets'),
      icon: 'icon-[lucide--image]',
      command: onMediaAssets
    }
  ]

  out.push({ separator: true })
  if (canShare.value) {
    out.push({
      label: t('prototype.projectMenu.share'),
      icon: 'icon-[lucide--users-round]',
      command: onShare
    })
  }
  out.push({
    label: t('prototype.projectMenu.copyLink'),
    icon: 'icon-[lucide--link]',
    command: onCopyLink
  })
  if (canManage.value) {
    out.push({
      label: t('prototype.projectMenu.viewUsage'),
      icon: 'icon-[lucide--chart-column]',
      command: onViewUsage
    })
  }

  if (canManage.value) {
    out.push({ separator: true })
    out.push({
      label: t('prototype.projectMenu.rename'),
      icon: 'icon-[lucide--pencil]',
      command: onRename
    })
    out.push({
      label: t('prototype.projectMenu.delete'),
      icon: 'icon-[lucide--trash-2]',
      command: onDelete,
      danger: true
    })
  }

  if (canLeave.value) {
    out.push({ separator: true })
    out.push({
      label: t('prototype.projectMenu.leave'),
      icon: 'icon-[lucide--log-out]',
      command: onLeave
    })
  }

  return out
})

function hide() {
  contextMenu.value?.hide()
}

function show(event: MouseEvent) {
  activate(hide)
  contextMenu.value?.show(event)
}

function onHide() {
  deactivate(hide)
}

defineExpose({ show })
</script>
