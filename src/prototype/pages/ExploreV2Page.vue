<!--
  Implements:
    Experimental V1.1 of the Explore surface. Reachable only at
    /prototype/explore-v2 — the original page at uiStore.activeView ===
    'explore' is unchanged.

    Hero pattern: a big search bar with a ⌘K hint sits above the feed.
    Click the bar (or press ⌘K anywhere on the page) to open a
    Raycast-style CommandPalette covering the screen. Below the bar is
    a row of one-word quick-action chips that act as direct shortcuts
    into the same commands.

    Commands are static and don't yet route — picking one toasts a
    "would navigate to X" message. This is intentional for the
    prototype: the goal here is the interaction model, not wiring real
    handlers.
-->
<template>
  <div
    class="relative flex min-h-screen w-full flex-col bg-base-background text-base-foreground"
  >
    <div class="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-8 py-10">
      <div class="flex items-center justify-between">
        <h1 class="m-0 text-2xl font-semibold">
          {{ t('prototype.views.exploreV2.title') }}
        </h1>
        <span
          class="rounded-full border border-interface-stroke bg-secondary-background px-3 py-1 text-xs text-muted-foreground"
        >
          {{ t('prototype.views.exploreV2.experimentBadge') }}
        </span>
      </div>

      <button
        type="button"
        class="group flex w-full items-center gap-4 rounded-2xl border border-interface-stroke bg-secondary-background p-5 text-left transition-colors hover:border-base-foreground/30 hover:bg-secondary-background-hover"
        @click="openPalette"
      >
        <i
          class="icon-[lucide--search] size-6 shrink-0 text-muted-foreground"
        />
        <span class="flex-1 text-base text-muted-foreground">
          {{ t('prototype.views.exploreV2.searchPlaceholder') }}
        </span>
        <span class="flex items-center gap-1">
          <kbd
            class="rounded-md border border-interface-stroke bg-base-background px-2 py-1 text-xs text-muted-foreground"
          >
            {{ modKey }}
          </kbd>
          <kbd
            class="rounded-md border border-interface-stroke bg-base-background px-2 py-1 text-xs text-muted-foreground"
          >
            K
          </kbd>
        </span>
      </button>

      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="chip in quickChips"
          :key="chip.commandId"
          type="button"
          :class="
            cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-full border border-interface-stroke bg-secondary-background px-3.5 py-1.5 text-sm text-base-foreground transition-colors',
              'hover:border-base-foreground/30 hover:bg-secondary-background-hover'
            )
          "
          @click="runChip(chip.commandId)"
        >
          <i :class="cn(chip.icon, 'size-4 text-muted-foreground')" />
          {{ chip.label }}
        </button>
      </div>

      <AssetMasonryGrid
        v-model:selected-ids="selectedIds"
        :assets="assets"
        :column-width="360"
      />
    </div>

    <CommandPalette
      :open="paletteOpen"
      :commands="commands"
      :groups="groups"
      @close="paletteOpen = false"
      @run="handleRun"
    />

    <div
      v-if="isDev"
      class="fixed right-4 bottom-4 z-50 rounded-lg border border-border-subtle bg-secondary-background p-2 shadow-lg"
    >
      <PersonaSwitcher />
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { useEventListener, useTitle } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AssetMasonryGrid from '@/platform/assets/components/AssetMasonryGrid.vue'

import CommandPalette from '../components/CommandPalette.vue'
import type {
  PaletteCommand,
  PaletteGroup
} from '../components/CommandPalette.vue'
import PersonaSwitcher from '../components/PersonaSwitcher.vue'
import { buildExploreAssets } from '../fixtures/exploreAssets'

const { t } = useI18n()
const toast = useToast()

useTitle('Explore V1.1 — ComfyUI')

const isDev = import.meta.env.DEV
const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const modKey = isMac ? '⌘' : 'Ctrl'

const paletteOpen = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const assets = computed(() => buildExploreAssets())

const groups = computed<PaletteGroup[]>(() => [
  { id: 'generate', label: t('prototype.commandPalette.groups.generate') },
  { id: 'search', label: t('prototype.commandPalette.groups.search') },
  { id: 'navigate', label: t('prototype.commandPalette.groups.navigate') },
  { id: 'settings', label: t('prototype.commandPalette.groups.settings') }
])

