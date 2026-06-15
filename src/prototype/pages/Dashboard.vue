<!--
  Implements:
    concept:   ../IA_Plan/wiki/concepts/personas-and-flows.md
    decision:  ../IA_Plan/wiki/decisions/drafts-as-default-private-project.md
    log:       ../IA_Plan/wiki/prototype-log.md#flow-01-dashboard

  Dashboard shell. Content is driven by the active top-bar tab:
    - Media-Assets tab active → real MediaAssetsView takes over the area
      below PrototypeTabs (it owns its own sidebar).
    - Home tab (and workflow tabs) → prototype dashboard with PrototypeSidebar
      / LibrarySidebar based on uiStore.activeView.
-->
<template>
  <div class="relative flex h-screen w-full flex-col">
    <PrototypeTabs />

    <div v-if="isMediaAssetsTabActive" class="relative flex min-h-0 flex-1">
      <LocalMediaView v-if="isLocalMode" />
      <MediaAssetsView v-else />
    </div>
    <div v-else class="flex min-h-0 flex-1">
      <PrototypeSidebar />

      <main
        class="flex-1 overflow-auto bg-base-background p-6 text-base-foreground"
      >
        <DraftsView v-if="activeView.kind === 'drafts'" />
        <ProjectsView v-else-if="activeView.kind === 'projects'" />
        <ProjectDetailView
          v-else-if="activeView.kind === 'project'"
          :key="activeView.projectId"
          :project-id="activeView.projectId"
        />
        <RecentsView v-else-if="activeView.kind === 'recents'" />
        <MembersView v-else-if="activeView.kind === 'members'" />
        <SettingsView v-else-if="activeView.kind === 'settings'" />
      </main>
    </div>

    <div
      v-if="isDev"
      class="fixed right-4 bottom-4 z-50 rounded-lg border border-border-subtle bg-secondary-background p-2 shadow-lg"
    >
      <PersonaSwitcher />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import MediaAssetsView from '@/platform/assets/components/MediaAssetsView.vue'
import LocalMediaView from '../components/LocalMediaView.vue'
import PersonaSwitcher from '../components/PersonaSwitcher.vue'
import PrototypeSidebar from '../components/PrototypeSidebar.vue'
import PrototypeTabs from '../components/PrototypeTabs.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { MEDIA_ASSETS_TAB_ID, usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import DraftsView from '../views/DraftsView.vue'
import MembersView from '../views/MembersView.vue'
import ProjectDetailView from '../views/ProjectDetailView.vue'
import ProjectsView from '../views/ProjectsView.vue'
import RecentsView from '../views/RecentsView.vue'
import SettingsView from '../views/SettingsView.vue'

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

const isDev = import.meta.env.DEV
</script>
