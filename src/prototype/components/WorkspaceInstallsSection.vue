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
    :title="
      t('prototype.views.settings.installs.heading', {
        workspace: currentWorkspace?.name ?? ''
      })
    "
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
                    date: entry.publishedAt,
                    version: entry.comfyUIVersion
                  })
                }}
              </span>
              <span
                v-if="entry.isLocked"
                class="inline-flex items-center gap-1 text-xs text-text-secondary"
              >
                <i class="icon-[lucide--lock] size-3" aria-hidden="true" />
                {{ t('prototype.views.settings.installs.lockedStatus') }}
              </span>
            </div>
            <div class="inline-flex shrink-0 items-center gap-2">
              <Button
                v-if="!isInstalledLocally(entry.installId)"
                variant="secondary"
                size="md"
                @click="personaStore.installBlessedToLocal(entry.installId)"
              >
                <i class="icon-[lucide--download]" aria-hidden="true" />
                {{ t('prototype.views.settings.installs.installAction') }}
              </Button>
              <template v-if="canEdit">
                <Button
                  variant="secondary"
                  size="md"
                  @click="
                    personaStore.setBlessedInstallLocked(
                      entry.installId,
                      !entry.isLocked
                    )
                  "
                >
                  <i
                    :class="
                      entry.isLocked
                        ? 'icon-[lucide--unlock]'
                        : 'icon-[lucide--lock]'
                    "
                    aria-hidden="true"
                  />
                  {{
                    entry.isLocked
                      ? t('prototype.views.settings.installs.unlockAction')
                      : t('prototype.views.settings.installs.lockAction')
                  }}
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  @click="onUnpublish(entry)"
                >
                  {{ t('prototype.views.settings.installs.unpublish') }}
                </Button>
              </template>
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

// Whether the current user has the bundle on this machine. Pure
// client-local computation; the cloud-side registry doesn't track
// per-user install state — that's a desktop-only fact. Per
// prototype/design-decisions.md 2026-05-20.
function isInstalledLocally(installId: string): boolean {
  return fixture.value.installs.some((i) => i.id === installId)
}

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
