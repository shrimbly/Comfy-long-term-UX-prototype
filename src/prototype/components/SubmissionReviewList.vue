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

  The review surface — used by the project Review tab and the workspace
  review queue. Each row shows the submission (name, diff, note) and the
  Approve / Decline actions inline (reviewers only; others see a pending
  badge). `showProject` adds the project name per row (the workspace
  queue spans projects).
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
        </div>

        <WorkflowChangeSummary
          v-if="sub.semanticDiff"
          :diff="sub.semanticDiff"
        />
        <span v-else-if="sub.diff" class="font-mono text-xs">
          <span class="text-jade-400">+{{ sub.diff.added }}</span>
          <span class="text-danger-200"> −{{ sub.diff.removed }}</span>
        </span>

        <span v-if="sub.note" class="text-xs text-base-foreground italic">
          “{{ sub.note }}”
        </span>

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
          <div v-if="canReview(sub)" class="flex gap-2">
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
          <span
            v-else
            class="rounded-sm bg-base-background px-1.5 py-0.5 text-[10px] text-muted-foreground"
          >
            {{ t('prototype.submissionReview.pendingBadge') }}
          </span>
        </div>
      </li>
    </ul>
  </div>

  <DeclineSubmissionDialog
    v-if="decliningSubmission"
    :submitter-name="submitterName(decliningSubmission.submittedByUserId)"
    @close="decliningSubmission = null"
    @confirm="onDeclineConfirm"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue/usetoast'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import DeclineSubmissionDialog from './DeclineSubmissionDialog.vue'
import WorkflowChangeSummary from './WorkflowChangeSummary.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { WorkflowSubmission } from '../types'

const { projectId, showProject = false } = defineProps<{
  // Scope to one project (the project Review tab). Omit for the
  // workspace-wide queue.
  projectId?: string
  showProject?: boolean
}>()

const { t } = useI18n()
const toast = useToast()
const personaStore = usePrototypePersonaStore()
const { fixture, activeInstall, pendingWorkflowSubmissions } =
  storeToRefs(personaStore)

const submissions = computed<WorkflowSubmission[]>(() =>
  pendingWorkflowSubmissions.value.filter(
    (s) => !projectId || s.projectId === projectId
  )
)

const decliningSubmission = ref<WorkflowSubmission | null>(null)

function submitterName(id: string): string {
  return fixture.value.members.find((m) => m.id === id)?.name ?? id
}

function projectName(id: string): string {
  return fixture.value.projects.find((p) => p.id === id)?.name ?? id
}

// Who can act = who can overwrite the canonical: the project Owner, or a
// workspace Admin of the project's workspace. Other viewers see a pending
// badge.
function canReview(sub: WorkflowSubmission): boolean {
  const project = fixture.value.projects.find((p) => p.id === sub.projectId)
  if (!project || project.isDrafts) return false
  if (project.ownerUserId === fixture.value.currentUser.id) return true
  const workspace = fixture.value.workspaces.find(
    (w) => w.id === project.workspaceId
  )
  return workspace?.currentUserRole === 'admin'
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

// Open the submitted branch to inspect it. No editor in the prototype, so
// this confirms via toast.
function onOpen(sub: WorkflowSubmission) {
  const branch = fixture.value.workflows.find(
    (w) => w.id === sub.forkWorkflowId
  )
  toast.add({
    severity: 'info',
    summary: t('prototype.submissionReview.toast.openedSummary'),
    detail: t('prototype.submissionReview.toast.openedDetail', {
      workflow: branch?.name ?? sub.workflowName
    }),
    life: 2200
  })
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
  decliningSubmission.value = sub
}

function onDeclineConfirm(comment: string) {
  const sub = decliningSubmission.value
  if (!sub) return
  personaStore.rejectSubmission(sub.id, comment)
  decliningSubmission.value = null
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
