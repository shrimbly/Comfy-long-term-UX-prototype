// Implements:
//   decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
//   log:      ../prototype/design-decisions.md 2026-06-16 (MVP scope)
//
// Resolves whether the current viewer can Publish a copy to workspace.
// Per the MVP model, overwrite is ungated — any workspace member can
// publish over a canonical; published-version history is the safety net.
// So the only question is whether there is a shared-project canonical to
// overwrite (i.e. this workflow is a copy of one).

import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'

import { usePrototypePersonaStore } from '../stores/personaStore'
import type { Workflow } from '../types'

export interface WorkflowPublishState {
  // True when this workflow is a copy whose source resolves to a canonical
  // workflow living in a shared (non-Drafts) project — i.e. there is
  // something to Publish to workspace.
  isPublishable: boolean
  targetWorkflowName?: string
  targetProjectName?: string
  canPublish: boolean
}

export function useWorkflowPublish(
  workflow: Ref<Workflow | undefined> | ComputedRef<Workflow | undefined>
): ComputedRef<WorkflowPublishState> {
  const personaStore = usePrototypePersonaStore()
  const { fixture } = storeToRefs(personaStore)

  return computed<WorkflowPublishState>(() => {
    const fork = workflow.value
    const notPublishable: WorkflowPublishState = {
      isPublishable: false,
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
    // Copies of copies (source still in My Workflows / Drafts) aren't
    // publish-to-workspace candidates.
    if (!targetProject || targetProject.isDrafts) return notPublishable

    return {
      isPublishable: true,
      targetWorkflowName: canonical.name,
      targetProjectName: targetProject.name,
      canPublish: true
    }
  })
}
