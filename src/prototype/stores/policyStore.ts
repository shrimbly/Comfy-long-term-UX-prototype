import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { policyCatalog } from '../fixtures/policyCatalog'
import { usePrototypePersonaStore } from './personaStore'

export const usePrototypePolicyStore = defineStore('prototype-policy', () => {
  const personas = usePrototypePersonaStore()
  const allowedByWorkspace = ref<Record<string, string[]>>({})
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
  const allowedModelFiles = computed(() =>
    policyCatalog
      .filter(
        (item) => item.kind === 'models' && allowedIds.value.includes(item.id)
      )
      .flatMap((item) => item.files ?? [])
  )

  function setAllowed(id: string, allowed: boolean) {
    if (!canEdit.value || !policyCatalog.some((item) => item.id === id))
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
  return { allowedIds, allowedModelFiles, canEdit, setAllowed, isAllowed }
})
