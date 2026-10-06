<template>
  <div class="relative flex size-full flex-col">
    <div v-if="isMediaAssetsTabActive" class="relative flex min-h-0 flex-1">
      <LocalMediaView v-if="isLocalMode" />
      <MediaAssetsView v-else />
    </div>
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

    <div
      v-if="showPersonaSwitcher"
      class="fixed right-4 bottom-4 z-50 rounded-lg border border-border-subtle bg-secondary-background p-2 shadow-lg"
    >
      <PersonaSwitcher />
    </div>

    <WorkflowDragGhost />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import MediaAssetsView from '@/platform/assets/components/MediaAssetsView.vue'
import LocalMediaView from '../components/LocalMediaView.vue'
import PersonaSwitcher from '../components/PersonaSwitcher.vue'
import PrototypeSidebar from '../components/PrototypeSidebar.vue'
import WorkflowDragGhost from '../components/WorkflowDragGhost.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { MEDIA_ASSETS_TAB_ID, usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import DraftsView from '../views/DraftsView.vue'
import HomeView from '../views/HomeView.vue'
import ProjectDetailView from '../views/ProjectDetailView.vue'
import ProjectsView from '../views/ProjectsView.vue'
import RecentsView from '../views/RecentsView.vue'
import SettingsView from '../views/SettingsView.vue'
import TemplatesView from '../views/TemplatesView.vue'

const uiStore = usePrototypeUiStore()
const tabsStore = usePrototypeTabsStore()
const personaStore = usePrototypePersonaStore()
const { activeView } = storeToRefs(uiStore)
const { activeTabId } = storeToRefs(tabsStore)
const { fixture } = storeToRefs(personaStore)

const isMediaAssetsTabActive = computed(
  () => activeTabId.value === MEDIA_ASSETS_TAB_ID
)
const isLocalMode = computed(() => fixture.value.mode === 'local')

// The persona toggle is a prototype affordance: surface it on the dev server
// and on the deployed prototype (Vercel, built with PROTOTYPE_DEPLOY=true),
// but never in a real ComfyUI production build.
const showPersonaSwitcher =
  import.meta.env.DEV || import.meta.env.VITE_PROTOTYPE_DEPLOY
</script>
