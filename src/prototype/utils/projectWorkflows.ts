// Implements:
//   entity:   ../IA_Plan/wiki/entities/project.md §"Project surface (MVP)"
//             — a project's published workflows and your drafts for it
//   decision: ../IA_Plan/wiki/decisions/my-workflows-as-default-save-area.md
//   decision: ../IA_Plan/wiki/decisions/project-switcher-in-tab-bar.md
//             — the project is "the parent of all"
//
// What each project holds, as the editor's Workflows panel lists it.

import type { Project, Workflow } from '../types'

export type WorkflowSectionKind = 'workflows' | 'templates'

export interface WorkflowSection {
  kind: WorkflowSectionKind
  workflows: Workflow[]
}

export interface ProjectWorkflows {
  project: Project
  sections: WorkflowSection[]
}

const newestFirst = (a: Workflow, b: Workflow) =>
  b.updatedAt.localeCompare(a.updatedAt)

// A team project holds your drafts for it, which live in My Workflows, and
// its published workflows (its templates). My Workflows holds its own
// workflows: the ones no other project in `projects` claims as a draft.
export function workflowsOfProject(
  project: Project,
  projects: Project[],
  workflows: Workflow[]
): ProjectWorkflows {
  const myWorkflowsId = projects.find((p) => p.isDrafts)?.id
  if (project.isDrafts) {
    const teamProjectIds = new Set(
      projects.filter((p) => !p.isDrafts).map((p) => p.id)
    )
    const own = workflows.filter(
      (w) =>
        w.projectId === project.id &&
        !teamProjectIds.has(w.provenanceProjectId ?? '')
    )
    return {
      project,
      sections: [{ kind: 'workflows', workflows: own.sort(newestFirst) }]
    }
  }
  const drafts = workflows.filter(
    (w) => w.projectId === myWorkflowsId && w.provenanceProjectId === project.id
  )
  const templates = workflows.filter(
    (w) => w.projectId === project.id && !w.forkedFrom
  )
  return {
    project,
    sections: [
      { kind: 'workflows', workflows: drafts.sort(newestFirst) },
      { kind: 'templates', workflows: templates.sort(newestFirst) }
    ]
  }
}

// Sections keep only the workflows whose name contains `query`, ignoring
// case; an empty query keeps everything.
export function matchingWorkflows(
  group: ProjectWorkflows,
  query: string
): ProjectWorkflows {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return group
  return {
    ...group,
    sections: group.sections.map((section) => ({
      ...section,
      workflows: section.workflows.filter((w) =>
        w.name.toLocaleLowerCase().includes(needle)
      )
    }))
  }
}

export const workflowCount = (group: ProjectWorkflows) =>
  group.sections.reduce((sum, section) => sum + section.workflows.length, 0)
