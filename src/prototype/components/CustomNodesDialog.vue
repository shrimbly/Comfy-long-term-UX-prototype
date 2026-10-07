<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md
    decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
    decision: ../IA_Plan/wiki/decisions/custom-nodes-as-configuration.md
    decision: prototype/design-decisions.md — 2026-10-07 "Custom nodes
              modal: Platform's table, with pinned versions"

  The Custom nodes modal the editor's extensions button opens, laid out
  like Platform's builder table: search with Status, License and Sort
  filters, then pack, publisher, installs, stars, version, license and an
  Install checkbox. The footer installs every ticked pack in one release.
-->
<template>
  <Dialog :open="true" @update:open="(open) => !open && store.close()">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent
        size="xl"
        class="h-[min(88vh,52rem)] overflow-hidden"
        @pointer-down-outside="
          (event) => store.pendingChanges && event.preventDefault()
        "
        @focus-outside.prevent
      >
        <DialogHeader class="flex-col items-stretch gap-4 px-6 pt-5 pb-4">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <DialogTitle class="flex-1 text-xl">
                {{ t('prototype.customNodes.title') }}
              </DialogTitle>
              <DialogClose />
            </div>
            <p
              class="m-0 flex items-center gap-2 text-sm text-muted-foreground"
            >
              <DeploymentStatusDot
                :status="store.rebuild ? 'building' : deployment.status"
              />
              <span>{{ whereLine }}</span>
            </p>
          </div>
          <div
            v-if="!store.isCustom"
            class="flex gap-2.5 rounded-lg border border-border-default bg-secondary-background/40 px-3 py-2.5 text-sm"
          >
            <i
              class="mt-0.5 icon-[lucide--info] size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span class="flex flex-col gap-0.5">
              <span class="font-medium">
                {{ t('prototype.customNodes.cloud.title') }}
              </span>
              <span class="text-muted-foreground">
                {{ t('prototype.customNodes.cloud.body') }}
              </span>
            </span>
          </div>
          <div class="flex items-center gap-2">
            <SearchInput
              v-model="store.query"
              class="flex-1"
              :placeholder="t('prototype.customNodes.search')"
              :aria-label="t('prototype.customNodes.search')"
            />
            <ToolbarSelect
              v-model="store.status"
              :options="statusOptions"
              :label="t('prototype.customNodes.toolbar.status')"
              :aria-label="t('prototype.customNodes.toolbar.status')"
            />
            <ToolbarSelect
              v-model="store.license"
              :options="licenseOptions"
              :label="t('prototype.customNodes.toolbar.license')"
              :aria-label="t('prototype.customNodes.toolbar.license')"
            />
            <ToolbarSelect
              v-model="store.sort"
              :options="sortOptions"
              :label="t('prototype.customNodes.toolbar.sort')"
              :aria-label="t('prototype.customNodes.toolbar.sort')"
            />
          </div>
        </DialogHeader>

        <div class="flex min-h-0 flex-1 flex-col px-6 pb-4">
          <div
            role="table"
            class="flex max-h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-subtle text-sm"
          >
            <div
              role="row"
              :class="
                cn(
                  GRID,
                  'h-10 shrink-0 border-l-2 border-l-transparent bg-secondary-background/60 px-4 text-base-foreground'
                )
              "
            >
              <span role="columnheader">
                {{ t('prototype.customNodes.column.pack') }}
              </span>
              <span role="columnheader">
                {{ t('prototype.customNodes.column.publisher') }}
              </span>
              <span role="columnheader">
                {{ t('prototype.customNodes.column.installs') }}
              </span>
              <span role="columnheader">
                {{ t('prototype.customNodes.column.stars') }}
              </span>
              <span role="columnheader">
                {{ t('prototype.customNodes.column.version') }}
              </span>
              <span role="columnheader">
                {{ t('prototype.customNodes.column.license') }}
              </span>
              <span role="columnheader" class="text-right">
                {{ t('prototype.customNodes.column.install') }}
              </span>
            </div>
            <div class="min-h-0 overflow-y-auto">
              <CustomNodesRow
                v-for="row in store.visibleRows"
                :key="row.id"
                :row
                :grid="GRID"
              />
              <p
                v-if="!store.visibleRows.length"
                class="m-0 border-t border-border-subtle py-8 text-center text-muted-foreground"
              >
                {{ t('prototype.customNodes.noMatch') }}
              </p>
            </div>
          </div>
        </div>

        <footer
          class="flex items-center gap-4 border-t border-border-subtle px-6 py-3"
        >
          <span class="min-w-0 flex-1 text-xs text-muted-foreground">
            {{ footer }}
          </span>
          <template v-if="store.isCustom && !store.rebuild">
            <span
              v-if="store.selected.length"
              class="shrink-0 text-xs text-muted-foreground"
            >
              {{ t('prototype.customNodes.actions.selected', selectedCount) }}
            </span>
            <Button
              v-if="store.selected.length"
              variant="muted-textonly"
              size="md"
              @click="store.selected = []"
            >
              {{ t('prototype.customNodes.actions.clear') }}
            </Button>
            <Button
              v-if="store.canInstall"
              variant="inverted"
              size="lg"
              :disabled="!selectedCount"
              @click="store.requestInstall()"
            >
              {{ t('prototype.customNodes.actions.install', selectedCount) }}
            </Button>
            <Button
              v-else
              variant="inverted"
              size="lg"
              :disabled="!selectedCount"
              @click="store.askAdmin()"
            >
              {{ t('prototype.customNodes.actions.askAdmin', selectedCount) }}
            </Button>
          </template>
        </footer>
      </DialogContent>
    </DialogPortal>
  </Dialog>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogClose from '@/components/ui/dialog/DialogClose.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogOverlay from '@/components/ui/dialog/DialogOverlay.vue'
