// Marquee (rubber-band) selection over a container. Mousedown on empty space
// inside the container starts a rectangle; while dragging, every card whose
// `[data-wf-id]` box intersects the rectangle is reported. A mousedown that
// never drags is treated as a click on empty space.
import { ref } from 'vue'

import type { Ref } from 'vue'

const DRAG_THRESHOLD = 5

interface MarqueeOptions {
  onSelect: (ids: string[]) => void
  onClickEmpty: () => void
}

export function useMarquee(
  containerRef: Ref<HTMLElement | null>,
  options: MarqueeOptions
) {
  // Container-relative rectangle for rendering the overlay.
  const rect = ref<{ x: number; y: number; w: number; h: number } | null>(null)

  let startX = 0
  let startY = 0
  let dragging = false

  function onMouseMove(event: MouseEvent) {
    const container = containerRef.value
    if (!container) return
    const dx = event.clientX - startX
    const dy = event.clientY - startY
    if (!dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    dragging = true

    const bounds = container.getBoundingClientRect()
    const x1 = Math.min(startX, event.clientX)
    const y1 = Math.min(startY, event.clientY)
    const x2 = Math.max(startX, event.clientX)
    const y2 = Math.max(startY, event.clientY)
    rect.value = {
      x: x1 - bounds.left,
      y: y1 - bounds.top,
      w: x2 - x1,
      h: y2 - y1
    }

    const ids: string[] = []
    container.querySelectorAll('[data-wf-id]').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.left < x2 && r.right > x1 && r.top < y2 && r.bottom > y1) {
        const id = el.getAttribute('data-wf-id')
        if (id) ids.push(id)
      }
    })
    options.onSelect(ids)
  }

  function onMouseUp() {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    if (!dragging) options.onClickEmpty()
    rect.value = null
    dragging = false
  }

  function onMouseDown(event: MouseEvent) {
    if (event.button !== 0) return
    const target = event.target as HTMLElement | null
    // Started on a card (or its controls) — let the card handle it.
    if (target?.closest('[data-wf-id]')) return
    if (!containerRef.value) return
    startX = event.clientX
    startY = event.clientY
    dragging = false
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return { rect, onMouseDown }
}
