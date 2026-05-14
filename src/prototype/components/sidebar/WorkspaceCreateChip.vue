<!--
  Implements:
    persona:  ../IA_Plan/wiki/concepts/personas.md — 1b Solo creator (local-only)
    log:      ../prototype/design-decisions.md (2026-05-14
              Local-only — surface Create-a-workspace CTA in the workspace slot)

  Local-only stand-in for the workspace switcher chip. The wiki position
  prior to this entry was that the switcher should be entirely hidden for
  this persona; we kept the slot occupied with a dashed Create-a-workspace
  CTA so the upgrade path is discoverable without introducing
  team/sharing concepts prematurely.
-->
<template>
  <button
    type="button"
    class="flex w-full cursor-pointer appearance-none items-center gap-2 rounded-md border border-dashed border-border-subtle bg-transparent p-2 text-left text-base-foreground transition-colors hover:border-border-default hover:bg-secondary-background focus:outline-none"
    :title="t('prototype.sidebar.createWorkspaceChip.title')"
    :aria-label="t('prototype.sidebar.createWorkspaceChip.title')"
  >
    <span
      class="grid size-8 shrink-0 place-items-center rounded-sm bg-secondary-background text-muted-foreground"
    >
      <span class="icon-[lucide--plus] size-4" />
    </span>
    <span class="flex min-w-0 flex-1 flex-col">
      <span class="truncate text-sm font-medium">{{
        t('prototype.sidebar.createWorkspaceChip.title')
      }}</span>
      <span class="truncate text-xs text-muted-foreground">{{
        t('prototype.sidebar.createWorkspaceChip.subtitle')
      }}</span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
