<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/workflow.md
    log:    ../prototype/design-decisions.md (2026-05-15 Workflow context menu)

  Grid: a hairline-bordered card — full-bleed thumbnail with rounded top
  corners over a caption row (file-type icon, name, storage, modified).
  List: a compact row. Right-clicking either opens a role-gated
  WorkflowContextMenu.
-->
<template>
  <div
    class="group relative text-base-foreground select-none"
    @contextmenu.prevent.stop="onContextMenu"
  >
    <button
      v-if="layout === 'grid'"
      type="button"
      :class="
        cn(
          'flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-secondary-background text-left text-base-foreground transition-colors',
          selected
            ? 'border-primary-background'
            : 'border-border-subtle hover:border-muted-foreground'
        )
      "
      @click="onCardClick"
    >
      <span class="block aspect-3/2 w-full overflow-hidden">
        <CustomThumbnail v-if="customThumbnails" :title="workflow.name" />
        <span
          v-else
          class="block size-full"
          :style="{ background: thumbnail }"
        />
      </span>
      <span class="flex flex-col gap-1 px-3 py-2.5">
        <span class="flex items-center gap-1.5">
          <span class="min-w-0 flex-1 truncate text-xs/tight font-medium">{{
            workflow.name
          }}</span>
          <i
            v-if="isPublishedInProject"
            class="mb-1 icon-[lucide--users-round] size-4 shrink-0 text-muted-foreground"
            :title="teamTitle"
          />
          <StorageIcon
            v-else-if="workflow.storage"
            :storage="workflow.storage"
            :label="storageTitle"
            class="size-4 shrink-0 text-muted-foreground"
          />
        </span>
        <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span class="min-w-0 flex-1 truncate">{{ workflow.updatedAt }}</span>
          <WorkflowVersionBadge
            v-if="isPublishedInProject"
            :name="workflow.name"
            :versions="workflow.publishedVersions ?? []"
          />
          <span
            v-else-if="copyVersion"
            :class="versionTagClass"
            :title="provenanceTitle"
          >
            {{ t('prototype.workflowCard.version', { n: copyVersion }) }}
          </span>
          <DraftProvenanceBadge v-else-if="draftMeta" :meta="draftMeta" />
        </span>
      </span>
    </button>

    <button
      v-else
      type="button"
      :class="
        cn(
          'flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors',
          selected
            ? 'bg-secondary-background'
            : 'hover:bg-secondary-background-hover'
        )
      "
      @click="onCardClick"
    >
      <span class="block aspect-3/2 h-9 shrink-0 overflow-hidden rounded-md">
        <CustomThumbnail v-if="customThumbnails" :title="workflow.name" />
        <span
          v-else
          class="block size-full"
          :style="{ background: thumbnail }"
        />
      </span>
      <span class="flex min-w-0 flex-1 items-center gap-1.5">
        <span class="truncate text-sm">{{ workflow.name }}</span>
      </span>
      <i
        v-if="isPublishedInProject"
        class="mb-1 icon-[lucide--users-round] size-4 shrink-0 text-muted-foreground"
        :title="teamTitle"
      />
      <StorageIcon
        v-else-if="workflow.storage"
        :storage="workflow.storage"
        :label="storageTitle"
        class="size-4 shrink-0 text-muted-foreground"
      />
      <span class="shrink-0 text-xs text-muted-foreground">{{
        workflow.updatedAt
      }}</span>
      <WorkflowVersionBadge
        v-if="isPublishedInProject"
        :name="workflow.name"
        :versions="workflow.publishedVersions ?? []"
      />
      <span
        v-else-if="copyVersion"
        :class="versionTagClass"
        :title="provenanceTitle"
      >
        {{ t('prototype.workflowCard.version', { n: copyVersion }) }}
      </span>
      <DraftProvenanceBadge v-else-if="draftMeta" :meta="draftMeta" />
    </button>

    <div
      v-if="actions && layout === 'grid'"
      class="pointer-events-none absolute inset-x-0 top-0 flex aspect-3/2 items-end justify-end gap-2 p-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
    >
      <template v-if="actions === 'published'">
        <Button
          variant="secondary"
          size="sm"
          class="pointer-events-auto"
          @click.stop="emit('copy', workflow.id)"
        >
          <i class="icon-[lucide--copy] size-4" />
          {{ t('prototype.workflowCard.copyAction') }}
        </Button>
        <CopyOpenButton
          v-if="copies.length"
          :copies
          @open="emit('open', $event)"
        />
      </template>
      <template v-else>
        <Button
          variant="secondary"
          size="sm"
          class="pointer-events-auto"
          @click.stop="emit('publish', workflow.id)"
        >
          <i class="icon-[lucide--folder-up] size-4" />
          {{ t('prototype.workflowCard.publishAction') }}
        </Button>
        <Button
          variant="primary"
          size="sm"
          class="pointer-events-auto"
          @click.stop="emit('open', workflow.id)"
        >
          <i class="icon-[lucide--square-arrow-out-up-right] size-4" />
          {{ t('prototype.workflowCard.openAction') }}
        </Button>
      </template>
    </div>

    <WorkflowContextMenu
      ref="menuRef"
      :workflow="workflow"
      :viewer-role="viewerRole"
      :show-open-containing-project="showOpenContainingProject"
      @open="emit('open', $event)"
      @open-project="emit('open-project', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import CopyOpenButton from './CopyOpenButton.vue'
