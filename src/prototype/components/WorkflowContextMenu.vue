<!--
  Implements:
    entity:   ../IA_Plan/wiki/entities/workflow.md
    concept:  ../IA_Plan/wiki/concepts/three-level-permissions.md §"Asset level"
    decision: ../IA_Plan/wiki/decisions/fork-vs-copy-one-operation.md
    decision: ../IA_Plan/wiki/decisions/save-destination-workflow-level.md
    decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
    open-q:   ../IA_Plan/wiki/open-questions.md#app-runner-fork-capability
              (prototype takes spec stance: App Runner cannot fork)
    open-q:   ../IA_Plan/wiki/open-questions.md#publish-direct-link-admin-gate
              (gated by roleGrants['publish-direct-link'])
    log:      ../prototype/design-decisions.md (2026-05-15 Workflow context menu)

  Role-gated workflow context menu. Caller passes the viewer's effective
  role on this workflow (resolved via useViewerWorkflowRole) and the menu
  shape is filtered accordingly:

    Owner       — Open, Rename, Branch, Publish to project, Save destination,
                  Share, Publish (direct link / Hub), View outputs,
                  Open containing project, Delete
    Runner      — Open (branch-on-open), Branch, View outputs,
                  Open containing project
    App Runner  — Run app, View outputs, Open containing project

  "Publish to project" is the single move-asset-to-another-project verb
  (concepts/cross-cutting-flows.md): moving a workflow into a shared
  project publishes it there as a canonical (seeds V1). A branch of a
  shared canonical instead gets "Publish to workspace" (the dialog adapts
  to Publish vs Submit for review based on overwrite permission + install
  identity).

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

const promoteDialogOpen = ref(false)
const uiStore = usePrototypeUiStore()

const isOwner = computed(() => viewerRole === 'owner')
const isRunner = computed(() => viewerRole === 'runner')
const isAppRunner = computed(() => viewerRole === 'app-runner')

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

const canSubmitToHub = computed(() => {
  const role = personaStore.currentWorkspace?.currentUserRole
  if (role === 'admin') return true
  if (role === 'member') return fixture.value.roleGrants['submit-to-hub']
  return false
})

// "Publish to project" is the move-asset-to-another-project verb (the
// wiki frames promotion as this same verb — concepts/cross-cutting-flows).
// Available on any owned workflow, including a copy: on a copy this is the
// publish-as-NEW mode (publishes the copy as a new canonical into the
// chosen project), alongside Publish to workspace which OVERWRITES the
// copy's source canonical. The picker can create a project.
const isPromotable = computed(() => isOwner.value)

function show(event: MouseEvent) {
  contextMenu.value?.show(event)
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
    // Publish as a new canonical in the project.
    const ok = personaStore.moveWorkflowToProject(
      workflow.id,
      payload.projectId
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

function onSetStorage(value: 'local' | 'cloud') {
  if (workflow.storage === value) return
  personaStore.setWorkflowStorage(workflow.id, value)
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

  // Open / Run primary action — verb depends on default-mode + role.
  if (isAppRunner.value) {
    out.push({
      label: t('prototype.workflowMenu.runApp'),
      icon: 'icon-[lucide--play]',
      command: onOpen
    })
  } else {
    out.push({
      label: t('prototype.workflowMenu.open'),
      icon: 'icon-[lucide--square-arrow-out-up-right]',
      command: onOpen
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
    out.push({
      label: t('prototype.workflowMenu.saveDestination'),
      icon: 'icon-[lucide--save]',
      items: [
        {
          label: t('prototype.workflowCard.storageLocal'),
          icon:
            workflow.storage === 'local'
              ? 'icon-[lucide--check]'
              : 'icon-[lucide--hard-drive]',
          command: () => onSetStorage('local')
        },
        {
          label: t('prototype.workflowCard.storageCloud'),
          icon:
            workflow.storage === 'cloud'
              ? 'icon-[lucide--check]'
              : 'icon-[lucide--cloud]',
          command: () => onSetStorage('cloud')
        }
      ]
    })
  }

  // Runner: Save a copy is the explicit way to get a working copy in My
  // Workflows. App Runner can't copy per spec.
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
    if (canSubmitToHub.value) {
      out.push({
        label: t('prototype.workflowMenu.publishHub'),
        icon: 'icon-[lucide--upload]',
        command: () => toastStub('prototype.workflowMenu.toast.publishHubStub')
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
