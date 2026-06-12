// Implements:
//   concept: ../IA_Plan/wiki/concepts/personas-and-flows.md
//
// Tiny Pinia store that drives the persona toggle. The current persona's
// fixture is the source of truth for everything the dashboard renders.

import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'

import { personas } from '../fixtures/personas'
import type {
  AllowlistKind,
  BlessedInstall,
  CreditLimitPeriod,
  DelegableCapability,
  Notification,
  PersonaDef,
  PersonaId,
  Project,
  ProjectAllowlistKind,
  ProjectAllowlists,
  ProjectRole,
  ProjectTier,
  WorkflowSubmission,
  WorkspaceRole
} from '../types'

export const usePrototypePersonaStore = defineStore('prototype-persona', () => {
  const currentPersonaId = ref<PersonaId>('workspace-admin')

  // Every published canonical (a non-branch workflow living in a shared,
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

  // Reactive so in-place fixture mutations (publish, approve, rename, …)
  // trigger re-renders even without a subsequent navigation.
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

  // Workflows shared with me via asset-level grant where the
  // containing project is NOT one I can reach through project nav —
  // i.e. workflows that wouldn't surface anywhere else. Per
  // concepts/three-level-permissions.md, asset-level grants are
  // independent from project-level access. The set is unioned across
  // every workspace the persona belongs to (not just the current one),
  // because share invites span workspaces — see persona personas-and-
  // flows.md #4 / #5.
  const sharedWorkflows = computed(() => {
    const viewerId = fixture.value.currentUser.id
    const reachableProjectIds = new Set(
      fixture.value.projects
        .filter(
          (p) =>
            p.isDrafts || p.tier === 'workspace-wide' || p.currentUserHasAccess
        )
        .map((p) => p.id)
    )
    return fixture.value.workflows
      .filter((w) => w.access?.some((a) => a.userId === viewerId))
      .filter((w) => !reachableProjectIds.has(w.projectId))
      .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  })

  const recentWorkflows = computed(() => {
    const accessibleProjectIds = new Set([
      ...visibleProjects.value.map((p) => p.id),
      ...(draftsProject.value ? [draftsProject.value.id] : [])
    ])
    const projectReachable = fixture.value.workflows.filter((w) =>
      accessibleProjectIds.has(w.projectId)
    )
    return [...projectReachable, ...sharedWorkflows.value].toSorted((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    )
  })

  // --- Notifications ---------------------------------------------------
  //
  // Cross-workspace alerts. Surfaced via the top-bar popover. Per
  // prototype/design-decisions.md 2026-05-14 — replaces the prior
  // "Shared with me" tray for Guest personas; the in-workspace nav now
  // carries shared content directly, so notifications are the only
  // cross-workspace cue.

  const sortedNotifications = computed(() =>
    [...fixture.value.notifications].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    )
  )

  const unreadNotificationCount = computed(
    () => fixture.value.notifications.filter((n) => !n.readAt).length
  )

  // Pending workflow submissions in the current workspace (the reviewer's
  // queue). Filtered to projects in the active workspace.
  const pendingWorkflowSubmissions = computed(() => {
    const wsId = fixture.value.currentWorkspaceId
    const wsProjectIds = new Set(
      fixture.value.projects
        .filter((p) => p.workspaceId === wsId)
        .map((p) => p.id)
    )
    return fixture.value.workflowSubmissions.filter(
      (s) => s.status === 'pending' && wsProjectIds.has(s.projectId)
    )
  })

  function markNotificationRead(id: string) {
    const today = new Date().toISOString().slice(0, 10)
    fixture.value.notifications = fixture.value.notifications.map((n) =>
      n.id === id && !n.readAt ? { ...n, readAt: today } : n
    )
  }

  function markAllNotificationsRead() {
    const today = new Date().toISOString().slice(0, 10)
    fixture.value.notifications = fixture.value.notifications.map((n) =>
      n.readAt ? n : { ...n, readAt: today }
    )
  }

  function setPersona(id: PersonaId) {
    currentPersonaId.value = id
  }

  function setCurrentWorkspace(id: string) {
    fixture.value.currentWorkspaceId = id
  }

  // --- Active install ---------------------------------------------------
  //
  // Multi-install state per ../IA_Plan/wiki/concepts/install-switcher.md.
  // Switching the active install changes the runtime, NOT the content
  // visibility (Media / Models / Nodes views aggregate across installs).
  // Per the wiki, switching swaps the workflow tab set — tab-set swap is
  // out of scope for A1 and tracked under open-q `install-switch-dirty-
  // state`; the indicator just records the choice for now.

  const activeInstall = computed(() => {
    const id = fixture.value.activeInstallId
    if (!id) return undefined
    return fixture.value.installs.find((i) => i.id === id)
  })

  function setActiveInstall(id: string) {
    if (!fixture.value.installs.some((i) => i.id === id)) return
    fixture.value.activeInstallId = id
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

  const allowlistKeyByKind = {
    model: 'models',
    'custom-node': 'customNodes',
    'partner-node': 'partnerNodes'
  } as const

  const allowlistIdPrefixByKind = {
    model: 'mdl',
    'custom-node': 'cn',
    'partner-node': 'pn'
  } as const

  function addAllowlistEntry(kind: AllowlistKind, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const key = allowlistKeyByKind[kind]
    const existing = fixture.value.allowlists[key]
    if (existing.entries.some((e) => e.name === trimmed)) return
    const today = new Date().toISOString().slice(0, 10)
    fixture.value.allowlists = {
      ...fixture.value.allowlists,
      [key]: {
        ...existing,
        entries: [
          ...existing.entries,
          {
            id: `${allowlistIdPrefixByKind[kind]}-${Date.now()}`,
            name: trimmed,
            addedAt: today,
            addedByUserId: fixture.value.currentUser.id
          }
        ]
      }
    }
  }

  function removeAllowlistEntry(kind: AllowlistKind, entryId: string) {
    const key = allowlistKeyByKind[kind]
    const existing = fixture.value.allowlists[key]
    fixture.value.allowlists = {
      ...fixture.value.allowlists,
      [key]: {
        ...existing,
        entries: existing.entries.filter((e) => e.id !== entryId)
      }
    }
  }

  function setAllowlistEnabled(kind: AllowlistKind, enabled: boolean) {
    const key = allowlistKeyByKind[kind]
    fixture.value.allowlists = {
      ...fixture.value.allowlists,
      [key]: { ...fixture.value.allowlists[key], enabled }
    }
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

  // --- Hub publishing approval queue -----------------------------------

  function approveHubSubmission(id: string) {
    fixture.value.hubSubmissions = fixture.value.hubSubmissions.filter(
      (s) => s.id !== id
    )
  }

  function rejectHubSubmission(id: string) {
    fixture.value.hubSubmissions = fixture.value.hubSubmissions.filter(
      (s) => s.id !== id
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
    // If we're removing a pending project invite, also drop the
    // workspace-level Guest invite it spawned.
    fixture.value.pendingInvites = fixture.value.pendingInvites.filter(
      (i) => i.id !== userId
    )
  }

  // --- Workflow operations --------------------------------------------
  //
  // Owner-only mutations (rename / delete / move) are not store-gated —
  // callers are expected to gate at the UI. Storage/destination toggle
  // is workflow-level per
  // ../IA_Plan/wiki/decisions/save-destination-workflow-level.md.
  // Fork lands in the actor's My Workflows in the host workspace per
  // ../IA_Plan/wiki/decisions/published-workflow-model.md.

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

  // Move a workflow into another project — the single "move asset to
  // another project" verb. Per concepts/cross-cutting-flows.md the wiki
  // frames promotion as this same verb applied to a My Workflows → shared
  // move, so the destination decides behaviour: moving into a SHARED
  // (non-Drafts, non-private) project publishes it as that project's
  // canonical (lineage cleared, V1 seeded if it had no history); moving
  // into My Workflows / a private project is a plain relocation. Install
  // gating for locked targets lives in the picker dialog. Returns success.
  function moveWorkflowToProject(
    workflowId: string,
    targetProjectId: string
  ): boolean {
    const source = fixture.value.workflows.find((w) => w.id === workflowId)
    const target = fixture.value.projects.find((p) => p.id === targetProjectId)
    if (!source || !target) return false
    const today = new Date().toISOString().slice(0, 10)
    const publishing = !target.isDrafts && target.tier !== 'private'
    fixture.value.workflows = fixture.value.workflows.map((w) =>
      w.id === workflowId
        ? {
            ...w,
            projectId: targetProjectId,
            updatedAt: today,
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

  // Fork = clone into the actor's My Workflows in the host workspace.
  // The host workspace is the workspace that contains the source
  // workflow's project — NOT necessarily the current workspace, per
  // the "forks land in host workspace" rule. Returns the new id so the
  // caller can route into the fork.
  // Create a BRANCH of a workflow per
  // ../IA_Plan/wiki/decisions/published-workflow-model.md +
  // ../IA_Plan/wiki/decisions/branch-vs-personal-copy.md. A branch lives in
  // the SAME project as its canonical (not in My Workflows) so it stays
  // under the project's governance and is visible to all collaborators. It
  // carries `forkedFrom` lineage so it can Publish to workspace (overwrite
  // the canonical). Branching a branch points at the original canonical.
  function branchWorkflow(workflowId: string): string | undefined {
    const source = fixture.value.workflows.find((w) => w.id === workflowId)
    if (!source) return
    const canonicalId = source.forkedFrom?.workflowId ?? source.id
    const canonical =
      fixture.value.workflows.find((w) => w.id === canonicalId) ?? source
    const newId = `wf-branch-${Date.now()}`
    const today = new Date().toISOString().slice(0, 10)
    const atVersion = canonical.publishedVersions?.at(-1)?.at
    fixture.value.workflows = [
      ...fixture.value.workflows,
      {
        ...source,
        id: newId,
        // Lives in the canonical's project — visible to all collaborators.
        projectId: canonical.projectId,
        // Branch auto-name default per the wiki: "<Name> — <username>".
        name: `${canonical.name} — ${fixture.value.currentUser.name}`,
        ownerUserId: fixture.value.currentUser.id,
        updatedAt: today,
        forkedFrom: { workflowId: canonicalId, atVersion },
        access: []
      }
    ]
    return newId
  }

  // Detached personal copy in My Workflows per
  // ../IA_Plan/wiki/decisions/branch-vs-personal-copy.md. No lineage — it
  // cannot be published/merged back. Always available, free of project
  // governance.
  function saveToMyWorkflows(workflowId: string): string | undefined {
    const source = fixture.value.workflows.find((w) => w.id === workflowId)
    if (!source) return
    const sourceProject = fixture.value.projects.find(
      (p) => p.id === source.projectId
    )
    if (!sourceProject) return
    const myWorkflowsId = findHostMyWorkflows(sourceProject.workspaceId)
    if (!myWorkflowsId) return
    const newId = `wf-copy-${Date.now()}`
    const today = new Date().toISOString().slice(0, 10)
    fixture.value.workflows = [
      ...fixture.value.workflows,
      {
        ...source,
        id: newId,
        projectId: myWorkflowsId,
        name: `${source.name} (copy)`,
        ownerUserId: fixture.value.currentUser.id,
        updatedAt: today,
        forkedFrom: undefined,
        access: []
      }
    ]
    return newId
  }

  // Branch-on-open per ../IA_Plan/wiki/decisions/published-workflow-model.md.
  // Opening a workflow in a SHARED project yields a branch in that project —
  // editing a shared workflow is never in-place. A workflow already in My
  // Workflows is edited directly. Reuses the user's existing branch of the
  // canonical rather than spawning duplicates. Returns the id to open.
  function openForWork(workflowId: string): string | undefined {
    const source = fixture.value.workflows.find((w) => w.id === workflowId)
    if (!source) return
    const sourceProject = fixture.value.projects.find(
      (p) => p.id === source.projectId
    )
    if (!sourceProject || sourceProject.isDrafts) return workflowId
    const existing = fixture.value.workflows.find(
      (w) =>
        w.ownerUserId === fixture.value.currentUser.id &&
        w.forkedFrom?.workflowId === workflowId
    )
    if (existing) return existing.id
    return branchWorkflow(workflowId)
  }

  // Publish a fork to workspace — overwrite the canonical workflow it was
  // forked from with the fork's contents, in place (stable id). Per
  // ../IA_Plan/wiki/decisions/published-workflow-model.md: no diff/merge;
  // canonical becomes whatever was most recently published. Gate checks
  // (overwrite permission + install identity) live in useWorkflowPublish;
  // this action assumes they passed. Returns true if a canonical was
  // overwritten.
  function publishToWorkspace(forkId: string): boolean {
    const fork = fixture.value.workflows.find((w) => w.id === forkId)
    if (!fork?.forkedFrom) return false
    const canonicalId = fork.forkedFrom.workflowId
    const today = new Date().toISOString().slice(0, 10)
    let overwritten = false
    fixture.value.workflows = fixture.value.workflows.map((w) => {
      if (w.id !== canonicalId) return w
      overwritten = true
      // Overwrite canonical content with the fork's. Name + identity +
      // project membership of the canonical are preserved; the fork's
      // working state (thumbnail here as a stand-in for graph contents)
      // and a fresh updatedAt land on the canonical, plus a new entry on
      // the published-version history timeline.
      return {
        ...w,
        updatedAt: today,
        thumbnailUrl: fork.thumbnailUrl ?? w.thumbnailUrl,
        publishedVersions: [
          ...(w.publishedVersions ?? []),
          { byUserId: fixture.value.currentUser.id, at: today }
        ]
      }
    })
    return overwritten
  }

  // --- Workflow submissions (member-overwrite-request-flow) ------------
  //
  // When a collaborator can't publish a fork (no overwrite permission),
  // they Submit it for an owner/admin to review. Per
  // ../IA_Plan/wiki/decisions/published-workflow-model.md (promoted from
  // open question 2026-05-27). Cross-persona note: fixtures don't share
  // state, so the submitter recording a submission and the reviewer
  // acting on it happen in different persona fixtures; seeds bridge the
  // demo. These actions operate on the *current* fixture only.

  function submitWorkflowForReview(forkId: string): boolean {
    const fork = fixture.value.workflows.find((w) => w.id === forkId)
    if (!fork?.forkedFrom) return false
    const canonical = fixture.value.workflows.find(
      (w) => w.id === fork.forkedFrom?.workflowId
    )
    if (!canonical) return false
    const project = fixture.value.projects.find(
      (p) => p.id === canonical.projectId
    )
    if (!project || project.isDrafts) return false
    if (
      fixture.value.workflowSubmissions.some(
        (s) => s.forkWorkflowId === forkId && s.status === 'pending'
      )
    ) {
      return true
    }
    fixture.value.workflowSubmissions = [
      ...fixture.value.workflowSubmissions,
      {
        id: `wfsub-${Date.now()}`,
        forkWorkflowId: forkId,
        canonicalWorkflowId: canonical.id,
        workflowName: canonical.name,
        projectId: project.id,
        submittedByUserId: fixture.value.currentUser.id,
        submittedAt: new Date().toISOString().slice(0, 10),
        status: 'pending'
      }
    ]
    return true
  }

  // Deliver a notification into another user's persona fixture so it
  // surfaces when you switch to them — fixtures don't share state, so this
  // bridges the cross-persona review demo in both directions (reviewer →
  // submitter on resolve, submitter → reviewer on resubmit).
  function deliverNotificationTo(
    userId: string,
    note: Omit<Notification, 'id'>
  ) {
    const persona = reactivePersonas.find(
      (p) => p.fixture.currentUser.id === userId
    )
    if (!persona) return
    persona.fixture.notifications = [
      { ...note, id: `note-${Date.now()}` },
      ...persona.fixture.notifications
    ]
  }

  // Upsert a submission into another user's persona fixture so both ends
  // of the review loop see a consistent status without shared state.
  function mirrorSubmissionTo(userId: string, submission: WorkflowSubmission) {
    const persona = reactivePersonas.find(
      (p) => p.fixture.currentUser.id === userId
    )
    if (!persona) return
    const exists = persona.fixture.workflowSubmissions.some(
      (s) => s.id === submission.id
    )
    persona.fixture.workflowSubmissions = exists
      ? persona.fixture.workflowSubmissions.map((s) =>
          s.id === submission.id ? { ...submission } : s
        )
      : [...persona.fixture.workflowSubmissions, { ...submission }]
  }

  function resolveSubmission(
    submissionId: string,
    status: 'approved' | 'rejected',
    comment?: string
  ) {
    const today = new Date().toISOString().slice(0, 10)
    const submission = fixture.value.workflowSubmissions.find(
      (s) => s.id === submissionId
    )
    if (!submission) return
    if (status === 'approved') {
      // Overwrite the canonical in place (the fork itself may not live in
      // this reviewer's fixture, so bump the canonical's updatedAt) and
      // append a published-version entry — approving IS publishing, so it
      // lands on the canonical's history timeline. The change is the
      // submitter's work, so the version is attributed to them, not the
      // reviewer who approved it.
      fixture.value.workflows = fixture.value.workflows.map((w) =>
        w.id === submission.canonicalWorkflowId
          ? {
              ...w,
              updatedAt: today,
              publishedVersions: [
                ...(w.publishedVersions ?? []),
                { byUserId: submission.submittedByUserId, at: today }
              ]
            }
          : w
      )
    }
    const resolved: WorkflowSubmission = {
      ...submission,
      status,
      reviewComment: comment ?? submission.reviewComment
    }
    fixture.value.workflowSubmissions = fixture.value.workflowSubmissions.map(
      (s) => (s.id === submissionId ? resolved : s)
    )
    // Mirror the outcome into the submitter's own fixture so their workflow
    // sidebar reflects the decline (and offers Revise & resubmit) without
    // shared state.
    mirrorSubmissionTo(submission.submittedByUserId, resolved)
    // Clear the reviewer's "submission-received" cue for this asset.
    fixture.value.notifications = fixture.value.notifications.map((n) =>
      n.kind === 'submission-received' &&
      n.target.assetId === submission.canonicalWorkflowId &&
      !n.readAt
        ? { ...n, readAt: today }
        : n
    )
    // Send the outcome back to the submitter. Declines carry the
    // reviewer's feedback so they know what to revise.
    const project = fixture.value.projects.find(
      (p) => p.id === submission.projectId
    )
    deliverNotificationTo(submission.submittedByUserId, {
      kind:
        status === 'approved' ? 'submission-approved' : 'submission-rejected',
      actorUserId: fixture.value.currentUser.id,
      target: {
        workspaceId: project?.workspaceId ?? fixture.value.currentWorkspaceId,
        projectId: submission.projectId,
        assetId: submission.canonicalWorkflowId
      },
      createdAt: today,
      message: status === 'rejected' ? comment : undefined
    })
  }

  function approveSubmission(submissionId: string) {
    resolveSubmission(submissionId, 'approved')
  }

  function rejectSubmission(submissionId: string, comment: string) {
    resolveSubmission(submissionId, 'rejected', comment)
  }

  // Submitter revises after a decline and sends the working copy back for
  // review. Flips the rejected submission to pending, re-notifies the
  // reviewer (project owner) and mirrors the pending state into their
  // fixture so it reappears in their Review queue.
  function resubmitSubmission(submissionId: string): boolean {
    const today = new Date().toISOString().slice(0, 10)
    const submission = fixture.value.workflowSubmissions.find(
      (s) => s.id === submissionId
    )
    if (!submission || submission.status !== 'rejected') return false
    const resubmitted: WorkflowSubmission = {
      ...submission,
      status: 'pending',
      submittedAt: today
    }
    fixture.value.workflowSubmissions = fixture.value.workflowSubmissions.map(
      (s) => (s.id === submissionId ? resubmitted : s)
    )
    const project = fixture.value.projects.find(
      (p) => p.id === submission.projectId
    )
    const reviewerId = project?.ownerUserId
    if (reviewerId) {
      mirrorSubmissionTo(reviewerId, resubmitted)
      deliverNotificationTo(reviewerId, {
        kind: 'submission-received',
        actorUserId: fixture.value.currentUser.id,
        target: {
          workspaceId: project?.workspaceId ?? fixture.value.currentWorkspaceId,
          projectId: submission.projectId,
          assetId: submission.canonicalWorkflowId
        },
        createdAt: today
      })
    }
    return true
  }

  // --- Project settings ------------------------------------------------
  //
  // Per ../IA_Plan/wiki/entities/project.md §"What it contains" +
  // prototype/design-decisions.md 2026-05-15: an Owner can toggle the
  // override flag (strict override of workspace allowlist), curate
  // entries, and set a filename-prefix default that prefills new
  // save-node widgets.

  const projectAllowlistKeyByKind = {
    model: 'models',
    'custom-node': 'customNodes'
  } as const

  const projectAllowlistIdPrefixByKind = {
    model: 'pmdl',
    'custom-node': 'pcn'
  } as const

  const emptyProjectAllowlists: ProjectAllowlists = {
    models: { override: false, entries: [] },
    customNodes: { override: false, entries: [] }
  }

  function updateProjectAllowlists(
    projectId: string,
    update: (lists: ProjectAllowlists) => ProjectAllowlists
  ) {
    fixture.value.projects = fixture.value.projects.map((p) => {
      if (p.id !== projectId) return p
      const base = p.allowlists ?? emptyProjectAllowlists
      return { ...p, allowlists: update(base) }
    })
  }

  function setProjectAllowlistOverride(
    projectId: string,
    kind: ProjectAllowlistKind,
    override: boolean
  ) {
    const key = projectAllowlistKeyByKind[kind]
    updateProjectAllowlists(projectId, (lists) => ({
      ...lists,
      [key]: { ...lists[key], override }
    }))
  }

  function addProjectAllowlistEntry(
    projectId: string,
    kind: ProjectAllowlistKind,
    name: string
  ) {
    const trimmed = name.trim()
    if (!trimmed) return
    const key = projectAllowlistKeyByKind[kind]
    const today = new Date().toISOString().slice(0, 10)
    updateProjectAllowlists(projectId, (lists) => {
      const existing = lists[key]
      if (existing.entries.some((e) => e.name === trimmed)) return lists
      return {
        ...lists,
        [key]: {
          ...existing,
          entries: [
            ...existing.entries,
            {
              id: `${projectAllowlistIdPrefixByKind[kind]}-${Date.now()}`,
              name: trimmed,
              addedAt: today,
              addedByUserId: fixture.value.currentUser.id
            }
          ]
        }
      }
    })
  }

  function removeProjectAllowlistEntry(
    projectId: string,
    kind: ProjectAllowlistKind,
    entryId: string
  ) {
    const key = projectAllowlistKeyByKind[kind]
    updateProjectAllowlists(projectId, (lists) => ({
      ...lists,
      [key]: {
        ...lists[key],
        entries: lists[key].entries.filter((e) => e.id !== entryId)
      }
    }))
  }

  function setProjectFilenamePrefix(projectId: string, prefix: string) {
    fixture.value.projects = fixture.value.projects.map((p) => {
      if (p.id !== projectId) return p
      return {
        ...p,
        defaults: { ...(p.defaults ?? {}), filenamePrefix: prefix }
      }
    })
  }

  // Project allowed-install set mutations per
  // ../IA_Plan/wiki/concepts/workspace-install-registry.md §"Sourcing for
  // project allowed-install sets". `allowedInstallIds` is the project's
  // hard-lock list of install identities; `installLockDisplayName` is the
  // workspace-canonical name rendered in the install gate dialog.
  function addProjectAllowedInstall(projectId: string, installId: string) {
    fixture.value.projects = fixture.value.projects.map((p) => {
      if (p.id !== projectId) return p
      const current = p.allowedInstallIds ?? []
      if (current.includes(installId)) return p
      return { ...p, allowedInstallIds: [...current, installId] }
    })
  }

  function removeProjectAllowedInstall(projectId: string, installId: string) {
    fixture.value.projects = fixture.value.projects.map((p) => {
      if (p.id !== projectId) return p
      const next = (p.allowedInstallIds ?? []).filter((id) => id !== installId)
      return { ...p, allowedInstallIds: next }
    })
  }

  function setProjectInstallLockDisplayName(projectId: string, name: string) {
    fixture.value.projects = fixture.value.projects.map((p) => {
      if (p.id !== projectId) return p
      return { ...p, installLockDisplayName: name }
    })
  }

  // Workspace install registry mutations per
  // ../IA_Plan/wiki/concepts/workspace-install-registry.md. All mutate
  // the *current* workspace's `blessedInstalls`.
  function withCurrentWorkspace(
    fn: (entries: BlessedInstall[]) => BlessedInstall[]
  ) {
    const wsId = fixture.value.currentWorkspaceId
    fixture.value.workspaces = fixture.value.workspaces.map((w) => {
      if (w.id !== wsId) return w
      return { ...w, blessedInstalls: fn(w.blessedInstalls ?? []) }
    })
  }

  function publishInstallToWorkspace(installId: string, canonicalName: string) {
    const sourceVersion = fixture.value.installs.find(
      (i) => i.id === installId
    )?.comfyUIVersion
    if (!sourceVersion) return
    withCurrentWorkspace((entries) => {
      if (entries.some((e) => e.installId === installId)) return entries
      const entry: BlessedInstall = {
        installId,
        canonicalDisplayName: canonicalName,
        comfyUIVersion: sourceVersion,
        publishedByUserId: fixture.value.currentUser.id,
        publishedAt: new Date().toISOString().slice(0, 10),
        isLocked: false
      }
      return [...entries, entry]
    })
  }

  function unpublishInstallFromWorkspace(installId: string) {
    withCurrentWorkspace((entries) =>
      entries.filter((e) => e.installId !== installId)
    )
  }

  function setBlessedInstallLocked(installId: string, locked: boolean) {
    withCurrentWorkspace((entries) =>
      entries.map((e) =>
        e.installId === installId ? { ...e, isLocked: locked } : e
      )
    )
  }

  function setBlessedInstallDisplayName(installId: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    withCurrentWorkspace((entries) =>
      entries.map((e) =>
        e.installId === installId ? { ...e, canonicalDisplayName: trimmed } : e
      )
    )
  }

  // Install a blessed bundle to the user's local machine. In product
  // this triggers the desktop installer; here it just adds a local
  // Install entry mirroring the registry entry's name + version. Per
  // ../IA_Plan/wiki/concepts/workspace-install-registry.md
  // §"Where the registry is shown" — only the desktop client can
  // perform this action; cloud-only surfaces deep-link to it.
  function installBlessedToLocal(installId: string) {
    const ws = currentWorkspace.value
    const entry = ws?.blessedInstalls?.find((b) => b.installId === installId)
    if (!entry) return
    if (fixture.value.installs.some((i) => i.id === installId)) return
    fixture.value.installs = [
      ...fixture.value.installs,
      {
        id: entry.installId,
        displayName: entry.canonicalDisplayName,
        comfyUIVersion: entry.comfyUIVersion,
        registeredAt: new Date().toISOString().slice(0, 10)
      }
    ]
  }

  // External email invite to a project. Creates a workspace-level Guest
  // pendingInvite + a project member entry keyed by the invite id, so the
  // panel can render the pending row before the recipient accepts.
  // Per ../IA_Plan/wiki/concepts/three-level-permissions.md: a project
  // Collaborator must hold *some* workspace role; for externals that role
  // is Guest, auto-created via the invite.
  function inviteExternalCollaborator(projectId: string, email: string) {
    const inviteId = `invite-${Date.now()}`
    const today = new Date().toISOString().slice(0, 10)
    fixture.value.pendingInvites = [
      ...fixture.value.pendingInvites,
      {
        id: inviteId,
        email,
        role: 'guest',
        invitedByUserId: fixture.value.currentUser.id,
        invitedAt: today
      }
    ]
    addProjectMember(projectId, inviteId, 'collaborator')
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
    sharedWorkflows,
    sortedNotifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    personas,
    setPersona,
    setCurrentWorkspace,
    activeInstall,
    setActiveInstall,
    inviteMember,
    revokeInvite,
    resendInvite,
    removeMember,
    changeMemberRole,
    setRoleGrant,
    setWorkspaceName,
    setWorkspaceDescription,
    addAllowlistEntry,
    removeAllowlistEntry,
    setAllowlistEnabled,
    setMemberCreditLimit,
    removeMemberCreditLimit,
    setDataTrainingOptOut,
    approveHubSubmission,
    rejectHubSubmission,
    transferOwnership,
    deleteCurrentWorkspace,
    setProjectTier,
    addProjectMember,
    changeProjectMemberRole,
    removeProjectMember,
    inviteExternalCollaborator,
    setProjectAllowlistOverride,
    addProjectAllowlistEntry,
    removeProjectAllowlistEntry,
    setProjectFilenamePrefix,
    addProjectAllowedInstall,
    removeProjectAllowedInstall,
    setProjectInstallLockDisplayName,
    publishInstallToWorkspace,
    unpublishInstallFromWorkspace,
    setBlessedInstallLocked,
    setBlessedInstallDisplayName,
    installBlessedToLocal,
    renameWorkflow,
    deleteWorkflow,
    setWorkflowStorage,
    getEffectiveWorkflowStorage,
    moveWorkflowToProject,
    createProject,
    branchWorkflow,
    saveToMyWorkflows,
    openForWork,
    publishToWorkspace,
    pendingWorkflowSubmissions,
    submitWorkflowForReview,
    approveSubmission,
    rejectSubmission,
    resubmitSubmission
  }
})
