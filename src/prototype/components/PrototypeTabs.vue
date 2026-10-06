<!--
  Implements:
    Mirrors ../../../../components/topbar/WorkflowTabs.vue — same vertical
    dividers per tab, active-tab underline, 0.75 opacity on inactive, and a
    trailing "+" button.

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
    - User avatar sits on the far right (mirroring CurrentUserButton's
      slot in the integrated tab bar).
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
    <div class="flex min-w-0 flex-1 items-stretch">
      <div
        v-if="tabsStore.openTabs.length"
        class="flex min-w-0 overflow-x-auto"
      >
        <div
          v-for="tab in tabsStore.openTabs"
          :key="tab.id"
          :class="
            cn(
              'relative flex shrink-0 items-center border-r border-interface-stroke',
              isTabActive(tab.id)
                ? 'opacity-100'
                : 'opacity-75 hover:opacity-100'
            )
          "
        >
          <Button
            variant="muted-textonly"
            class="h-full rounded-none"
            :aria-pressed="isTabActive(tab.id)"
            @click="onSelectTab(tab.id)"
            @click.middle="tabsStore.close(tab.id)"
          >
            <i
              v-if="tab.kind === 'builder'"
              class="icon-[lucide--hammer] size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <i
              v-else-if="tab.kind === 'app'"
              class="icon-[lucide--panels-top-left] size-4 text-primary-background"
              aria-hidden="true"
            />
            <i
              v-else-if="tab.kind === 'media-assets'"
              class="icon-[comfy--image-ai-edit] size-4"
              aria-hidden="true"
            />
            <span class="max-w-40 truncate">{{ tab.label }}</span>
          </Button>
          <Button
            variant="muted-textonly"
            size="icon-sm"
            :aria-label="t('prototype.tabs.closeTab')"
            @click="tabsStore.close(tab.id)"
          >
            <i class="icon-[lucide--x] size-3.5" aria-hidden="true" />
          </Button>
          <span
            v-if="isTabActive(tab.id)"
            class="absolute inset-x-0 bottom-0 h-px bg-primary-background"
          />
        </div>
      </div>
      <Button
        v-if="!isEditorRoute"
        variant="muted-textonly"
        size="icon"
        class="aspect-square h-full w-auto shrink-0 rounded-none"
        :title="t('prototype.tabs.newTab')"
        :aria-label="t('prototype.tabs.newTab')"
        @click="tabsStore.addBlank"
      >
        <i class="icon-[lucide--plus] size-4" aria-hidden="true" />
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
    <div class="flex shrink-0 items-center gap-1 px-2">
      <button
        type="button"
        class="grid size-7 cursor-pointer appearance-none place-items-center rounded-sm border-0 bg-transparent text-muted-foreground transition-colors hover:bg-secondary-background hover:text-base-foreground focus:outline-none"
        :title="t('prototype.tabs.feedback')"
        :aria-label="t('prototype.tabs.feedback')"
      >
        <span class="icon-[lucide--message-square-text] size-4" />
      </button>
      <button
        type="button"
        class="inline-flex h-7 cursor-pointer appearance-none items-center gap-1 rounded-full border-0 bg-transparent p-0.5 pr-1 text-base-foreground transition-colors hover:bg-secondary-background focus:outline-none"
        :title="userName"
        :aria-label="userName"
      >
        <span
          class="grid size-6 place-items-center rounded-full text-xs font-semibold text-button-surface-contrast"
          :style="{ backgroundColor: userColor }"
        >
          {{ userInitial }}
        </span>
        <span
          class="icon-[lucide--chevron-down] size-3.5 text-muted-foreground"
        />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import WorkflowTabs from '@/components/topbar/WorkflowTabs.vue'
import TopbarBadges from '@/components/topbar/TopbarBadges.vue'
import TopbarSubscribeButton from '@/components/topbar/TopbarSubscribeButton.vue'
import Button from '@/components/ui/button/Button.vue'
import ProjectSwitcher from './ProjectSwitcher.vue'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypeNavigationStore } from '../stores/navigationStore'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { HOME_TAB_ID, usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeUiStore } from '../stores/uiStore'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const navigationStore = usePrototypeNavigationStore()
const tabsStore = usePrototypeTabsStore()
const customCloud = usePrototypeCustomCloudStore()
const uiStore = usePrototypeUiStore()
const { fixture } = storeToRefs(usePrototypePersonaStore())
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

const userName = computed(
  () => fixture.value.currentUser.name || t('prototype.topbar.userFallback')
)
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())
const userColor = computed(
  () =>
    fixture.value.members.find(
      (member) => member.id === fixture.value.currentUser.id
    )?.avatarColor ?? 'var(--primary-background)'
)

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
