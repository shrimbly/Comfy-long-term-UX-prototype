<!--
  Implements:
    entity: ../IA_Plan/wiki/entities/workflow.md
    log:    ../prototype/design-decisions.md (2026-05-15 Workflow context menu)

  Bare thumbnail + caption. The thumbnail is the card. Right-clicking
  anywhere on the card opens a role-gated WorkflowContextMenu.
-->
<template>
  <div
    class="group flex flex-col gap-2 text-base-foreground select-none"
    @contextmenu.prevent.stop="onContextMenu"
  >
    <button
      type="button"
      class="flex cursor-pointer flex-col gap-2 text-left text-base-foreground"
      @click="onOpen"
    >
      <span
        class="relative block aspect-square w-full overflow-hidden rounded-md"
        :style="{ background: thumbnail }"
      >
        <span
          v-if="effectiveStorage"
          :title="
            t(
              effectiveStorage === 'local'
                ? 'prototype.workflowCard.storageLocal'
                : 'prototype.workflowCard.storageCloud'
            )
          "
          class="absolute top-2 right-2 grid size-6 place-items-center rounded-sm bg-black/40 backdrop-blur-sm"
        >
          <i
            :class="
              cn(
                'size-3.5 text-white',
                effectiveStorage === 'local'
                  ? 'icon-[lucide--hard-drive]'
                  : 'icon-[lucide--cloud]'
              )
            "
          />
        </span>
        <button
          v-if="compatBadge"
          type="button"
          :title="compatBadge.tooltip"
          :aria-label="compatBadge.tooltip"
          :class="
            cn(
              'absolute top-2 left-2 grid size-6 cursor-pointer appearance-none place-items-center rounded-sm border-0 backdrop-blur-sm',
              compatBadge.tone === 'danger'
                ? 'text-danger-foreground bg-black/60'
                : 'bg-warning-background text-button-surface-contrast'
            )
          "
          @click.stop="onBadgeClick"
        >
          <i :class="cn('size-3.5', compatBadge.icon)" />
        </button>
      </span>
      <span class="flex flex-col">
        <span class="truncate text-sm/tight">{{ workflow.name }}</span>
        <span class="text-xs text-muted-foreground">{{
          workflow.updatedAt
        }}</span>
      </span>
    </button>

    <WorkflowContextMenu
      ref="menuRef"
      :workflow="workflow"
      :viewer-role="viewerRole"
      :show-open-containing-project="showOpenContainingProject"
      @open="onOpen"
      @open-project="emit('open-project', $event)"
    />

    <InstallGateDialog
      v-if="isGateOpen && gateCompat"
      :workflow="workflow"
      :compat="gateCompat"
      @close="closeGate"
      @satisfy="onSatisfyGate"
      @save-to-my-workflows="onSaveToMyWorkflows"
    />

    <RuntimeRecommendationDialog
      v-if="isAdvisoryOpen && advisoryCompat"
      :workflow="workflow"
      :compat="advisoryCompat"
      @close="closeAdvisory"
    />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { computed, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

import InstallGateDialog from './InstallGateDialog.vue'
import RuntimeRecommendationDialog from './RuntimeRecommendationDialog.vue'
import WorkflowContextMenu from './WorkflowContextMenu.vue'
import type { WorkflowCompatResult } from '../composables/useWorkflowCompat'
import { useViewerWorkflowRole } from '../composables/useViewerWorkflowRole'
import { useWorkflowCompat } from '../composables/useWorkflowCompat'
import { usePrototypePersonaStore } from '../stores/personaStore'
import { thumbnailGradient } from '../utils/thumbnail'
import type { Workflow } from '../types'

const { workflow, showOpenContainingProject = true } = defineProps<{
  workflow: Workflow
  showOpenContainingProject?: boolean
}>()

const emit = defineEmits<{
  open: [workflowId: string]
  'open-project': [projectId: string]
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const thumbnail = computed(() => thumbnailGradient(workflow.id))
const effectiveStorage = computed(() =>
  personaStore.getEffectiveWorkflowStorage(workflow.id, workflow.storage)
)

const workflowRef = toRef(() => workflow)
const viewerRole = useViewerWorkflowRole(workflowRef)

const { resolve: resolveCompat } = useWorkflowCompat()
const compatResult = computed(() => resolveCompat(workflow))
const compatBadge = computed<{
  tone: 'danger' | 'warning'
  icon: string
  tooltip: string
} | null>(() => {
  const result = compatResult.value
  if (result.status === 'blocked') {
    return {
      tone: 'danger',
      icon: 'icon-[lucide--lock]',
      tooltip: t('prototype.workflowCard.compatBlocked', {
        required: result.requiredInstallName ?? '—',
        current: result.current?.displayName ?? '—'
      })
    }
  }
  if (result.status === 'recommended-mismatch') {
    return {
      tone: 'warning',
      icon: 'icon-[lucide--triangle-alert]',
      tooltip: t('prototype.workflowCard.compatRecommendedMismatch', {
        recommended: result.recommendedComfyUIVersion ?? '—',
        current: result.current?.comfyUIVersion ?? '—'
      })
    }
  }
  return null
})

type MenuHandle = { show: (event: MouseEvent) => void }
const menuRef = ref<MenuHandle | null>(null)

function onContextMenu(event: MouseEvent) {
  menuRef.value?.show(event)
}

// Gate Open when the workflow's compat is blocked. Same interception
// applies whether Open came from a card click or the context-menu Open
// action — both funnel through `onOpen`.
const isGateOpen = ref(false)
const gateCompat = ref<WorkflowCompatResult | null>(null)

function onOpen() {
  const result = resolveCompat(workflow)
  if (result.status === 'blocked') {
    gateCompat.value = result
    isGateOpen.value = true
    return
  }
  emit('open', workflow.id)
}

function closeGate() {
  isGateOpen.value = false
}

function onSatisfyGate(installId: string) {
  // Journey 6 step 5–6: install the team build if missing (additively;
  // user's personal install stays), then switch active install to it,
  // then re-open the workflow. The bundle metadata for the install
  // (canonical name + version) comes from the workspace install
  // registry — keeps gate dialog and workspace settings in sync per
  // ../IA_Plan/wiki/concepts/workspace-install-registry.md.
  const hasIt = personaStore.fixture.installs.some((i) => i.id === installId)
  if (!hasIt) {
    personaStore.installBlessedToLocal(installId)
  }
  personaStore.setActiveInstall(installId)
  isGateOpen.value = false
  emit('open', workflow.id)
}

function onSaveToMyWorkflows() {
  // Install lock gates publish, not use (design-decisions 2026-05-27).
  // Forking lands a private copy in the actor's My Workflows, which
  // carries no allowed-install set — so the fork opens on the current
  // install without re-tripping the gate. The user can work freely;
  // they just can't publish back to the team until on a blessed install.
  const forkId = personaStore.forkWorkflow(workflow.id)
  isGateOpen.value = false
  if (forkId) emit('open', forkId)
}

// Advisory dialog — opened by clicking the recommended-mismatch badge.
// Non-blocking; pure information. Click on the badge stops propagation
// so the workflow's regular Open action doesn't also fire.
const isAdvisoryOpen = ref(false)
const advisoryCompat = ref<WorkflowCompatResult | null>(null)

function onBadgeClick() {
  const result = compatResult.value
  if (result.status === 'blocked') {
    gateCompat.value = result
    isGateOpen.value = true
    return
  }
  if (result.status === 'recommended-mismatch') {
    advisoryCompat.value = result
    isAdvisoryOpen.value = true
  }
}

function closeAdvisory() {
  isAdvisoryOpen.value = false
}
</script>
