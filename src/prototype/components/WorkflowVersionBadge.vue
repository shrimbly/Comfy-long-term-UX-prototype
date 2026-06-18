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
          'inline-flex items-center gap-0.5 rounded-md bg-border-subtle px-1.5 py-0.5 text-xs font-medium text-base-foreground',
          hasHistory && 'cursor-pointer hover:bg-secondary-background-selected'
        )
      "
      @click.stop.prevent="onTrigger"
      @keydown.enter.stop.prevent="onTrigger"
      @keydown.space.stop.prevent="onTrigger"
    >
      {{ t('prototype.workflowCard.version', { n: currentVersion }) }}
      <i
        v-if="hasHistory"
        class="icon-[lucide--chevron-down] size-3 text-muted-foreground"
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
        <button
          v-for="row in rows"
          :key="row.n"
          type="button"
          class="flex w-full cursor-pointer appearance-none items-center justify-between gap-2 rounded-sm border-0 bg-transparent px-2 py-1.5 text-xs transition-colors hover:bg-interface-menu-component-surface-hovered focus:bg-interface-menu-component-surface-hovered focus:outline-none"
          @click.stop.prevent="openVersion(row.n)"
        >
          <span class="shrink-0 font-medium text-base-foreground">
            {{ t('prototype.workflowCard.version', { n: row.n }) }}
          </span>
          <span class="flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <span class="truncate">{{ row.name }}</span>
            <span aria-hidden="true">·</span>
            <span class="shrink-0">{{ row.at }}</span>
          </span>
        </button>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { onClickOutside } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePrototypePersonaStore } from '../stores/personaStore'
import type { PublishedVersion } from '../types'

const { versions, name } = defineProps<{
  versions: PublishedVersion[]
  name: string
}>()

const { t } = useI18n()
const toast = useToast()
const personaStore = usePrototypePersonaStore()

const hasHistory = computed(() => versions.length > 0)
const currentVersion = computed(() => versions.length || 1)

function userName(id: string): string {
  return personaStore.fixture.members.find((m) => m.id === id)?.name ?? id
}

// Newest version first; version number is the chronological index + 1.
const rows = computed(() =>
  versions
    .map((v, i) => ({ n: i + 1, name: userName(v.byUserId), at: v.at }))
    .reverse()
)

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
