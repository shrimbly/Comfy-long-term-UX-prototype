<!--
  Implements:
    concept:    ../IA_Plan/wiki/concepts/personas-and-flows.md
    decision:   ../IA_Plan/wiki/decisions/drafts-as-default-private-project.md
    references: ../IA_Plan/wiki/references/competitive-sidebars.md
    log:        ../IA_Plan/wiki/prototype-log.md#flow-01-dashboard

  Composed sidebar. Workspace chip at top (cloud only); groups:
    YOUR WORK — My Workflows, Projects (cloud only)
    LIBRARY   — Media assets
    WORKSPACE — Members (team only)
  Footer: usage / upgrade chip (cloud only), Settings, Help.

  Local mode (Persona 1b) — workspace switcher slot holds a dashed
  Create-a-workspace CTA (see prototype/design-decisions.md 2026-05-14)
  instead of the populated chip. No projects, no usage chip.
-->
<template>
  <aside
    class="flex h-full w-60 shrink-0 flex-col gap-2 border-r border-border-subtle bg-base-background p-4 text-base-foreground"
  >
    <div class="flex items-center pt-3 pb-1">
      <ComfyWordmark class="h-5 w-auto text-brand-yellow" />
    </div>

    <WorkspaceChip
      v-if="isCloudMode && currentWorkspace"
      :workspace="currentWorkspace"
      :workspaces="fixture.workspaces"
      :current-user="fixture.currentUser"
      @select-workspace="personaStore.setCurrentWorkspace"
    />
    <WorkspaceCreateChip v-else-if="isLocalMode" />

    <div class="mt-1 flex flex-col gap-1">
      <SidebarItem
        :label="t('prototype.sidebar.home')"
        icon="icon-[lucide--house]"
        :active="activeView.kind === 'home'"
        @click="uiStore.go({ kind: 'home' })"
      />
      <SidebarItem
        :label="t('prototype.sidebar.recents')"
        icon="icon-[lucide--history]"
        :active="activeView.kind === 'recents'"
        @click="uiStore.go({ kind: 'recents' })"
      />
      <SidebarItem
        :label="t('prototype.sidebar.templates')"
        icon="icon-[lucide--layout-template]"
        :active="activeView.kind === 'templates'"
        @click="uiStore.go({ kind: 'templates' })"
      />
    </div>

    <nav class="flex flex-1 flex-col overflow-y-auto">
      <SidebarGroup
        v-if="draftsProject || isLocalMode"
        :label="t('prototype.sidebar.groupYourWork')"
        :show-header="showGroupHeaders"
      >
        <SidebarItem
          :label="t('prototype.sidebar.drafts')"
          icon="icon-[lucide--workflow]"
          :active="activeView.kind === 'drafts'"
          @click="uiStore.go({ kind: 'drafts' })"
        />
        <SidebarItem
          v-if="isCloudMode && !isSoloPersona"
          :label="t('prototype.sidebar.projects')"
          icon="icon-[lucide--folder]"
          :active="
            activeView.kind === 'projects' || activeView.kind === 'project'
          "
          @click="uiStore.go({ kind: 'projects' })"
        />
      </SidebarGroup>

      <SidebarGroup :label="t('prototype.sidebar.groupLibrary')">
        <SidebarItem
          :label="t('prototype.sidebar.libraryMedia')"
          icon="icon-[lucide--image]"
          :active="activeTabId === MEDIA_ASSETS_TAB_ID"
          @click="openMedia"
        />
      </SidebarGroup>

      <SidebarGroup
        v-if="showWorkspaceGroup"
        :label="t('prototype.sidebar.groupWorkspace')"
      >
        <SidebarItem
          :label="t('prototype.sidebar.members')"
          icon="icon-[lucide--users]"
          :active="activeView.kind === 'members'"
          @click="uiStore.go({ kind: 'members' })"
        />
      </SidebarGroup>
    </nav>

    <div class="flex flex-col gap-2">
      <UsageChip
        v-if="fixture.usage"
        :usage="fixture.usage"
        :plan="currentWorkspace?.plan"
      />
      <button
        v-else-if="isLocalMode"
        type="button"
        class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-(image:--subscription-button-gradient) px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        <span class="icon-[lucide--zap] size-4" />
        {{ t('prototype.sidebar.upgradeCta') }}
      </button>
      <SidebarItem
        :label="t('prototype.sidebar.settings')"
        icon="icon-[lucide--settings]"
        :active="activeView.kind === 'settings'"
        @click="uiStore.go({ kind: 'settings' })"
      />
      <SidebarItem
        :label="t('prototype.sidebar.help')"
        icon="icon-[lucide--circle-help]"
      />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import ComfyWordmark from './ComfyWordmark.vue'
import SidebarGroup from './sidebar/SidebarGroup.vue'
import SidebarItem from './sidebar/SidebarItem.vue'
import UsageChip from './sidebar/UsageChip.vue'
import WorkspaceChip from './sidebar/WorkspaceChip.vue'
import WorkspaceCreateChip from './sidebar/WorkspaceCreateChip.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { MEDIA_ASSETS_TAB_ID, usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeUiStore } from '../stores/uiStore'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const tabsStore = usePrototypeTabsStore()
const uiStore = usePrototypeUiStore()

const { activeTabId } = storeToRefs(tabsStore)

const { fixture, currentWorkspace, draftsProject, currentPersonaId } =
  storeToRefs(personaStore)

const { activeView } = storeToRefs(uiStore)

const isLocalMode = computed(() => fixture.value.mode === 'local')
const isCloudMode = computed(() => fixture.value.mode === 'cloud')

const isSoloPersona = computed(
  () =>
    currentPersonaId.value === 'solo' || currentPersonaId.value === 'solo-local'
)

const showWorkspaceGroup = computed(
  () => isCloudMode.value && currentWorkspace.value?.tier === 'team'
)
const showGroupHeaders = computed(() => !isSoloPersona.value)

function openMedia() {
  tabsStore.openMediaAssets(t('prototype.sidebar.libraryMedia'))
}
</script>
