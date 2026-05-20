<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/install-switcher.md
    entity:   ../IA_Plan/wiki/entities/install.md
    open-q:   ../IA_Plan/wiki/open-questions.md#install-indicator-placement
              — working placement (this prototype): top bar, beside the
              notifications bell.
    log:      ../prototype/design-decisions.md
              — A1 working stance: switching records active install only;
              tab-set swap behavior is deferred to A2.

  Top-bar chip surfacing the active install and a popover for switching.
  Hidden when the persona has no installs (cloud-only). Switching the
  active install changes the runtime in product reality; in the
  prototype it's purely a state update — the gate/attribution UX that
  reacts to it lands in A2.
-->
<template>
  <div v-if="hasInstalls" ref="containerRef" class="relative inline-flex">
    <button
      type="button"
      class="inline-flex h-7 cursor-pointer appearance-none items-center gap-1.5 rounded-sm border-0 bg-transparent px-1.5 text-sm text-base-foreground transition-colors hover:bg-secondary-background focus:outline-none"
      :title="t('prototype.installChip.tooltip')"
      :aria-label="t('prototype.installChip.ariaLabel')"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span
        v-if="activeIsBlessed && currentWorkspace"
        :title="
          t('prototype.installChip.workspaceAvatarTitle', {
            workspace: currentWorkspace.name
          })
        "
        class="grid size-4 shrink-0 place-items-center rounded-sm text-[10px] font-semibold text-button-surface-contrast"
        :style="{ backgroundColor: currentWorkspace.avatarColor }"
      >
        {{ currentWorkspace.name.charAt(0) }}
      </span>
      <span
        v-else
        class="icon-[lucide--monitor] size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <span class="max-w-32 truncate text-xs">{{ activeName }}</span>
      <i
        v-if="activeIsLocked"
        :title="
          t('prototype.installChip.lockedTooltip', {
            workspace: currentWorkspace?.name ?? ''
          })
        "
        class="icon-[lucide--lock] size-3 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <span
        class="icon-[lucide--chevron-down] size-3.5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </button>

    <div
      v-if="isOpen"
      class="absolute top-full right-0 z-20 mt-1 flex w-72 flex-col rounded-lg border border-border-default bg-interface-menu-surface text-sm text-base-foreground shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
    >
      <header
        class="flex items-center justify-between gap-2 border-b border-border-default px-3 py-2"
      >
        <span class="font-medium">
          {{ t('prototype.installChip.title') }}
        </span>
      </header>

      <ul class="m-0 flex list-none flex-col p-0">
        <li
          v-for="row in installRows"
          :key="row.install.id"
          class="border-b border-border-default last:border-b-0"
        >
          <div
            :class="
              cn(
                'flex w-full items-start gap-2 px-3 py-2',
                row.install.id === activeId &&
                  'bg-interface-menu-component-surface-hovered'
              )
            "
          >
            <button
              type="button"
              class="flex flex-1 cursor-pointer appearance-none items-start gap-2 border-0 bg-transparent p-0 text-left focus:outline-none"
              :aria-current="row.install.id === activeId ? 'true' : undefined"
              @click="onSelect(row.install.id)"
            >
              <span
                v-if="row.install.id === activeId"
                class="mt-0.5 icon-[lucide--check] size-3.5 shrink-0 text-primary-background"
                aria-hidden="true"
              />
              <span
                v-else
                class="mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                <span class="flex items-center gap-1.5 truncate text-sm">
                  <span
                    v-if="row.blessed && currentWorkspace"
                    :title="
                      t('prototype.installChip.workspaceAvatarTitle', {
                        workspace: currentWorkspace.name
                      })
                    "
                    class="grid size-4 shrink-0 place-items-center rounded-sm text-[10px] font-semibold text-button-surface-contrast"
                    :style="{ backgroundColor: currentWorkspace.avatarColor }"
                    :aria-label="
                      t('prototype.installChip.workspaceAvatarTitle', {
                        workspace: currentWorkspace.name
                      })
                    "
                  >
                    {{ currentWorkspace.name.charAt(0) }}
                  </span>
                  <span class="truncate">{{ row.install.displayName }}</span>
                  <i
                    v-if="row.blessed?.isLocked"
                    :title="
                      t('prototype.installChip.lockedTooltip', {
                        workspace: currentWorkspace?.name ?? ''
                      })
                    "
                    class="icon-[lucide--lock] size-3 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </span>
                <span class="truncate text-xs text-muted-foreground">
                  {{
                    t('prototype.installChip.versionLine', {
                      version: row.install.comfyUIVersion
                    })
                  }}
                </span>
              </span>
            </button>
            <button
              v-if="row.canPublish"
              type="button"
              :title="t('prototype.installChip.publishHint')"
              class="shrink-0 cursor-pointer appearance-none rounded-sm border-0 bg-transparent px-2 py-1 text-xs text-muted-foreground hover:bg-interface-menu-component-surface-hovered hover:text-base-foreground"
              @click.stop="onPublish(row.install.id, row.install.displayName)"
            >
              {{ t('prototype.installChip.publish') }}
            </button>
          </div>
        </li>
      </ul>

      <footer
        v-if="activeIsLocked"
        class="flex items-start gap-2 border-t border-border-default bg-warning-background/30 px-3 py-2 text-xs text-base-foreground"
      >
        <i
          class="mt-0.5 icon-[lucide--lock] size-3.5 shrink-0"
          aria-hidden="true"
        />
        <span>
          {{
            t('prototype.installChip.activeLockedNote', {
              workspace: currentWorkspace?.name ?? ''
            })
          }}
        </span>
      </footer>
      <footer
        v-else
        class="border-t border-border-default px-3 py-2 text-xs text-muted-foreground"
      >
        {{ t('prototype.installChip.aggregationHint') }}
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { onClickOutside } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePrototypePersonaStore } from '../stores/personaStore'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture, activeInstall, currentWorkspace } = storeToRefs(personaStore)

