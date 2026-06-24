<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/project.md
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md — project level
    log:     ../prototype/design-decisions.md (2026-05-13 Sharing panel)
    log:     ../prototype/design-decisions.md (2026-05-15 Project Settings tab)

  Single-project view. Workflows live in the body; the Sharing panel
  lives in a modal accessed from the header (avatar summary + Share
  button), mirroring Google Drive's Share affordance.

  Body tabs: Workflows (always visible) and Usage (Owner/Admin-only). The
  Usage tab is gated by `canViewUsage` so a Collaborator sees the
  Workflows view directly and the tab strip collapses.
-->
<template>
  <div class="flex flex-col gap-6">
    <button
      type="button"
      class="flex w-fit cursor-pointer items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-base-foreground"
      @click="onBack"
    >
      <span class="icon-[lucide--arrow-left] size-4" />
      {{ backLabel }}
    </button>

    <header class="flex items-start justify-between gap-4">
      <PageTitle>{{ project?.name }}</PageTitle>
      <div v-if="project" class="flex items-center gap-2">
        <button
          v-if="project.tier !== 'private'"
          type="button"
          class="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-secondary-background pr-3 pl-1.5 text-sm transition-colors hover:bg-secondary-background-hover"
          @click="isSharingOpen = true"
        >
          <span
            v-if="accessLevel !== 'private' && visibleAvatars.length"
            class="flex items-center"
          >
            <span
              v-for="(a, i) in visibleAvatars"
              :key="a.userId"
              :class="
                cn(
                  'grid size-6 place-items-center rounded-full border-2 border-secondary-background text-[10px] font-semibold text-button-surface-contrast',
                  i > 0 && '-ml-2'
                )
              "
              :style="{ backgroundColor: a.avatarColor }"
              :title="a.name"
            >
              {{ a.initial }}
            </span>
            <span
              v-if="hiddenAvatarCount > 0"
              class="-ml-2 grid size-6 place-items-center rounded-full border-2 border-secondary-background bg-secondary-background-hover text-[10px] font-semibold text-muted-foreground"
            >
              {{
                t('prototype.views.project.sharing.summaryMore', {
                  count: hiddenAvatarCount
                })
              }}
            </span>
          </span>
          <span class="text-muted-foreground">
            {{ sharingSummary }}
          </span>
          <span class="mx-1 text-muted-foreground">·</span>
          <span class="font-medium">
            {{ t('prototype.views.project.sharing.shareButton') }}
          </span>
        </button>
        <button
          type="button"
          class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-secondary-background px-3 text-sm transition-colors hover:bg-secondary-background-hover"
          @click="onViewMediaAssets"
        >
          <span class="icon-[lucide--image] size-4" />
          {{ t('prototype.views.project.viewMediaAssets') }}
        </button>
        <button
          type="button"
          class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary-background px-3 text-sm font-medium text-button-surface-contrast transition-colors hover:bg-primary-background-hover"
          @click="onNewWorkflow"
        >
          {{ t('prototype.views.project.newWorkflow') }}
        </button>
      </div>
    </header>

    <p v-if="!project" class="text-sm text-muted-foreground">
      {{ t('prototype.views.project.notFound') }}
    </p>

    <template v-else>
      <nav
        v-if="visibleTabs.length > 1"
        class="flex gap-1 border-b border-interface-stroke"
        role="tablist"
      >
        <button
          v-for="tab in visibleTabs"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.id"
          :class="
            cn(
              'inline-flex h-10 cursor-pointer appearance-none items-center gap-2 border-0 border-b-2 bg-transparent px-3 text-sm transition-colors',
              activeTab === tab.id
                ? 'border-text-primary text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )
          "
          @click="activeTab = tab.id"
        >
          <span>{{ tab.label }}</span>
          <span
            v-if="tab.count"
            class="rounded-full bg-secondary-background px-2 py-0.5 text-xs text-text-secondary"
          >
            {{ tab.count }}
          </span>
        </button>
      </nav>

      <div class="flex flex-col gap-6">
        <template v-if="activeTab === 'workflows'">
          <section class="flex flex-col gap-3">
            <div class="flex items-baseline justify-between">
              <div class="flex items-center gap-1.5">
                <h2
                  class="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
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

            <nav v-if="currentFolder" class="flex items-center gap-1.5 text-sm">
              <button
                type="button"
                class="cursor-pointer text-muted-foreground transition-colors hover:text-base-foreground"
                @click="goToRoot"
              >
                {{ t('prototype.views.project.workflowsHeading') }}
              </button>
              <i
                class="icon-[lucide--chevron-right] size-4 text-muted-foreground"
              />
              <span class="font-medium">{{ currentFolder.name }}</span>
            </nav>

            <div
              v-if="showFolders"
              class="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-3"
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

          <section class="flex flex-col gap-3">
            <div class="flex items-baseline justify-between">
              <div class="flex items-center gap-1.5">
                <h2
                  class="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
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
                v-if="myDraftsWithMeta.length"
                class="text-xs text-muted-foreground"
              >
                {{
                  t('prototype.views.project.draftCount', {
                    count: myDraftsWithMeta.length
                  })
                }}
              </span>
            </div>
            <div
              v-if="myDraftsWithMeta.length"
              class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-6"
            >
              <WorkflowCard
                v-for="d in myDraftsWithMeta"
                :key="d.wf.id"
                :workflow="d.wf"
                :draft-meta="d.meta"
                actions="draft"
                @open="onOpenDraft"
                @publish="publishDraft"
                @open-project="onOpenProject"
              />
            </div>
            <div
              v-else
              class="rounded-xl border border-dashed border-border-subtle p-10 text-center text-sm text-muted-foreground"
            >
              {{ t('prototype.views.project.draftsEmpty') }}
            </div>
          </section>
        </template>

        <ProjectUsageSection
          v-else-if="activeTab === 'usage'"
          :usage="project?.monthlyUsage ?? []"
          :project-name="project?.name ?? ''"
        />
      </div>
    </template>

    <ProjectSharingDialog
      v-if="isSharingOpen && project && project.tier !== 'private'"
      :project="project"
      @close="isSharingOpen = false"
    />

    <WorkflowEditorNoticeDialog
      v-if="showEditorNotice"
      @close="showEditorNotice = false"
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

import PageTitle from '../components/PageTitle.vue'

import Button from '@/components/ui/button/Button.vue'

import FolderCard from '../components/FolderCard.vue'
import InfoTooltip from '../components/InfoTooltip.vue'
import ProjectSharingDialog from '../components/ProjectSharingDialog.vue'
import ProjectUsageSection from '../components/ProjectUsageSection.vue'
import PromoteToProjectDialog from '../components/PromoteToProjectDialog.vue'
import PromptDialog from '../components/PromptDialog.vue'
import PublishConfirmDialog from '../components/PublishConfirmDialog.vue'
import SelectableWorkflowGrid from '../components/SelectableWorkflowGrid.vue'
import WorkflowCard from '../components/WorkflowCard.vue'
import WorkflowEditorNoticeDialog from '../components/WorkflowEditorNoticeDialog.vue'
import { useFolderBrowser } from '../composables/useFolderBrowser'
import { useProjectAccess } from '../composables/useProjectAccess'
import { useWorkflowPublish } from '../composables/useWorkflowPublish'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import { deriveDraftMeta } from '../utils/draftMeta'

type ProjectTabId = 'workflows' | 'usage'

const { projectId } = defineProps<{
  projectId: string
}>()

const { t } = useI18n()
const toast = useToast()
const personaStore = usePrototypePersonaStore()
const uiStore = usePrototypeUiStore()
const tabsStore = usePrototypeTabsStore()
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
const showEditorNotice = ref(false)
const activeTab = ref<ProjectTabId>('workflows')

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
// new editor tab. No editor in the prototype, so a placeholder notice stands
// in for the editor while the tab strip shows the opened tab.
function onNewWorkflow() {
  const newId = personaStore.createDraftInProject(projectId)
  if (!newId) return
  activeTab.value = 'workflows'
  const wf = fixture.value.workflows.find((w) => w.id === newId)
  tabsStore.openWorkflow(wf?.name ?? 'Untitled workflow')
  showEditorNotice.value = true
}

// Draft primary action. No editor in the prototype — opening a draft toasts.
function onOpenDraft(workflowId: string) {
  const wf = fixture.value.workflows.find((w) => w.id === workflowId)
  toast.add({
    severity: 'info',
    summary: t('prototype.workflowCard.openedSummary'),
    detail: t('prototype.workflowCard.openedDetail', { name: wf?.name ?? '' }),
    life: 2200
  })
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

const visibleTabs = computed(() => {
  const tabs: Array<{ id: ProjectTabId; label: string; count?: number }> = [
    {
      id: 'workflows',
      label: t('prototype.views.project.tabs.workflows')
    }
  ]
  if (canViewUsage.value) {
    tabs.push({
      id: 'usage',
      label: t('prototype.views.project.tabs.usage')
    })
  }
  return tabs
})

watchEffect(() => {
  if (!visibleTabs.value.some((tab) => tab.id === activeTab.value)) {
    activeTab.value = visibleTabs.value[0]?.id ?? 'workflows'
  }
})

const backLabel = computed(() => t('prototype.views.project.back'))

function onBack() {
  uiStore.go({ kind: 'projects' })
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

// "My drafts" — the viewer's own unpublished copies that live in My
// Workflows but carry this project as their provenance. Surfaced here (not
// moved) so the project keeps the association. Per
// ../IA_Plan/wiki/entities/project.md §"Project surface (MVP)".
const myDrafts = computed(() => {
  const draftsId = draftsProject.value?.id
  if (!draftsId) return []
  return fixture.value.workflows
    .filter(
      (w) => w.projectId === draftsId && w.provenanceProjectId === projectId
    )
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})

const myDraftsWithMeta = computed(() =>
  myDrafts.value.map((wf) => ({
    wf,
    meta: deriveDraftMeta(wf, fixture.value.workflows, fixture.value.projects)
  }))
)

function onViewMediaAssets() {
  uiStore.setProjectFilter(projectId)
  tabsStore.openMediaAssets(t('prototype.sidebar.libraryMedia'))
}

// People with access drive the Share button's avatar stack + summary.
const { accessLevel, visibleAvatars, hiddenAvatarCount, peopleCount } =
  useProjectAccess(project)

const sharingSummary = computed(() => {
  switch (accessLevel.value) {
    case 'everyone':
      return t('prototype.views.project.sharing.summaryAnyone', {
        workspace: currentWorkspace.value?.name ?? ''
      })
    case 'private':
      return t('prototype.views.project.sharing.summaryPrivate')
    default:
      return t('prototype.views.project.sharing.summaryRestricted', {
        count: peopleCount.value
      })
  }
})
</script>
