<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md
    decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
    decision: ../IA_Plan/wiki/decisions/custom-nodes-as-configuration.md
    decision: prototype/design-decisions.md — 2026-10-07 "Custom nodes
              modal: Platform's table, with pinned versions"

  The Custom nodes modal the editor's extensions button opens. Its table
  follows Platform's builder: pack (linked to GitHub), publisher, installs,
  stars, version, then a status or action. Installed packs come first, then
  what the deployment can add, then the packs the workspace policy blocks.
-->
<template>
  <Dialog :open="true" @update:open="(open) => !open && store.close()">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent
        size="xl"
        class="max-h-[88vh] overflow-hidden"
        @pointer-down-outside="
          (event) => store.pendingChanges && event.preventDefault()
        "
        @focus-outside.prevent
      >
        <DialogHeader class="flex-col items-stretch gap-3 px-6 pt-5 pb-2">
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
          <div class="flex items-center gap-2.5">
            <SearchInput
              v-model="store.query"
              class="flex-1"
              :placeholder="t('prototype.customNodes.search')"
              :aria-label="t('prototype.customNodes.search')"
            />
            <ToggleGroup
              v-model="store.filter"
              type="single"
              variant="outline"
              :aria-label="t('prototype.customNodes.filter.label')"
              class="rounded-lg border border-border-default p-0.5"
            >
              <ToggleGroupItem
                v-for="option in FILTERS"
                :key="option"
                :value="option"
                size="sm"
                class="border-none px-3"
              >
                {{ t(`prototype.customNodes.filter.${option}`) }}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </DialogHeader>

        <div class="min-h-0 flex-1 overflow-y-auto px-6 pb-2">
          <div role="table" class="flex flex-col text-sm">
            <div
              role="row"
              :class="
                cn(GRID, 'min-h-9 text-xs font-medium text-muted-foreground')
              "
            >
              <span role="columnheader">
                {{ t('prototype.customNodes.column.pack') }}
              </span>
              <span role="columnheader">
                {{ t('prototype.customNodes.column.publisher') }}
              </span>
              <span role="columnheader" class="text-right">
                {{ t('prototype.customNodes.column.installs') }}
              </span>
              <span role="columnheader" class="text-right">
                {{ t('prototype.customNodes.column.stars') }}
              </span>
              <span role="columnheader" class="pl-2.5">
                {{ t('prototype.customNodes.column.version') }}
              </span>
              <span role="columnheader" class="sr-only">
                {{ t('prototype.customNodes.column.select') }}
              </span>
            </div>

            <CustomNodesRow
              v-for="row in listedRows"
              :key="row.id"
              :row
              :grid="GRID"
            />

            <div
              v-if="blockedRows.length"
              class="flex min-h-9 items-center justify-between border-t border-border-subtle text-xs font-medium text-muted-foreground"
            >
              <span class="flex items-center gap-1.5">
                <i class="icon-[lucide--lock] size-3" aria-hidden="true" />
                {{
                  tText('prototype.customNodes.blocked', {
                    workspace: workspaceName,
                    count: blockedRows.length
                  })
                }}
              </span>
              <span class="flex items-center gap-1">
                <Button
                  v-if="store.showBlocked && canReviewPolicies"
                  variant="muted-textonly"
                  size="sm"
                  @click="reviewPolicies"
                >
                  {{ t('prototype.customNodes.reviewPolicies') }}
                </Button>
                <Button
                  variant="muted-textonly"
                  size="sm"
                  :aria-expanded="store.showBlocked"
                  @click="store.showBlocked = !store.showBlocked"
                >
                  {{
                    store.showBlocked
                      ? t('prototype.customNodes.hide')
                      : t('prototype.customNodes.show')
                  }}
                  <i
                    :class="
                      cn(
                        'icon-[lucide--chevron-down] size-3.5',
                        store.showBlocked && 'rotate-180'
                      )
                    "
                    aria-hidden="true"
                  />
                </Button>
              </span>
            </div>
            <template v-if="store.showBlocked">
              <CustomNodesRow
                v-for="row in blockedRows"
                :key="row.id"
                :row
                :grid="GRID"
              />
            </template>

            <p
              v-if="!store.visibleRows.length"
              class="m-0 border-t border-border-subtle py-6 text-center text-muted-foreground"
            >
              {{ t('prototype.customNodes.noMatch') }}
            </p>
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
import ToggleGroup from '@/components/ui/toggle-group/ToggleGroup.vue'
import ToggleGroupItem from '@/components/ui/toggle-group/ToggleGroupItem.vue'

import { useTextT } from '../composables/useTextT'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypeCustomNodesStore } from '../stores/customNodesStore'
import type { PackFilter } from '../stores/customNodesStore'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypePolicyStore } from '../stores/policyStore'
import { HOME_TAB_ID, usePrototypeTabsStore } from '../stores/tabsStore'
import { usePrototypeUiStore } from '../stores/uiStore'

import CustomNodesRow from './CustomNodesRow.vue'
import DeploymentStatusDot from './DeploymentStatusDot.vue'

const FILTERS: PackFilter[] = ['all', 'installed', 'available']
const GRID =
  'grid grid-cols-[minmax(0,1fr)_8rem_4.5rem_4.5rem_11.5rem_1.5rem] items-center gap-x-4'

const { t } = useI18n()
const tText = useTextT()
const store = usePrototypeCustomNodesStore()
const customCloud = usePrototypeCustomCloudStore()
const personaStore = usePrototypePersonaStore()
const policies = usePrototypePolicyStore()
const tabsStore = usePrototypeTabsStore()
const uiStore = usePrototypeUiStore()

const deployment = computed(() => store.deployment)
const workspaceName = computed(() => personaStore.currentWorkspace?.name ?? '')
const canReviewPolicies = computed(() => policies.canEdit)

const listedRows = computed(() =>
  store.visibleRows.filter((row) => row.state !== 'blocked')
)
const selectedCount = computed(() => store.selected.length)
const blockedRows = computed(() =>
  store.visibleRows.filter((row) => row.state === 'blocked')
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

function reviewPolicies() {
  store.close()
  tabsStore.select(HOME_TAB_ID)
  uiStore.openSettings('policies')
}
</script>