const isOpen = ref(false)
const containerRef = useTemplateRef<HTMLElement>('containerRef')

onClickOutside(containerRef, () => {
  isOpen.value = false
})

const installs = computed(() => fixture.value.installs)
const hasInstalls = computed(() => installs.value.length > 0)
const activeId = computed(() => fixture.value.activeInstallId)
const activeName = computed(
  () => activeInstall.value?.displayName ?? t('prototype.installChip.noActive')
)
const activeBlessed = computed(() => {
  const active = activeInstall.value
  if (!active) return undefined
  return currentWorkspace.value?.blessedInstalls?.find(
    (b) => b.installId === active.id
  )
})
const activeIsBlessed = computed(() => !!activeBlessed.value)
const activeIsLocked = computed(() => !!activeBlessed.value?.isLocked)

// Publish authority follows the workspace install registry decision —
// Admin-only by default, delegable via `edit-allowlists`. The
// "Publish to workspace" affordance only shows on team workspaces for
// installs not yet in the registry.
const canPublishToWorkspace = computed(() => {
  const ws = currentWorkspace.value
  if (!ws || ws.tier !== 'team') return false
  const role = ws.currentUserRole
  if (role === 'admin') return true
  if (role === 'member' && fixture.value.roleGrants['edit-allowlists'])
    return true
  return false
})

const installRows = computed(() =>
  installs.value.map((install) => {
    const blessed = currentWorkspace.value?.blessedInstalls?.find(
      (b) => b.installId === install.id
    )
    return {
      install,
      blessed,
      canPublish: canPublishToWorkspace.value && !blessed
    }
  })
)

function onSelect(id: string) {
  personaStore.setActiveInstall(id)
  isOpen.value = false
}

function onPublish(installId: string, defaultName: string) {
  const name = window.prompt(
    t('prototype.installChip.publishPrompt', {
      workspace: currentWorkspace.value?.name ?? ''
    }),
    defaultName
  )
  if (!name) return
  personaStore.publishInstallToWorkspace(installId, name.trim())
  isOpen.value = false
}
</script>
