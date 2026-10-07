<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/project.md
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md — project level
    log:     ../prototype/design-decisions.md (2026-05-13 Sharing panel)
    log:     ../prototype/design-decisions.md (2026-05-15 Project Settings tab)
    concept: ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — Settings shows
             the deployment; opening a workflow switches the tab strip to
             this project

  Single-project view. Workflows live in the body; the Sharing panel
  lives in a modal accessed from the header (avatar summary + Share
  button), mirroring Google Drive's Share affordance.

  Body tabs: Workflows (always visible), Usage (Owner/Admin-only) and
  Settings (the project's deployment). The Usage tab is gated by
  `canViewUsage` so a Collaborator sees the Workflows view directly.
-->
<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
    <PrototypeBreadcrumb
      :items="breadcrumbItems"
      :drop-folder-ids="breadcrumbDropTargets"
      @navigate="onBreadcrumb"
    />

    <ProjectPageHeader
      v-if="project"
      v-model:active-tab="activeTab"
      :project
      :can-view-usage="canViewUsage"
      @share="isSharingOpen = true"
      @media="onViewMediaAssets"
      @environment="isEnvironmentOpen = true"
      @new-workflow="onNewWorkflow"
    />

    <p v-if="!project" class="text-sm text-muted-foreground">
      {{ t('prototype.views.project.notFound') }}
    </p>

    <template v-else>
      <div class="flex flex-col gap-6">
        <template v-if="activeTab === 'workflows'">
          <section
            :class="
              cn(
                'flex flex-col gap-3 rounded-xl',
                dropTarget === 'published' &&
                  'outline-2 outline-offset-8 outline-primary-background outline-dashed'
              )
            "
            @dragover="onPublishedDragOver"
            @dragleave="onSectionDragLeave"
            @drop="onPublishedDrop"
          >
            <div class="flex items-baseline justify-between">
              <div class="flex items-center gap-1.5">
                <h2
                  class="text-sm font-semibold tracking-wide text-base-foreground uppercase"
                >
                  {{ t('prototype.views.project.workflowsHeading') }}
                </h2>
                <InfoTooltip
                  :label="t('prototype.views.project.workflowsHeading')"
                >
                  <span>{{
                    t('prototype.views.project.publishedInfo.shared')
                  }}</span>
                  <span>{{
                    t('prototype.views.project.publishedInfo.copy')
                  }}</span>
                  <span>{{
                    t('prototype.views.project.publishedInfo.publish')
                  }}</span>
                </InfoTooltip>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  v-if="!currentFolder"
                  variant="textonly"
                  size="sm"
                  @click="creatingFolder = true"
                >
                  <i class="icon-[lucide--folder-plus] size-4" />
                  {{ t('prototype.folders.newFolder') }}
                </Button>
                <span
                  v-if="workflows.length"
                  class="text-xs text-muted-foreground"
                >
                  {{
                    t('prototype.views.project.workflowCount', {
                      count: workflows.length
                    })
                  }}
                </span>
              </div>
            </div>

            <div
              v-if="showFolders"
              class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-6"
            >
              <FolderCard
                v-for="f in folders"
                :key="f.id"
                :folder="f"
                :count="workflowCount(f.id)"
                @open="enterFolder"
              />
            </div>

            <SelectableWorkflowGrid
              v-if="publishedHere.length"
              :workflows="publishedHere"
              :container-id="projectId"
              layout-class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-6"
            >
              <template
                #default="{
                  isSelected,
                  selectionActive,
                  onSelect,
                  onContextMenu,
                  onDragStart
                }"
              >
                <WorkflowCard
                  v-for="wf in publishedHere"
                  :key="wf.id"
                  :workflow="wf"
                  actions="published"
                  draggable
                  selectable
                  :selected="isSelected(wf.id)"
                  :selection-active="selectionActive"
                  :copies="copiesByCanonical[wf.id] ?? []"
                  @copy="onCopyWorkflow"
                  @open="onOpenDraft"
                  @open-project="onOpenProject"
                  @select="onSelect(wf.id, $event)"
                  @context-menu="onContextMenu($event)"
                  @dragstart="onDragStart(wf.id, $event)"
                />
              </template>
            </SelectableWorkflowGrid>
            <div
              v-else-if="publishedEmpty"
              class="rounded-xl border border-dashed border-border-subtle p-10 text-center text-sm text-muted-foreground"
            >
              {{ publishedEmpty }}
            </div>
          </section>

          <section
            :class="
              cn(
                'flex flex-col gap-3 rounded-xl',
                dropTarget === 'drafts' &&
                  'outline-2 outline-offset-8 outline-primary-background outline-dashed'
              )
            "
            @dragover="onDraftsDragOver"
            @dragleave="onSectionDragLeave"
            @drop="onDraftsDrop"
          >
            <div class="flex items-baseline justify-between">
              <div class="flex items-center gap-1.5">
                <h2
                  class="text-sm font-semibold tracking-wide text-base-foreground uppercase"
                >
                  {{ t('prototype.views.project.draftsHeading') }}
                </h2>
                <InfoTooltip
                  :label="t('prototype.views.project.draftsHeading')"
                >
                  <span>{{
                    t('prototype.views.project.draftsInfo.private')
                  }}</span>
                  <span>{{
                    t('prototype.views.project.draftsInfo.publish')
                  }}</span>
                </InfoTooltip>
              </div>
              <span
                v-if="draftsWithMeta.length"
                class="text-xs text-muted-foreground"
              >
                {{
                  t('prototype.views.project.draftCount', {
                    count: draftsWithMeta.length
                  })
                }}
              </span>
            </div>
            <div
              v-if="draftsWithMeta.length"
              class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-6"
            >
              <WorkflowCard
                v-for="d in draftsWithMeta"
                :key="d.wf.id"
                :workflow="d.wf"
                :draft-meta="d.meta"
                actions="draft"
                draggable
                @open="onOpenDraft"
                @publish="publishDraft"
                @open-project="onOpenProject"
                @dragstart="onDraftDragStart(d.wf.id, $event)"
              />
            </div>
            <div
              v-else
              class="rounded-xl border border-dashed border-border-subtle p-10 text-center text-sm text-muted-foreground"
            >
              {{ draftsEmptyMessage }}
            </div>
          </section>
        </template>

        <ProjectUsageSection v-else-if="activeTab === 'usage'" :project />

        <ProjectSettingsTab
          v-else-if="activeTab === 'settings'"
          :project
          @members="activeTab = 'members'"
          @environment="isEnvironmentOpen = true"
        />

        <ProjectSharing
          v-else-if="activeTab === 'members'"
          :project
          :show-header="false"
        />
      </div>
    </template>

    <ProjectEnvironmentSheet
      v-if="isEnvironmentOpen && project"
      :deployment="customCloud.deploymentOf(project.id)"
      :project-id="project.id"
      @close="isEnvironmentOpen = false"
    />
    <ProjectSharingDialog
      v-if="isSharingOpen && project && project.tier !== 'private'"
      :project="project"
      @close="isSharingOpen = false"
    />

    <PromoteToProjectDialog
      v-if="publishSourceId"
      :source-workflow-id="publishSourceId"
      @close="closePublish"
      @publish="onPublished"
    />

    <PublishConfirmDialog
      v-if="pendingPublish"
      :workflow-name="pendingPublish.workflowName"
      :project-name="pendingPublish.projectName"
      :next-version="pendingPublish.nextVersion"
      @confirm="confirmPublishDraft"
      @publish-new="publishDraftAsNew"
      @close="cancelPublishConfirm"
    />

    <PromptDialog
      v-if="creatingFolder"
      :title="t('prototype.folders.newFolderTitle')"
      :placeholder="t('prototype.folders.namePlaceholder')"
      :confirm-label="t('prototype.folders.create')"
      @confirm="onCreateFolder"
      @cancel="creatingFolder = false"
    />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { useToast } from 'primevue/usetoast'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import FolderCard from '../components/FolderCard.vue'
