<!--
  Implements:
    entity:   ../IA_Plan/wiki/entities/project.md
    concept:  ../IA_Plan/wiki/concepts/three-level-permissions.md — project level
    log:      ../prototype/design-decisions.md (2026-05-13 Sharing panel)

  Google Drive-style sharing surface for a single project:
    - Add people row at top (combobox of workspace members not yet in project)
    - People with access list (role dropdowns; Owner / Collaborator / Project Guest)
    - General access row (tier dropdown — Restricted ↔ Workspace-wide)

  Workspace-wide projects synthesize an implicit "via workspace" floor;
  the people list shows only explicit overrides + Owner(s).
-->
<template>
  <div class="flex flex-col gap-4">
    <header class="flex items-baseline justify-between">
      <h2 class="text-lg font-semibold">
        {{ t('prototype.views.project.sharing.title') }}
      </h2>
      <span class="text-xs text-muted-foreground">
        {{
          t('prototype.views.project.sharing.peopleCount', {
            count: peopleRows.length
          })
        }}
      </span>
    </header>

    <div v-if="canInvite" class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <div ref="pickerRef" class="relative flex-1">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('prototype.views.project.sharing.addPlaceholder')"
            class="h-10 w-full rounded-lg border border-border-subtle bg-secondary-background px-3 text-sm outline-none focus:border-base-foreground"
            @focus="pickerOpen = true"
            @keydown.enter="onEnterSubmit"
          />
          <div
            v-if="pickerOpen"
            class="absolute inset-x-0 top-full z-20 mt-1 flex max-h-64 flex-col gap-0.5 overflow-y-auto rounded-lg border border-border-default bg-interface-menu-surface p-1 shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
          >
            <button
              v-for="candidate in pickerCandidates"
              :key="candidate.id"
              type="button"
              class="flex w-full cursor-pointer appearance-none items-center gap-3 rounded-sm border-0 bg-transparent px-2 py-1.5 text-left text-base-foreground transition-colors hover:bg-interface-menu-component-surface-hovered focus:bg-interface-menu-component-surface-hovered focus:outline-none"
              @click="onAddCandidate(candidate.id)"
            >
              <span
                class="grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold text-button-surface-contrast"
                :style="{ backgroundColor: candidate.avatarColor ?? '#7c7c7c' }"
              >
                {{ candidate.initial }}
              </span>
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="truncate text-sm">{{ candidate.name }}</span>
                <span class="truncate text-xs text-muted-foreground">
                  {{ candidate.email }}
                </span>
              </span>
              <span class="text-xs text-muted-foreground">
                {{ t(`prototype.sidebar.role.${candidate.workspaceRole}`) }}
              </span>
            </button>
            <button
              v-if="canSubmitExternal"
              type="button"
              class="flex w-full cursor-pointer appearance-none items-center gap-3 rounded-sm border-0 bg-transparent px-2 py-1.5 text-left text-base-foreground transition-colors hover:bg-interface-menu-component-surface-hovered focus:bg-interface-menu-component-surface-hovered focus:outline-none"
              @click="onSubmitExternal"
            >
              <span
                class="grid size-7 shrink-0 place-items-center rounded-full bg-secondary-background text-muted-foreground"
              >
                <span class="icon-[lucide--mail-plus] size-3.5" />
              </span>
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="truncate text-sm">
                  {{
                    t('prototype.views.project.sharing.addExternalHint', {
                      email: searchQuery.trim(),
                      workspace: workspaceName
                    })
                  }}
                </span>
              </span>
            </button>
            <p
              v-if="
                !pickerCandidates.length && !canSubmitExternal && searchQuery
              "
              class="p-2 text-xs text-muted-foreground italic"
            >
              {{ t('prototype.views.project.sharing.noMatches') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <ul
      v-if="peopleRows.length"
      class="m-0 list-none rounded-xl border border-border-subtle bg-base-background p-0"
    >
      <li
        v-for="(row, i) in peopleRows"
        :key="row.userId"
        :class="
          cn(
            'flex items-center gap-3 px-3 py-2.5',
            i > 0 && 'border-t border-border-subtle'
          )
        "
      >
        <span
          class="grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold text-button-surface-contrast"
          :style="{ backgroundColor: row.avatarColor }"
        >
          {{ row.initial }}
        </span>
        <div class="flex min-w-0 flex-1 flex-col">
          <span class="truncate text-sm font-medium">
            {{ row.name }}
            <span
              v-if="row.userId === fixture.currentUser.id"
              class="ml-1 text-xs text-muted-foreground"
            >
              ({{ t('prototype.views.members.actions.you') }})
            </span>
          </span>
          <span class="truncate text-xs text-muted-foreground">
            {{ row.email }}
          </span>
        </div>
        <span
          v-if="row.pending"
          class="bg-accent-warning/15 text-accent-warning rounded-full px-2 py-0.5 text-xs"
        >
          {{ t('prototype.views.project.sharing.pending') }}
        </span>
        <span
          v-else-if="row.implicit"
          class="rounded-full bg-secondary-background px-2 py-0.5 text-xs text-muted-foreground italic"
        >
          {{ t('prototype.views.project.sharing.viaWorkspace') }}
        </span>
        <RoleDropdown
          v-if="canChangeRole(row)"
          :role="row.role"
          :viewer-can-set-owner="isProjectOwner"
          @select="(role) => onChangeRole(row, role)"
          @remove="onRemove(row)"
        />
        <span
          v-else
          class="rounded-full bg-secondary-background px-2 py-0.5 text-xs text-muted-foreground"
        >
          {{ t(`prototype.views.projectRole.${row.role}`) }}
        </span>
      </li>
    </ul>

    <section class="flex flex-col gap-2">
      <h3
        class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {{ t('prototype.views.project.sharing.generalAccessHeading') }}
      </h3>
      <div
        class="flex items-center gap-3 rounded-xl border border-border-subtle bg-base-background px-3 py-2.5"
      >
        <span
          :class="
            cn(
              'grid size-9 shrink-0 place-items-center rounded-full bg-secondary-background',
              tierIcon
            )
          "
        />
        <div class="flex min-w-0 flex-1 flex-col">
          <span class="text-sm font-medium">{{ tierLabel }}</span>
          <span class="text-xs text-muted-foreground">{{
            tierDescription
          }}</span>
        </div>
        <TierDropdown
          v-if="canChangeTier"
          :tier="project.tier"
          @select="(value) => personaStore.setProjectTier(project.id, value)"
        />
        <span
          v-else
          class="rounded-full bg-secondary-background px-2 py-0.5 text-xs text-muted-foreground"
        >
          {{ t(`prototype.projectTier.${project.tier}`) }}
        </span>
      </div>
    </section>

    <p class="text-xs text-muted-foreground">
      {{ t('prototype.views.project.sharing.footerNote') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { onClickOutside } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import RoleDropdown from './RoleDropdown.vue'
import TierDropdown from './TierDropdown.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { Project, ProjectRole } from '../types'

const { project } = defineProps<{
  project: Project
}>()

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture, currentWorkspace } = storeToRefs(personaStore)

const searchQuery = ref('')
const pickerOpen = ref(false)
const pickerRef = useTemplateRef<HTMLElement>('pickerRef')
onClickOutside(pickerRef, () => {
  pickerOpen.value = false
})

const workspaceName = computed(() => currentWorkspace.value?.name ?? '')

interface PersonRow {
  userId: string
  name: string
  email: string
  avatarColor: string
  initial: string
  role: ProjectRole
  // Implicit rows derive from workspace role (e.g. workspace Admin auto-Owner
  // on workspace-wide projects). The role pill is read-only for implicit rows.
  implicit: boolean
  // Pending rows correspond to external email invites that haven't been
  // accepted yet — they live in fixture.pendingInvites rather than members.
  pending: boolean
}

function makeRow(
  userId: string,
  role: ProjectRole,
  implicit: boolean
): PersonRow {
  const wsMember = fixture.value.members.find((wm) => wm.id === userId)
  if (wsMember) {
    return {
      userId,
      name: wsMember.name,
      email: wsMember.email,
      avatarColor: wsMember.avatarColor ?? '#7c7c7c',
      initial: wsMember.name.trim().charAt(0).toUpperCase(),
      role,
      implicit,
      pending: false
    }
  }
  // Fallback: pending external invite (project member entry keyed by the
  // invite id, no workspace member yet).
  const invite = fixture.value.pendingInvites.find((i) => i.id === userId)
  if (invite) {
    return {
      userId,
      name: invite.email,
      email: invite.email,
      avatarColor: '#7c7c7c',
      initial: invite.email.trim().charAt(0).toUpperCase(),
      role,
      implicit,
      pending: true
    }
  }
  return {
    userId,
    name: userId,
    email: '',
    avatarColor: '#7c7c7c',
    initial: userId.trim().charAt(0).toUpperCase(),
    role,
    implicit,
    pending: false
  }
}

const peopleRows = computed<PersonRow[]>(() => {
  const explicit = (project.members ?? []).map((m) =>
    makeRow(m.userId, m.role, false)
  )
  const explicitIds = new Set(explicit.map((r) => r.userId))
  const rows = [...explicit]

  if (!explicitIds.has(project.ownerUserId)) {
    rows.unshift(makeRow(project.ownerUserId, 'owner', false))
  }

  // Workspace-wide auto-Owner: include all workspace Admins. Per the wiki,
  // Admin auto-Owner only applies to workspace-wide tier.
  if (project.tier === 'workspace-wide') {
    for (const m of fixture.value.members) {
      if (m.role !== 'admin') continue
      if (explicitIds.has(m.id)) continue
      if (m.id === project.ownerUserId) continue
      rows.push(makeRow(m.id, 'owner', true))
    }
  }

  return rows
})

const viewerWorkspaceRole = computed(
  () => currentWorkspace.value?.currentUserRole ?? 'guest'
)

const isWorkspaceAdmin = computed(() => viewerWorkspaceRole.value === 'admin')

const viewerProjectRole = computed<ProjectRole | undefined>(() => {
  const me = fixture.value.currentUser.id
  if (project.ownerUserId === me) return 'owner'
  if (
    project.tier === 'workspace-wide' &&
    viewerWorkspaceRole.value === 'admin'
  ) {
    return 'owner'
  }
  return project.members?.find((m) => m.userId === me)?.role
})

const isProjectOwner = computed(() => viewerProjectRole.value === 'owner')

const canChangeTier = computed(
  () => isProjectOwner.value || isWorkspaceAdmin.value
)
const canInvite = computed(
  () =>
    isProjectOwner.value ||
    viewerProjectRole.value === 'collaborator' ||
    isWorkspaceAdmin.value
)

function canChangeRole(row: PersonRow): boolean {
  if (row.implicit) return false
  if (row.userId === fixture.value.currentUser.id) return false
  if (!canInvite.value) return false
  if (row.role === 'owner' && !isProjectOwner.value) return false
  return true
}

const pickerCandidates = computed(() => {
  const inProject = new Set([
    project.ownerUserId,
    ...(project.members ?? []).map((m) => m.userId)
  ])
  const query = searchQuery.value.trim().toLowerCase()
  return fixture.value.members
    .filter((m) => !inProject.has(m.id))
    .filter((m) => {
      if (!query) return true
      return (
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query)
      )
    })
    .slice(0, 8)
    .map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      avatarColor: m.avatarColor,
      initial: m.name.trim().charAt(0).toUpperCase(),
      workspaceRole: m.role
    }))
})

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Offer the external-invite affordance when:
//   1. The input looks like an email
//   2. That email doesn't match a workspace member (those are suggestions)
//   3. That email isn't already a pending invite
const canSubmitExternal = computed(() => {
  const value = searchQuery.value.trim().toLowerCase()
  if (!emailRegex.test(value)) return false
  if (fixture.value.members.some((m) => m.email.toLowerCase() === value)) {
    return false
  }
  if (
    fixture.value.pendingInvites.some((i) => i.email.toLowerCase() === value)
  ) {
    return false
  }
  return true
})

