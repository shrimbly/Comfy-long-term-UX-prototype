<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/three-level-permissions.md — workspace level
    persona:  ../IA_Plan/wiki/concepts/personas-and-flows.md — #2 Admin, #3 Member
    open-q:   ../IA_Plan/wiki/open-questions.md#delegation-surface-in-ui
              — Permissions matrix is the proposed first-class surface
    open-q:   ../IA_Plan/wiki/open-questions.md#publish-direct-link-admin-gate
              — admin-controlled per-role grants
    open-q:   ../IA_Plan/wiki/open-questions.md#single-admin-or-many
              — working: multiple Admins allowed
    log:      ../prototype/design-decisions.md (2026-05-13)
              — Members surface scope, delegable capabilities list

  Workspace-level Members surface. Three tabs:
    Members      — list with role pills and per-row actions
    Pending      — outstanding invites with resend/revoke
    Permissions  — per-role baseline delegation matrix (Admin only)
-->
<template>
  <div class="flex flex-col gap-6">
    <header class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-semibold">
          {{ t('prototype.views.members.title') }}
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t('prototype.views.members.subtitle', { count: memberCount }) }}
        </p>
      </div>
      <button
        v-if="!isGuest"
        type="button"
        class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-base-foreground px-4 text-sm font-medium text-base-background transition-opacity hover:opacity-90"
        @click="showInvite = true"
      >
        {{ t('prototype.views.members.invite') }}
      </button>
    </header>

    <nav class="flex gap-1 border-b border-border-subtle" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :class="
          cn(
            'inline-flex h-10 cursor-pointer items-center gap-2 border-b-2 px-3 text-sm transition-colors',
            activeTab === tab.id
              ? 'border-base-foreground text-base-foreground'
              : 'border-transparent text-muted-foreground hover:text-base-foreground'
          )
        "
        @click="activeTab = tab.id"
      >
        <span>{{ tab.label }}</span>
        <span
          v-if="tab.count !== undefined"
          class="rounded-full bg-secondary-background px-2 py-0.5 text-xs"
        >
          {{ tab.count }}
        </span>
      </button>
    </nav>

    <section v-if="activeTab === 'members'" class="flex flex-col">
      <div class="rounded-xl border border-border-subtle bg-base-background">
        <table class="w-full border-collapse text-sm">
          <thead class="bg-secondary-background text-left">
            <tr>
              <th class="px-4 py-3 font-medium">
                {{ t('prototype.views.members.table.name') }}
              </th>
              <th class="px-4 py-3 font-medium">
                {{ t('prototype.views.members.table.email') }}
              </th>
              <th class="px-4 py-3 font-medium">
                {{ t('prototype.views.members.table.role') }}
              </th>
              <th class="px-4 py-3 font-medium">
                {{ t('prototype.views.members.table.joined') }}
              </th>
              <th class="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in sortedMembers"
              :key="m.id"
              class="border-t border-border-subtle"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <span
                    class="grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold text-button-surface-contrast"
                    :style="{ backgroundColor: m.avatarColor ?? '#7c7c7c' }"
                  >
                    {{ initialOf(m.name) }}
                  </span>
                  <span class="flex flex-col">
                    <span class="font-medium">
                      {{ m.name }}
                      <span
                        v-if="m.id === fixture.currentUser.id"
                        class="ml-1 text-xs text-muted-foreground"
                      >
                        ({{ t('prototype.views.members.actions.you') }})
                      </span>
                    </span>
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-muted-foreground">{{ m.email }}</td>
              <td class="px-4 py-3">
                <span
                  :class="
                    cn(
                      'inline-flex h-6 items-center rounded-full px-2 text-xs',
                      roleBadgeClass(m.role)
                    )
                  "
                >
                  {{ t(`prototype.sidebar.role.${m.role}`) }}
                </span>
              </td>
              <td class="px-4 py-3 text-muted-foreground">{{ m.joinedAt }}</td>
              <td class="px-2 py-3 text-right">
                <MemberRowActions
                  v-if="canActOn(m)"
                  :current-role="m.role"
                  :viewer-role="viewerRole"
                  @change-role="(role) => onChangeRole(m, role)"
                  @remove="onRemove(m)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-else-if="activeTab === 'pending'" class="flex flex-col">
      <div
        v-if="!fixture.pendingInvites.length"
        class="rounded-xl border border-dashed border-border-subtle p-12 text-center text-sm text-muted-foreground"
      >
        {{ t('prototype.views.members.pendingTab.empty') }}
      </div>
      <div
        v-else
        class="overflow-hidden rounded-xl border border-border-subtle bg-base-background"
      >
        <table class="w-full border-collapse text-sm">
          <thead class="bg-secondary-background text-left">
            <tr>
              <th class="px-4 py-3 font-medium">
                {{ t('prototype.views.members.pendingTab.headerEmail') }}
              </th>
              <th class="px-4 py-3 font-medium">
                {{ t('prototype.views.members.pendingTab.headerRole') }}
              </th>
              <th class="px-4 py-3 font-medium">
                {{ t('prototype.views.members.pendingTab.headerInvitedBy') }}
              </th>
              <th class="px-4 py-3 font-medium">
                {{ t('prototype.views.members.pendingTab.headerInvitedAt') }}
              </th>
              <th class="w-44 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="invite in fixture.pendingInvites"
              :key="invite.id"
              class="border-t border-border-subtle"
            >
              <td class="px-4 py-3 font-medium">{{ invite.email }}</td>
              <td class="px-4 py-3">
                <span
                  :class="
                    cn(
                      'inline-flex h-6 items-center rounded-full px-2 text-xs',
                      roleBadgeClass(invite.role)
                    )
                  "
                >
                  {{ t(`prototype.sidebar.role.${invite.role}`) }}
                </span>
              </td>
              <td class="px-4 py-3 text-muted-foreground">
                {{ inviterName(invite.invitedByUserId) }}
              </td>
              <td class="px-4 py-3 text-muted-foreground">
                {{ invite.invitedAt }}
              </td>
              <td class="px-4 py-3 text-right">
                <div class="inline-flex gap-1">
                  <button
                    type="button"
                    class="h-8 cursor-pointer rounded-lg px-3 text-xs text-muted-foreground transition-colors hover:bg-secondary-background hover:text-base-foreground"
                    @click="personaStore.resendInvite(invite.id)"
                  >
                    {{ t('prototype.views.members.actions.resend') }}
                  </button>
                  <button
                    type="button"
                    class="text-danger-foreground h-8 cursor-pointer rounded-lg px-3 text-xs transition-colors hover:bg-secondary-background"
                    @click="personaStore.revokeInvite(invite.id)"
                  >
                    {{ t('prototype.views.members.actions.revoke') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-else-if="activeTab === 'permissions'" class="flex flex-col">
      <PermissionsMatrix
        :role-grants="fixture.roleGrants"
        :read-only="viewerRole !== 'admin'"
        @toggle="personaStore.setRoleGrant"
      />
    </section>

    <InviteMemberDialog
      v-if="showInvite"
      :workspace-name="currentWorkspace?.name ?? ''"
      :can-invite-admins="viewerRole === 'admin'"
      @close="showInvite = false"
      @submit="onInviteSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import InviteMemberDialog from '../components/InviteMemberDialog.vue'
import MemberRowActions from '../components/MemberRowActions.vue'
import PermissionsMatrix from '../components/PermissionsMatrix.vue'
import { usePrototypePersonaStore } from '../stores/personaStore'
import type { WorkspaceMember, WorkspaceRole } from '../types'

const { t } = useI18n()
const personaStore = usePrototypePersonaStore()
const { fixture, currentWorkspace } = storeToRefs(personaStore)

type TabId = 'members' | 'pending' | 'permissions'
const activeTab = ref<TabId>('members')
const showInvite = ref(false)

const viewerRole = computed<WorkspaceRole>(
  () => currentWorkspace.value?.currentUserRole ?? 'guest'
)
const isGuest = computed(() => viewerRole.value === 'guest')

const memberCount = computed(() => fixture.value.members.length)

const roleOrder: Record<WorkspaceRole, number> = {
  admin: 0,
  member: 1,
  guest: 2
}

const sortedMembers = computed(() =>
  fixture.value.members.toSorted((a, b) => {
    const rA = roleOrder[a.role]
    const rB = roleOrder[b.role]
    if (rA !== rB) return rA - rB
    return a.name.localeCompare(b.name)
  })
)

const tabs = computed<Array<{ id: TabId; label: string; count?: number }>>(
  () => [
    {
      id: 'members',
      label: t('prototype.views.members.tabs.members'),
      count: fixture.value.members.length
    },
    {
      id: 'pending',
      label: t('prototype.views.members.tabs.pending'),
      count: fixture.value.pendingInvites.length
    },
    {
      id: 'permissions',
      label: t('prototype.views.members.tabs.permissions')
    }
  ]
)

function initialOf(name: string) {
  return name.trim().charAt(0).toUpperCase()
}

function roleBadgeClass(role: WorkspaceRole) {
  if (role === 'admin') return 'bg-accent-warning/15 text-accent-warning'
  if (role === 'guest') return 'bg-secondary-background text-muted-foreground'
  return 'bg-secondary-background text-base-foreground'
}

function inviterName(userId: string) {
  if (userId === fixture.value.currentUser.id) {
    return t('prototype.views.members.actions.you')
  }
  return fixture.value.members.find((m) => m.id === userId)?.name ?? userId
}

function canActOn(member: WorkspaceMember) {
  if (member.id === fixture.value.currentUser.id) return false
  if (isGuest.value) return false
  if (viewerRole.value === 'member' && member.role === 'admin') return false
  return true
}

function onChangeRole(member: WorkspaceMember, role: WorkspaceRole) {
  personaStore.changeMemberRole(member.id, role)
}

function onRemove(member: WorkspaceMember) {
  if (
    window.confirm(
      t('prototype.views.members.removeConfirm', { name: member.name })
    )
  ) {
    personaStore.removeMember(member.id)
  }
}

function onInviteSubmit({
  email,
  role
}: {
  email: string
  role: WorkspaceRole
}) {
  personaStore.inviteMember(email, role)
  showInvite.value = false
  activeTab.value = 'pending'
}
</script>