import InfoTooltip from '../components/InfoTooltip.vue'
import ProjectEnvironmentSheet from '../components/project/ProjectEnvironmentSheet.vue'
import ProjectPageHeader from '../components/project/ProjectPageHeader.vue'
import ProjectSettingsTab from '../components/project/ProjectSettingsTab.vue'
import ProjectSharing from '../components/ProjectSharing.vue'
import ProjectSharingDialog from '../components/ProjectSharingDialog.vue'
import ProjectUsageSection from '../components/ProjectUsageSection.vue'
import PromoteToProjectDialog from '../components/PromoteToProjectDialog.vue'
import PromptDialog from '../components/PromptDialog.vue'
import PrototypeBreadcrumb from '../components/PrototypeBreadcrumb.vue'
import PublishConfirmDialog from '../components/PublishConfirmDialog.vue'
import SelectableWorkflowGrid from '../components/SelectableWorkflowGrid.vue'
import WorkflowCard from '../components/WorkflowCard.vue'
import { useFolderBrowser } from '../composables/useFolderBrowser'
import { useWorkflowDrag } from '../composables/useWorkflowDrag'
import { useWorkflowPublish } from '../composables/useWorkflowPublish'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import type { Workflow } from '../types'
import type { ProjectPageTab } from '../components/project/ProjectPageHeader.vue'
import { deriveDraftMeta } from '../utils/draftMeta'

