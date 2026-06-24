<!--
  Implements:
    entity:   ../IA_Plan/wiki/entities/workflow.md
    concept:  ../IA_Plan/wiki/concepts/three-level-permissions.md §"Asset level"
    decision: ../IA_Plan/wiki/decisions/fork-vs-copy-one-operation.md
    decision: ../IA_Plan/wiki/decisions/save-destination-workflow-level.md
    decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
    open-q:   ../IA_Plan/wiki/open-questions.md#publish-direct-link-admin-gate
              (gated by roleGrants['publish-direct-link'])
    log:      ../prototype/design-decisions.md (2026-05-15 Workflow context menu)

  Role-gated workflow context menu. Caller passes the viewer's effective
  role on this workflow (resolved via useViewerWorkflowRole) and the menu
  shape is filtered accordingly:

    Owner       — Open, Rename, Save to My Workflows, Publish to project,
                  Save destination, Share, Publish via direct link,
                  View outputs, Open containing project, Delete
    Runner      — Open, Save to My Workflows, View outputs,
                  Open containing project

  "Publish to project" is the single move-asset-to-another-project verb
  (concepts/cross-cutting-flows.md): moving a workflow into a shared
  project publishes it there as a canonical (seeds V1). Accessing a
  project workflow takes a personal copy (copy-on-access); publishing
  that copy back either overwrites the canonical or adds a new one.

  Sharing / publish / view-outputs are prototype stubs that toast — the
  full surfaces exist in their own flows. Storage triggers a real store
  mutation.
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
        class="w-full justify-start gap-2"
        v-bind="props.action"
      >
        <i v-if="item.icon" :class="cn('size-4', item.icon)" />
        <span class="flex-1 text-left">{{ item.label }}</span>
        <i
          v-if="item.items?.length"
          class="icon-[lucide--chevron-right] size-4 opacity-60"
        />
      </Button>
    </template>
  </ContextMenu>

  <PromoteToProjectDialog
    v-if="publishSourceId"
    :source-workflow-id="publishSourceId"
    @close="closePublish"
    @publish="onPublished"
  />

  <ConfirmDialog
    v-if="activeDialog === 'getLatest'"
    :title="t('prototype.workflowMenu.getLatestTitle')"
    :message="
      t('prototype.workflowMenu.getLatestConfirm', { name: workflow.name })
    "
    :confirm-label="t('prototype.workflowMenu.getLatest')"
    @confirm="confirmGetLatest"
    @cancel="activeDialog = null"
  />

  <PromptDialog
    v-if="activeDialog === 'rename'"
    :title="t('prototype.workflowMenu.renameTitle')"
    :initial-value="workflow.name"
    :confirm-label="t('g.rename')"
    @confirm="confirmRename"
    @cancel="activeDialog = null"
  />

  <ConfirmDialog
    v-if="activeDialog === 'delete'"
    :title="t('prototype.workflowMenu.deleteTitle')"
    :message="
      t('prototype.workflowMenu.deleteConfirm', { name: workflow.name })
    "
    :confirm-label="t('g.delete')"
    danger
    @confirm="confirmDelete"
    @cancel="activeDialog = null"
  />

  <MoveToFolderDialog
    v-if="activeDialog === 'move'"
    :workflow-ids="[workflow.id]"
    @moved="onMoved"
    @cancel="activeDialog = null"
  />
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import ContextMenu from 'primevue/contextmenu'
import type { MenuItem } from 'primevue/menuitem'
import { useToast } from 'primevue/usetoast'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import ConfirmDialog from './ConfirmDialog.vue'
import MoveToFolderDialog from './MoveToFolderDialog.vue'
import PromoteToProjectDialog from './PromoteToProjectDialog.vue'
import PromptDialog from './PromptDialog.vue'
import { useWorkflowPublish } from '../composables/useWorkflowPublish'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { ViewerWorkflowRole } from '../composables/useViewerWorkflowRole'
import type { Workflow } from '../types'

const {
  workflow,
  viewerRole,
  showOpenContainingProject = true
} = defineProps<{
  workflow: Workflow
  viewerRole: ViewerWorkflowRole
  showOpenContainingProject?: boolean
}>()

const emit = defineEmits<{
  open: [workflowId: string]
  'open-project': [projectId: string]
}>()

const { t } = useI18n()
const toast = useToast()
const personaStore = usePrototypePersonaStore()
const { fixture } = storeToRefs(personaStore)
const { publishSourceId, openPublish, closePublish, onPublished } =
  useWorkflowPublish()

type ContextMenuHandle = {
  show: (event: MouseEvent) => void
  hide: () => void
}
const contextMenu = ref<ContextMenuHandle | null>(null)

