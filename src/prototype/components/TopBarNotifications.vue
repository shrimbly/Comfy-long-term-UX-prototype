<!--
  Implements:
    persona: ../IA_Plan/wiki/concepts/personas.md — §4 Project Collaborator,
             §5 Asset-only Guest (revised — see prototype/design-decisions.md
             2026-05-14)
    log:     ../prototype/design-decisions.md 2026-05-14 (cross-workspace
             notifications)

  Top-bar bell + popover. The only cue Guest personas get that something
  changed in a workspace they aren't currently looking at. Clicking a row
  marks it read, switches workspace if the target is elsewhere, and
  routes to the relevant project. "Mark all read" clears unread.
-->
<template>
  <div ref="containerRef" class="relative inline-flex">
    <button
      type="button"
      class="relative grid size-7 cursor-pointer appearance-none place-items-center rounded-sm border-0 bg-transparent text-muted-foreground transition-colors hover:bg-secondary-background hover:text-base-foreground focus:outline-none"
      :title="t('prototype.tabs.notifications')"
      :aria-label="t('prototype.tabs.notifications')"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span class="icon-[lucide--bell] size-4" />
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-primary-background px-1 text-[10px]/4 font-semibold text-button-surface-contrast"
        aria-hidden="true"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <div
      v-if="isOpen"
      class="absolute top-full right-0 z-20 mt-1 flex w-80 flex-col rounded-lg border border-border-default bg-interface-menu-surface text-sm text-base-foreground shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
    >
      <header
        class="flex items-center justify-between gap-2 border-b border-border-default px-3 py-2"
      >
        <span class="font-medium">
          {{ t('prototype.views.notifications.title') }}
        </span>
        <button
          v-if="unreadCount > 0"
          type="button"
          class="cursor-pointer appearance-none border-0 bg-transparent text-xs text-muted-foreground transition-colors hover:text-base-foreground focus:outline-none"
          @click="onMarkAll"
        >
          {{ t('prototype.views.notifications.markAllRead') }}
        </button>
      </header>

      <p
        v-if="!sortedNotifications.length"
        class="px-3 py-6 text-center text-sm text-muted-foreground"
      >
        {{ t('prototype.views.notifications.empty') }}
      </p>

      <ul
        v-else
        class="m-0 flex max-h-80 list-none flex-col overflow-y-auto p-0"
      >
        <li
          v-for="n in sortedNotifications"
          :key="n.id"
          class="border-b border-border-default last:border-b-0"
        >
          <button
            type="button"
            class="group flex w-full cursor-pointer appearance-none items-start gap-2 border-0 bg-transparent px-3 py-2 text-left transition-colors hover:bg-interface-menu-component-surface-hovered focus:bg-interface-menu-component-surface-hovered focus:outline-none"
            @click="onSelect(n)"
          >
            <span
              v-if="!n.readAt"
              class="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-background"
              aria-hidden="true"
            />
            <span v-else class="mt-1.5 size-1.5 shrink-0" aria-hidden="true" />
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span class="truncate text-sm">
                {{ messageFor(n) }}
              </span>
              <span class="truncate text-xs text-muted-foreground">
                {{
                  t('prototype.views.notifications.in', {
                    workspace: workspaceName(n.target.workspaceId)
                  })
                }}
                · {{ n.createdAt }}
              </span>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import type { Notification, NotificationKind } from '../types'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const uiStore = usePrototypeUiStore()
const { fixture, sortedNotifications, unreadNotificationCount } =
  storeToRefs(personaStore)

const isOpen = ref(false)
const containerRef = useTemplateRef<HTMLElement>('containerRef')

onClickOutside(containerRef, () => {
  isOpen.value = false
})

const unreadCount = computed(() => unreadNotificationCount.value)

function workspaceName(id: string) {
  return (
    fixture.value.workspaces.find((w) => w.id === id)?.name ??
    t('prototype.views.notifications.unknownWorkspace')
  )
}

function projectName(id?: string) {
  if (!id) return t('prototype.views.notifications.unknownProject')
  return (
    fixture.value.projects.find((p) => p.id === id)?.name ??
    t('prototype.views.notifications.unknownProject')
  )
}

function assetName(id?: string) {
  if (!id) return t('prototype.views.notifications.unknownAsset')
  return (
    fixture.value.workflows.find((w) => w.id === id)?.name ??
    t('prototype.views.notifications.unknownAsset')
  )
}

function actorName(id: string) {
  return (
    fixture.value.members.find((m) => m.id === id)?.name ??
    t('prototype.views.notifications.unknownActor')
  )
}

const kindKey: Record<NotificationKind, string> = {
  'asset-grant': 'prototype.views.notifications.kind.asset-grant',
  'asset-update': 'prototype.views.notifications.kind.asset-update',
  'project-grant': 'prototype.views.notifications.kind.project-grant',
  'workspace-invite': 'prototype.views.notifications.kind.workspace-invite'
}

function messageFor(n: Notification) {
  return t(kindKey[n.kind], {
    actor: actorName(n.actorUserId),
    asset: assetName(n.target.assetId),
    project: projectName(n.target.projectId),
    workspace: workspaceName(n.target.workspaceId)
  })
}

function onSelect(n: Notification) {
  personaStore.markNotificationRead(n.id)
  isOpen.value = false
  if (fixture.value.currentWorkspaceId !== n.target.workspaceId) {
    personaStore.setCurrentWorkspace(n.target.workspaceId)
  }
  if (n.target.projectId) {
    uiStore.go({ kind: 'project', projectId: n.target.projectId })
  } else {
    uiStore.go({ kind: 'projects' })
  }
}

function onMarkAll() {
  personaStore.markAllNotificationsRead()
}
</script>
