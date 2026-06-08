<!--
  Implements:
    entity:   ../IA_Plan/wiki/entities/workflow.md
    decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
              — fork lineage + full published-version timeline

  Per-workflow detail page (one level below the project). Header: the
  canonical workflow (large thumbnail + actions). Left: collaborators'
  forks of it. Right: a VS Code-style published-version history graph.
-->
<template>
  <div v-if="canonical" class="flex flex-col gap-6">
    <button
      type="button"
      class="flex w-fit cursor-pointer items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-base-foreground"
      @click="onBack"
    >
      <span class="icon-[lucide--arrow-left] size-4" />
      {{ projectName }}
    </button>

    <header class="flex max-w-3xl flex-col gap-5 sm:flex-row sm:items-start">
      <span
        class="block aspect-square w-44 shrink-0 overflow-hidden rounded-xl"
        :style="{ background: thumbnail }"
      />
      <div class="flex min-w-0 flex-1 flex-col gap-3">
        <div class="flex items-center gap-2">
          <h1 class="m-0 text-2xl font-semibold">{{ canonical.name }}</h1>
          <span
            class="rounded-sm bg-secondary-background px-1.5 py-0.5 text-[10px] text-muted-foreground"
          >
            {{
              t(
                canonical.kind === 'app'
                  ? 'prototype.workflowDetail.appTag'
                  : 'prototype.workflowDetail.workflowTag'
              )
            }}
          </span>
        </div>
        <div class="mt-1 flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary-background px-3 text-sm font-medium text-button-surface-contrast transition-colors hover:bg-primary-background-hover"
            @click="onOpen"
          >
            <span class="icon-[lucide--git-fork] size-4" />
            {{ t('prototype.workflowDetail.open') }}
          </button>
        </div>
      </div>
    </header>

    <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section class="flex flex-col gap-3">
        <h2
          class="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
        >
          {{
            t('prototype.workflowDetail.forksHeading', { count: forks.length })
          }}
        </h2>
        <p
          v-if="!forks.length"
          class="rounded-xl border border-dashed border-border-subtle p-6 text-center text-sm text-muted-foreground"
        >
          {{ t('prototype.workflowDetail.noForks') }}
        </p>
        <ul v-else class="m-0 flex list-none flex-col gap-2 p-0">
          <li
            v-for="f in forks"
            :key="f.id"
            class="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-secondary-background p-3"
          >
            <div class="flex min-w-0 flex-col gap-0.5">
              <span class="flex items-center gap-1.5 text-sm">
                <span class="truncate">{{ ownerName(f.ownerUserId) }}</span>
                <span
                  v-if="f.ownerUserId === currentUserId"
                  class="rounded-sm bg-base-background px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {{ t('prototype.workflowDetail.yours') }}
                </span>
              </span>
              <span class="text-xs text-muted-foreground">{{
                f.updatedAt
              }}</span>
            </div>
          </li>
        </ul>
      </section>

      <aside class="lg:border-l lg:border-border-subtle lg:pl-6">
        <WorkflowHistoryGraph :canonical-id="canonical.id" />
      </aside>
    </div>
  </div>

  <p v-else class="text-sm text-muted-foreground">
    {{ t('prototype.views.project.notFound') }}
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import WorkflowHistoryGraph from '../components/WorkflowHistoryGraph.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import { thumbnailGradient } from '../utils/thumbnail'

const { workflowId } = defineProps<{
  workflowId: string
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const uiStore = usePrototypeUiStore()

const canonical = computed(() =>
  personaStore.fixture.workflows.find((w) => w.id === workflowId)
)
const thumbnail = computed(() => thumbnailGradient(workflowId))
const project = computed(() =>
  personaStore.fixture.projects.find((p) => p.id === canonical.value?.projectId)
)
const projectName = computed(
  () => project.value?.name ?? t('prototype.views.project.back')
)
const currentUserId = computed(() => personaStore.fixture.currentUser.id)
const forks = computed(() =>
  personaStore.fixture.workflows.filter(
    (w) => w.forkedFrom?.workflowId === workflowId
  )
)

function ownerName(userId?: string) {
  if (!userId) return ''
  return (
    personaStore.fixture.members.find((m) => m.id === userId)?.name ?? userId
  )
}

function onBack() {
  if (project.value) {
    uiStore.go({ kind: 'project', projectId: project.value.id })
  } else {
    uiStore.go({ kind: 'projects' })
  }
}

// Open for work: reuse-or-fork into My Workflows, then jump there so the
// working copy is visible (A has no in-app editor surface).
function onOpen() {
  personaStore.openForWork(workflowId)
  uiStore.go({ kind: 'drafts' })
}
</script>