const { projectId } = defineProps<{
  projectId: string
}>()

const { t } = useI18n()
const toast = useToast()
const personaStore = usePrototypePersonaStore()
const uiStore = usePrototypeUiStore()
const customCloud = usePrototypeCustomCloudStore()
const { fixture, currentWorkspace, draftsProject } = storeToRefs(personaStore)
const {
  publishSourceId,
  closePublish,
  onPublished,
  publishDraft,
  pendingPublish,
  confirmPublishDraft,
  cancelPublishConfirm,
  publishDraftAsNew
} = useWorkflowPublish()

const isSharingOpen = ref(false)
const activeTab = ref<ProjectPageTab>('workflows')
const isEnvironmentOpen = ref(false)

onMounted(() => {
  // A project just created via workflow promotion asks to open its share
  // settings on arrival.
  if (uiStore.consumeShareIntent(projectId)) isSharingOpen.value = true
  // The projects-list "View usage" action requests the Usage tab on arrival.
  if (uiStore.consumeProjectTab(projectId) === 'usage' && canViewUsage.value) {
    activeTab.value = 'usage'
  }
})

// Published card primary action: take a personal copy into My Workflows
// (copy-on-access). The copy then surfaces in this project's "My drafts".
function onCopyWorkflow(workflowId: string) {
  const newId = personaStore.copyToMyWorkflows(workflowId)
  if (!newId) return
  const copy = fixture.value.workflows.find((w) => w.id === newId)
  toast.add({
    severity: 'success',
    summary: t('prototype.workflowCard.copiedSummary'),
    detail: t('prototype.workflowCard.copiedDetail', {
      name: copy?.name ?? ''
    }),
    life: 2800
  })
}

// "+ Workflow" — create a fresh draft in the viewer's My Workflows tied to
// this project (it lands in the "My drafts" section below), then open it in a
// new editor tab. The tab belongs to this project, so the tab strip switches
// (reloads) into it first if another project is current.
function onNewWorkflow() {
  const newId = personaStore.createDraftInProject(projectId)
  if (!newId) return
  activeTab.value = 'workflows'
  const wf = fixture.value.workflows.find((w) => w.id === newId)
  if (wf) customCloud.openWorkflow(projectId, wf)
}

