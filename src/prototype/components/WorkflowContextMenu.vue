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

  <PublishToWorkspaceDialog
    v-if="publishDialogOpen"
    :state="publishState"
    @close="publishDialogOpen = false"
    @publish="onPublish"
    @ask-owner="onAskOwner"
  />

  <PromoteToProjectDialog
    v-if="promoteDialogOpen"
    @close="promoteDialogOpen = false"
    @promote="onPromoted"
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
import PublishToWorkspaceDialog from './PublishToWorkspaceDialog.vue'
import { useWorkflowPublish } from '../composables/useWorkflowPublish'
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

const publishDialogOpen = ref(false)
const promoteDialogOpen = ref(false)
const uiStore = usePrototypeUiStore()

// Publish to workspace targets a branch whose canonical lives in a shared
// project. The composable resolves publishability + permission/install
// gates; the dialog adapts (Publish vs Submit for review). Per
// ../IA_Plan/wiki/decisions/published-workflow-model.md.
const workflowRef = computed(() => workflow)
const publishState = useWorkflowPublish(workflowRef)

const isOwner = computed(() => viewerRole === 'owner')
const isRunner = computed(() => viewerRole === 'runner')
const isAppRunner = computed(() => viewerRole === 'app-runner')

const sourceProject = computed(() =>
  fixture.value.projects.find((p) => p.id === workflow.projectId)
)

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
// Available on any owned workflow that isn't a branch (branches publish
// over their canonical instead). The picker can create a project.
const isPromotable = computed(() => isOwner.value && !workflow.forkedFrom)

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

function onBranch() {
  const newId = personaStore.branchWorkflow(workflow.id)
  if (!newId) return
  toast.add({
    severity: 'success',
    summary: t('prototype.workflowMenu.toast.branchedSummary'),
    detail: t('prototype.workflowMenu.toast.branchedDetail', {
      name: workflow.name
    }),
    life: 2800
  })
}

function onSaveToMyWorkflows() {
  const newId = personaStore.saveToMyWorkflows(workflow.id)
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

function onPublishToWorkspace() {
  publishDialogOpen.value = true
}

function onPromoteToProject() {
  promoteDialogOpen.value = true
}

function onPromoted(targetProjectId: string, isNewProject: boolean) {
  const ok = personaStore.moveWorkflowToProject(workflow.id, targetProjectId)
  promoteDialogOpen.value = false
  if (!ok) return
  const project = fixture.value.projects.find((p) => p.id === targetProjectId)
  toast.add({
    severity: 'success',
    summary: t('prototype.promoteToProject.toastSummary'),
    detail: t('prototype.promoteToProject.toastDetail', {
      workflow: workflow.name,
      project: project?.name ?? ''
    }),
    life: 2800
  })
  if (isNewProject) {
    // Brand-new project — land on it and open share settings so the user
    // can invite collaborators straight away.
    uiStore.requestShareSettings(targetProjectId)
    uiStore.go({ kind: 'project', projectId: targetProjectId })
  } else {
    // Existing project — land on the now-canonical's detail page so its
    // fresh version history is visible.
    uiStore.go({ kind: 'workflow', workflowId: workflow.id })
  }
}

function onPublish() {
  const ok = personaStore.publishToWorkspace(workflow.id)
  publishDialogOpen.value = false
  if (!ok) return
  toast.add({
    severity: 'success',
    summary: t('prototype.workflowMenu.toast.publishedSummary'),
    detail: t('prototype.workflowMenu.toast.publishedDetail', {
      workflow: publishState.value.targetWorkflowName ?? workflow.name,
      project: publishState.value.targetProjectName ?? ''
    }),
    life: 2800
  })
}

function onAskOwner() {
  const ok = personaStore.submitWorkflowForReview(workflow.id)
  publishDialogOpen.value = false
  if (!ok) return
  toast.add({
    severity: 'success',
    summary: t('prototype.workflowMenu.toast.submittedSummary'),
    detail: t('prototype.workflowMenu.toast.submittedDetail', {
      workflow: publishState.value.targetWorkflowName ?? workflow.name
    }),
    life: 2800
  })
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
    out.push({
      label: t('prototype.workflowMenu.branch'),
      icon: 'icon-[lucide--git-branch]',
      command: onBranch
    })
    out.push({
      label: t('prototype.workflowMenu.saveToMyWorkflows'),
      icon: 'icon-[lucide--copy]',
      command: onSaveToMyWorkflows
    })
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

  // Runner: fork-into-My-Workflows is the explicit way to get a working
  // copy without going through Open (which also forks per
  // published-workflow-model). App Runner can't fork per spec.
  if (isRunner.value) {
    out.push({ separator: true })
    out.push({
      label: t('prototype.workflowMenu.branch'),
      icon: 'icon-[lucide--git-branch]',
      command: onBranch
    })
    out.push({
      label: t('prototype.workflowMenu.saveToMyWorkflows'),
      icon: 'icon-[lucide--copy]',
      command: onSaveToMyWorkflows
    })
  }

  // Publish to workspace — shows on any branch of a shared canonical, for
  // every actor (the dialog adapts: Publish for those with overwrite
  // rights, Submit for review otherwise). Per published-workflow-model.
  if (publishState.value.isPublishable) {
    out.push({ separator: true })
    out.push({
      label: t('prototype.workflowMenu.publishToWorkspace'),
      icon: 'icon-[lucide--git-merge]',
      command: onPublishToWorkspace
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
