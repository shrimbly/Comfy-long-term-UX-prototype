<!--
  Implements:
    Mirrors ../../../../components/topbar/WorkflowTabs.vue and
    WorkflowTab.vue — the same Tabs components and classes, so hover,
    active state, unsaved dot and close button match the real editor.

  The one tab bar above Home and the editor (LayoutDefault mounts it).
  Differences vs upstream:
    - Home (lucide--house) comes first and links to the dashboard. It can't
      be closed.
    - The project switcher sits right after Home, before the workflow tabs
      (Custom Comfy Cloud:
      ../IA_Plan/wiki/decisions/project-switcher-in-tab-bar.md). The tabs to
      its right are that project's tabs.
    - Driven by the prototype tabsStore. Its workflow tabs show the real
      editor embedded in the dashboard (RealEditor). The real workflow tabs
      appear only on the standalone editor route (`/`).
-->
<template>
  <nav
    :aria-label="t('prototype.tabs.navigation')"
    class="flex h-(--workflow-tabs-height) w-full shrink-0 items-stretch border-b border-interface-stroke bg-comfy-menu-bg text-base-foreground"
  >
    <Button
      as="a"
      :href="router.resolve({ name: 'PrototypeDashboard' }).href"
      variant="muted-textonly"
      size="icon"
      :class="
        cn(
          'relative aspect-square h-full w-auto shrink-0 rounded-none border-interface-stroke',
          isHomeActive && 'text-base-foreground',
          !showSwitcher && 'border-r'
        )
      "
      :aria-label="t('prototype.tabs.home')"
      :aria-current="isHomeActive ? 'page' : undefined"
      @click="onSelectHome"
    >
      <i class="icon-[lucide--house] size-4" aria-hidden="true" />
      <span
        v-if="isHomeActive"
        class="absolute inset-x-0 bottom-0 h-px bg-primary-background"
      />
    </Button>
    <ProjectSwitcher
      v-if="showSwitcher && customCloud.currentProject"
      :project="customCloud.currentProject"
    />
    <BuildingChip
      v-if="customCloud.buildingDeployment && customCloud.progress"
      :name="customCloud.buildingDeployment.name"
      :remaining-seconds="customCloud.progress.remainingSeconds"
      @open="customCloud.dialogStep = 'building'"
    />
    <BuildingChip
      v-if="customNodes.rebuildChipName && customNodes.progress"
      :name="customNodes.rebuildChipName"
      :remaining-seconds="customNodes.progress.remainingSeconds"
      @open="customNodes.open()"
    />
    <div
      class="flex h-full min-w-0 flex-auto flex-row gap-1 overflow-hidden px-1"
    >
      <div class="overflow-hidden">
        <div
          class="flex size-full scrollbar-thin scrollbar-thumb-alpha-smoke-500-50 scrollbar-track-transparent overflow-x-auto overflow-y-hidden p-0"
        >
          <Tabs
            class="h-full"
            :model-value="isEditorRoute ? '' : tabsStore.activeTabId"
            activation-mode="manual"
            @update:model-value="onSelectTab(String($event))"
          >
            <TabsList class="h-full flex-nowrap gap-1">
              <div
                v-for="tab in tabsStore.openTabs"
                :key="tab.id"
                class="group/tab relative h-full shrink-0"
                @click.middle="tabsStore.close(tab.id)"
              >
                <TabsTrigger
                  :value="tab.id"
                  class="h-full max-w-full min-w-22.5 py-2 pr-2 pl-3"
                >
                  <i
                    v-if="tab.kind === 'builder'"
                    class="icon-[lucide--hammer] bg-muted-foreground"
                  />
                  <i
                    v-else-if="tab.kind === 'app'"
                    class="icon-[lucide--panels-top-left] bg-primary-background"
                  />
                  <i
                    v-else-if="tab.kind === 'media-assets'"
                    class="icon-[comfy--image-ai-edit]"
                  />
                  <span
                    class="inline-block max-w-[150px] truncate font-inter text-sm leading-none font-normal text-inherit"
                  >
                    {{ tab.label }}
                  </span>
                  <span class="relative size-4 shrink-0">
                    <span
                      v-if="tab.isDirty"
                      :class="
                        cn(
                          'absolute top-1/2 left-1/2 z-10 size-2 -translate-1/2 rounded-full group-focus-within/tab:hidden group-hover/tab:hidden',
                          isTabActive(tab.id)
                            ? 'bg-base-foreground'
                            : 'bg-smoke-800'
                        )
                      "
                    />
                  </span>
                </TabsTrigger>
                <Button
                  :class="
                    cn(
                      'absolute top-1/2 right-2 size-4 -translate-y-1/2 rounded-none p-0 text-smoke-800 group-focus-within/tab:visible group-hover/tab:visible',
                      isTabActive(tab.id) && !tab.isDirty
                        ? 'visible'
                        : 'invisible'
                    )
                  "
                  variant="muted-textonly"
                  size="unset"
                  :aria-label="t('prototype.tabs.closeTab')"
                  @click.stop="tabsStore.close(tab.id)"
                >
                  <i class="icon-[lucide--x] size-4" />
                </Button>
              </div>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <Button
        v-if="!isEditorRoute"
        class="shrink-0 self-center rounded-lg"
        variant="muted-textonly"
        size="icon"
        :title="t('prototype.tabs.newTab')"
        :aria-label="t('prototype.tabs.newTab')"
        @click="tabsStore.addBlank"
      >
        <i class="pi pi-plus" />
      </Button>
      <WorkflowTabs
        v-else
        :before-open="navigationStore.openEditor"
        :show-actions="false"
        :inert="navigationStore.openingEditor"
        class="min-w-0"
      />
    </div>
    <TopbarBadges />
    <TopbarSubscribeButton />
  </nav>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import WorkflowTabs from '@/components/topbar/WorkflowTabs.vue'
import TopbarBadges from '@/components/topbar/TopbarBadges.vue'
import TopbarSubscribeButton from '@/components/topbar/TopbarSubscribeButton.vue'
import Button from '@/components/ui/button/Button.vue'
import Tabs from '@/components/ui/tabs/Tabs.vue'
import TabsList from '@/components/ui/tabs/TabsList.vue'
import TabsTrigger from '@/components/ui/tabs/TabsTrigger.vue'
import BuildingChip from './BuildingChip.vue'
import ProjectSwitcher from './ProjectSwitcher.vue'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypeCustomNodesStore } from '../stores/customNodesStore'
import { usePrototypeNavigationStore } from '../stores/navigationStore'
import { HOME_TAB_ID, usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeUiStore } from '../stores/uiStore'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const navigationStore = usePrototypeNavigationStore()
const tabsStore = usePrototypeTabsStore()
const customCloud = usePrototypeCustomCloudStore()
const customNodes = usePrototypeCustomNodesStore()
const uiStore = usePrototypeUiStore()
const isEditorRoute = computed(() => route.name === 'GraphView')
const isHomeActive = computed(
  () => !isEditorRoute.value && tabsStore.activeTabId === HOME_TAB_ID
)
const showSwitcher = computed(
  () => customCloud.isEnabled && !!customCloud.currentProject
)

function isTabActive(id: string) {
  return !isEditorRoute.value && tabsStore.activeTabId === id
}

async function onSelectHome(event: MouseEvent) {
  if (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  )
    return
  event.preventDefault()
  tabsStore.select(HOME_TAB_ID)
  uiStore.goHome()
  await router.push({ name: 'PrototypeDashboard' })
}

async function onSelectTab(id: string) {
  tabsStore.select(id)
  await router.push({ name: 'PrototypeDashboard' })
}
</script>
