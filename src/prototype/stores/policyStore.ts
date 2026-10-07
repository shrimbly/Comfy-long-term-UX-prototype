import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { policyCatalog } from '../fixtures/policyCatalog'
import type { PolicyItem } from '../fixtures/policyCatalog'
import { usePrototypePersonaStore } from './personaStore'

export interface PrivatePackSource {
  kind: 'zip' | 'repo'
  label: string
}

export const usePrototypePolicyStore = defineStore('prototype-policy', () => {
  const personas = usePrototypePersonaStore()
  const allowedByWorkspace = ref<Record<string, string[]>>({})
  // Packs a workspace imported itself: a zip or a repo, not the registry.
  const privateByWorkspace = ref<Record<string, PolicyItem[]>>({})
  const seededIds = policyCatalog
    .filter((item) => item.allowed)
    .map((item) => item.id)
  const workspaceId = computed(() => personas.fixture.currentWorkspaceId)
  const canEdit = computed(
    () =>
      personas.currentWorkspace?.currentUserRole === 'admin' ||
      personas.currentWorkspace?.ownerUserId === personas.fixture.currentUser.id
  )
  const allowedIds = computed(
    () => allowedByWorkspace.value[workspaceId.value] ?? seededIds
  )
  const privatePacks = computed(
    () => privateByWorkspace.value[workspaceId.value] ?? []
  )
  // Everything this workspace can allow: the registry plus its own packs.
  const catalog = computed(() => [...policyCatalog, ...privatePacks.value])
  const allowedModelFiles = computed(() =>
    policyCatalog
      .filter(
        (item) => item.kind === 'models' && allowedIds.value.includes(item.id)
      )
      .flatMap((item) => item.files ?? [])
  )

  function setAllowed(id: string, allowed: boolean) {
    if (!canEdit.value || !catalog.value.some((item) => item.id === id))
      return false
    const next = allowedIds.value.filter((value) => value !== id)
    allowedByWorkspace.value = {
      ...allowedByWorkspace.value,
      [workspaceId.value]: allowed ? [...next, id] : next
    }
    return true
  }

  function isAllowed(id: string) {
    return allowedIds.value.includes(id)
  }

  function slugOf(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // A private pack is allowed for every project the moment it lands.
  function importPrivatePack(name: string, source: PrivatePackSource) {
    const trimmed = name.trim()
    if (!canEdit.value || !trimmed) return false
    const id = `private-${slugOf(trimmed)}`
    if (catalog.value.some((item) => item.id === id)) return false
    const pack: PolicyItem = {
      id,
      kind: 'nodes',
      name: trimmed,
      publisher: personas.currentWorkspace?.name ?? '',
      license: 'Private',
      version: source.kind === 'repo' ? 'main' : '1.0.0',
      installs: 0,
      allowed: true,
      private: true
    }
    privateByWorkspace.value = {
      ...privateByWorkspace.value,
      [workspaceId.value]: [...privatePacks.value, pack]
    }
    allowedByWorkspace.value = {
      ...allowedByWorkspace.value,
      [workspaceId.value]: [...allowedIds.value, id]
    }
    return true
  }

  return {
    allowedIds,
    allowedModelFiles,
    canEdit,
    catalog,
    privatePacks,
    setAllowed,
    isAllowed,
    importPrivatePack
  }
})
