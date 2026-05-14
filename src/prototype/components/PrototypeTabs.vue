<!--
  Implements:
    Mirrors ../../../../components/topbar/WorkflowTabs.vue — same vertical
    dividers per tab, active-tab underline, 0.75 opacity on inactive,
    hover-revealed close button, and trailing "+" button.

  Differences vs upstream:
    - Home tab (lucide--house) is rendered first and is the default active
      tab. It can't be closed.
    - Driven by the prototype tabsStore (mock data) rather than the real
      workflow store.
    - User avatar sits on the far right (mirroring CurrentUserButton's
      slot in the integrated tab bar).
-->
<template>
  <div
    class="flex h-(--workflow-tabs-height) w-full items-stretch border-b border-interface-stroke bg-base-background text-base-foreground"
  >
    <div class="flex min-w-0 flex-1 items-stretch">
      <button
        type="button"
        :class="
          cn(
            'group relative grid aspect-square h-full shrink-0 cursor-pointer appearance-none place-items-center border-0 border-x border-(--border-color) bg-transparent text-base-foreground transition-opacity focus:outline-none',
            isHomeActive ? 'opacity-100' : 'opacity-75 hover:opacity-100'
          )
        "
        :aria-label="t('prototype.tabs.home')"
        @click="onSelectHome"
      >
        <span class="icon-[lucide--house] size-4" />
        <span
          v-if="isHomeActive"
          class="absolute inset-x-0 -bottom-px h-px bg-primary-background"
        />
      </button>

      <div
        v-for="tab in openTabs"
        :key="tab.id"
        :class="
          cn(
            'group relative flex h-full min-w-[90px] shrink cursor-pointer items-center gap-2 border-r border-(--border-color) p-2 transition-opacity',
            tab.id === activeTabId
              ? 'opacity-100'
              : 'opacity-75 hover:opacity-100'
          )
        "
        @click="tabsStore.select(tab.id)"
        @click.middle="tabsStore.close(tab.id)"
      >
        <span
          v-if="tab.kind === 'builder'"
          class="icon-[lucide--hammer] size-4 shrink-0 text-muted-foreground"
        />
        <span
          v-else-if="tab.kind === 'app'"
          class="icon-[lucide--panels-top-left] size-4 shrink-0 text-primary-background"
        />
        <span class="inline-block max-w-[150px] flex-1 truncate text-sm">{{
          tab.label
        }}</span>
        <span class="relative shrink-0">
          <span
            v-if="tab.isDirty && tab.id !== activeTabId"
            aria-hidden="true"
            class="absolute top-1/2 left-1/2 z-10 -translate-1/2 text-xl leading-none font-bold text-base-foreground group-hover:hidden"
            >•</span
          >
          <button
            type="button"
            :class="
              cn(
                'invisible grid size-5 shrink-0 cursor-pointer appearance-none place-items-center rounded-sm border-0 bg-transparent text-muted-foreground transition-colors group-hover:visible hover:bg-secondary-background hover:text-base-foreground focus:outline-none',
                tab.id === activeTabId && 'visible'
              )
            "
            :aria-label="t('prototype.tabs.closeTab')"
            @click.stop="tabsStore.close(tab.id)"
          >
            <span class="icon-[lucide--x] size-3.5" />
          </button>
        </span>

        <span
          v-if="tab.id === activeTabId"
          class="absolute inset-x-0 -bottom-px h-px bg-primary-background"
        />
      </div>

      <button
        type="button"
        class="grid aspect-square h-full shrink-0 cursor-pointer appearance-none place-items-center border-0 bg-transparent text-muted-foreground transition-colors hover:bg-secondary-background hover:text-base-foreground focus:outline-none"
        :title="t('prototype.tabs.newTab')"
        :aria-label="t('prototype.tabs.newTab')"
        @click="tabsStore.addBlank"
      >
        <span class="icon-[lucide--plus] size-4" />
      </button>
    </div>

    <div class="flex shrink-0 items-center gap-1 px-2">
      <button
        type="button"
        class="grid size-7 cursor-pointer appearance-none place-items-center rounded-sm border-0 bg-transparent text-muted-foreground transition-colors hover:bg-secondary-background hover:text-base-foreground focus:outline-none"
        :title="t('prototype.tabs.feedback')"
        :aria-label="t('prototype.tabs.feedback')"
      >
        <span class="icon-[lucide--message-square-text] size-4" />
      </button>
      <TopBarNotifications />
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
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import TopBarNotifications from './TopBarNotifications.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { HOME_TAB_ID, usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeUiStore } from '../stores/uiStore'

const { t } = useI18n()
const tabsStore = usePrototypeTabsStore()
const uiStore = usePrototypeUiStore()
const personaStore = usePrototypePersonaStore()
const { openTabs, activeTabId } = storeToRefs(tabsStore)
const { fixture } = storeToRefs(personaStore)

const isHomeActive = computed(() => activeTabId.value === HOME_TAB_ID)

const userName = computed(
  () => fixture.value.currentUser.name || t('prototype.topbar.userFallback')
)
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())
const userColor = computed(() => {
  const me = fixture.value.members.find(
    (m) => m.id === fixture.value.currentUser.id
  )
  return me?.avatarColor ?? '#3b82f6'
})

function onSelectHome() {
  tabsStore.select(HOME_TAB_ID)
  uiStore.go({ kind: 'drafts' })
}
</script>