const commands = computed<PaletteCommand[]>(() => [
  {
    id: 'generate-image',
    label: t('prototype.commandPalette.cmd.generateImage.label'),
    hint: t('prototype.commandPalette.cmd.generateImage.hint'),
    icon: 'icon-[lucide--sparkles]',
    shortcut: [modKey, 'G'],
    keywords: ['create', 'render', 'image', 'prompt'],
    group: 'generate'
  },
  {
    id: 'search-media',
    label: t('prototype.commandPalette.cmd.searchMedia.label'),
    hint: t('prototype.commandPalette.cmd.searchMedia.hint'),
    icon: 'icon-[lucide--image]',
    keywords: ['assets', 'outputs', 'gallery'],
    group: 'search'
  },
  {
    id: 'search-templates',
    label: t('prototype.commandPalette.cmd.searchTemplates.label'),
    hint: t('prototype.commandPalette.cmd.searchTemplates.hint'),
    icon: 'icon-[lucide--layout-template]',
    keywords: ['starter', 'preset'],
    group: 'search'
  },
  {
    id: 'search-projects',
    label: t('prototype.commandPalette.cmd.searchProjects.label'),
    hint: t('prototype.commandPalette.cmd.searchProjects.hint'),
    icon: 'icon-[lucide--folder]',
    keywords: ['folders'],
    group: 'search'
  },
  {
    id: 'search-workflows',
    label: t('prototype.commandPalette.cmd.searchWorkflows.label'),
    hint: t('prototype.commandPalette.cmd.searchWorkflows.hint'),
    icon: 'icon-[lucide--workflow]',
    keywords: ['graph', 'pipeline'],
    group: 'search'
  },
  {
    id: 'open-drafts',
    label: t('prototype.commandPalette.cmd.openDrafts.label'),
    icon: 'icon-[lucide--file-text]',
    keywords: ['my workflows', 'private'],
    group: 'navigate'
  },
  {
    id: 'open-recents',
    label: t('prototype.commandPalette.cmd.openRecents.label'),
    icon: 'icon-[lucide--clock]',
    keywords: ['history'],
    group: 'navigate'
  },
  {
    id: 'open-hub',
    label: t('prototype.commandPalette.cmd.openHub.label'),
    icon: 'icon-[lucide--compass]',
    keywords: ['community'],
    group: 'navigate'
  },
  {
    id: 'open-settings',
    label: t('prototype.commandPalette.cmd.openSettings.label'),
    icon: 'icon-[lucide--settings]',
    shortcut: [modKey, ','],
    group: 'settings'
  },
  {
    id: 'settings-general',
    label: t('prototype.commandPalette.cmd.settingsGeneral.label'),
    icon: 'icon-[lucide--sliders-horizontal]',
    group: 'settings'
  },
  {
    id: 'settings-allowlists',
    label: t('prototype.commandPalette.cmd.settingsAllowlists.label'),
    icon: 'icon-[lucide--shield-check]',
    group: 'settings'
  },
  {
    id: 'settings-publishing',
    label: t('prototype.commandPalette.cmd.settingsPublishing.label'),
    icon: 'icon-[lucide--upload]',
    group: 'settings'
  },
  {
    id: 'settings-billing',
    label: t('prototype.commandPalette.cmd.settingsBilling.label'),
    icon: 'icon-[lucide--credit-card]',
    keywords: ['plan', 'invoice'],
    group: 'settings'
  },
  {
    id: 'settings-advanced',
    label: t('prototype.commandPalette.cmd.settingsAdvanced.label'),
    icon: 'icon-[lucide--terminal]',
    group: 'settings'
  }
])

const quickChips = computed(() => [
  {
    commandId: 'generate-image',
    label: t('prototype.views.exploreV2.chip.generate'),
    icon: 'icon-[lucide--sparkles]'
  },
  {
    commandId: 'search-media',
    label: t('prototype.views.exploreV2.chip.media'),
    icon: 'icon-[lucide--image]'
  },
  {
    commandId: 'search-templates',
    label: t('prototype.views.exploreV2.chip.templates'),
    icon: 'icon-[lucide--layout-template]'
  },
  {
    commandId: 'search-projects',
    label: t('prototype.views.exploreV2.chip.projects'),
    icon: 'icon-[lucide--folder]'
  },
  {
    commandId: 'search-workflows',
    label: t('prototype.views.exploreV2.chip.workflows'),
    icon: 'icon-[lucide--workflow]'
  },
  {
    commandId: 'open-settings',
    label: t('prototype.views.exploreV2.chip.settings'),
    icon: 'icon-[lucide--settings]'
  }
])

function openPalette() {
  paletteOpen.value = true
}

function runChip(commandId: string) {
  const cmd = commands.value.find((c) => c.id === commandId)
  if (cmd) handleRun(cmd)
}

function handleRun(cmd: PaletteCommand) {
  paletteOpen.value = false
  toast.add({
    severity: 'info',
    summary: cmd.label,
    detail: t('prototype.commandPalette.runStub'),
    life: 2400
  })
}

useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  const meta = isMac ? event.metaKey : event.ctrlKey
  if (meta && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    paletteOpen.value = true
  }
})
</script>
