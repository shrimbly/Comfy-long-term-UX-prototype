<!--
  Implements:
    concept:   ../IA_Plan/wiki/concepts/personas-and-flows.md
    decision:  ../IA_Plan/wiki/decisions/drafts-as-default-private-project.md
    log:       ../IA_Plan/wiki/prototype-log.md#flow-01-dashboard

  Dashboard shell. When the active view is a Library section, the main
  sidebar is replaced by the LibrarySidebar (dedicated-page takeover
  pattern, modeled on the ComfyUI_frontend Media Assets tab).
-->
<template>
  <div class="relative flex h-screen w-full flex-col">
    <PrototypeTabs />

    <div class="flex min-h-0 flex-1">
      <template v-if="activeView.kind === 'library'">
        <LibrarySidebar :section="activeView.section" />
      </template>
      <template v-else>
        <PrototypeSidebar />
      </template>

      <main
        class="flex-1 overflow-auto bg-base-background p-6 text-base-foreground"
      >
        <template v-if="activeView.kind === 'library'">
          <LibraryView :section="activeView.section" />
        </template>
        <template v-else>
          <DraftsView v-if="activeView.kind === 'drafts'" />
          <ProjectsView v-else-if="activeView.kind === 'projects'" />
          <ProjectDetailView
            v-else-if="activeView.kind === 'project'"
            :project-id="activeView.projectId"
          />
          <RecentsView v-else-if="activeView.kind === 'recents'" />
          <HubView v-else-if="activeView.kind === 'hub'" />
          <MembersView v-else-if="activeView.kind === 'members'" />
          <SettingsView v-else-if="activeView.kind === 'settings'" />
        </template>
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

import LibrarySidebar from '../components/LibrarySidebar.vue'
import PersonaSwitcher from '../components/PersonaSwitcher.vue'
import PrototypeSidebar from '../components/PrototypeSidebar.vue'
import PrototypeTabs from '../components/PrototypeTabs.vue'
import { usePrototypeUiStore } from '../stores/uiStore'
import DraftsView from '../views/DraftsView.vue'
import HubView from '../views/HubView.vue'
import LibraryView from '../views/LibraryView.vue'
import MembersView from '../views/MembersView.vue'
import ProjectDetailView from '../views/ProjectDetailView.vue'
import ProjectsView from '../views/ProjectsView.vue'
import RecentsView from '../views/RecentsView.vue'
import SettingsView from '../views/SettingsView.vue'

const uiStore = usePrototypeUiStore()
const { activeView } = storeToRefs(uiStore)

const isDev = import.meta.env.DEV
</script>
