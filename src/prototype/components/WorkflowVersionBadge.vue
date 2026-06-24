<!--
  Version badge for a published-in-project (team) workflow. Shows the current
  version as a badge; when there's published-version history, a chevron opens a
  popover listing each version with its uploader + date.

  The trigger is a role="button" span (not a <button>) because this renders
  inside the card's <button> — nested buttons get re-parented by the HTML
  parser. The popover is teleported to body so it escapes the card's
  overflow-hidden clip.
-->
<template>
  <span ref="triggerRef" class="inline-flex">
    <span
      :role="hasHistory ? 'button' : undefined"
      :tabindex="hasHistory ? 0 : undefined"
      :aria-expanded="hasHistory ? open : undefined"
      :class="
        cn(
          'inline-flex items-center gap-0.5 rounded-md bg-base-foreground px-1.5 py-0.5 text-xs font-medium text-base-background',
          hasHistory && 'cursor-pointer hover:bg-base-foreground/80'
        )
      "
      @click.stop.prevent="onTrigger"
      @keydown.enter.stop.prevent="onTrigger"
      @keydown.space.stop.prevent="onTrigger"
    >
      {{ t('prototype.workflowCard.version', { n: currentVersion }) }}
      <i
        v-if="hasHistory"
        class="icon-[lucide--chevron-down] size-3 text-base-background/60"
      />
    </span>

    <Teleport to="body">
      <div
        v-if="open"
        ref="popRef"
        class="fixed z-50 flex w-60 flex-col gap-0.5 rounded-lg border border-border-default bg-interface-menu-surface p-1 shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
        :style="popStyle"
      >
        <p class="px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {{ t('prototype.workflowCard.versionHistory') }}
        </p>
        <HoverCardRoot
          v-for="row in rows"
          :key="row.n"
          :open-delay="120"
          :close-delay="120"
        >
          <HoverCardTrigger as-child>
            <div
              role="button"
              tabindex="0"
              class="group/vrow flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors hover:bg-interface-menu-component-surface-hovered focus:bg-interface-menu-component-surface-hovered focus:outline-none"
              @click.stop.prevent="openVersion(row.n)"
              @keydown.enter.stop.prevent="openVersion(row.n)"
              @keydown.space.stop.prevent="openVersion(row.n)"
            >
              <span class="flex shrink-0 items-center gap-1">
                <span class="font-medium text-base-foreground">
                  {{ t('prototype.workflowCard.version', { n: row.n }) }}
                </span>
                <Tooltip
                  v-if="row.pinned"
                  :text="t('prototype.workflowCard.stableTag')"
                >
                  <i class="icon-[lucide--pin] size-3 text-base-foreground" />
                </Tooltip>
                <i
                  v-if="row.comment"
                  class="icon-[lucide--message-square-text] size-3.5 text-muted-foreground"
                />
              </span>
              <span
                class="relative flex min-w-0 flex-1 items-center justify-end gap-1.5 text-muted-foreground"
              >
                <span
                  :class="
                    cn(
                      'flex min-w-0 items-center gap-1.5',
                      canManage && 'group-hover/vrow:opacity-0'
                    )
                  "
                >
                  <span class="truncate">{{ row.name }}</span>
                  <span aria-hidden="true">·</span>
                  <span class="shrink-0">{{ row.at }}</span>
                </span>
                <span
                  v-if="canManage"
                  class="absolute right-0 hidden items-center gap-0.5 group-hover/vrow:flex"
                >
                  <Tooltip
                    :text="
                      t(
                        row.pinned
                          ? 'prototype.workflowCard.unpinAction'
                          : 'prototype.workflowCard.pinAction'
                      )
                    "
                  >
                    <Button
                      variant="textonly"
                      size="unset"
                      class="grid size-5 place-items-center rounded-sm hover:bg-interface-menu-component-surface-selected"
                      :aria-label="
                        t(
                          row.pinned
                            ? 'prototype.workflowCard.unpinAction'
                            : 'prototype.workflowCard.pinAction'
                        )
                      "
                      @click.stop.prevent="togglePin(row.n)"
                    >
                      <i
                        :class="
                          cn(
                            'icon-[lucide--pin] size-3.5',
                            row.pinned
                              ? 'text-base-foreground'
                              : 'text-muted-foreground'
                          )
                        "
                      />
                    </Button>
                  </Tooltip>
                  <Tooltip
                    :text="t('prototype.workflowCard.deleteVersionAction')"
                  >
                    <Button
                      variant="textonly"
                      size="unset"
                      class="hover:text-danger grid size-5 place-items-center rounded-sm text-muted-foreground hover:bg-interface-menu-component-surface-selected"
                      :aria-label="
                        t('prototype.workflowCard.deleteVersionAction')
                      "
                      @click.stop.prevent="removeVersion(row.n)"
                    >
                      <i class="icon-[lucide--trash-2] size-3.5" />
                    </Button>
                  </Tooltip>
                </span>
              </span>
            </div>
          </HoverCardTrigger>
          <!-- Comment pops out 4px to the right of the popover; the offset
               clears the panel's 4px padding + 1px border. -->
          <HoverCardPortal v-if="row.comment">
            <HoverCardContent
              side="right"
              align="start"
              :side-offset="9"
              :collision-padding="8"
              class="z-50 max-h-60 w-64 overflow-y-auto rounded-lg border border-border-default bg-interface-menu-surface px-3 py-2 text-xs/relaxed whitespace-pre-wrap text-base-foreground shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
            >
              {{ row.comment }}
            </HoverCardContent>
          </HoverCardPortal>
        </HoverCardRoot>
      </div>
    </Teleport>

    <ConfirmDialog
      v-if="pendingDeleteVersion !== null"
      :title="t('prototype.workflowCard.deleteVersionAction')"
      :message="
        t('prototype.workflowCard.deleteVersionConfirm', {
          n: pendingDeleteVersion ?? 0
        })
      "
      :confirm-label="t('g.delete')"
      danger
      @confirm="confirmDeleteVersion"
      @cancel="pendingDeleteVersion = null"
    />
  </span>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { onClickOutside } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  HoverCardContent,
  HoverCardPortal,
  HoverCardRoot,
  HoverCardTrigger
} from 'reka-ui'

