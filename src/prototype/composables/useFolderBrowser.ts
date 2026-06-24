// Single-level folder navigation within one container — My Workflows (the
// Drafts project) or a shared project's published section. `containerId` is
// that container's project id; `workflows` is the full set of workflows in
// the container to organize. Folders are flat (no nesting) in the UI.
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'

import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'
import type { ComputedRef, Ref } from 'vue'
import type { Workflow } from '../types'

export function useFolderBrowser(
  containerId: Ref<string | undefined> | ComputedRef<string | undefined>,
  workflows: Ref<Workflow[]> | ComputedRef<Workflow[]>
) {
  const personaStore = usePrototypePersonaStore()
  const uiStore = usePrototypeUiStore()
  const { fixture } = storeToRefs(personaStore)

  const currentFolderId = ref<string | null>(null)

  const folders = computed(() =>
    (fixture.value.folders ?? []).filter(
      (f) => f.projectId === containerId.value
    )
  )

  const currentFolder = computed(
    () => folders.value.find((f) => f.id === currentFolderId.value) ?? null
  )

  // A folder search result requests its folder be opened on arrival; consume
  // that intent once the matching container resolves.
  watch(
    containerId,
    (id) => {
      if (!id) return
      const folderId = uiStore.consumeFolder(id)
      if (folderId && folders.value.some((f) => f.id === folderId)) {
        currentFolderId.value = folderId
      }
    },
    { immediate: true }
  )

  // Drop back to the root if the container changes or the open folder is gone.
  watch([containerId, folders], () => {
    if (
      currentFolderId.value &&
      !folders.value.some((f) => f.id === currentFolderId.value)
    ) {
      currentFolderId.value = null
    }
  })

  // Workflows at the active level (the container root, or inside the open
  // folder).
  const workflowsHere = computed(() =>
    workflows.value.filter(
      (w) => (w.folderId ?? null) === currentFolderId.value
    )
  )

  function workflowCount(folderId: string): number {
    return workflows.value.filter((w) => w.folderId === folderId).length
  }

  function enterFolder(id: string) {
    currentFolderId.value = id
  }

  function goToRoot() {
    currentFolderId.value = null
  }

  return {
    currentFolderId,
    currentFolder,
    folders,
    workflowsHere,
    workflowCount,
    enterFolder,
    goToRoot
  }
}
