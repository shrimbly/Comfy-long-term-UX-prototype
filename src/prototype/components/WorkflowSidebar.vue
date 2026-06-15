<!--
  Implements:
    entity:   ../IA_Plan/wiki/entities/workflow.md
    decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
              — canonical + published-version timeline; branch / personal copy
    log:      ../prototype/design-decisions.md (2026-06-10 workflow sidebar)

  Compact right-hand detail for a canonical workflow selected in the
  project grid. Name + current version, a branch action (Create / Open
  your branch) and Open-a-copy, then the linear published-version
  history. No other users' branches — neither as cards nor in the
  timeline.
-->
<template>
  <aside
    v-if="canonical"
    class="flex w-80 shrink-0 flex-col gap-3 rounded-xl border border-border-subtle p-4"
  >
    <header class="flex items-start justify-between gap-2">
      <div class="flex min-w-0 flex-col gap-1">
        <h3 class="m-0 truncate text-base font-semibold text-base-foreground">
          {{ canonical.name }}
        </h3>
        <span class="text-xs text-muted-foreground">
          {{ t('prototype.history.version', { number: versionNumber }) }}
        </span>
      </div>
      <Button
        variant="muted-textonly"
        size="icon-sm"
        :aria-label="t('g.close')"
        @click="emit('close')"
      >
        <i class="icon-[lucide--x] size-4" />
      </Button>
    </header>

    <div class="flex flex-col gap-2">
      <Button variant="primary" size="md" @click="onOpenCopy">
        <i class="icon-[lucide--copy] size-4" />
        {{ t('prototype.workflowSidebar.openCopy') }}
      </Button>
    </div>

    <div class="h-px bg-border-subtle" />

    <section class="flex min-h-0 flex-col gap-2">
      <h4
        class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {{ t('prototype.workflowSidebar.historyHeading') }}
      </h4>
      <p v-if="!versions.length" class="text-xs text-muted-foreground">
        {{ t('prototype.history.empty') }}
      </p>
      <ul v-else class="m-0 flex list-none flex-col gap-0 p-0">
        <li
          v-for="(row, i) in versions"
          :key="row.key"
          class="grid grid-cols-[0.75rem_1fr] gap-x-2"
        >
          <span class="relative flex items-center justify-center">
            <span
              class="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border-default"
              :class="
                cn(
                  i === 0 && 'top-1/2',
                  i === versions.length - 1 && 'bottom-1/2'
                )
              "
              aria-hidden="true"
            />
            <span
              :class="
                cn(
                  'relative z-10 size-2 rounded-full ring-2 ring-base-background',
                  row.isLatest ? 'bg-primary-background' : 'bg-muted-foreground'
                )
              "
            />
          </span>
          <Button
            variant="textonly"
            size="unset"
            class="min-w-0 justify-start gap-2 rounded-md px-2 py-1 text-left hover:bg-secondary-background-hover"
            @click="onOpenVersion(row.number)"
          >
            <span class="shrink-0 text-sm text-base-foreground">
              {{ t('prototype.history.version', { number: row.number }) }}
            </span>
            <span class="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {{
                t('prototype.history.versionMeta', {
                  date: row.at,
                  user: row.user
                })
              }}
            </span>
            <span
              v-if="row.isLatest"
              class="shrink-0 rounded-sm bg-secondary-background px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {{ t('prototype.history.current') }}
            </span>
          </Button>
        </li>
      </ul>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { useToast } from 'primevue/usetoast'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { usePrototypePersonaStore } from '../stores/personaStore'

const { workflowId } = defineProps<{
  workflowId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const toast = useToast()
const personaStore = usePrototypePersonaStore()

const canonical = computed(() =>
  personaStore.fixture.workflows.find((w) => w.id === workflowId)
)

const versionNumber = computed(
  () => canonical.value?.publishedVersions?.length ?? 0
)

function memberName(userId: string): string {
  return (
    personaStore.fixture.members.find((m) => m.id === userId)?.name ?? userId
  )
}

const versions = computed(() => {
  const list = canonical.value?.publishedVersions ?? []
  const total = list.length
  return [...list].reverse().map((v, i) => ({
    key: `${v.at}-${i}`,
    number: total - i,
    at: v.at,
    user: memberName(v.byUserId),
    isLatest: i === 0
  }))
})

// No editor in the prototype — opening a past version confirms via toast.
function onOpenVersion(number: number) {
  if (!canonical.value) return
  toast.add({
    severity: 'info',
    summary: t('prototype.workflowSidebar.toast.openedVersionSummary'),
    detail: t('prototype.workflowSidebar.toast.openedVersionDetail', {
      name: canonical.value.name,
      number
    }),
    life: 2200
  })
}

function onOpenCopy() {
  if (!canonical.value) return
  personaStore.copyToMyWorkflows(workflowId)
  toast.add({
    severity: 'success',
    summary: t('prototype.workflowSidebar.toast.copySummary'),
    detail: t('prototype.workflowSidebar.toast.copyDetail', {
      name: canonical.value.name
    }),
    life: 2800
  })
}
</script>