import Button from '@/components/ui/button/Button.vue'

import ConfirmDialog from './ConfirmDialog.vue'
import Tooltip from './Tooltip.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { PublishedVersion } from '../types'

const {
  versions,
  name,
  workflowId,
  canManage = false
} = defineProps<{
  versions: PublishedVersion[]
  name: string
  workflowId: string
  // The viewer may curate the timeline (pin a stable version, delete one) —
  // project owners and workspace admins on a workspace-wide project.
  canManage?: boolean
}>()

const { t } = useI18n()
const toast = useToast()
const personaStore = usePrototypePersonaStore()

function userName(id: string): string {
  return personaStore.fixture.members.find((m) => m.id === id)?.name ?? id
}

// Version number is the chronological index + 1 and is *stable*: a deleted
// version is soft-removed (kept in the array, flagged) so the remaining
// numbers don't renumber — the history can read 1, 2, 4, 5.
const indexed = computed(() =>
  versions.map((v, i) => ({
    n: i + 1,
    name: userName(v.byUserId),
    at: v.at,
    comment: v.comment,
    pinned: v.pinned ?? false,
    deleted: v.deleted ?? false
  }))
)
const visible = computed(() => indexed.value.filter((r) => !r.deleted))
const hasHistory = computed(() => visible.value.length > 0)
// The card shows the *effective* current version: the pinned "stable" version
// if the admin set one, else the latest publish.
const currentVersion = computed(() => {
  const pinned = visible.value.find((r) => r.pinned)
  if (pinned) return pinned.n
  return visible.value.length ? visible.value[visible.value.length - 1].n : 1
})
// Newest first.
const rows = computed(() => [...visible.value].reverse())

const POPOVER_WIDTH = 240
const open = ref(false)

function openVersion(n: number) {
  open.value = false
  toast.add({
    severity: 'info',
    summary: t('prototype.workflowCard.openVersionSummary'),
    detail: t('prototype.workflowCard.openVersionDetail', { name, n }),
    life: 2200
  })
}

function togglePin(n: number) {
  const wasPinned = indexed.value[n - 1]?.pinned
  personaStore.pinVersion(workflowId, n)
  toast.add({
    severity: 'success',
    summary: t(
      wasPinned
        ? 'prototype.workflowCard.unpinnedSummary'
        : 'prototype.workflowCard.pinnedSummary'
    ),
    detail: t(
      wasPinned
        ? 'prototype.workflowCard.unpinnedDetail'
        : 'prototype.workflowCard.pinnedDetail',
      { n }
    ),
    life: 2200
  })
}

// The version pending a delete confirmation (its 1-based number), or null.
const pendingDeleteVersion = ref<number | null>(null)

function removeVersion(n: number) {
  open.value = false
  pendingDeleteVersion.value = n
}

function confirmDeleteVersion() {
  const n = pendingDeleteVersion.value
  pendingDeleteVersion.value = null
  if (n == null) return
  personaStore.deleteVersion(workflowId, n)
  toast.add({
    severity: 'success',
    summary: t('prototype.workflowCard.versionDeletedSummary'),
    detail: t('prototype.workflowCard.versionDeletedDetail', { n }),
    life: 2200
  })
}
const triggerRef = useTemplateRef<HTMLElement>('triggerRef')
const popRef = useTemplateRef<HTMLElement>('popRef')
const popStyle = ref<Record<string, string>>({})

function onTrigger() {
  if (!hasHistory.value) return
  if (open.value) {
    open.value = false
    return
  }
  const rect = triggerRef.value?.getBoundingClientRect()
  if (rect) {
    const left = Math.max(
      8,
      Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 8)
    )
    popStyle.value = { top: `${rect.bottom + 4}px`, left: `${left}px` }
  }
  open.value = true
}

onClickOutside(popRef, () => (open.value = false), { ignore: [triggerRef] })
</script>
