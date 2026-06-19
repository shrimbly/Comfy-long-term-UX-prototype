// Shared publish-to-project flow. Drives PromoteToProjectDialog and applies
// the chosen outcome — overwrite an existing canonical (new published
// version) or publish as a new canonical — then lands on the destination
// project. Used by the workflow context menu and the project page's draft
// "Publish" action so both surfaces behave identically.
//
// Implements:
//   decision: ../IA_Plan/wiki/decisions/published-workflow-model.md
//   log:      ../prototype/design-decisions.md (2026-06-09 promotion)
import { useToast } from 'primevue/usetoast'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePrototypePersonaStore } from '../stores/personaStore'
import { usePrototypeUiStore } from '../stores/uiStore'

interface PublishPayload {
  projectId: string
  isNewProject: boolean
  targetWorkflowId: string | null
  newName: string | null
}

export function useWorkflowPublish() {
  const { t } = useI18n()
  const toast = useToast()
  const personaStore = usePrototypePersonaStore()
  const uiStore = usePrototypeUiStore()

  const publishSourceId = ref<string | null>(null)

  function openPublish(workflowId: string) {
    publishSourceId.value = workflowId
  }

  function closePublish() {
    publishSourceId.value = null
  }

  function resolveSourceCanonical(workflowId: string) {
    const draft = personaStore.fixture.workflows.find(
      (w) => w.id === workflowId
    )
    const sourceId = draft?.forkedFrom?.workflowId
    return sourceId
      ? personaStore.fixture.workflows.find((w) => w.id === sourceId)
      : undefined
  }

  // The draft awaiting a publish confirmation (overwrite over its source
  // canonical). Drives PublishConfirmDialog.
  const publishConfirmDraftId = ref<string | null>(null)

  const pendingPublish = computed(() => {
    const id = publishConfirmDraftId.value
    if (!id) return null
    const source = resolveSourceCanonical(id)
    if (!source) return null
    const project = personaStore.fixture.projects.find(
      (p) => p.id === source.projectId
    )
    return {
      workflowName: source.name,
      projectName: project?.name ?? '',
      nextVersion: (source.publishedVersions?.length || 1) + 1
    }
  })

  // Publish a draft that is a copy of a project canonical. With a resolvable
  // source we confirm first (the overwrite is ungated and seen by everyone);
  // a draft with no resolvable source (created in-project, or source removed)
  // falls back to the choose-a-destination dialog.
  function publishDraft(workflowId: string) {
    if (!resolveSourceCanonical(workflowId)) {
      openPublish(workflowId)
      return
    }
    publishConfirmDraftId.value = workflowId
  }

  function cancelPublishConfirm() {
    publishConfirmDraftId.value = null
  }

  // Escape hatch from the confirm step: publish as a NEW workflow instead of
  // overwriting the source canonical. Hands off to the choose-a-destination
  // dialog, where the user can pick (or create) a project and name it.
  function publishDraftAsNew() {
    const workflowId = publishConfirmDraftId.value
    publishConfirmDraftId.value = null
    if (workflowId) openPublish(workflowId)
  }

  // Confirmed: overwrite the source canonical in place (appends a published
  // version) and leave the draft where it is — the project link persists.
  function confirmPublishDraft() {
    const workflowId = publishConfirmDraftId.value
    publishConfirmDraftId.value = null
    if (!workflowId) return
    const source = resolveSourceCanonical(workflowId)
    if (!source) return
    if (!personaStore.publishOverWorkflow(workflowId, source.id)) return
    const project = personaStore.fixture.projects.find(
      (p) => p.id === source.projectId
    )
    toast.add({
      severity: 'success',
      summary: t('prototype.promoteToProject.overwriteToastSummary'),
      detail: t('prototype.promoteToProject.overwriteToastDetail', {
        workflow: source.name,
        project: project?.name ?? ''
      }),
      life: 2800
    })
  }

  function onPublished(payload: PublishPayload) {
    const sourceId = publishSourceId.value
    publishSourceId.value = null
    if (!sourceId) return

    const source = personaStore.fixture.workflows.find((w) => w.id === sourceId)
    const project = personaStore.fixture.projects.find(
      (p) => p.id === payload.projectId
    )

    if (payload.targetWorkflowId) {
      // Overwrite an existing canonical with this workflow's content.
      const target = personaStore.fixture.workflows.find(
        (w) => w.id === payload.targetWorkflowId
      )
      const ok = personaStore.publishOverWorkflow(
        sourceId,
        payload.targetWorkflowId
      )
      if (!ok) return
      toast.add({
        severity: 'success',
        summary: t('prototype.promoteToProject.overwriteToastSummary'),
        detail: t('prototype.promoteToProject.overwriteToastDetail', {
          workflow: target?.name ?? source?.name ?? '',
          project: project?.name ?? ''
        }),
        life: 2800
      })
    } else {
      // Publish as a new canonical in the project (named via the dialog). The
      // draft stays in My Workflows and now tracks the new canonical at v1.
      const ok = personaStore.publishAsNewWorkflow(
        sourceId,
        payload.projectId,
        payload.newName ?? undefined
      )
      if (!ok) return
      toast.add({
        severity: 'success',
        summary: t('prototype.promoteToProject.toastSummary'),
        detail: t('prototype.promoteToProject.toastDetail', {
          workflow: source?.name ?? '',
          project: project?.name ?? ''
        }),
        life: 2800
      })
      if (payload.isNewProject) {
        // Brand-new project — open share settings so the user can invite
        // collaborators straight away.
        uiStore.requestShareSettings(payload.projectId)
      }
    }

    uiStore.go({ kind: 'project', projectId: payload.projectId })
  }

  return {
    publishSourceId,
    openPublish,
    closePublish,
    onPublished,
    publishDraft,
    pendingPublish,
    confirmPublishDraft,
    cancelPublishConfirm,
    publishDraftAsNew
  }
}