// Each WorkflowCard owns its own menu instance, so opening one would
// otherwise leave the others on screen (the card stops the contextmenu
// event from reaching PrimeVue's outside-click dismissal). Track the
// open menu at module scope and dismiss it before showing the next.
let closeActiveMenu: (() => void) | null = null

const isOwner = computed(() => viewerRole === 'owner')
const isRunner = computed(() => viewerRole === 'runner')

// A checked-out copy that trails the canonical's effective current version.
const isBehind = computed(() => personaStore.versionsBehind(workflow) > 0)

const sourceProject = computed(() =>
  fixture.value.projects.find((p) => p.id === workflow.projectId)
)

// A workflow already in My Workflows is private and edited in place —
// no branching (that's for shared canonicals) and no "Save to My
// Workflows" (it's already there). Per published-workflow-model.md.
const isInDrafts = computed(() => !!sourceProject.value?.isDrafts)

// Foldering applies to workflows that live in a foldered container: a
// project canonical, or a *personal* workflow in My Workflows (project-draft
// copies live in a project's "My drafts", which isn't foldered).
const isFolderable = computed(() => {
  const p = sourceProject.value
  if (!p) return false
  if (!p.isDrafts) return !workflow.forkedFrom
  const prov = workflow.provenanceProjectId
  const inRealProject =
    !!prov && fixture.value.projects.some((x) => x.id === prov && !x.isDrafts)
  return !inRealProject
})

// Only offer "Move to folder" when the container has folders to move into
// (folders are created from the container's "New folder" button).
const hasFolders = computed(() =>
  (fixture.value.folders ?? []).some((f) => f.projectId === workflow.projectId)
)

const canPublishDirectLink = computed(() => {
  const role = personaStore.currentWorkspace?.currentUserRole
  if (role === 'admin') return true
  if (role === 'member') {
    return fixture.value.roleGrants['publish-direct-link']
  }
  return false
})

// "Publish to project" is the move-asset-to-another-project verb (the
// wiki frames promotion as this same verb — concepts/cross-cutting-flows).
// Available on any owned workflow, including a copy: on a copy this is the
// publish-as-NEW mode (publishes the copy as a new canonical into the
// chosen project), alongside Publish to workspace which OVERWRITES the
// copy's source canonical. The picker can create a project.
const isPromotable = computed(() => isOwner.value)

function hide() {
  contextMenu.value?.hide()
}

function show(event: MouseEvent) {
  if (closeActiveMenu && closeActiveMenu !== hide) closeActiveMenu()
  closeActiveMenu = hide
  contextMenu.value?.show(event)
}

function onHide() {
  if (closeActiveMenu === hide) closeActiveMenu = null
}
defineExpose({ show })

function toastStub(key: string, params?: Record<string, unknown>) {
  toast.add({
    severity: 'info',
    summary: t('prototype.workflowMenu.toastStubSummary'),
    detail: params ? t(key, params) : t(key),
    life: 2200
  })
}

function onOpen() {
  emit('open', workflow.id)
}

type ActiveDialog = 'rename' | 'delete' | 'getLatest' | 'move'
const activeDialog = ref<ActiveDialog | null>(null)

function onMoved() {
  activeDialog.value = null
  toast.add({
    severity: 'success',
    summary: t('prototype.folders.movedSummary'),
    detail: t('prototype.folders.movedDetail', { name: workflow.name }),
    life: 2200
  })
}

function onGetLatest() {
  activeDialog.value = 'getLatest'
}

function confirmGetLatest() {
  activeDialog.value = null
  if (!personaStore.updateToLatest(workflow.id)) return
  toast.add({
    severity: 'success',
    summary: t('prototype.workflowMenu.toast.gotLatestSummary'),
    detail: t('prototype.workflowMenu.toast.gotLatestDetail', {
      name: workflow.name
    }),
    life: 2800
  })
}

function onRename() {
  activeDialog.value = 'rename'
}

function confirmRename(name: string) {
  activeDialog.value = null
  personaStore.renameWorkflow(workflow.id, name)
}

function onSaveCopy() {
  const newId = personaStore.copyToMyWorkflows(workflow.id)
  if (!newId) return
  toast.add({
    severity: 'success',
    summary: t('prototype.workflowMenu.toast.savedCopySummary'),
    detail: t('prototype.workflowMenu.toast.savedCopyDetail', {
      name: workflow.name
    }),
    life: 2800
  })
}

function onPromoteToProject() {
  openPublish(workflow.id)
}

function onUploadToCloud() {
  if (workflow.storage === 'cloud') return
  personaStore.setWorkflowStorage(workflow.id, 'cloud')
  toast.add({
    severity: 'success',
    summary: t('prototype.workflowMenu.toast.savedToCloudSummary'),
    detail: t('prototype.workflowMenu.toast.savedToCloudDetail', {
      name: workflow.name
    }),
    life: 2800
  })
}

