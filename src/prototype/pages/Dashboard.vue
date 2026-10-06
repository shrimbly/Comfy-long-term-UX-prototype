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
    - A workflow tab → the demo editor (DemoEditorView).
    - Home tab → prototype dashboard with PrototypeSidebar / LibrarySidebar
      based on uiStore.activeView.
  Custom Comfy Cloud layers on top: a project whose deployment is building
  is locked below the tab strip, a file dropped anywhere opens matte_pass,
  and switching projects plays a reload transition.
-->
<template>
  <div
    class="relative flex size-full flex-col"
    @dragover="onFileDragOver"
    @dragleave="onFileDragLeave"
    @drop="onFileDrop"
  >
    <div class="relative flex min-h-0 flex-1">
      <div v-if="isMediaAssetsTabActive" class="relative flex min-h-0 flex-1">
        <LocalMediaView v-if="isLocalMode" />
        <MediaAssetsView v-else />
      </div>
      <DemoEditorView v-else-if="isEditorTabActive" />
      <div v-else class="flex min-h-0 flex-1">
        <PrototypeSidebar />

        <main
          class="flex-1 overflow-auto bg-base-background p-6 text-base-foreground"
        >
          <HomeView v-if="activeView.kind === 'home'" />
          <DraftsView v-else-if="activeView.kind === 'drafts'" />
          <ProjectsView v-else-if="activeView.kind === 'projects'" />
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

      <BuildLockModal
        v-if="customCloud.isLocked && customCloud.progress && currentProject"
        :project="currentProject"
        :progress="customCloud.progress"
      />
      <BuildReadyToast v-if="readyProject" :project="readyProject" />
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

    <div
      v-if="showPersonaSwitcher"
      class="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg border border-border-subtle bg-secondary-background p-2 shadow-lg"
    >
      <PersonaSwitcher />
      <DemoControls />
    </div>

    <WorkflowDragGhost />
    <RunTargetDialog v-if="customCloud.dialogStep" />
    <ProjectReloadOverlay
      v-if="reloadingProject"
      :project="reloadingProject"
      :deployment="customCloud.deploymentOf(reloadingProject.id)"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import MediaAssetsView from '@/platform/assets/components/MediaAssetsView.vue'
import BuildLockModal from '../components/BuildLockModal.vue'
import BuildReadyToast from '../components/BuildReadyToast.vue'
import DemoControls from '../components/DemoControls.vue'
import LocalMediaView from '../components/LocalMediaView.vue'
import PersonaSwitcher from '../components/PersonaSwitcher.vue'
import ProjectReloadOverlay from '../components/ProjectReloadOverlay.vue'
import PrototypeSidebar from '../components/PrototypeSidebar.vue'
import RunTargetDialog from '../components/RunTargetDialog.vue'
import WorkflowDragGhost from '../components/WorkflowDragGhost.vue'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { MEDIA_ASSETS_TAB_ID, usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import DemoEditorView from '../views/DemoEditorView.vue'
import DraftsView from '../views/DraftsView.vue'
import HomeView from '../views/HomeView.vue'
import ProjectDetailView from '../views/ProjectDetailView.vue'
import ProjectsView from '../views/ProjectsView.vue'
import RecentsView from '../views/RecentsView.vue'
import SettingsView from '../views/SettingsView.vue'
import TemplatesView from '../views/TemplatesView.vue'

const { t } = useI18n()
const uiStore = usePrototypeUiStore()
const tabsStore = usePrototypeTabsStore()
const personaStore = usePrototypePersonaStore()
const customCloud = usePrototypeCustomCloudStore()
const { activeView } = storeToRefs(uiStore)
const { activeTabId, openTabs } = storeToRefs(tabsStore)
const { fixture } = storeToRefs(personaStore)
const { currentProject } = storeToRefs(customCloud)

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

// The persona toggle is a prototype affordance: surface it on the dev server
// and on the deployed prototype (Vercel, built with PROTOTYPE_DEPLOY=true),
// but never in a real ComfyUI production build.
const showPersonaSwitcher =
  import.meta.env.DEV || import.meta.env.VITE_PROTOTYPE_DEPLOY

// Any file dropped on the app opens as the incompatible matte_pass workflow,
// so a live demo can't miss. Media Assets keeps its own drop handling, and
// in-app card drags (no files) pass straight through.
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
  isDraggingFile.value = !customCloud.isLocked
}

function onFileDragLeave(event: DragEvent) {
  if (!event.relatedTarget) isDraggingFile.value = false
}

function onFileDrop(event: DragEvent) {
  if (!handlesFileDrops.value || !carriesFiles(event)) return
  event.preventDefault()
  isDraggingFile.value = false
  customCloud.dropIncompatibleWorkflow()
}
</script>
