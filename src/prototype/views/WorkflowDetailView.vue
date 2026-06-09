<!--
  Implements:
    entity:   ../IA_Plan/wiki/entities/workflow.md
    decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
              — branch visibility = all collaborators; full publish timeline
    decision: ../IA_Plan/wiki/decisions/branch-vs-personal-copy.md

  Per-workflow detail page. Left column: the main (canonical) version as a
  header, then My branches, then Other collaborators' branches — all as
  thumbnail cards. Right column: a VS Code-style git history graph.
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
        <p
          v-if="canonical.description"
          class="m-0 text-sm text-muted-foreground"
        >
          {{ canonical.description }}
        </p>
        <div class="mt-1 flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary-background px-3 text-sm font-medium text-button-surface-contrast transition-colors hover:bg-primary-background-hover"
            @click="onOpen"
          >
            <span class="icon-[lucide--git-branch] size-4" />
            {{ t('prototype.workflowDetail.open') }}
          </button>
          <button
            type="button"
            class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-secondary-background px-3 text-sm transition-colors hover:bg-secondary-background-hover"
            @click="onSaveToMyWorkflows"
          >
            <span class="icon-[lucide--hard-drive] size-4" />
            {{ t('prototype.workflowDetail.saveToMyWorkflows') }}
          </button>
        </div>
      </div>
    </header>

    <section v-if="pendingReviews.length" class="flex flex-col gap-3">
      <h2
        class="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {{ t('prototype.workflowDetail.pendingReviewHeading') }}
      </h2>
      <SubmissionReviewList
        :canonical-workflow-id="canonical.id"
        variant="review"
      />
    </section>

    <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div class="flex flex-col gap-8">
        <section class="flex flex-col gap-3">
          <h2
            class="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {{ t('prototype.workflowDetail.myBranches') }}
          </h2>
          <div
            v-if="myBranches.length"
            class="grid grid-cols-[repeat(auto-fill,minmax(9rem,12rem))] gap-4"
          >
            <WorkflowCard v-for="b in myBranches" :key="b.id" :workflow="b" />
          </div>
          <p
            v-else
            class="rounded-xl border border-dashed border-border-subtle p-6 text-center text-sm text-muted-foreground"
          >
            {{ t('prototype.workflowDetail.noMyBranches') }}
          </p>
        </section>

        <section v-if="otherBranches.length" class="flex flex-col gap-3">
          <h2
            class="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {{ t('prototype.workflowDetail.otherBranches') }}
          </h2>
          <div
            class="grid grid-cols-[repeat(auto-fill,minmax(9rem,12rem))] gap-4"
          >
            <WorkflowCard
              v-for="b in otherBranches"
              :key="b.id"
              :workflow="b"
            />
          </div>
        </section>
      </div>

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

import SubmissionReviewList from '../components/SubmissionReviewList.vue'
import WorkflowCard from '../components/WorkflowCard.vue'
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
const branches = computed(() =>
  personaStore.fixture.workflows.filter(
    (w) => w.forkedFrom?.workflowId === workflowId
  )
)
const myBranches = computed(() =>
  branches.value.filter((b) => b.ownerUserId === currentUserId.value)
)
const otherBranches = computed(() =>
  branches.value.filter((b) => b.ownerUserId !== currentUserId.value)
)

const pendingReviews = computed(() =>
  personaStore.pendingWorkflowSubmissions.filter(
    (s) => s.canonicalWorkflowId === workflowId
  )
)

function onBack() {
  if (project.value) {
    uiStore.go({ kind: 'project', projectId: project.value.id })
  } else {
    uiStore.go({ kind: 'projects' })
  }
}

// Open for work: reuse-or-branch in this project. No in-app editor surface,
// so jump to the project so the new branch is visible alongside its peers.
function onOpen() {
  personaStore.openForWork(workflowId)
  if (project.value) {
    uiStore.go({ kind: 'project', projectId: project.value.id })
  }
}

function onSaveToMyWorkflows() {
  personaStore.saveToMyWorkflows(workflowId)
  uiStore.go({ kind: 'drafts' })
}
</script>