function onSetThumbnail() {
  personaStore.cycleWorkflowThumbnail(workflow.id)
  toast.add({
    severity: 'success',
    summary: t('prototype.workflowMenu.toast.thumbnailSummary'),
    life: 1800
  })
}

function onDelete() {
  activeDialog.value = 'delete'
}

function confirmDelete() {
  activeDialog.value = null
  personaStore.deleteWorkflow(workflow.id)
  toast.add({
    severity: 'success',
    summary: t('prototype.workflowMenu.toast.deletedSummary'),
    detail: t('prototype.workflowMenu.toast.deletedDetail', {
      name: workflow.name
    }),
    life: 2800
  })
}

function onOpenContainingProject() {
  if (!sourceProject.value) return
  emit('open-project', sourceProject.value.id)
}

// Build menu shape. Owner has the kitchen-sink list; Runner and App
// Runner get trimmed branches. Each section uses a `separator: true`
// divider so the visual grouping mirrors the wiki capability table.

const items = computed<MenuItem[]>(() => {
  const out: MenuItem[] = []

  // Open primary action.
  out.push({
    label: t('prototype.workflowMenu.open'),
    icon: 'icon-[lucide--square-arrow-out-up-right]',
    command: onOpen
  })

  // Re-sync a behind copy to the canonical's current (pinned-else-latest)
  // version — replaces the copy's content.
  if (isBehind.value) {
    out.push({
      label: t('prototype.workflowMenu.getLatest'),
      icon: 'icon-[lucide--refresh-cw]',
      command: onGetLatest
    })
  }

  // Organize into a folder (project canonical or personal My Workflows).
  if (isFolderable.value && hasFolders.value) {
    out.push({ separator: true })
    out.push({
      label: t('prototype.folders.moveToFolder'),
      icon: 'icon-[lucide--folder-input]',
      command: () => (activeDialog.value = 'move')
    })
  }

  // Owner ops — rename / fork in place / move / storage.
  if (isOwner.value) {
    out.push({ separator: true })
    out.push({
      label: t('prototype.workflowMenu.rename'),
      icon: 'icon-[lucide--pencil]',
      command: onRename
    })
    if (!isInDrafts.value) {
      out.push({
        label: t('prototype.workflowMenu.saveToMyWorkflows'),
        icon: 'icon-[lucide--copy]',
        command: onSaveCopy
      })
    }
    if (isPromotable.value) {
      out.push({
        label: t('prototype.workflowMenu.promoteToProject'),
        icon: 'icon-[lucide--folder-up]',
        command: onPromoteToProject
      })
    }
    if (workflow.storage === 'local') {
      out.push({
        label: t('prototype.workflowMenu.uploadToCloud'),
        icon: 'icon-[lucide--cloud-upload]',
        command: onUploadToCloud
      })
    }
    out.push({
      label: t('prototype.workflowMenu.setThumbnail'),
      icon: 'icon-[lucide--image]',
      command: onSetThumbnail
    })
  }

  // Runner: Save a copy is the explicit way to get a working copy in My
  // Workflows.
  if (isRunner.value && !isInDrafts.value) {
    out.push({ separator: true })
    out.push({
      label: t('prototype.workflowMenu.saveToMyWorkflows'),
      icon: 'icon-[lucide--copy]',
      command: onSaveCopy
    })
  }

  // Sharing / publishing — Owner only.
  if (isOwner.value) {
    out.push({ separator: true })
    out.push({
      label: t('prototype.workflowMenu.share'),
      icon: 'icon-[lucide--users-round]',
      command: () => toastStub('prototype.workflowMenu.toast.shareStub')
    })
    if (canPublishDirectLink.value) {
      out.push({
        label: t('prototype.workflowMenu.publishDirectLink'),
        icon: 'icon-[lucide--link]',
        command: () => toastStub('prototype.workflowMenu.toast.publishLinkStub')
      })
    }
  }

  // Outputs + navigation — available to everyone who can see the asset.
  out.push({ separator: true })
  out.push({
    label: t('prototype.workflowMenu.viewOutputs'),
    icon: 'icon-[lucide--image]',
    command: () => toastStub('prototype.workflowMenu.toast.outputsStub')
  })
  if (
    showOpenContainingProject &&
    sourceProject.value &&
    !sourceProject.value.isDrafts
  ) {
    out.push({
      label: t('prototype.workflowMenu.openContainingProject'),
      icon: 'icon-[lucide--folder-open]',
      command: onOpenContainingProject
    })
  }

  // Destructive — Owner only.
  if (isOwner.value) {
    out.push({ separator: true })
    out.push({
      label: t('prototype.workflowMenu.delete'),
      icon: 'icon-[lucide--trash-2]',
      command: onDelete
    })
  }

  return out
})
</script>
