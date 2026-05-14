<!--
  Implements:
    entity:  ../IA_Plan/wiki/entities/project.md
    concept: ../IA_Plan/wiki/concepts/three-level-permissions.md — project level
    persona: ../IA_Plan/wiki/concepts/personas.md — Project Collaborator (#4)
    log:     ../prototype/design-decisions.md (2026-05-13 Sharing panel)

  Single-project view. Workflows live in the body; the Sharing panel
  lives in a modal accessed from the header (avatar summary + Share
  button), mirroring Google Drive's Share affordance.
-->
<template>
  <div class="flex flex-col gap-6">
    <button
      type="button"
      class="flex w-fit cursor-pointer items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-base-foreground"
      @click="onBack"
    >
      <span class="icon-[lucide--arrow-left] size-4" />
      {{ backLabel }}
    </button>

    <header class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-semibold">{{ project?.name }}</h1>
        <span
          v-if="project"
          class="rounded-sm bg-secondary-background-hover px-2 py-0.5 text-xs text-muted-foreground"
        >
          {{ t(`prototype.projectTier.${project.tier}`) }}
        </span>
      </div>
      <div v-if="project && !isAssetOnlyGuest" class="flex items-center gap-2">
        <button
          v-if="project.tier !== 'private'"
          type="button"
          class="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-secondary-background pr-3 pl-1.5 text-sm transition-colors hover:bg-secondary-background-hover"
          @click="isSharingOpen = true"
        >
          <span v-if="avatarStack.length" class="flex items-center">
            <span
              v-for="(a, i) in avatarStack"
              :key="a.userId"
              :class="
                cn(
                  'grid size-6 place-items-center rounded-full border-2 border-secondary-background text-[10px] font-semibold text-button-surface-contrast',
                  i > 0 && '-ml-2'
                )
              "
              :style="{ backgroundColor: a.avatarColor }"
              :title="a.name"
            >
              {{ a.initial }}
            </span>
            <span
              v-if="hiddenAvatarCount > 0"
              class="-ml-2 grid size-6 place-items-center rounded-full border-2 border-secondary-background bg-secondary-background-hover text-[10px] font-semibold text-muted-foreground"
            >
              {{
                t('prototype.views.project.sharing.summaryMore', {
                  count: hiddenAvatarCount
                })
              }}
            </span>
          </span>
          <span class="text-muted-foreground">
            {{ sharingSummary }}
          </span>
          <span class="mx-1 text-muted-foreground">·</span>
          <span class="font-medium">
            {{ t('prototype.views.project.sharing.shareButton') }}
          </span>
        </button>
        <button
          type="button"
          class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-secondary-background px-3 text-sm transition-colors hover:bg-secondary-background-hover"
          @click="onViewMediaAssets"
        >
          <span class="icon-[lucide--image] size-4" />
          {{ t('prototype.views.project.viewMediaAssets') }}
        </button>
        <button
          type="button"
          class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary-background px-3 text-sm font-medium text-button-surface-contrast transition-colors hover:bg-primary-background-hover"
        >
          {{ t('prototype.views.project.newWorkflow') }}
        </button>
      </div>
    </header>

    <p v-if="!project" class="text-sm text-muted-foreground">
      {{ t('prototype.views.project.notFound') }}
    </p>

    <template v-else>
      <section class="flex flex-col gap-3">
        <div class="flex items-baseline justify-between">
          <h2
            class="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {{ t('prototype.views.project.workflowsHeading') }}
          </h2>
          <span v-if="workflows.length" class="text-xs text-muted-foreground">
            {{
              t('prototype.views.project.workflowCount', {
                count: workflows.length
              })
            }}
          </span>
        </div>
        <div
          v-if="workflows.length"
          class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          <WorkflowCard v-for="wf in workflows" :key="wf.id" :workflow="wf" />
        </div>
        <div
          v-else
          class="rounded-xl border border-dashed border-border-subtle p-10 text-center text-sm text-muted-foreground"
        >
          {{ t('prototype.views.project.empty') }}
        </div>
      </section>
    </template>

    <ProjectSharingDialog
      v-if="isSharingOpen && project && project.tier !== 'private'"
      :project="project"
      @close="isSharingOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ProjectSharingDialog from '../components/ProjectSharingDialog.vue'
import WorkflowCard from '../components/WorkflowCard.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'

const { projectId } = defineProps<{
  projectId: string
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const uiStore = usePrototypeUiStore()
const { fixture, currentWorkspace, currentPersonaId } =
  storeToRefs(personaStore)

const isSharingOpen = ref(false)

const project = computed(() =>
  fixture.value.projects.find((p) => p.id === projectId)
)

// Asset-only Guests see the project as a transit shell only — workflows
// are filtered to just their accessible assets, and the share / media-
// assets / new-workflow CTAs are hidden.
const isAssetOnlyGuest = computed(
  () => currentPersonaId.value === 'asset-only-guest'
)

const backLabel = computed(() => t('prototype.views.project.back'))

function onBack() {
  uiStore.go({ kind: 'projects' })
}

const workflows = computed(() =>
  fixture.value.workflows
    .filter((w) => w.projectId === projectId)
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
)

function onViewMediaAssets() {
  uiStore.setProjectFilter(projectId)
  uiStore.go({ kind: 'library', section: 'media' })
}

// People with access to drive the avatar stack + member-count summary.
// Mirrors the resolver in ProjectSharing — owner + explicit members +
// (for workspace-wide) all workspace Admins.
const peopleIds = computed<string[]>(() => {
  const p = project.value
  if (!p) return []
  const ids = new Set<string>()
  ids.add(p.ownerUserId)
  for (const m of p.members ?? []) ids.add(m.userId)
  if (p.tier === 'workspace-wide') {
    for (const m of fixture.value.members) {
      if (m.role === 'admin') ids.add(m.id)
    }
  }
  return [...ids]
})

const MAX_VISIBLE_AVATARS = 3

const avatarStack = computed(() =>
  peopleIds.value.slice(0, MAX_VISIBLE_AVATARS).map((id) => {
    const wsMember = fixture.value.members.find((m) => m.id === id)
    const invite = fixture.value.pendingInvites.find((i) => i.id === id)
    const name = wsMember?.name ?? invite?.email ?? id
    return {
      userId: id,
      name,
      avatarColor: wsMember?.avatarColor ?? '#7c7c7c',
      initial: name.trim().charAt(0).toUpperCase()
    }
  })
)

const hiddenAvatarCount = computed(() =>
  Math.max(0, peopleIds.value.length - MAX_VISIBLE_AVATARS)
)

const sharingSummary = computed(() => {
  if (!project.value) return ''
  if (project.value.tier === 'workspace-wide') {
    return t('prototype.views.project.sharing.summaryAnyone', {
      workspace: currentWorkspace.value?.name ?? ''
    })
  }
  return t('prototype.views.project.sharing.summaryRestricted', {
    count: peopleIds.value.length
  })
})
</script>
