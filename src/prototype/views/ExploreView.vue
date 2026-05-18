<!--
  Implements:
    Dashboard home for every persona — the "community" feed.

    Hero pattern: a compact search bar with a ⌘K hint sits above the
    feed. Click the bar (or press ⌘K anywhere on the dashboard) to open
    a Raycast-style CommandPalette covering the screen.

    Commands are static and don't yet route — picking one toasts a
    "would navigate to X" message. This is intentional for the
    prototype: the goal here is the interaction model, not wiring real
    handlers.

    Feed is sourced from prototype community fixtures
    (fixtures/exploreAssets.ts); each asset carries
    `user_metadata.creator` so the MediaAssetCard hover chip can
    attribute the work.
-->
<template>
  <div class="flex flex-col gap-4">
    <button
      type="button"
      class="group flex w-full items-center gap-2.5 rounded-lg border border-interface-stroke bg-secondary-background px-3 py-2 text-left transition-colors hover:border-base-foreground/30 hover:bg-secondary-background-hover"
      @click="openPalette"
    >
      <i class="icon-[lucide--search] size-4 shrink-0 text-muted-foreground" />
      <span class="flex-1 text-sm text-muted-foreground">
        {{ t('prototype.views.explore.searchPlaceholder') }}
      </span>
      <span class="flex items-center gap-1">
        <kbd
          class="rounded-sm border border-interface-stroke bg-base-background px-1.5 py-0.5 text-[10px] text-muted-foreground"
        >
          {{ modKey }}
        </kbd>
        <kbd
          class="rounded-sm border border-interface-stroke bg-base-background px-1.5 py-0.5 text-[10px] text-muted-foreground"
        >
          K
        </kbd>
      </span>
    </button>

    <AssetMasonryGrid
      v-model:selected-ids="selectedIds"
      :assets="assets"
      :column-width="COLUMN_WIDTH"
    />

    <CommandPalette
      :open="paletteOpen"
      :commands="commands"
      :groups="groups"
      @close="paletteOpen = false"
      @run="handleRun"
    />
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AssetMasonryGrid from '@/platform/assets/components/AssetMasonryGrid.vue'

import type {
  PaletteCommand,
  PaletteGroup
} from '../components/CommandPalette.vue'
import CommandPalette from '../components/CommandPalette.vue'
import { buildExploreAssets } from '../fixtures/exploreAssets'

const COLUMN_WIDTH = 360

const { t } = useI18n()
const toast = useToast()

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

function openPalette() {
  paletteOpen.value = true
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
