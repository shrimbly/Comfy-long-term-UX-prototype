// Implements:
//   concept: ../IA_Plan/wiki/concepts/personas-and-flows.md
//
// Tiny Pinia store that drives the persona toggle. The current persona's
// fixture is the source of truth for everything the dashboard renders.

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { personas } from '../fixtures/personas'
import type {
  AllowlistKind,
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

  const currentPersona = computed<PersonaDef>(
    () => personas.find((p) => p.id === currentPersonaId.value) ?? personas[0]
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
    sortedNotifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
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
    inviteExternalCollaborator
  }
})
