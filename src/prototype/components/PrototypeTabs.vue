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
          'relative aspect-square h-full w-auto shrink-0 rounded-none',
          isHomeActive && 'text-base-foreground'
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
    <div
      v-if="mediaTab"
      class="flex shrink-0 items-center border-r border-interface-stroke"
    >
      <Button
        variant="muted-textonly"
        class="h-full rounded-none"
        :aria-pressed="isMediaActive"
        @click="onSelectMedia"
      >
        <i class="icon-[comfy--image-ai-edit] size-4" aria-hidden="true" />
        {{ mediaTab.label }}
      </Button>
      <Button
        variant="muted-textonly"
        size="icon-sm"
        :aria-label="t('prototype.tabs.closeTab')"
        @click="tabsStore.close(MEDIA_ASSETS_TAB_ID)"
      >
        <i class="icon-[lucide--x] size-3.5" aria-hidden="true" />
      </Button>
    </div>
    <WorkflowTabs
      :inactive="!isEditorRoute"
      :before-open="navigationStore.openEditor"
      :show-actions="false"
      :inert="navigationStore.openingEditor"
      class="min-w-0"
    />
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
import { usePrototypeNavigationStore } from '../stores/navigationStore'
import { usePrototypePersonaStore } from '../stores/personaStore'
import {
  HOME_TAB_ID,
  MEDIA_ASSETS_TAB_ID,
  usePrototypeTabsStore
} from '../stores/tabsStore'
import { usePrototypeUiStore } from '../stores/uiStore'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const navigationStore = usePrototypeNavigationStore()
const tabsStore = usePrototypeTabsStore()
const uiStore = usePrototypeUiStore()
const { fixture } = storeToRefs(usePrototypePersonaStore())
const isEditorRoute = computed(() => route.name === 'GraphView')
const isMediaActive = computed(
  () => !isEditorRoute.value && tabsStore.activeTabId === MEDIA_ASSETS_TAB_ID
)
const isHomeActive = computed(
  () => !isEditorRoute.value && !isMediaActive.value
)
const mediaTab = computed(() =>
  tabsStore.openTabs.find((tab) => tab.id === MEDIA_ASSETS_TAB_ID)
)
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

async function onSelectMedia() {
  tabsStore.select(MEDIA_ASSETS_TAB_ID)
  await router.push({ name: 'PrototypeDashboard' })
}
</script>
