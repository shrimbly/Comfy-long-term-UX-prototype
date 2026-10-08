<template>
  <aside
    class="flex h-full w-60 shrink-0 flex-col gap-2 border-r border-border-subtle bg-base-background p-4 text-base-foreground"
  >
    <template v-if="activeView.kind === 'settings'">
      <h1 class="px-3 py-3 text-base font-medium">
        {{ t('prototype.settings.title') }}
      </h1>
      <SidebarItem
        :label="t('prototype.sidebar.home')"
        icon="icon-[lucide--arrow-left]"
        @click="uiStore.goHome()"
      />
      <nav
        :aria-label="t('prototype.settings.title')"
        class="flex-1 overflow-y-auto"
      >
        <SidebarGroup
          v-for="group in settingsGroups"
          :key="group.label"
          :label="group.label"
        >
          <SidebarItem
            v-for="item in group.items"
            :key="item.id"
            :label="t(`prototype.settings.pages.${item.id}.title`)"
            :icon="item.icon"
            :active="uiStore.settingsPage === item.id"
            @click="uiStore.openSettings(item.id)"
          />
        </SidebarGroup>
      </nav>
    </template>
    <template v-else>
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
        <SidebarItem
          :label="t('prototype.sidebar.libraryMedia')"
          icon="icon-[lucide--image]"
          :active="activeView.kind === 'media'"
          @click="uiStore.go({ kind: 'media' })"
        />
        <SidebarItem
          v-if="isCloudMode"
          :label="t('prototype.environments.title')"
          icon="icon-[ph--stack-bold]"
          :active="activeView.kind === 'environments'"
          @click="uiStore.go({ kind: 'environments' })"
        />
      </div>

      <nav class="flex flex-1 flex-col overflow-y-auto">
        <SidebarGroup
          :label="t('prototype.sidebar.groupYourWork')"
          :show-header="showGroupHeaders"
        >
          <SidebarItem
            v-if="draftsProject || isLocalMode"
            :label="t('prototype.sidebar.drafts')"
            icon="icon-[lucide--workflow]"
            :active="activeView.kind === 'drafts'"
            @click="uiStore.go({ kind: 'drafts' })"
          />
          <SidebarItem
            v-if="
              isCloudMode &&
              !isSoloPersona &&
              (!homestead.enabled || homestead.version === 3)
            "
            :label="t('prototype.sidebar.projects')"
            icon="icon-[lucide--folder]"
            :active="
              activeView.kind === 'projects' || activeView.kind === 'project'
            "
            @click="uiStore.go({ kind: 'projects' })"
          />
        </SidebarGroup>
      </nav>
    </template>
    <WorkspaceFooter />
  </aside>
</template>

<script setup lang="ts">
import { useHomesteadStore } from '../homestead/store'
const homestead = useHomesteadStore()
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import SidebarGroup from './sidebar/SidebarGroup.vue'
import SidebarItem from './sidebar/SidebarItem.vue'
import WorkspaceFooter from './sidebar/WorkspaceFooter.vue'
import type { SettingsPage } from '../stores/uiStore'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const uiStore = usePrototypeUiStore()

const { fixture, currentWorkspace, draftsProject } = storeToRefs(personaStore)

const { activeView } = storeToRefs(uiStore)

const isLocalMode = computed(() => fixture.value.mode === 'local')
const isCloudMode = computed(() => fixture.value.mode === 'cloud')

// A solo persona is anyone whose current workspace is a personal one — no
// team, so no shared Projects nav and a flatter, header-less sidebar. Tier-
// based so every solo flavor (new/established × cloud/local) is covered.
const isSoloPersona = computed(
  () => currentWorkspace.value?.tier === 'personal'
)

const showGroupHeaders = computed(() => !isSoloPersona.value)
const settingsGroups = computed(() => [
  {
    label: t('prototype.settings.accountGroup'),
    items: [
      { id: 'account' as SettingsPage, icon: 'icon-[lucide--user-round]' },
      { id: 'security' as SettingsPage, icon: 'icon-[lucide--shield]' }
    ]
  },
  ...(isCloudMode.value
    ? [
        {
          label: t('prototype.settings.workspaceGroup'),
          items: [
            { id: 'general' as SettingsPage, icon: 'icon-[lucide--settings]' },
            { id: 'projects' as SettingsPage, icon: 'icon-[lucide--folder]' },
            {
              id: 'members' as SettingsPage,
              icon: 'icon-[lucide--users-round]'
            },
            {
              id: 'usage' as SettingsPage,
              icon: 'icon-[lucide--chart-no-axes-combined]'
            },
            ...(currentWorkspace.value?.currentUserRole === 'admin'
              ? [
                  {
                    id: 'billing' as SettingsPage,
                    icon: 'icon-[lucide--credit-card]'
                  }
                ]
              : []),
            {
              id: 'policies' as SettingsPage,
              icon: 'icon-[lucide--shield-check]'
            }
          ]
        }
      ]
    : [])
])
</script>