function onOpenDraft(workflowId: string) {
  const wf = fixture.value.workflows.find((w) => w.id === workflowId)
  if (wf) customCloud.openWorkflow(projectId, wf)
}

const project = computed(() =>
  fixture.value.projects.find((p) => p.id === projectId)
)

// Owner/Admin-only usage visibility per
// ../IA_Plan/wiki/concepts/three-level-permissions.md §"Project level".
// Workspace Admins auto-act as Owner on workspace-wide projects only.
const canViewUsage = computed(() => {
  const p = project.value
  if (!p || p.isDrafts) return false
  const viewerId = fixture.value.currentUser.id
  if (p.ownerUserId === viewerId) return true
  return (
    p.tier === 'workspace-wide' &&
    currentWorkspace.value?.currentUserRole === 'admin'
  )
})

// If the viewer loses usage access while viewing it, fall back to workflows.
watchEffect(() => {
  if (activeTab.value === 'usage' && !canViewUsage.value) {
    activeTab.value = 'workflows'
  }
})

// Top-of-page trail: Projects › <project> [› <folder>]. The folder segment
// reflects the Published section's open folder.
const breadcrumbItems = computed(() => {
  const items = [t('prototype.sidebar.projects'), project.value?.name ?? '']
  if (currentFolder.value) items.push(currentFolder.value.name)
  return items
})

// The project-root crumb (index 1) accepts dropped workflows → project root.
const breadcrumbDropTargets = computed(() =>
  breadcrumbItems.value.map((_, i) => (i === 1 ? null : undefined))
)

function onBreadcrumb(index: number) {
  if (index === 0) uiStore.go({ kind: 'projects' })
  else if (index === 1) goToRoot()
}

function onOpenProject(id: string) {
  uiStore.go({ kind: 'project', projectId: id })
}

// Canonicals only — the "Published" registry. Working copies live in the
// actor's My Workflows, not the project grid.
const workflows = computed(() =>
  fixture.value.workflows
    .filter((w) => w.projectId === projectId && !w.forkedFrom)
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
)

// Folders organize the Published canonicals (single-level). My drafts stays
// flat.
const containerId = computed(() => projectId)
const {
  currentFolderId,
  currentFolder,
  folders,
  workflowsHere: publishedHere,
  workflowCount,
  enterFolder,
  goToRoot
} = useFolderBrowser(containerId, workflows)

const showFolders = computed(
  () => currentFolderId.value === null && folders.value.length > 0
)

const publishedEmpty = computed(() => {
  if (publishedHere.value.length > 0) return null
  if (currentFolder.value) return t('prototype.folders.empty')
  if (!showFolders.value) return t('prototype.views.project.empty')
  return null
})

const creatingFolder = ref(false)
function onCreateFolder(name: string) {
  creatingFolder.value = false
  personaStore.createFolder(projectId, name)
}

