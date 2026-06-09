<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
              §"member-overwrite-request-flow" — owner/admin reviews a
              collaborator's submitted working copy and publishes (approve)
              or declines (reject).
    decision: ../IA_Plan/wiki/decisions/team-locked-install.md
              — approving = publishing, so it is install-gated for the
                reviewer too: a locked project's submission can only be
                approved from a blessed active install.
    log:      ../prototype/design-decisions.md 2026-05-27

  Shared list of pending submissions with Approve / Reject. Used by both
  the project-level Review tab and the workspace-level review queue.
  `showProject` adds the project name per row (workspace queue spans
  projects; the project tab doesn't need it).
-->
<template>
  <div class="flex flex-col gap-3">
    <p v-if="!submissions.length" class="m-0 text-sm text-text-secondary">
      {{ t('prototype.submissionReview.empty') }}
    </p>

    <ul v-else class="m-0 flex list-none flex-col gap-2 p-0">
      <li
        v-for="sub in submissions"
        :key="sub.id"
        class="flex max-w-2xl flex-col gap-3 rounded-lg border border-border-subtle bg-secondary-background p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 flex-col gap-0.5">
            <span class="truncate text-sm font-medium text-base-foreground">
              {{ sub.workflowName }}
            </span>
            <span class="text-xs text-muted-foreground">
              {{
                t('prototype.submissionReview.meta', {
                  user: submitterName(sub.submittedByUserId),
                  date: sub.submittedAt
                })
              }}<template v-if="showProject">
                · {{ projectName(sub.projectId) }}</template
              >
            </span>
            <span v-if="sub.diff" class="pt-1 font-mono text-xs">
              <span class="text-jade-400">+{{ sub.diff.added }}</span>
              <span class="text-danger-200"> −{{ sub.diff.removed }}</span>
            </span>
            <span
              v-if="sub.note"
              class="pt-1 text-xs text-base-foreground italic"
            >
              “{{ sub.note }}”
            </span>
          </div>
        </div>

        <div
          v-if="lockedReason(sub)"
          class="flex items-center gap-2 rounded-md bg-warning-background/30 px-3 py-1.5 text-xs text-base-foreground"
        >
          <i class="icon-[lucide--triangle-alert] size-3.5 shrink-0" />
          {{ lockedReason(sub) }}
        </div>

        <div class="flex items-center justify-between gap-2">
          <Button variant="textonly" size="md" @click="onOpen(sub)">
            <i
              class="icon-[lucide--square-arrow-out-up-right]"
              aria-hidden="true"
            />
            {{ t('prototype.submissionReview.open') }}
          </Button>
          <div class="flex gap-2">
            <Button variant="secondary" size="md" @click="onReject(sub)">
              {{ t('prototype.submissionReview.reject') }}
            </Button>
            <Button
              variant="primary"
              size="md"
              :disabled="!!lockedReason(sub)"
              @click="onApprove(sub)"
            >
              <i class="icon-[lucide--check]" aria-hidden="true" />
              {{ t('prototype.submissionReview.approve') }}
            </Button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue/usetoast'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import type { WorkflowSubmission } from '../types'

const { projectId, showProject = false } = defineProps<{
  // When set, scope to one project (the project Review tab). Omit for the
  // workspace-wide queue.
  projectId?: string
  showProject?: boolean
}>()

const { t } = useI18n()
const toast = useToast()
const personaStore = usePrototypePersonaStore()
const uiStore = usePrototypeUiStore()
const { fixture, activeInstall, pendingWorkflowSubmissions } =
  storeToRefs(personaStore)

const submissions = computed<WorkflowSubmission[]>(() =>
  pendingWorkflowSubmissions.value.filter(
    (s) => !projectId || s.projectId === projectId
  )
)

function submitterName(id: string): string {
  return fixture.value.members.find((m) => m.id === id)?.name ?? id
}

function projectName(id: string): string {
  return fixture.value.projects.find((p) => p.id === id)?.name ?? id
}

// Approving publishes the canonical, so the install gate applies to the
// reviewer too. If the submission's project is install-locked and the
// reviewer's active install isn't in the set, approve is disabled with
// the reason shown.
function lockedReason(sub: WorkflowSubmission): string | null {
  const project = fixture.value.projects.find((p) => p.id === sub.projectId)
  const allowed = project?.allowedInstallIds
  if (!allowed || allowed.length === 0) return null
  if (activeInstall.value && allowed.includes(activeInstall.value.id)) {
    return null
  }
  return t('prototype.submissionReview.lockedToApprove', {
    required:
      project?.installLockDisplayName ??
      t('prototype.submissionReview.teamInstall')
  })
}

// Open the workflow for review. No editor in the prototype — this lands
// on the canonical's detail page, where the submitted branch shows under
// "Other branches" alongside the full published-version history.
function onOpen(sub: WorkflowSubmission) {
  uiStore.go({ kind: 'workflow', workflowId: sub.canonicalWorkflowId })
}

function onApprove(sub: WorkflowSubmission) {
  personaStore.approveSubmission(sub.id)
  toast.add({
    severity: 'success',
    summary: t('prototype.submissionReview.toast.approvedSummary'),
    detail: t('prototype.submissionReview.toast.approvedDetail', {
      workflow: sub.workflowName,
      user: submitterName(sub.submittedByUserId)
    }),
    life: 2800
  })
}

function onReject(sub: WorkflowSubmission) {
  personaStore.rejectSubmission(sub.id)
  toast.add({
    severity: 'info',
    summary: t('prototype.submissionReview.toast.rejectedSummary'),
    detail: t('prototype.submissionReview.toast.rejectedDetail', {
      workflow: sub.workflowName,
      user: submitterName(sub.submittedByUserId)
    }),
    life: 2800
  })
}
</script>
