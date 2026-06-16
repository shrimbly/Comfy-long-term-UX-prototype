// Implements:
//   concept: ../IA_Plan/wiki/concepts/personas-and-flows.md
//
// Tiny Pinia store that drives the persona toggle. The current persona's
// fixture is the source of truth for everything the dashboard renders.

import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'

import { personas } from '../fixtures/personas'
import type {
  CreditLimitPeriod,
  DelegableCapability,
  PersonaDef,
  PersonaId,
  Project,
  ProjectRole,
  ProjectTier,
  WorkspaceRole
} from '../types'

export const usePrototypePersonaStore = defineStore('prototype-persona', () => {
  const currentPersonaId = ref<PersonaId>('workspace-admin')

  // Every published canonical (a non-copy workflow living in a shared,
  // non-Drafts project) reached the project via an initial Publish, so it
  // has at least V1 in its history. Backfill that baseline for fixtures
  // that didn't seed it explicitly, so a later publish bumps to V2.
  for (const persona of personas) {
    const { workflows, projects } = persona.fixture
    for (const wf of workflows) {
      if (wf.forkedFrom || wf.publishedVersions?.length) continue
      const project = projects.find((p) => p.id === wf.projectId)
      if (!project || project.isDrafts) continue
      wf.publishedVersions = [
        {
          byUserId: wf.ownerUserId ?? persona.fixture.currentUser.id,
          at: wf.updatedAt
        }
      ]
    }
  }

  // Reactive so in-place fixture mutations (publish, rename, …) trigger
  // re-renders even without a subsequent navigation.
  const reactivePersonas = reactive(personas)

  const currentPersona = computed<PersonaDef>(
    () =>
      reactivePersonas.find((p) => p.id === currentPersonaId.value) ??
      reactivePersonas[0]
  )

  const fixture = computed(() => currentPersona.value.fixture)

  const currentWorkspace = computed(() =>
    fixture.value.workspaces.find(
      (w) => w.id === fixture.value.currentWorkspaceId
    )
  )

  const draftsProject = computed<Project | undefined>(() =>
    fixture.value.projects.find(
      (p) => p.isDrafts && p.workspaceId === fixture.value.currentWorkspaceId
    )
  )

  // All non-Drafts projects in the current workspace that the user can
  // see. Restricted projects the user wasn't invited to are NOT included —
  // confidentiality contract per the prototype-log 2026-05-12 entry.
  const visibleProjects = computed(() =>
    fixture.value.projects.filter(
      (p) =>
        !p.isDrafts &&
        p.workspaceId === fixture.value.currentWorkspaceId &&
        (p.tier === 'workspace-wide' || p.currentUserHasAccess)
    )
  )

  const draftsWorkflowCount = computed(() => {
    const drafts = draftsProject.value
    if (!drafts) return 0
    return fixture.value.workflows.filter((w) => w.projectId === drafts.id)
      .length
  })

  const recentWorkflows = computed(() => {
    const accessibleProjectIds = new Set([
      ...visibleProjects.value.map((p) => p.id),
      ...(draftsProject.value ? [draftsProject.value.id] : [])
    ])
    return fixture.value.workflows
      .filter((w) => accessibleProjectIds.has(w.projectId))
      .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  })

  function setPersona(id: PersonaId) {
    currentPersonaId.value = id
  }

  function setCurrentWorkspace(id: string) {
    fixture.value.currentWorkspaceId = id
  }

  // --- Member management (workspace level) ----------------------------
  //
  // Local-only state changes. All mutations land in the current persona's
  // fixture. Persona switching shows a different workspace state — no
  // cross-persona sync, which matches the demo intent.

  function inviteMember(email: string, role: WorkspaceRole) {
    const id = `invite-${Date.now()}`
    fixture.value.pendingInvites = [
      ...fixture.value.pendingInvites,
      {
        id,
        email,
        role,
        invitedByUserId: fixture.value.currentUser.id,
        invitedAt: new Date().toISOString().slice(0, 10)
      }
    ]
  }

  function revokeInvite(inviteId: string) {
    fixture.value.pendingInvites = fixture.value.pendingInvites.filter(
      (i) => i.id !== inviteId
    )
  }

  function resendInvite(inviteId: string) {
    fixture.value.pendingInvites = fixture.value.pendingInvites.map((i) =>
      i.id === inviteId
        ? { ...i, invitedAt: new Date().toISOString().slice(0, 10) }
        : i
    )
  }

  function removeMember(memberId: string) {
    fixture.value.members = fixture.value.members.filter(
      (m) => m.id !== memberId
    )
    const ws = currentWorkspace.value
    if (ws) ws.memberCount = fixture.value.members.length
  }

  function changeMemberRole(memberId: string, role: WorkspaceRole) {
    fixture.value.members = fixture.value.members.map((m) =>
      m.id === memberId ? { ...m, role } : m
    )
  }

  function setRoleGrant(capability: DelegableCapability, value: boolean) {
    fixture.value.roleGrants = {
      ...fixture.value.roleGrants,
      [capability]: value
    }
  }

  // --- Workspace settings ----------------------------------------------

  function setWorkspaceName(name: string) {
    const ws = currentWorkspace.value
    if (!ws) return
    fixture.value.workspaces = fixture.value.workspaces.map((w) =>
      w.id === ws.id ? { ...w, name } : w
    )
  }

  function setWorkspaceDescription(description: string) {
    const ws = currentWorkspace.value
    if (!ws) return
    fixture.value.workspaces = fixture.value.workspaces.map((w) =>
      w.id === ws.id ? { ...w, description } : w
    )
  }

  // --- Member credit limits --------------------------------------------
  //
  // Per ../IA_Plan/wiki/open-questions.md#per-member-credit-limits —
  // mechanism is TBD; the UI surface is committed regardless.

  function setMemberCreditLimit(
    memberId: string,
    limit: number,
    period: CreditLimitPeriod
  ) {
    const existing = fixture.value.memberCreditLimits.find(
      (l) => l.memberId === memberId
    )
    const today = new Date().toISOString().slice(0, 10)
    if (existing) {
      fixture.value.memberCreditLimits = fixture.value.memberCreditLimits.map(
        (l) => (l.memberId === memberId ? { ...l, limit, period } : l)
      )
      return
    }
    fixture.value.memberCreditLimits = [
      ...fixture.value.memberCreditLimits,
      {
        memberId,
        limit,
        period,
        used: 0,
        resetsAt: today
      }
    ]
  }

  function removeMemberCreditLimit(memberId: string) {
    fixture.value.memberCreditLimits = fixture.value.memberCreditLimits.filter(
      (l) => l.memberId !== memberId
    )
  }

  // --- Data/training policy --------------------------------------------

  function setDataTrainingOptOut(value: boolean) {
    const ws = currentWorkspace.value
    if (!ws) return
    fixture.value.workspaces = fixture.value.workspaces.map((w) =>
      w.id === ws.id ? { ...w, dataTrainingOptOut: value } : w
    )
  }

  // --- Ownership + deletion (team workspaces only) ---------------------

  function transferOwnership(newOwnerUserId: string) {
    const ws = currentWorkspace.value
    if (!ws || ws.tier !== 'team') return
    fixture.value.workspaces = fixture.value.workspaces.map((w) =>
      w.id === ws.id ? { ...w, ownerUserId: newOwnerUserId } : w
    )
  }

  function deleteCurrentWorkspace() {
    const ws = currentWorkspace.value
    if (!ws || ws.tier !== 'team') return
    const remaining = fixture.value.workspaces.filter((w) => w.id !== ws.id)
    if (!remaining.length) return
    fixture.value.workspaces = remaining
    fixture.value.currentWorkspaceId = remaining[0].id
  }

  // --- Project sharing -------------------------------------------------

  function setProjectTier(projectId: string, tier: ProjectTier) {
    fixture.value.projects = fixture.value.projects.map((p) =>
      p.id === projectId ? { ...p, tier } : p
    )
  }

  function addProjectMember(
    projectId: string,
    userId: string,
    role: ProjectRole
  ) {
    fixture.value.projects = fixture.value.projects.map((p) => {
      if (p.id !== projectId) return p
      const next = (p.members ?? []).filter((m) => m.userId !== userId)
      next.push({ userId, role })
      return { ...p, members: next }
    })
  }

  function changeProjectMemberRole(
    projectId: string,
    userId: string,
    role: ProjectRole
  ) {
    fixture.value.projects = fixture.value.projects.map((p) => {
      if (p.id !== projectId) return p
      return {
        ...p,
        members: (p.members ?? []).map((m) =>
          m.userId === userId ? { ...m, role } : m
        )
      }
    })
  }

  function removeProjectMember(projectId: string, userId: string) {
    fixture.value.projects = fixture.value.projects.map((p) => {
      if (p.id !== projectId) return p
      return {
        ...p,
        members: (p.members ?? []).filter((m) => m.userId !== userId)
      }
    })
  }

  // --- Workflow operations --------------------------------------------
  //
  // Owner-only mutations (rename / delete / move) are not store-gated —
  // callers are expected to gate at the UI. Storage/destination toggle
  // is workflow-level per
  // ../IA_Plan/wiki/decisions/save-destination-workflow-level.md.

  function findHostMyWorkflows(workspaceId: string): string | undefined {
    return fixture.value.projects.find(
      (p) => p.workspaceId === workspaceId && p.isDrafts
    )?.id
  }

  function renameWorkflow(workflowId: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const today = new Date().toISOString().slice(0, 10)
    fixture.value.workflows = fixture.value.workflows.map((w) =>
      w.id === workflowId ? { ...w, name: trimmed, updatedAt: today } : w
    )
  }

  function deleteWorkflow(workflowId: string) {
    fixture.value.workflows = fixture.value.workflows.filter(
      (w) => w.id !== workflowId
    )
  }

  // Workflow-storage overrides live in a sibling ref because the
  // persona fixture isn't deeply reactive — mutating fixture.workflows
  // doesn't propagate through the WorkflowCard's `workflow` prop. This
  // mirrors fixtures/mediaAssets.ts's promotedToCloudIds pattern.
  const workflowStorageOverrides = ref<Record<string, 'local' | 'cloud'>>({})

  function setWorkflowStorage(workflowId: string, storage: 'local' | 'cloud') {
    workflowStorageOverrides.value = {
      ...workflowStorageOverrides.value,
      [workflowId]: storage
    }
    fixture.value.workflows = fixture.value.workflows.map((w) =>
      w.id === workflowId ? { ...w, storage } : w
    )
  }

  function getEffectiveWorkflowStorage(
    workflowId: string,
    fallback: 'local' | 'cloud' | undefined
  ): 'local' | 'cloud' | undefined {
    return workflowStorageOverrides.value[workflowId] ?? fallback
  }

  // Custom workflow thumbnails. The prototype has no real graph renders, so
  // "set thumbnail" cycles the placeholder gradient: the override bumps a
  // counter and the seed becomes `${id}#${n}`, yielding a different gradient.
  const workflowThumbnailOverrides = ref<Record<string, number>>({})

  function cycleWorkflowThumbnail(workflowId: string) {
    workflowThumbnailOverrides.value = {
      ...workflowThumbnailOverrides.value,
      [workflowId]: (workflowThumbnailOverrides.value[workflowId] ?? 0) + 1
    }
  }

  function workflowThumbnailSeed(workflowId: string): string {
    const n = workflowThumbnailOverrides.value[workflowId]
    return n ? `${workflowId}#${n}` : workflowId
  }

  // Move a workflow into another project — the single "move asset to
  // another project" verb. Per concepts/cross-cutting-flows.md the wiki
  // frames promotion as this same verb applied to a My Workflows → shared
  // move, so the destination decides behaviour: moving into a SHARED
  // (non-Drafts, non-private) project publishes it as that project's
  // canonical (lineage cleared, V1 seeded if it had no history); moving
  // into My Workflows / a private project is a plain relocation. Returns
  // success.
  function moveWorkflowToProject(
    workflowId: string,
    targetProjectId: string,
    newName?: string
  ): boolean {
    const source = fixture.value.workflows.find((w) => w.id === workflowId)
    const target = fixture.value.projects.find((p) => p.id === targetProjectId)
    if (!source || !target) return false
    const today = new Date().toISOString().slice(0, 10)
    const publishing = !target.isDrafts && target.tier !== 'private'
    const trimmedName = newName?.trim()
    fixture.value.workflows = fixture.value.workflows.map((w) =>
      w.id === workflowId
        ? {
            ...w,
            projectId: targetProjectId,
            updatedAt: today,
            ...(trimmedName ? { name: trimmedName } : {}),
            ...(publishing
              ? {
                  forkedFrom: undefined,
                  publishedVersions: w.publishedVersions?.length
                    ? w.publishedVersions
                    : [{ byUserId: fixture.value.currentUser.id, at: today }]
                }
              : {})
          }
        : w
    )
    return true
  }

  // Create a new shared project in the current workspace, owned by the
  // current user. Defaults to the restricted (scoped) tier — a fresh
  // project starts private to its creator + invitees, not workspace-wide.
  // Returns the new id.
  function createProject(name: string): string {
    const id = `proj-${Date.now()}`
    fixture.value.projects = [
      ...fixture.value.projects,
      {
        id,
        workspaceId: fixture.value.currentWorkspaceId,
        name: name.trim(),
        tier: 'restricted',
        ownerUserId: fixture.value.currentUser.id,
        isDrafts: false,
        currentUserHasAccess: true,
        members: [{ userId: fixture.value.currentUser.id, role: 'owner' }]
      }
    ]
    return id
  }

  // Generate a non-colliding copy name within a project. Keep-every-copy
  // (design-decisions.md 2026-06-16) means re-copying never overwrites, so
  // names disambiguate: "X (copy)", "X (copy 2)", …
  function uniqueCopyName(baseName: string, projectId: string): string {
    const existing = new Set(
      fixture.value.workflows
        .filter((w) => w.projectId === projectId)
        .map((w) => w.name)
    )
    const first = `${baseName} (copy)`
    if (!existing.has(first)) return first
    let n = 2
    while (existing.has(`${baseName} (copy ${n})`)) n++
    return `${baseName} (copy ${n})`
  }

  // Copy-on-access (design-decisions.md 2026-06-16). Taking a working copy
  // of a workflow lands a fresh copy in the actor's My Workflows in the host
  // workspace (the workspace containing the source's project). Every call
  // yields a NEW copy — keep-every-copy: no reuse, no dedup, names
  // disambiguate. The copy carries `forkedFrom` lineage so it can be
  // published back over the canonical (Publish to workspace) or published
  // as a new workflow into a project. Returns the new copy's id.
  function copyToMyWorkflows(workflowId: string): string | undefined {
    const source = fixture.value.workflows.find((w) => w.id === workflowId)
    if (!source) return
    const canonicalId = source.forkedFrom?.workflowId ?? source.id
    const canonical =
      fixture.value.workflows.find((w) => w.id === canonicalId) ?? source
    const sourceProject = fixture.value.projects.find(
      (p) => p.id === canonical.projectId
    )
    const myWorkflowsId = sourceProject
      ? findHostMyWorkflows(sourceProject.workspaceId)
      : undefined
    const targetProjectId = myWorkflowsId ?? canonical.projectId
    const newId = `wf-copy-${Date.now()}`
    const today = new Date().toISOString().slice(0, 10)
    const atVersion = canonical.publishedVersions?.at(-1)?.at
    fixture.value.workflows = [
      ...fixture.value.workflows,
      {
        ...source,
        id: newId,
        projectId: targetProjectId,
        name: uniqueCopyName(canonical.name, targetProjectId),
        ownerUserId: fixture.value.currentUser.id,
        updatedAt: today,
        forkedFrom: { workflowId: canonicalId, atVersion },
        access: []
      }
    ]
    return newId
  }

  // Publish a workflow's contents OVER an existing canonical workflow,
  // in place (stable id). The publish flow lets the user pick which
  // existing workflow to overwrite (commonly the source canonical, but any
  // workflow in the target project is selectable) — see
  // PromoteToProjectDialog. Per the MVP model (design-decisions.md
  // 2026-06-16): any member can overwrite; the latest publish is the
  // canonical content, and a version-history entry is appended (the
  // recoverability safety net). Returns true if a workflow was overwritten.
  function publishOverWorkflow(
    sourceId: string,
    targetWorkflowId: string
  ): boolean {
    const source = fixture.value.workflows.find((w) => w.id === sourceId)
    if (!source) return false
    const today = new Date().toISOString().slice(0, 10)
    let overwritten = false
    fixture.value.workflows = fixture.value.workflows.map((w) => {
      if (w.id !== targetWorkflowId) return w
      overwritten = true
      // Overwrite the target's content with the source's. The target's
      // name + identity + project membership are preserved; the source's
      // working state (thumbnail here as a stand-in for graph contents)
      // and a fresh updatedAt land on it, plus a new entry on the
      // published-version history timeline.
      return {
        ...w,
        updatedAt: today,
        thumbnailUrl: source.thumbnailUrl ?? w.thumbnailUrl,
        publishedVersions: [
          ...(w.publishedVersions ?? []),
          { byUserId: fixture.value.currentUser.id, at: today }
        ]
      }
    })
    return overwritten
  }

  return {
    currentPersonaId,
    currentPersona,
    fixture,
    currentWorkspace,
    draftsProject,
    draftsWorkflowCount,
    visibleProjects,
    recentWorkflows,
    personas,
    setPersona,
    setCurrentWorkspace,
    inviteMember,
    revokeInvite,
    resendInvite,
    removeMember,
    changeMemberRole,
    setRoleGrant,
    setWorkspaceName,
    setWorkspaceDescription,
    setMemberCreditLimit,
    removeMemberCreditLimit,
    setDataTrainingOptOut,
    transferOwnership,
    deleteCurrentWorkspace,
    setProjectTier,
    addProjectMember,
    changeProjectMemberRole,
    removeProjectMember,
    renameWorkflow,
    deleteWorkflow,
    setWorkflowStorage,
    getEffectiveWorkflowStorage,
    cycleWorkflowThumbnail,
    workflowThumbnailSeed,
    moveWorkflowToProject,
    createProject,
    copyToMyWorkflows,
    publishOverWorkflow
  }
})
