// Implements:
//   concept: ../IA_Plan/wiki/concepts/three-level-permissions.md §"Asset level"
//   concept: ../IA_Plan/wiki/concepts/three-level-permissions.md §"Project level"
//   decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
//
// Resolves the current viewer's effective role on a single workflow.
// Combines two facts: workflow.ownerUserId (asset-level Owner) and
// workflow.access[] (explicit per-user grants). Falls back to the
// project tier: Workspace Admins act as Owner on workspace-wide
// projects; workspace Members in any workspace-wide project are at
// least Runner.

import { computed } from 'vue'
import type { ComputedRef } from 'vue'

import type { Workflow } from '../types'
import { usePrototypePersonaStore } from '../stores/personaStore'

export type ViewerWorkflowRole = 'owner' | 'runner' | 'app-runner' | 'none'

export function useViewerWorkflowRole(
  workflow: ComputedRef<Workflow | undefined>
): ComputedRef<ViewerWorkflowRole> {
  const personaStore = usePrototypePersonaStore()

  return computed(() => {
    const wf = workflow.value
    if (!wf) return 'none'
    const viewerId = personaStore.fixture.currentUser.id
    if (wf.ownerUserId && wf.ownerUserId === viewerId) return 'owner'

    const direct = wf.access?.find((a) => a.userId === viewerId)
    if (direct) return direct.role

    const project = personaStore.fixture.projects.find(
      (p) => p.id === wf.projectId
    )
    if (!project) return 'none'

    // Owner of My Workflows / a project the viewer owns.
    if (project.ownerUserId === viewerId) return 'owner'

    // Workspace Admin auto-acts as Owner on workspace-wide projects.
    const workspaceRole = personaStore.currentWorkspace?.currentUserRole
    if (project.tier === 'workspace-wide' && workspaceRole === 'admin') {
      return 'owner'
    }

    // Member with access to a workspace-wide project — Runner by
    // default (can run + fork; cannot rename/delete the canonical).
    if (project.tier === 'workspace-wide' && workspaceRole === 'member') {
      return 'runner'
    }

    // Scoped project: explicit member entry is required. Mirror their
    // role at project-level into the asset-level vocabulary.
    const projectMember = project.members?.find((m) => m.userId === viewerId)
    if (projectMember) {
      return projectMember.role === 'project-guest' ? 'app-runner' : 'runner'
    }

    return 'none'
  })
}
