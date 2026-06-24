// Shared drag state for dragging a workflow card onto a folder. One workflow
// is dragged at a time, so the id lives at module scope.
import { ref } from 'vue'

// The workflow ids being dragged — one, or a whole multi-selection.
const draggingWorkflowIds = ref<string[]>([])

export function useWorkflowDrag() {
  function startDrag(workflowIds: string[], event: DragEvent) {
    draggingWorkflowIds.value = workflowIds
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', workflowIds.join(','))
    }
  }

  function endDrag() {
    draggingWorkflowIds.value = []
  }

  return { draggingWorkflowIds, startDrag, endDrag }
}