// The viewer's own copies, keyed by the canonical they forked from — drives
// each published card's "Open" CTA + multi-copy selector.
const copiesByCanonical = computed(() => {
  const viewerId = fixture.value.currentUser.id
  const buckets: Record<string, typeof fixture.value.workflows> = {}
  for (const w of fixture.value.workflows) {
    const canonicalId = w.forkedFrom?.workflowId
    if (!canonicalId || w.ownerUserId !== viewerId) continue
    ;(buckets[canonicalId] ??= []).push(w)
  }
  for (const list of Object.values(buckets)) {
    list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
  return buckets
})

// "Drafts" — the viewer's own unpublished copies that live in My Workflows
// but carry this project as their provenance. Surfaced here (not moved) so
// the project keeps the association. Per
// ../IA_Plan/wiki/entities/project.md §"Project surface (MVP)".
const projectDrafts = computed(() => {
  const draftsId = draftsProject.value?.id
  if (!draftsId) return []
  return fixture.value.workflows.filter(
    (w) => w.projectId === draftsId && w.provenanceProjectId === projectId
  )
})

// The whole project's drafts at root; inside a folder, only the drafts
// checked out from a published workflow that lives in that folder. Drafts
// created fresh in the project (no source workflow) belong to the root only.
const draftsHere = computed(() => {
  const folderId = currentFolder.value?.id
  const canonicalsInFolder = folderId
    ? new Set(
        workflows.value.filter((w) => w.folderId === folderId).map((w) => w.id)
      )
    : null
  return projectDrafts.value
    .filter(
      (d) =>
        !canonicalsInFolder ||
        (!!d.forkedFrom && canonicalsInFolder.has(d.forkedFrom.workflowId))
    )
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})

const draftsWithMeta = computed(() =>
  draftsHere.value.map((wf) => ({
    wf,
    meta: deriveDraftMeta(wf, fixture.value.workflows, fixture.value.projects)
  }))
)

const draftsEmptyMessage = computed(() =>
  currentFolder.value
    ? t('prototype.views.project.draftsFolderEmpty')
    : t('prototype.views.project.draftsEmpty')
)

// Drag published↔draft. A published canonical dragged onto the Drafts section
// is checked out (copy-on-access); a draft dragged onto the Published section
// enters the publish flow. Reuses the shared drag state that also powers folder
// drops + the collapsing ghost.
const { draggingWorkflowIds, startDrag } = useWorkflowDrag()
const dropTarget = ref<'published' | 'drafts' | null>(null)

const draggedWorkflows = computed(() =>
  draggingWorkflowIds.value
    .map((id) => fixture.value.workflows.find((w) => w.id === id))
    .filter((w): w is Workflow => !!w)
)

// Published canonicals of this project → checkoutable into Drafts.
const draggedCanCheckOut = computed(
  () =>
    draggedWorkflows.value.length > 0 &&
    draggedWorkflows.value.every(
      (w) => !w.forkedFrom && w.projectId === projectId
    )
)

// A single project draft → publishable up (publishDraft opens a dialog).
const draggedCanPublish = computed(
  () =>
    draggedWorkflows.value.length === 1 &&
    projectDrafts.value.some((d) => d.id === draggedWorkflows.value[0]?.id)
)

function onDraftDragStart(id: string, event: DragEvent) {
  startDrag([id], event)
}

function onPublishedDragOver(event: DragEvent) {
  if (!draggedCanPublish.value) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dropTarget.value = 'published'
}

function onDraftsDragOver(event: DragEvent) {
  if (!draggedCanCheckOut.value) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dropTarget.value = 'drafts'
}

function onSectionDragLeave(event: DragEvent) {
  const root = event.currentTarget as HTMLElement
  if (!root.contains(event.relatedTarget as Node | null)) {
    dropTarget.value = null
  }
}

function onPublishedDrop(event: DragEvent) {
  const id = draggedWorkflows.value[0]?.id
  const publishable = draggedCanPublish.value
  dropTarget.value = null
  if (!publishable || !id) return
  event.preventDefault()
  publishDraft(id)
}

function onDraftsDrop(event: DragEvent) {
  const ids = draggedWorkflows.value.map((w) => w.id)
  const checkoutable = draggedCanCheckOut.value
  const first = fixture.value.workflows.find((w) => w.id === ids[0])
  dropTarget.value = null
  if (!checkoutable) return
  event.preventDefault()
  let created = 0
  for (const id of ids) if (personaStore.copyToMyWorkflows(id)) created++
  if (!created) return
  toast.add({
    severity: 'success',
    summary: t('prototype.workflowCard.copiedSummary'),
    detail:
      created === 1
        ? t('prototype.workflowCard.copiedDetail', { name: first?.name ?? '' })
        : t('prototype.views.project.checkedOutCountDetail', {
            count: created
          }),
    life: 2800
  })
}

function onViewMediaAssets() {
  uiStore.setProjectFilter(projectId)
  uiStore.go({ kind: 'media' })
}
</script>
