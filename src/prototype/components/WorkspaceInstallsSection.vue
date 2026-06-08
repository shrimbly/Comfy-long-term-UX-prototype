<!--
  Implements:
    entity:   ../IA_Plan/wiki/entities/workspace.md §"Install registry"
    concept:  ../IA_Plan/wiki/concepts/workspace-install-registry.md
    decision: ../IA_Plan/wiki/decisions/workspace-install-registry.md
    log:      ../prototype/design-decisions.md 2026-05-19

  Workspace Settings → Installs section. Renders the workspace's
  `blessedInstalls` registry: each entry's workspace-canonical name +
  publish provenance + lock toggle + unpublish. Editable iff the viewer
  is workspace Admin or a Member with the publish-install delegation
  (Admin-only by default per the registry decision).
-->
<template>
  <SettingsPanel
    :title="t('prototype.views.settings.installs.heading')"
    :description="t('prototype.views.settings.installs.description')"
  >
    <p v-if="!entries.length" class="m-0 text-sm text-text-secondary">
      {{ t('prototype.views.settings.installs.empty') }}
    </p>

    <SettingsSubCard v-else>
      <ul class="m-0 flex list-none flex-col p-0">
        <li
          v-for="(entry, index) in entries"
          :key="entry.installId"
          :class="
            cn(
              'flex flex-col gap-2 py-3',
              index > 0 && 'border-t border-interface-stroke'
            )
          "
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 flex-col gap-0.5">
              <input
                type="text"
                :value="entry.canonicalDisplayName"
                :disabled="!canEdit"
                class="w-full appearance-none border-0 bg-transparent p-0 text-sm font-medium text-text-primary outline-none disabled:opacity-60"
                @change="
                  personaStore.setBlessedInstallDisplayName(
                    entry.installId,
                    ($event.target as HTMLInputElement).value
                  )
                "
              />
              <span class="text-xs text-muted">
                {{
                  t('prototype.views.settings.installs.publishedBy', {
                    user: publisherLabel(entry.publishedByUserId),
                    date: entry.publishedAt
                  })
                }}
              </span>
              <span
                v-if="entry.description"
                class="text-xs text-text-secondary"
              >
                {{ entry.description }}
              </span>
            </div>
            <div class="inline-flex shrink-0 items-center gap-2">
              <label
                class="inline-flex cursor-pointer items-center gap-2 text-xs text-text-secondary"
              >
                <input
                  type="checkbox"
                  :checked="entry.isLocked"
                  :disabled="!canEdit"
                  class="size-4 cursor-pointer appearance-auto accent-base-foreground"
                  @change="
                    personaStore.setBlessedInstallLocked(
                      entry.installId,
                      ($event.target as HTMLInputElement).checked
                    )
                  "
                />
                <span class="inline-flex items-center gap-1">
                  <i class="icon-[lucide--lock] size-3.5" aria-hidden="true" />
                  {{ t('prototype.views.settings.installs.lockedToggle') }}
                </span>
              </label>
              <Button
                v-if="canEdit"
                variant="secondary"
                size="md"
                @click="onUnpublish(entry)"
              >
                {{ t('prototype.views.settings.installs.unpublish') }}
              </Button>
            </div>
          </div>
        </li>
      </ul>
    </SettingsSubCard>

    <p class="m-0 text-xs text-muted italic">
      {{ t('prototype.views.settings.installs.publishHint') }}
    </p>
  </SettingsPanel>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import SettingsPanel from './settings/SettingsPanel.vue'
import SettingsSubCard from './settings/SettingsSubCard.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { BlessedInstall } from '../types'

const { canEdit } = defineProps<{
  canEdit: boolean
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture, currentWorkspace } = storeToRefs(personaStore)

const entries = computed<BlessedInstall[]>(
  () => currentWorkspace.value?.blessedInstalls ?? []
)

function publisherLabel(userId: string): string {
  if (userId === fixture.value.currentUser.id) {
    return t('prototype.views.members.actions.you')
  }
  return fixture.value.members.find((m) => m.id === userId)?.name ?? userId
}

function onUnpublish(entry: BlessedInstall) {
  if (
    !window.confirm(
      t('prototype.views.settings.installs.unpublishConfirm', {
        name: entry.canonicalDisplayName
      })
    )
  ) {
    return
  }
  personaStore.unpublishInstallFromWorkspace(entry.installId)
}
</script>
