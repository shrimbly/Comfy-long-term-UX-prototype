import type { DraftMeta, Project, Workflow } from '../types'

// Provenance for a workflow that is connected to a project — i.e. carries a
// `provenanceProjectId`. A copy tracks its source canonical; a created-in-
// project draft tracks itself. A copy whose source canonical no longer
// resolves is `source-removed`. Returns undefined for unconnected personal
// workflows (no badge).
export function deriveDraftMeta(
  workflow: Workflow,
  allWorkflows: Workflow[],
  projects: Project[]
): DraftMeta | undefined {
  const provenanceProjectId = workflow.provenanceProjectId
  if (!provenanceProjectId) return undefined
  const projectName =
    projects.find((p) => p.id === provenanceProjectId)?.name ?? ''
  if (!workflow.forkedFrom) {
    return { state: 'linked', projectName, workflowName: workflow.name }
  }
  const source = allWorkflows.find(
    (w) => w.id === workflow.forkedFrom!.workflowId
  )
  if (!source) {
    return { state: 'source-removed', projectName, workflowName: '' }
  }
  return { state: 'linked', projectName, workflowName: source.name }
}
