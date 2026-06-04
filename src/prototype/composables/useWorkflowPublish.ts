// Implements:
//   decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
//             — Publish to workspace overwrites the canonical in place;
//               overwrite requires Project Owner / workspace Admin.
//   decision: ../IA_Plan/wiki/decisions/team-locked-install.md
//             — publish additionally requires a blessed active install
//               (install identity in the project's allowed-install set),
//               for every actor including Owners/Admins.
//   log:      ../prototype/design-decisions.md 2026-05-27
//
// Resolves whether the current viewer can Publish a fork to workspace,
// and — when blocked — *all* the reasons (permission and/or install),
// since the two gates are independent and we surface both.

import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'

import { usePrototypePersonaStore } from '../stores/personaStore'
import type { Workflow } from '../types'

export type PublishBlockedReason = 'permission' | 'install'

export interface WorkflowPublishState {
  // True when this workflow is a fork whose source resolves to a
  // canonical workflow living in a shared (non-Drafts) project — i.e.
  // there is something to Publish to workspace.
  isPublishable: boolean
  targetWorkflowName?: string
  targetProjectName?: string
  // All failing gates. Empty iff canPublish is true.
  blockedReasons: PublishBlockedReason[]
  canPublish: boolean
  // For the install-blocked case: the workspace-canonical name of the
  // install the target project requires, and the viewer's current one.
  requiredInstallName?: string
  currentInstallName?: string
  // For the permission-blocked case: the canonical's project owner, for
  // the "ask an owner to publish" copy.
  targetOwnerName?: string
}

export function useWorkflowPublish(
  workflow: Ref<Workflow | undefined> | ComputedRef<Workflow | undefined>
): ComputedRef<WorkflowPublishState> {
  const personaStore = usePrototypePersonaStore()
  const { fixture, activeInstall } = storeToRefs(personaStore)

  return computed<WorkflowPublishState>(() => {
    const fork = workflow.value
    const notPublishable: WorkflowPublishState = {
      isPublishable: false,
      blockedReasons: [],
      canPublish: false
    }
    if (!fork?.forkedFrom) return notPublishable

    const canonical = fixture.value.workflows.find(
      (w) => w.id === fork.forkedFrom?.workflowId
    )
    if (!canonical) return notPublishable

    const targetProject = fixture.value.projects.find(
      (p) => p.id === canonical.projectId
    )
    // Publish to workspace only targets a canonical in a shared project.
    // Forks of forks (source still in My Workflows / Drafts) aren't
    // publish-to-workspace candidates.
    if (!targetProject || targetProject.isDrafts) return notPublishable

    const viewerId = fixture.value.currentUser.id
    const targetWorkspace = fixture.value.workspaces.find(
      (w) => w.id === targetProject.workspaceId
    )

    // Overwrite permission: Project Owner, or workspace Admin of the
    // target project's workspace (auto-elevated per published-workflow-
    // model). Mirrors the wiki's overwrite-permission row.
    const isProjectOwner = targetProject.ownerUserId === viewerId
    const isWorkspaceAdmin = targetWorkspace?.currentUserRole === 'admin'
    const hasOverwriteRight = isProjectOwner || isWorkspaceAdmin

    // Install gate: only applies if the target project carries an
    // allowed-install set. Passes iff the active install's identity is in
    // it. A viewer with no active install (cloud-only) never passes.
    const allowed = targetProject.allowedInstallIds
    const installGated = !!allowed && allowed.length > 0
    const installOk =
      !installGated ||
      (!!activeInstall.value && allowed.includes(activeInstall.value.id))

    const blockedReasons: PublishBlockedReason[] = []
    if (!hasOverwriteRight) blockedReasons.push('permission')
    if (!installOk) blockedReasons.push('install')

    const requiredInstallName = installGated
      ? (targetProject.installLockDisplayName ??
        targetWorkspace?.blessedInstalls?.find(
          (b) => b.installId === allowed?.[0]
        )?.canonicalDisplayName ??
        allowed?.[0])
      : undefined

    const ownerMember = fixture.value.members.find(
      (m) => m.id === targetProject.ownerUserId
    )

    return {
      isPublishable: true,
      targetWorkflowName: canonical.name,
      targetProjectName: targetProject.name,
      blockedReasons,
      canPublish: blockedReasons.length === 0,
      requiredInstallName,
      currentInstallName: activeInstall.value?.displayName,
      targetOwnerName: ownerMember?.name
    }
  })
}
