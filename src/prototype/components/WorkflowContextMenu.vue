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

    Owner       — Open, Rename, Fork, Move to project, Save destination,
                  Share, Publish (direct link / Hub), View outputs,
                  Open containing project, Delete
    Runner      — Open (fork-on-open), Fork, View outputs,
                  Open containing project
    App Runner  — Run app, View outputs, Open containing project

  Sharing / publish / view-outputs are prototype stubs that toast — the
  full surfaces exist in their own flows. Storage and Move trigger real
  store mutations.
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
        :class="
          cn(
            'w-full justify-start gap-2',
            (item as InactiveMenuItem).inactive && 'opacity-50'
          )
        "
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

  <WorkflowMoveDialog
    v-if="moveDialogOpen"
    :workflow="workflow"
    @close="moveDialogOpen = false"
    @moved="onMoved"
  />

  <Teleport v-if="saveToCloudPrompt" to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      @click.self="saveToCloudPrompt = null"
    >
      <div
        class="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border-subtle bg-base-background p-6 shadow-2xl"
      >
        <header class="flex flex-col gap-1">
          <h2 class="text-lg font-semibold">
            {{ t('prototype.workflowMenu.saveToCloudPrompt.title') }}
          </h2>
          <p class="text-sm text-muted-foreground">
            {{
              t(
                `prototype.workflowMenu.saveToCloudPrompt.body.${saveToCloudPrompt}`,
                { name: workflow.name }
              )
            }}
          </p>
        </header>
        <footer class="flex justify-end gap-2">
          <button
            type="button"
            class="inline-flex h-9 cursor-pointer items-center rounded-lg bg-secondary-background px-3 text-sm transition-colors hover:bg-secondary-background-hover"
            @click="saveToCloudPrompt = null"
          >
            {{ t('prototype.workflowMenu.saveToCloudPrompt.cancel') }}
          </button>
          <button
            type="button"
            class="inline-flex h-9 cursor-pointer items-center rounded-lg bg-primary-background px-3 text-sm font-medium text-button-surface-contrast transition-colors hover:bg-primary-background-hover"
            @click="confirmSaveAndContinue"
          >
            {{ t('prototype.workflowMenu.saveToCloudPrompt.confirm') }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
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

import WorkflowMoveDialog from './WorkflowMoveDialog.vue'
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
const uiStore = usePrototypeUiStore()
const { fixture } = storeToRefs(personaStore)

type ContextMenuHandle = {
  show: (event: MouseEvent) => void
  hide: () => void
}
const contextMenu = ref<ContextMenuHandle | null>(null)

const moveDialogOpen = ref(false)

// Share / Publish / Submit assume a cloud-resident workflow per
// concepts/sharing-vs-publishing.md ("Recipients access a canonical
// workflow inside the host workspace"). When the workflow is local, we
// surface the menu items as inactive and intercept the click with a
// "Save to cloud first?" prompt — matching the wiki's "auto-created
// lazily" language in decisions/save-destination-workflow-level.md.
type SaveToCloudIntent = 'share' | 'publish-link' | 'publish-hub'
const saveToCloudPrompt = ref<SaveToCloudIntent | null>(null)

type InactiveMenuItem = MenuItem & { inactive?: boolean }

const effectiveStorage = computed(() =>
  personaStore.getEffectiveWorkflowStorage(workflow.id, workflow.storage)
)
const isLocal = computed(() => effectiveStorage.value !== 'cloud')

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

function show(event: MouseEvent) {
  contextMenu.value?.show(event)
}
defineExpose({ show })

function toastStub(key: string) {
  toast.add({
    severity: 'info',
    summary: t('prototype.workflowMenu.toastStubSummary'),
    detail: t(key),
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

function onFork() {
  const newId = personaStore.forkWorkflow(workflow.id)
  if (!newId) return
  toast.add({
    severity: 'success',
    summary: t('prototype.workflowMenu.toast.forkedSummary'),
    detail: t('prototype.workflowMenu.toast.forkedDetail', {
      name: workflow.name
    }),
    life: 2800
  })
}

function onMove() {
  moveDialogOpen.value = true
}

function onMoved(targetProjectId: string) {
  const target = fixture.value.projects.find((p) => p.id === targetProjectId)
  toast.add({
    severity: 'success',
    summary: t('prototype.workflowMenu.toast.movedSummary'),
    detail: t('prototype.workflowMenu.toast.movedDetail', {
      name: workflow.name,
      project: target?.name ?? ''
    }),
    life: 2800
  })
}

function onSaveToCloud() {
  if (effectiveStorage.value === 'cloud') return
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

function onExport() {
  toastStub('prototype.workflowMenu.toast.exportStub')
}

function runShareIntent(intent: SaveToCloudIntent) {
  if (intent === 'share') {
    toastStub('prototype.workflowMenu.toast.shareStub')
  } else if (intent === 'publish-link') {
    toastStub('prototype.workflowMenu.toast.publishLinkStub')
  } else {
    toastStub('prototype.workflowMenu.toast.publishHubStub')
  }
}

function onShareIntent(intent: SaveToCloudIntent) {
  if (isLocal.value) {
    saveToCloudPrompt.value = intent
    return
  }
  runShareIntent(intent)
}

function confirmSaveAndContinue() {
  const intent = saveToCloudPrompt.value
  saveToCloudPrompt.value = null
  if (!intent) return
  personaStore.setWorkflowStorage(workflow.id, 'cloud')
  toast.add({
    severity: 'success',
    summary: t('prototype.workflowMenu.toast.savedToCloudSummary'),
    detail: t('prototype.workflowMenu.toast.savedToCloudDetail', {
      name: workflow.name
    }),
    life: 2200
  })
  runShareIntent(intent)
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
  uiStore.go({ kind: 'project', projectId: sourceProject.value.id })
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
      label: t('prototype.workflowMenu.duplicate'),
      icon: 'icon-[lucide--copy]',
      command: onFork
    })
    out.push({
      label: t('prototype.workflowMenu.moveToProject'),
      icon: 'icon-[lucide--folder-input]',
      command: onMove
    })
    if (effectiveStorage.value === 'cloud') {
      out.push({
        label: t('prototype.workflowMenu.export'),
        icon: 'icon-[lucide--download]',
        command: onExport
      })
    } else {
      out.push({
        label: t('prototype.workflowMenu.saveToCloud'),
        icon: 'icon-[lucide--cloud-upload]',
        command: onSaveToCloud
      })
    }
  }

  // Runner: fork-into-My-Workflows is the explicit way to get a working
  // copy without going through Open (which also forks per
  // published-workflow-model). App Runner can't fork per spec.
  if (isRunner.value) {
    out.push({ separator: true })
    out.push({
      label: t('prototype.workflowMenu.fork'),
      icon: 'icon-[lucide--git-fork]',
      command: onFork
    })
  }

  // Sharing / publishing — Owner only. All three require cloud
  // residency per concepts/sharing-vs-publishing.md, so when storage
  // is local the items render inactive and clicking opens the
  // save-to-cloud prompt instead of running the action.
  if (isOwner.value) {
    out.push({ separator: true })
    out.push({
      label: t('prototype.workflowMenu.share'),
      icon: 'icon-[lucide--users-round]',
      inactive: isLocal.value,
      command: () => onShareIntent('share')
    } satisfies InactiveMenuItem)
    if (canPublishDirectLink.value) {
      out.push({
        label: t('prototype.workflowMenu.publishDirectLink'),
        icon: 'icon-[lucide--link]',
        inactive: isLocal.value,
        command: () => onShareIntent('publish-link')
      } satisfies InactiveMenuItem)
    }
    if (canSubmitToHub.value) {
      out.push({
        label: t('prototype.workflowMenu.publishHub'),
        icon: 'icon-[lucide--upload]',
        inactive: isLocal.value,
        command: () => onShareIntent('publish-hub')
      } satisfies InactiveMenuItem)
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