const tierLabel = computed(() => {
  const key = `prototype.views.project.sharing.tier.${project.tier}.label`
  return t(key, { workspace: workspaceName.value })
})

const tierDescription = computed(() => {
  const key = `prototype.views.project.sharing.tier.${project.tier}.description`
  return t(key)
})

const tierIcon = computed(() => {
  if (project.tier === 'workspace-wide') {
    return 'icon-[lucide--globe] size-5 text-muted-foreground'
  }
  if (project.tier === 'private') {
    return 'icon-[lucide--user] size-5 text-muted-foreground'
  }
  return 'icon-[lucide--lock] size-5 text-muted-foreground'
})

function onAddCandidate(userId: string) {
  // Default role for new project additions is Collaborator. Owner is
  // reserved for explicit role change after adding.
  personaStore.addProjectMember(project.id, userId, 'collaborator')
  searchQuery.value = ''
  pickerOpen.value = false
}

function onSubmitExternal() {
  if (!canSubmitExternal.value) return
  personaStore.inviteExternalCollaborator(project.id, searchQuery.value.trim())
  searchQuery.value = ''
  pickerOpen.value = false
}

function onEnterSubmit() {
  if (canSubmitExternal.value) {
    onSubmitExternal()
    return
  }
  // If the input exactly matches one workspace member's name or email,
  // treat Enter as confirming that suggestion.
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return
  const exact = pickerCandidates.value.find(
    (c) => c.email.toLowerCase() === query || c.name.toLowerCase() === query
  )
  if (exact) onAddCandidate(exact.id)
}

function onChangeRole(row: PersonRow, role: ProjectRole) {
  // If the row is the project owner record (implicit-or-explicit) and
  // the role is something other than owner, treat as demotion: only
  // possible if there's another owner already, otherwise no-op.
  if (row.userId === project.ownerUserId && role !== 'owner') return
  if (!project.members?.some((m) => m.userId === row.userId)) {
    personaStore.addProjectMember(project.id, row.userId, role)
  } else {
    personaStore.changeProjectMemberRole(project.id, row.userId, role)
  }
}

function onRemove(row: PersonRow) {
  if (row.userId === project.ownerUserId) return
  personaStore.removeProjectMember(project.id, row.userId)
}
</script>
