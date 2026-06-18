// Implements:
//   concept: ../IA_Plan/wiki/concepts/three-level-permissions.md — project level
//
// Resolves the people with access to a project into an avatar stack. Mirrors
// the resolver in ProjectSharing: owner + explicit members + (for
// workspace-wide) all workspace Admins. Shared by ProjectAccessBadge and the
// project detail header's Share summary.

import { storeToRefs } from 'pinia'
import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

import { usePrototypePersonaStore } from '../stores/personaStore'
import type { Project } from '../types'
import { projectAccessLevel } from '../utils/projectAccess'

interface ProjectAvatar {
  userId: string
  name: string
  avatarColor: string
  initial: string
}

const MAX_VISIBLE_AVATARS = 3
const FALLBACK_AVATAR_COLOR = '#7c7c7c'

export function useProjectAccess(
  project: MaybeRefOrGetter<Project | undefined>
) {
  const personaStore = usePrototypePersonaStore()
  const { fixture } = storeToRefs(personaStore)

  const peopleIds = computed<string[]>(() => {
    const p = toValue(project)
    if (!p) return []
    const ids = new Set<string>([p.ownerUserId])
    for (const m of p.members ?? []) ids.add(m.userId)
    if (p.tier === 'workspace-wide') {
      for (const m of fixture.value.members) {
        if (m.role === 'admin') ids.add(m.id)
      }
    }
    return [...ids]
  })

  const avatars = computed<ProjectAvatar[]>(() =>
    peopleIds.value.map((id) => {
      const wsMember = fixture.value.members.find((m) => m.id === id)
      const invite = fixture.value.pendingInvites.find((i) => i.id === id)
      const name = wsMember?.name ?? invite?.email ?? id
      return {
        userId: id,
        name,
        avatarColor: wsMember?.avatarColor ?? FALLBACK_AVATAR_COLOR,
        initial: name.trim().charAt(0).toUpperCase()
      }
    })
  )

  const visibleAvatars = computed(() =>
    avatars.value.slice(0, MAX_VISIBLE_AVATARS)
  )

  const hiddenAvatarCount = computed(() =>
    Math.max(0, avatars.value.length - MAX_VISIBLE_AVATARS)
  )

  const peopleCount = computed(() => peopleIds.value.length)

  const accessLevel = computed(() => {
    const p = toValue(project)
    return p ? projectAccessLevel(p) : 'private'
  })

  return { accessLevel, visibleAvatars, hiddenAvatarCount, peopleCount }
}
