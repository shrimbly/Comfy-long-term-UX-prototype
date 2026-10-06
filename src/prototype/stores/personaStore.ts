// Implements:
//   concept: ../IA_Plan/wiki/concepts/personas-and-flows.md
//
// Tiny Pinia store that drives the persona toggle. The current persona's
// fixture is the source of truth for everything the dashboard renders.

import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'

import { personas } from '../fixtures/personas'
import { workflowThumbnail } from '../utils/thumbnail'
import type {
  CreditLimitPeriod,
  DelegableCapability,
  PersonaDef,
  PersonaId,
  Project,
  ProjectRole,
  ProjectTier,
  Workflow,
  WorkspaceRole
} from '../types'

export const usePrototypePersonaStore = defineStore('prototype-persona', () => {
  const currentPersonaId = ref<PersonaId>('workspace-admin')

  // Every published canonical (a non-copy workflow living in a shared,
  // non-Drafts project) reached the project via an initial Publish, so it
  // has at least V1 in its history. Backfill that baseline for fixtures
  // that didn't seed it explicitly, so a later publish bumps to V2.
  for (const persona of personas) {
    persona.fixture.folders ??= []
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

  function renameProject(projectId: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    fixture.value.projects = fixture.value.projects.map((p) =>
      p.id === projectId ? { ...p, name: trimmed } : p
    )
  }

  // Delete a project and its canonical workflows. Drafts in My Workflows that
  // were copied from those canonicals survive (they live in the Drafts
  // project) and surface as "source removed" via their now-dangling
  // forkedFrom lineage.
  function deleteProject(projectId: string) {
    fixture.value.projects = fixture.value.projects.filter(
      (p) => p.id !== projectId
    )
    fixture.value.workflows = fixture.value.workflows.filter(
      (w) => w.projectId !== projectId
    )
  }

  // The current user leaves a project: drop their membership and access so the
  // project falls out of the visible list. Only meaningful for restricted /
  // private projects — workspace-wide access is implicit via the workspace.
  function leaveProject(projectId: string) {
    const userId = fixture.value.currentUser.id
    fixture.value.projects = fixture.value.projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            currentUserHasAccess: false,
            members: (p.members ?? []).filter((m) => m.userId !== userId)
          }
        : p
    )
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

  // Walk copy lineage (forkedFrom) to the resolvable root canonical, so a copy
  // or draft shows the same thumbnail as the published workflow it descends
  // from. Stops at the workflow itself if its source no longer resolves.
  function thumbnailLineageRoot(workflow: Workflow): Workflow {
    let current = workflow
    const seen = new Set<string>([current.id])
    while (current.forkedFrom?.workflowId) {
      const parent = fixture.value.workflows.find(
        (w) => w.id === current.forkedFrom!.workflowId
      )
      if (!parent || seen.has(parent.id)) break
      seen.add(parent.id)
      current = parent
    }
    return current
  }

  // Resolve a workflow's thumbnail background. Copies/drafts mirror their
  // lineage root, so a copy always shares the image of the workflow it was
  // copied from; the override counter keys off that root so cycling the source
  // updates its copies too.
  function resolveWorkflowThumbnail(workflow: Workflow): string {
    const source = thumbnailLineageRoot(workflow)
    const n = workflowThumbnailOverrides.value[source.id]
    return workflowThumbnail(source, n ? `${source.id}#${n}` : source.id)
  }

  // Publish a draft as a NEW canonical in the target project. Mints a fresh v1
  // canonical from the draft's content and KEEPS the draft in My Workflows,
  // re-pointing its lineage at the new canonical — so the draft stays in that
  // project's "My drafts" and now shows the v1 tag (mirror of publishing OVER
  // an existing canonical, which also leaves the draft in place). Returns the
  // new canonical's id, or undefined if the draft / project can't resolve.
  function publishAsNewWorkflow(
    draftId: string,
    targetProjectId: string,
    newName?: string,
    comment?: string
  ): string | undefined {
    const draft = fixture.value.workflows.find((w) => w.id === draftId)
    const target = fixture.value.projects.find((p) => p.id === targetProjectId)
    if (!draft || !target) return
    const today = new Date().toISOString().slice(0, 10)
    const canonicalId = `wf-pub-${Date.now()}`
    const canonicalName = newName?.trim() || draft.name
    fixture.value.workflows = [
      ...fixture.value.workflows.map((w) =>
        w.id === draftId
          ? {
              ...w,
              updatedAt: today,
              provenanceProjectId: targetProjectId,
              forkedFrom: { workflowId: canonicalId, atVersion: today }
            }
          : w
      ),
      {
        id: canonicalId,
        projectId: targetProjectId,
        name: canonicalName,
        description: draft.description,
        thumbnailUrl: draft.thumbnailUrl,
        kind: draft.kind ?? 'workflow',
        ownerUserId: fixture.value.currentUser.id,
        updatedAt: today,
        publishedVersions: [
          {
            byUserId: fixture.value.currentUser.id,
            at: today,
            ...(comment?.trim() ? { comment: comment.trim() } : {})
          }
        ]
      }
    ]
    return canonicalId
  }

  // Create a new shared project in the current workspace, owned by the
  // current user. `tier` defaults to restricted (the bare PromoteToProject
  // caller); the New-project dialog passes the user's chosen tier and, when
  // restricted, the collaborators to seed. The Custom Comfy Cloud build flow
  // passes the new project's deployment + colour. Returns the new id.
  function createProject(
    name: string,
    tier: ProjectTier = 'restricted',
    collaboratorIds: string[] = [],
    runsOn: Pick<Project, 'deploymentId' | 'color'> = {}
  ): string {
    const id = `proj-${Date.now()}`
    const ownerId = fixture.value.currentUser.id
    fixture.value.projects = [
      ...fixture.value.projects,
      {
        id,
        workspaceId: fixture.value.currentWorkspaceId,
        name: name.trim(),
        tier,
        ownerUserId: ownerId,
        isDrafts: false,
        currentUserHasAccess: true,
        members: [
          { userId: ownerId, role: 'owner' },
          ...collaboratorIds
            .filter((uid) => uid !== ownerId)
            .map((uid) => ({ userId: uid, role: 'collaborator' as const }))
        ],
        ...runsOn
      }
    ]
    return id
  }

  // Create a fresh workflow in the viewer's My Workflows that is a draft *for*
  // the given project (provenanceProjectId), surfacing in that project's "My
  // drafts" section without living in the shared project itself — per
  // ../IA_Plan/wiki/entities/project.md §"Project surface (MVP)". Returns the
  // new id, or undefined if the project / host drafts can't resolve.
  function createDraftInProject(projectId: string): string | undefined {
    const project = fixture.value.projects.find((p) => p.id === projectId)
    if (!project) return
    const draftsId = findHostMyWorkflows(project.workspaceId)
    if (!draftsId) return
    const id = `wf-draft-${Date.now()}`
    const today = new Date().toISOString().slice(0, 10)
    fixture.value.workflows = [
      ...fixture.value.workflows,
      {
        id,
        projectId: draftsId,
        name: 'Untitled workflow',
        kind: 'workflow',
        ownerUserId: fixture.value.currentUser.id,
        updatedAt: today,
        provenanceProjectId: projectId,
        storage: 'cloud'
      }
    ]
    return id
  }

  // Copy-on-access (design-decisions.md 2026-06-16). Taking a working copy
  // of a workflow lands a fresh copy in the actor's My Workflows in the host
  // workspace (the workspace containing the source's project). Every call
  // yields a NEW copy — keep-every-copy: no reuse, no dedup. The copy keeps
  // the original name (its provenance link, not a "(copy)" suffix, marks it).
  // It carries `forkedFrom` lineage so it can be published back over the
  // canonical (Publish to workspace) or published as a new workflow into a
  // project. Returns the new copy's id.
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
    // Check out from the effective current version — the pinned "stable"
    // version if the admin set one, else the latest publish.
    const liveVersions = (canonical.publishedVersions ?? []).filter(
      (v) => !v.deleted
    )
    const atVersion = (
      liveVersions.find((v) => v.pinned) ?? liveVersions.at(-1)
    )?.at
    // Stamp the copy with the project it came from so it surfaces in that
    // project's "My drafts". A copy of a personal (drafts-project) workflow
    // keeps whatever provenance the source already carried, if any.
    const fromPublishedCanonical = !!sourceProject && !sourceProject.isDrafts
    const provenanceProjectId = fromPublishedCanonical
      ? canonical.projectId
      : source.provenanceProjectId
    // The copy keeps the canonical's name — the version it was taken from is
    // shown as a badge (derived from `forkedFrom.atVersion`), never baked into
    // the editable name string.
    fixture.value.workflows = [
      ...fixture.value.workflows,
      {
        ...source,
        id: newId,
        projectId: targetProjectId,
        name: canonical.name,
        ownerUserId: fixture.value.currentUser.id,
        updatedAt: today,
        forkedFrom: { workflowId: canonicalId, atVersion },
        provenanceProjectId,
        // A working copy is not itself published — it carries no published
        // history of its own (the canonical's history isn't inherited).
        publishedVersions: undefined,
        // A fresh copy lands as the user's local working file (prototype: a
        // copy always reads as local, so the card shows the local storage icon).
        storage: 'local',
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
    targetWorkflowId: string,
    comment?: string
  ): boolean {
    const source = fixture.value.workflows.find((w) => w.id === sourceId)
    const target = fixture.value.workflows.find(
      (w) => w.id === targetWorkflowId
    )
    if (!source || !target) return false
    const today = new Date().toISOString().slice(0, 10)
    fixture.value.workflows = fixture.value.workflows.map((w) => {
      if (w.id === targetWorkflowId) {
        // Overwrite the target's content with the source's. The target's
        // name + identity + project membership are preserved; the source's
        // working state (thumbnail here as a stand-in for graph contents)
        // and a fresh updatedAt land on it, plus a new entry on the
        // published-version history timeline. Published canonicals always
        // carry a baseline V1 (seeded at store init), so appending lands the
        // publish at the displayed version + 1.
        return {
          ...w,
          updatedAt: today,
          thumbnailUrl: source.thumbnailUrl ?? w.thumbnailUrl,
          publishedVersions: [
            ...(w.publishedVersions ?? []),
            {
              byUserId: fixture.value.currentUser.id,
              at: today,
              ...(comment?.trim() ? { comment: comment.trim() } : {})
            }
          ]
        }
      }
      if (w.id === sourceId) {
        // The published copy now reflects the version it just created —
        // advance its fork point so its version badge tracks the new
        // published version (e.g. v2 → v3).
        return {
          ...w,
          updatedAt: today,
          forkedFrom: { workflowId: targetWorkflowId, atVersion: today }
        }
      }
      return w
    })
    return true
  }

  // The canonical's effective current published version — the pinned "stable"
  // version if an admin set one, else the latest non-deleted publish. `n` is
  // the 1-based version number (chronological index + 1). undefined if it has
  // no live versions.
  function effectiveVersion(
    canonical: Workflow
  ): { at: string; n: number } | undefined {
    const live = (canonical.publishedVersions ?? [])
      .map((v, i) => ({ v, n: i + 1 }))
      .filter(({ v }) => !v.deleted)
    if (!live.length) return
    const chosen = live.find(({ v }) => v.pinned) ?? live[live.length - 1]
    return { at: chosen.v.at, n: chosen.n }
  }

  // How many published versions a checked-out copy trails its canonical's
  // effective current version. 0 when it isn't a resolvable copy, is already
  // current, or is ahead of a pinned older version.
  function versionsBehind(workflow: Workflow): number {
    const fork = workflow.forkedFrom
    if (!fork) return 0
    const canonical = fixture.value.workflows.find(
      (w) => w.id === fork.workflowId
    )
    if (!canonical) return 0
    const effective = effectiveVersion(canonical)
    if (!effective) return 0
    const copyIndex = (canonical.publishedVersions ?? []).findIndex(
      (v) => v.at === fork.atVersion
    )
    if (copyIndex < 0) return 0
    const behind = effective.n - (copyIndex + 1)
    return behind > 0 ? behind : 0
  }

  // Re-sync a checked-out copy to its canonical's effective current version
  // (pinned-else-latest): replaces the copy's content (its version pointer +
  // modified date here) in place. Returns true on success.
  function updateToLatest(workflowId: string): boolean {
    const copy = fixture.value.workflows.find((w) => w.id === workflowId)
    const fork = copy?.forkedFrom
    const canonical = fork
      ? fixture.value.workflows.find((w) => w.id === fork.workflowId)
      : undefined
    if (!copy || !fork || !canonical) return false
    const effective = effectiveVersion(canonical)
    if (!effective) return false
    const today = new Date().toISOString().slice(0, 10)
    fixture.value.workflows = fixture.value.workflows.map((w) =>
      w.id === workflowId
        ? {
            ...w,
            updatedAt: today,
            forkedFrom: { workflowId: fork.workflowId, atVersion: effective.at }
          }
        : w
    )
    return true
  }

  // Admin curation of a canonical's published-version history. `n` is the
  // 1-based version number (chronological array index + 1).
  // Pin marks the "stable / latest-good" version, clearing any other pin;
  // pinning the already-pinned version unpins it.
  function pinVersion(workflowId: string, n: number) {
    fixture.value.workflows = fixture.value.workflows.map((w) => {
      if (w.id !== workflowId || !w.publishedVersions) return w
      return {
        ...w,
        publishedVersions: w.publishedVersions.map((v, i) => ({
          ...v,
          pinned: i === n - 1 ? !v.pinned : false
        }))
      }
    })
  }

  // Soft-delete: flag the version so display drops it, but keep it in the
  // array so the remaining version numbers don't renumber.
  function deleteVersion(workflowId: string, n: number) {
    fixture.value.workflows = fixture.value.workflows.map((w) => {
      if (w.id !== workflowId || !w.publishedVersions) return w
      return {
        ...w,
        publishedVersions: w.publishedVersions.map((v, i) =>
          i === n - 1 ? { ...v, deleted: true } : v
        )
      }
    })
  }

  // --- Folders (My Workflows + projects) ------------------------------
  //
  // A folder organizes workflows within a container: My Workflows (the
  // Drafts project) or a shared project. `containerId` is that project's id.

  function createFolder(containerId: string, name: string): string {
    const id = `folder-${Date.now()}`
    fixture.value.folders = [
      ...(fixture.value.folders ?? []),
      { id, projectId: containerId, name: name.trim() }
    ]
    return id
  }

  function renameFolder(folderId: string, name: string) {
    fixture.value.folders = (fixture.value.folders ?? []).map((f) =>
      f.id === folderId ? { ...f, name: name.trim() } : f
    )
  }

  // Deleting a folder is non-destructive to its workflows — they fall back to
  // the container root (folderId cleared).
  function deleteFolder(folderId: string) {
    fixture.value.folders = (fixture.value.folders ?? []).filter(
      (f) => f.id !== folderId
    )
    fixture.value.workflows = fixture.value.workflows.map((w) =>
      w.folderId === folderId ? { ...w, folderId: undefined } : w
    )
  }

  function moveWorkflowToFolder(workflowId: string, folderId: string | null) {
    fixture.value.workflows = fixture.value.workflows.map((w) =>
      w.id === workflowId ? { ...w, folderId: folderId ?? undefined } : w
    )
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
    renameProject,
    deleteProject,
    leaveProject,
    renameWorkflow,
    deleteWorkflow,
    setWorkflowStorage,
    getEffectiveWorkflowStorage,
    cycleWorkflowThumbnail,
    resolveWorkflowThumbnail,
    publishAsNewWorkflow,
    createProject,
    createDraftInProject,
    copyToMyWorkflows,
    publishOverWorkflow,
    pinVersion,
    deleteVersion,
    versionsBehind,
    updateToLatest,
    createFolder,
    renameFolder,
    deleteFolder,
    moveWorkflowToFolder
  }
})
