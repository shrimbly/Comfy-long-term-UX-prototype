// Shared drag state for dragging workflow cards onto a folder. A drag can
// carry one card or a whole multi-selection, so the ids live at module scope
// alongside the geometry + pointer the custom collapsing ghost needs.
import { ref } from 'vue'

interface DragGhostGeometry {
  // The source card's width — the ghost matches it before and after collapse.
  width: number
  // Height of the card's 3:2 thumbnail — the region the ghost collapses away,
  // leaving just the text area.
  thumbHeight: number
}

// The workflow ids being dragged — one, or a whole multi-selection.
const draggingWorkflowIds = ref<string[]>([])
const ghostGeometry = ref<DragGhostGeometry | null>(null)
const pointer = ref({ x: 0, y: 0 })

// A 1×1 transparent pixel that replaces the browser's default drag image, so
// only the custom collapsing ghost is visible.
let transparentPixel: HTMLImageElement | null = null
function emptyDragImage() {
  if (!transparentPixel) {
    const img = new Image()
    img.src =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    transparentPixel = img
  }
  return transparentPixel
}

export function useWorkflowDrag() {
  function startDrag(workflowIds: string[], event: DragEvent) {
    draggingWorkflowIds.value = workflowIds
    pointer.value = { x: event.clientX, y: event.clientY }

    const card = (event.target as HTMLElement | null)?.closest('[data-wf-id]')
    if (card) {
      const width = card.getBoundingClientRect().width
      ghostGeometry.value = { width, thumbHeight: (width * 2) / 3 }
    } else {
      ghostGeometry.value = null
    }

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', workflowIds.join(','))
      event.dataTransfer.setDragImage(emptyDragImage(), 0, 0)
    }
  }

  function updatePointer(x: number, y: number) {
    pointer.value = { x, y }
  }

  function endDrag() {
    draggingWorkflowIds.value = []
    ghostGeometry.value = null
  }

  return {
    draggingWorkflowIds,
    ghostGeometry,
    pointer,
    startDrag,
    updatePointer,
    endDrag
  }
}