import CustomThumbnail from './CustomThumbnail.vue'
import DraftProvenanceBadge from './DraftProvenanceBadge.vue'
import StorageIcon from './StorageIcon.vue'
import WorkflowContextMenu from './WorkflowContextMenu.vue'
import WorkflowVersionBadge from './WorkflowVersionBadge.vue'
import { useViewerWorkflowRole } from '../composables/useViewerWorkflowRole'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import { workflowThumbnail } from '../utils/thumbnail'
import type { DraftMeta, Workflow } from '../types'

const {
  workflow,
  layout = 'grid',
  showOpenContainingProject = true,
  selected = false,
  draftMeta,
  actions,
  copies = []
} = defineProps<{
  workflow: Workflow
  layout?: 'grid' | 'list'
  showOpenContainingProject?: boolean
  selected?: boolean
  draftMeta?: DraftMeta
  actions?: 'published' | 'draft'
  // The viewer's existing copies of this canonical (published cards only) —
  // drives the "Open" CTA + its multi-copy selector.
  copies?: Workflow[]
}>()

const emit = defineEmits<{
  open: [workflowId: string]
  copy: [workflowId: string]
  publish: [workflowId: string]
  'open-project': [projectId: string]
}>()

// With hover actions the card body is inert — only the explicit buttons act.
// Without them, clicking the card opens the workflow (Recents / Home).
function onCardClick() {
  if (actions) return
  emit('open', workflow.id)
}

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { customThumbnails } = storeToRefs(usePrototypeUiStore())

const thumbnail = computed(() =>
  workflowThumbnail(workflow, personaStore.workflowThumbnailSeed(workflow.id))
)

const storageTitle = computed(() =>
  t(
    workflow.storage === 'local'
      ? 'prototype.workflowCard.storageLocal'
      : 'prototype.workflowCard.storageCloud'
  )
)

// A canonical (not a copy) living in a real, non-Drafts project is a
// "published in a project" team workflow — always cloud, shown with a team
// icon + version badge instead of the personal cloud/local storage icon.
const isPublishedInProject = computed(() => {
  if (workflow.forkedFrom) return false
  const project = personaStore.fixture.projects.find(
    (p) => p.id === workflow.projectId
  )
  return !!project && !project.isDrafts
})

// The version this copy was taken from — derived from its fork point rather
// than baked into the (user-editable) name. Any copy of a resolvable source
// shows a version tag (the tag and the link badge convey the same provenance,
// so the tag wins); it is absent only when the source no longer resolves, which
// the source-removed badge then handles.
const copyVersion = computed(() => {
  const fork = workflow.forkedFrom
  if (!fork) return undefined
  const canonical = personaStore.fixture.workflows.find(
    (w) => w.id === fork.workflowId
  )
  if (!canonical) return undefined
  const versions = canonical.publishedVersions ?? []
  if (fork.atVersion) {
    const index = versions.findIndex((v) => v.at === fork.atVersion)
    if (index >= 0) return index + 1
  }
  // Fork point can't be pinned (missing/stale atVersion) — show the source's
  // current version rather than dropping back to the redundant link badge.
  return Math.max(versions.length, 1)
})

const versionTagClass =
  'inline-flex shrink-0 items-center rounded-md bg-border-subtle px-1.5 py-0.5 text-xs font-medium text-base-foreground'

// The version badge carries the copy's provenance (formerly the link icon's
// tooltip): which project + workflow it tracks.
const provenanceTitle = computed(() =>
  draftMeta?.state === 'linked'
    ? t('prototype.views.project.draftProvenance.link', {
        project: draftMeta.projectName,
        workflow: draftMeta.workflowName
      })
    : undefined
)

const teamTitle = computed(() => t('prototype.workflowCard.team'))

const workflowRef = computed(() => workflow)
const viewerRole = useViewerWorkflowRole(workflowRef)

type MenuHandle = { show: (event: MouseEvent) => void }
const menuRef = ref<MenuHandle | null>(null)

function onContextMenu(event: MouseEvent) {
  menuRef.value?.show(event)
}
</script>
