<!--
  Implements:
    concept:   ../IA_Plan/wiki/concepts/personas-and-flows.md
    decision:  ../IA_Plan/wiki/decisions/drafts-as-default-private-project.md
    log:       ../IA_Plan/wiki/prototype-log.md#flow-01-dashboard
    concept:   ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
    flow:      ../prototype/flows/07-custom-cloud-happy-path.md

  Dashboard shell. Content is driven by the active top-bar tab:
    - Media-Assets tab active → real MediaAssetsView takes over the area
      below PrototypeTabs (it owns its own sidebar).
    - A workflow tab → the real ComfyUI editor (RealEditor). It stays
      mounted, invisible while another tab is active, so it boots once.
    - Home tab → prototype dashboard with PrototypeSidebar / LibrarySidebar
      based on uiStore.activeView.
  Custom Comfy Cloud layers on top: a file dropped anywhere opens
  matte_pass, and switching projects plays a reload transition.
-->
<template>
  <div
    class="relative flex size-full flex-col"
    @dragover.capture="onFileDragOver"
    @dragleave="onFileDragLeave"
    @drop.capture="onFileDrop"
  >
    <div class="relative flex min-h-0 flex-1">
      <div v-if="isMediaAssetsTabActive" class="relative flex min-h-0 flex-1">
        <LocalMediaView v-if="isLocalMode" />
        <MediaAssetsView v-else />
      </div>
      <div v-else-if="!isEditorTabActive" class="flex min-h-0 flex-1">
        <PrototypeSidebar />

        <main
          :class="
            cn(
              'min-w-0 flex-1 overflow-auto bg-base-background text-base-foreground',
              activeView.kind !== 'settings' && 'p-6'
            )
          "
        >
          <HomeView v-if="activeView.kind === 'home'" />
          <DraftsView v-else-if="activeView.kind === 'drafts'" />
          <ProjectsView v-else-if="activeView.kind === 'projects'" />
          <MediaView v-else-if="activeView.kind === 'media'" />
          <EnvironmentsView
            v-else-if="activeView.kind === 'environments'"
            :key="fixture.currentWorkspaceId"
          />
          <ProjectDetailView
            v-else-if="activeView.kind === 'project'"
            :key="activeView.projectId"
            :project-id="activeView.projectId"
          />
          <RecentsView v-else-if="activeView.kind === 'recents'" />
          <TemplatesView v-else-if="activeView.kind === 'templates'" />
          <SettingsView v-else-if="activeView.kind === 'settings'" />
        </main>
      </div>
      <RealEditor />

      <BuildReadyToast
        v-if="readyProject"
        :title="
          tText('prototype.customCloud.ready.title', {
            project: readyProject.name
          })
        "
        :body="
          tText('prototype.customCloud.ready.body', {
            workflow: MATTE_PASS.name,
            project: readyProject.name
          })
        "
        @dismiss="customCloud.readyProjectId = null"
      />
      <BuildReadyToast
        v-else-if="customNodes.ready"
        :title="
          tText('prototype.customNodes.ready.title', {
            deployment: customNodes.ready.deploymentName,
            release: customNodes.ready.release
          })
        "
        :body="
          tText(
            customNodes.ready.kind === 'add'
              ? 'prototype.customNodes.ready.bodyAdd'
              : 'prototype.customNodes.ready.bodyChange',
            {
              pack: customNodes.ready.packNames.join(', '),
              version: customNodes.ready.version,
              deployment: customNodes.ready.deploymentName
            }
          )
        "
        @dismiss="customNodes.ready = null"
      />
      <div
        v-if="isDraggingFile"
        class="pointer-events-none absolute inset-0 z-30 grid place-items-center border-2 border-dashed border-primary-background bg-primary-background/10"
      >
        <span
          class="rounded-lg bg-base-background px-4 py-2 text-sm text-base-foreground"
        >
          {{ t('prototype.customCloud.editor.dropHint') }}
        </span>
      </div>
    </div>

    <div v-if="showDemoControls" class="fixed bottom-4 left-64 z-50">
      <DemoControls />
    </div>

    <WorkflowDragGhost />
    <RunTargetDialog v-if="customCloud.dialogStep" />
    <CustomNodesDialog v-if="customNodes.isOpen" />
    <CustomNodesRebuildDialog
      v-if="customNodes.pendingChanges"
      :changes="customNodes.pendingChanges"
    />
    <ProjectReloadOverlay v-if="reloadingProject" :project="reloadingProject" />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import MediaAssetsView from '@/platform/assets/components/MediaAssetsView.vue'
