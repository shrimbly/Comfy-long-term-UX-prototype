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
    v-if="promoteDialogOpen"
    :source-workflow-id="workflow.id"
    @close="promoteDialogOpen = false"
    @publish="onPublished"
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

import PromoteToProjectDialog from './PromoteToProjectDialog.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'
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

const promoteDialogOpen = ref(false)
const uiStore = usePrototypeUiStore()

const isOwner = computed(() => viewerRole === 'owner')
const isRunner = computed(() => viewerRole === 'runner')

const sourceProject = computed(() =>
  fixture.value.projects.find((p) => p.id === workflow.projectId)
)

// A workflow already in My Workflows is private and edited in place —
// no branching (that's for shared canonicals) and no "Save to My
// Workflows" (it's already there). Per published-workflow-model.md.
const isInDrafts = computed(() => !!sourceProject.value?.isDrafts)

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

function onRename() {
  const next = window.prompt(
    t('prototype.workflowMenu.renamePrompt'),
    workflow.name
  )
  if (next === null) return
  personaStore.renameWorkflow(workflow.id, next)
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
  promoteDialogOpen.value = true
}

function onPublished(payload: {
  projectId: string
  isNewProject: boolean
  targetWorkflowId: string | null
  newName: string | null
}) {
  promoteDialogOpen.value = false
  const project = fixture.value.projects.find((p) => p.id === payload.projectId)
  if (payload.targetWorkflowId) {
    // Overwrite an existing workflow in the project with this one's content.
    const target = fixture.value.workflows.find(
      (w) => w.id === payload.targetWorkflowId
    )
    const ok = personaStore.publishOverWorkflow(
      workflow.id,
      payload.targetWorkflowId
    )
    if (!ok) return
    toast.add({
      severity: 'success',
      summary: t('prototype.promoteToProject.overwriteToastSummary'),
      detail: t('prototype.promoteToProject.overwriteToastDetail', {
        workflow: target?.name ?? workflow.name,
        project: project?.name ?? ''
      }),
      life: 2800
    })
  } else {
    // Publish as a new canonical in the project (named via the dialog).
    const ok = personaStore.moveWorkflowToProject(
      workflow.id,
      payload.projectId,
      payload.newName ?? undefined
    )
    if (!ok) return
    toast.add({
      severity: 'success',
      summary: t('prototype.promoteToProject.toastSummary'),
      detail: t('prototype.promoteToProject.toastDetail', {
        workflow: workflow.name,
        project: project?.name ?? ''
      }),
      life: 2800
    })
    if (payload.isNewProject) {
      // Brand-new project — open share settings so the user can invite
      // collaborators straight away.
      uiStore.requestShareSettings(payload.projectId)
    }
  }
  // Land on the destination project; the published workflow appears in its
  // grid (select it to see the version history in the sidebar).
  uiStore.go({ kind: 'project', projectId: payload.projectId })
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
  const ok = window.confirm(
    t('prototype.workflowMenu.deleteConfirm', { name: workflow.name })
  )
  if (!ok) return
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
