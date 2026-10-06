<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
              — updating a deployment updates every project on it
    decision: prototype/design-decisions.md — 2026-10-07 "Custom nodes
              modal: Platform's table, with pinned versions"

  Installing a pack, or changing an installed pack's version, is a new
  release of the shared deployment. This asks first, and names every
  project that gets the release.
-->
<template>
  <Dialog :open="true" @update:open="(open) => !open && cancel()">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent size="md" class="gap-5 p-8" @interact-outside.prevent>
        <DialogHeader class="p-0">
          <DialogTitle class="text-2xl">{{ title }}</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <dl
          class="m-0 flex flex-col rounded-lg border border-border-default bg-secondary-background/40 text-sm"
        >
          <div
            v-for="item in summary"
            :key="item.label"
            class="grid grid-cols-[9.5rem_minmax(0,1fr)] gap-x-3 border-border-default px-3.5 py-2.5 not-first:border-t"
          >
            <dt class="text-muted-foreground">{{ item.label }}</dt>
            <dd class="m-0">{{ item.value }}</dd>
          </div>
        </dl>

        <div class="flex flex-col gap-2 text-sm">
          <span class="text-muted-foreground">
            {{
              tText('prototype.customNodes.rebuild.projectsLead', {
                deployment: deployment.name
              })
            }}
          </span>
          <ul
            class="m-0 flex list-none flex-col rounded-lg border border-border-default p-0"
          >
            <li
              v-for="project in store.projectsOnDeployment"
              :key="project.id"
              class="flex items-center gap-2.5 border-border-default px-3.5 py-2.5 not-first:border-t"
            >
              {{ project.name }}
              <span
                v-if="project.id === customCloud.currentProject?.id"
                class="ml-auto text-xs text-muted-foreground"
              >
                {{ t('prototype.customNodes.rebuild.thisProject') }}
              </span>
            </li>
          </ul>
          <span class="text-xs text-muted-foreground">
            {{
              t('prototype.customNodes.rebuild.keepWorking', {
                release: deployment.release,
                next: next
              })
            }}
          </span>
        </div>

        <DialogFooter class="p-0">
          <Button variant="textonly" size="lg" @click="cancel">
            {{ t('prototype.customNodes.rebuild.notNow') }}
          </Button>
          <Button variant="inverted" size="lg" @click="store.confirmRebuild()">
            {{ t('prototype.customNodes.rebuild.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogPortal>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogClose from '@/components/ui/dialog/DialogClose.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogOverlay from '@/components/ui/dialog/DialogOverlay.vue'
import DialogPortal from '@/components/ui/dialog/DialogPortal.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'

import { useTextT } from '../composables/useTextT'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypeCustomNodesStore } from '../stores/customNodesStore'
import type { PackChange } from '../utils/customNodes'
import { changeTarget } from '../utils/customNodes'
import { nextRelease } from '../utils/deployment'

const { change } = defineProps<{
  change: PackChange
}>()

const { t } = useI18n()
const tText = useTextT()
const store = usePrototypeCustomNodesStore()
const customCloud = usePrototypeCustomCloudStore()

const deployment = computed(() => store.deployment)
const next = computed(() => nextRelease(deployment.value.release))
const row = computed(() => store.rows.find((r) => r.id === change.packId))
const pack = computed(() => row.value?.name ?? change.packId)

const target = computed(() => {
  const version = changeTarget(change, row.value?.latest ?? '')
  return change.to
    ? t('prototype.customNodes.rebuild.pinned', { version })
    : t('prototype.customNodes.rebuild.latest', { version })
})

const title = computed(() =>
  change.kind === 'add'
    ? t('prototype.customNodes.rebuild.titleAdd', { pack: pack.value })
    : t('prototype.customNodes.rebuild.titleChange', { pack: pack.value })
)

const summary = computed(() => [
  change.kind === 'add'
    ? {
        label: t('prototype.customNodes.rebuild.adds'),
        value: t('prototype.customNodes.rebuild.addValue', {
          pack: pack.value,
          version: target.value
        })
      }
    : {
        label: t('prototype.customNodes.rebuild.changes'),
        value: t('prototype.customNodes.rebuild.changeValue', {
          pack: pack.value,
          from: change.from,
          to: target.value
        })
      },
  {
    label: t('prototype.customNodes.rebuild.newRelease'),
    value: `${deployment.value.release} → ${next.value}`
  },
  {
    label: t('prototype.customNodes.rebuild.takes'),
    value: t('prototype.customNodes.rebuild.takesValue')
  }
])

function cancel() {
  store.pendingChange = null
}
</script>
