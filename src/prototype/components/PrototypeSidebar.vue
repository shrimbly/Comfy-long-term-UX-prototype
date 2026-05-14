<!--
  Implements:
    concept:    ../IA_Plan/wiki/concepts/personas-and-flows.md
    decision:   ../IA_Plan/wiki/decisions/drafts-as-default-private-project.md
    references: ../IA_Plan/wiki/references/competitive-sidebars.md
    log:        ../IA_Plan/wiki/prototype-log.md#flow-01-dashboard

  Composed sidebar. Workspace chip at top (cloud only); groups:
    YOUR WORK — My Workflows, Projects (cloud only)
    LIBRARY   — Media, Models, Custom Nodes, Prompts (cloud) / Outputs (local)
    WORKSPACE — Members (team only)
  Footer: usage / upgrade chip (cloud only), Settings, Help.

  Local mode (Persona 1b) — workspace switcher slot holds a dashed
  Create-a-workspace CTA (see prototype/design-decisions.md 2026-05-14)
  instead of the populated chip. No projects, Prompts dropped in favor of
  Outputs, no usage chip.
-->
<template>
  <aside
    class="flex h-full w-64 shrink-0 flex-col gap-3 border-r border-border-subtle bg-base-background p-3 text-base-foreground"
  >
    <WorkspaceChip
      v-if="isCloudMode && currentWorkspace"
      :workspace="currentWorkspace"
      :workspaces="fixture.workspaces"
      :current-user="fixture.currentUser"
      @select-workspace="personaStore.setCurrentWorkspace"
    />
    <WorkspaceCreateChip v-else-if="isLocalMode" />

    <label
      class="flex h-8 min-h-8 w-full cursor-text items-center gap-2 rounded-lg bg-secondary-background px-2 py-1.5 text-base-foreground"
    >
      <span
        class="icon-[lucide--search] size-4 shrink-0 text-muted-foreground"
      />
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('prototype.sidebar.searchPlaceholder')"
        class="min-w-0 flex-1 truncate bg-transparent text-xs outline-none placeholder:text-muted-foreground"
      />
    </label>

    <div class="flex flex-col gap-1">
      <SidebarItem
        :label="t('prototype.sidebar.recents')"
        icon="icon-[lucide--clock]"
        :active="activeView.kind === 'recents'"
        @click="uiStore.go({ kind: 'recents' })"
      />

      <SidebarItem
        v-if="showDiscover"
        :label="t('prototype.sidebar.templates')"
        icon="icon-[lucide--layout-template]"
        :active="activeView.kind === 'hub'"
        @click="uiStore.go({ kind: 'hub' })"
      />
    </div>

    <nav class="flex flex-1 flex-col gap-1 overflow-y-auto">
      <SidebarGroup
        v-if="draftsProject || isLocalMode"
        :label="t('prototype.sidebar.groupYourWork')"
        :show-header="showGroupHeaders"
      >
        <SidebarItem
          :label="t('prototype.sidebar.drafts')"
          icon="icon-[lucide--file-pen]"
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

      <SidebarGroup
        v-if="!isGuestPersona"
        :label="t('prototype.sidebar.groupLibrary')"
      >
        <SidebarItem
          v-for="item in libraryItems"
          :key="item.section"
          :label="item.label"
          :icon="item.icon"
          :active="isLibrarySectionActive(item.section)"
          @click="uiStore.go({ kind: 'library', section: item.section })"
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
        v-if="!isGuestPersona"
        :label="t('prototype.sidebar.settings')"
        icon="icon-[lucide--settings]"
        :active="activeView.kind === 'settings'"
        @click="uiStore.go({ kind: 'settings' })"
      />
      <SidebarItem
        :label="t('prototype.sidebar.help')"
        icon="icon-[lucide--help-circle]"
      />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import SidebarGroup from './sidebar/SidebarGroup.vue'
import SidebarItem from './sidebar/SidebarItem.vue'
import UsageChip from './sidebar/UsageChip.vue'
import WorkspaceChip from './sidebar/WorkspaceChip.vue'
import WorkspaceCreateChip from './sidebar/WorkspaceCreateChip.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import type { LibrarySection } from '../types'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const uiStore = usePrototypeUiStore()

const { fixture, currentWorkspace, draftsProject, currentPersonaId } =
  storeToRefs(personaStore)

const { activeView } = storeToRefs(uiStore)

const searchQuery = ref('')

const isLocalMode = computed(() => fixture.value.mode === 'local')
const isCloudMode = computed(() => fixture.value.mode === 'cloud')

const isSoloPersona = computed(
  () =>
    currentPersonaId.value === 'solo' || currentPersonaId.value === 'solo-local'
)
const isGuestPersona = computed(
  () =>
    currentPersonaId.value === 'project-collaborator' ||
    currentPersonaId.value === 'asset-only-guest'
)

const showDiscover = computed(() => true)
const showWorkspaceGroup = computed(
  () =>
    isCloudMode.value &&
    !isGuestPersona.value &&
    currentWorkspace.value?.tier === 'team'
)
const showGroupHeaders = computed(() => !isSoloPersona.value)

const libraryItems = computed<
  Array<{ section: LibrarySection; label: string; icon: string }>
>(() => {
  const items: Array<{ section: LibrarySection; label: string; icon: string }> =
    [
      {
        section: 'media',
        label: t('prototype.sidebar.libraryMedia'),
        icon: 'icon-[lucide--image]'
      },
      {
        section: 'models',
        label: t('prototype.sidebar.libraryModels'),
        icon: 'icon-[lucide--box]'
      },
      {
        section: 'nodes',
        label: t('prototype.sidebar.libraryNodes'),
        icon: 'icon-[lucide--blocks]'
      }
    ]
  if (isCloudMode.value) {
    items.push({
      section: 'prompts',
      label: t('prototype.sidebar.libraryPrompts'),
      icon: 'icon-[lucide--text]'
    })
  }
  return items
})

function isLibrarySectionActive(section: LibrarySection) {
  return (
    activeView.value.kind === 'library' && activeView.value.section === section
  )
}
</script>