import BuildReadyToast from '../components/BuildReadyToast.vue'
import CustomNodesDialog from '../components/CustomNodesDialog.vue'
import CustomNodesRebuildDialog from '../components/CustomNodesRebuildDialog.vue'
import DemoControls from '../components/DemoControls.vue'
import LocalMediaView from '../components/LocalMediaView.vue'
import ProjectReloadOverlay from '../components/ProjectReloadOverlay.vue'
import RealEditor from '../components/RealEditor.vue'
import PrototypeSidebar from '../components/PrototypeSidebar.vue'
import RunTargetDialog from '../components/RunTargetDialog.vue'
import WorkflowDragGhost from '../components/WorkflowDragGhost.vue'
import { useTextT } from '../composables/useTextT'
import { MATTE_PASS } from '../fixtures/customCloud'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypeCustomNodesStore } from '../stores/customNodesStore'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { MEDIA_ASSETS_TAB_ID, usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import DraftsView from '../views/DraftsView.vue'
import HomeView from '../views/HomeView.vue'
import MediaView from '../views/MediaView.vue'
import ProjectDetailView from '../views/ProjectDetailView.vue'
import ProjectsView from '../views/ProjectsView.vue'
import EnvironmentsView from '../views/EnvironmentsView.vue'
import RecentsView from '../views/RecentsView.vue'
import SettingsView from '../views/SettingsView.vue'
import TemplatesView from '../views/TemplatesView.vue'

const { t } = useI18n()
const uiStore = usePrototypeUiStore()
const tabsStore = usePrototypeTabsStore()
const personaStore = usePrototypePersonaStore()
const customCloud = usePrototypeCustomCloudStore()
const customNodes = usePrototypeCustomNodesStore()
const tText = useTextT()
const { activeView } = storeToRefs(uiStore)
const { activeTabId, openTabs } = storeToRefs(tabsStore)
const { fixture } = storeToRefs(personaStore)

const isMediaAssetsTabActive = computed(
  () => activeTabId.value === MEDIA_ASSETS_TAB_ID
)
const isEditorTabActive = computed(
  () =>
    openTabs.value.find((tab) => tab.id === activeTabId.value)?.kind ===
    'workflow'
)
const isLocalMode = computed(() => fixture.value.mode === 'local')

const readyProject = computed(() =>
  fixture.value.projects.find((p) => p.id === customCloud.readyProjectId)
)
const reloadingProject = computed(() =>
  fixture.value.projects.find((p) => p.id === customCloud.reloadingToId)
)

// The demo controls are a prototype affordance: surface it on the dev server
// and on the deployed prototype (Vercel, built with PROTOTYPE_DEPLOY=true),
// but never in a real ComfyUI production build.
const showDemoControls =
  import.meta.env.DEV || import.meta.env.VITE_PROTOTYPE_DEPLOY

// Any file dropped on the app opens as the incompatible matte_pass workflow,
// so a live demo can't miss. Caught on the way down, so the editor's own
// drop handler never loads the file. Media Assets keeps its own drop
// handling, and in-app card drags (no files) pass straight through.
const isDraggingFile = ref(false)
const handlesFileDrops = computed(
  () => customCloud.isEnabled && !isMediaAssetsTabActive.value
)

function carriesFiles(event: DragEvent) {
  return event.dataTransfer?.types.includes('Files') ?? false
}

function onFileDragOver(event: DragEvent) {
  if (!handlesFileDrops.value || !carriesFiles(event)) return
  event.preventDefault()
  isDraggingFile.value = true
}

function onFileDragLeave(event: DragEvent) {
  if (!event.relatedTarget) isDraggingFile.value = false
}

function onFileDrop(event: DragEvent) {
  if (!handlesFileDrops.value || !carriesFiles(event)) return
  event.preventDefault()
  event.stopPropagation()
  isDraggingFile.value = false
  customCloud.dropIncompatibleWorkflow()
}
</script>