import DialogPortal from '@/components/ui/dialog/DialogPortal.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import SearchInput from '@/components/ui/search-input/SearchInput.vue'

import { useTextT } from '../composables/useTextT'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypeCustomNodesStore } from '../stores/customNodesStore'
import { ANY_LICENSE } from '../utils/customNodes'
import type { PackSort, PackStatus } from '../utils/customNodes'

import CustomNodesRow from './CustomNodesRow.vue'
import DeploymentStatusDot from './DeploymentStatusDot.vue'
import ToolbarSelect from './ToolbarSelect.vue'

const GRID =
  'grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_4.5rem_4rem_9.5rem_6.5rem_3.5rem] items-center gap-x-4'
const STATUSES: PackStatus[] = ['all', 'installed', 'available', 'blocked']
const SORTS: PackSort[] = ['installs', 'stars', 'name']

const { t } = useI18n()
const tText = useTextT()
const store = usePrototypeCustomNodesStore()
const customCloud = usePrototypeCustomCloudStore()

const deployment = computed(() => store.deployment)
const selectedCount = computed(() => store.selected.length)

const statusOptions = computed(() =>
  STATUSES.map((value) => ({
    value,
    label: t(`prototype.customNodes.status.filter.${value}`)
  }))
)
const licenseOptions = computed(() => [
  { value: ANY_LICENSE, label: t('prototype.customNodes.toolbar.all') },
  ...store.licenses.map((value) => ({ value, label: value }))
])
const sortOptions = computed(() =>
  SORTS.map((value) => ({
    value,
    label: t(`prototype.customNodes.sort.${value}`)
  }))
)

const whereLine = computed(() => {
  const project = customCloud.currentProject?.name ?? ''
  if (!store.isCustom)
    return tText('prototype.customNodes.runsOnCloud', { project })
  if (store.rebuild)
    return tText('prototype.customNodes.building', {
      deployment: deployment.value.name,
      release: store.rebuild.release,
      current: deployment.value.release ?? ''
    })
  return tText('prototype.customNodes.runsOn', {
    project,
    deployment: deployment.value.name,
    release: deployment.value.release ?? ''
  })
})

const footer = computed(() => {
  if (!store.isCustom) return t('prototype.customNodes.footer.cloud')
  if (store.rebuild)
    return t('prototype.customNodes.footer.building', {
      release: store.rebuild.release
    })
  const key = store.canInstall ? 'custom' : 'member'
  return tText(`prototype.customNodes.footer.${key}`, {
    deployment: deployment.value.name
  })
})
</script>
