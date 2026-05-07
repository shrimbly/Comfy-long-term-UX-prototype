import { useEventListener } from '@vueuse/core'
import type { Ref } from 'vue'

import { useSharedCanvasPositionConversion } from '@/composables/element/useCanvasPositionConversion'
import { usePragmaticDroppable } from '@/composables/usePragmaticDragAndDrop'
import type { LGraphNode, Point } from '@/lib/litegraph/src/litegraph'
import { LiteGraph } from '@/lib/litegraph/src/litegraph'
import { ASSET_DRAG_MIME } from '@/platform/assets/composables/useAssetDragPreview'
import { useMediaAssetActions } from '@/platform/assets/composables/useMediaAssetActions'
import type { AssetItem } from '@/platform/assets/schemas/assetSchema'
import { useWorkflowService } from '@/platform/workflow/core/services/workflowService'
import { ComfyWorkflow } from '@/platform/workflow/management/stores/workflowStore'
import { app as comfyApp } from '@/scripts/app'
import { useLitegraphService } from '@/services/litegraphService'
import { useAssetsStore } from '@/stores/assetsStore'
import { ComfyModelDef } from '@/stores/modelStore'
import type { ModelNodeProvider } from '@/stores/modelToNodeStore'
import { useModelToNodeStore } from '@/stores/modelToNodeStore'
import { ComfyNodeDefImpl } from '@/stores/nodeDefStore'
import type { RenderedTreeExplorerNode } from '@/types/treeExplorerTypes'

export const useCanvasDrop = (canvasRef: Ref<HTMLCanvasElement | null>) => {
  const modelToNodeStore = useModelToNodeStore()
  const litegraphService = useLitegraphService()
  const workflowService = useWorkflowService()
  const assetActions = useMediaAssetActions()
  const assetsStore = useAssetsStore()

  usePragmaticDroppable(() => canvasRef.value, {
    getDropEffect: (args): Exclude<DataTransfer['dropEffect'], 'none'> =>
      args.source.data.type === 'tree-explorer-node' ? 'copy' : 'move',
    onDrop: async (event) => {
      const loc = event.location.current.input
      const dndData = event.source.data

      if (dndData.type === 'tree-explorer-node') {
        const node = dndData.data as RenderedTreeExplorerNode
        const conv = useSharedCanvasPositionConversion()
        const basePos = conv.clientPosToCanvasPos([loc.clientX, loc.clientY])

        if (node.data instanceof ComfyNodeDefImpl) {
          const nodeDef = node.data
          const pos: Point = [...basePos]
          // Add an offset on y to make sure after adding the node, the cursor
          // is on the node (top left corner)
          pos[1] += LiteGraph.NODE_TITLE_HEIGHT
          litegraphService.addNodeOnGraph(nodeDef, { pos })
        } else if (node.data instanceof ComfyModelDef) {
          const model = node.data
          const pos = basePos
          const nodeAtPos = comfyApp.canvas.graph?.getNodeOnPos(pos[0], pos[1])
          let targetProvider: ModelNodeProvider | null = null
          let targetGraphNode: LGraphNode | null = null
          if (nodeAtPos) {
            const providers = modelToNodeStore.getAllNodeProviders(
              model.directory
            )
            for (const provider of providers) {
              if (provider.nodeDef.name === nodeAtPos.comfyClass) {
                targetGraphNode = nodeAtPos
                targetProvider = provider
              }
            }
          }
          if (!targetGraphNode) {
            const provider = modelToNodeStore.getNodeProvider(model.directory)
            if (provider) {
              targetGraphNode = litegraphService.addNodeOnGraph(
                provider.nodeDef,
                {
                  pos
                }
              )
              targetProvider = provider
            }
          }
          if (targetGraphNode) {
            const widget = targetGraphNode.widgets?.find(
              (widget) => widget.name === targetProvider?.key
            )
            if (widget) {
              widget.value = model.file_name
            }
          }
        } else if (node.data instanceof ComfyWorkflow) {
          const workflow = node.data
          await workflowService.insertWorkflow(workflow, { position: basePos })
        }
      }
    }
  })

  // Native HTML5 drop for media-assets drag.
  // Asset cards initiate drags via native dragstart (pragmatic-drag-and-drop
  // ignores those events). We listen at document/capture so we run before
  // LGraphNode.vue's @drop and can replace its asset on a compatible loader.
  // Accept drops only when the topmost element under the cursor is the canvas
  // itself or a Vue-rendered node overlay. Sidebars, modals, and other
  // pointer-event-auto overlays sit on top of the canvas DOM and must not
  // create nodes.
  const isAssetDragOverCanvas = (event: DragEvent): boolean => {
    if (!event.dataTransfer?.types.includes(ASSET_DRAG_MIME)) return false
    const canvas = canvasRef.value
    if (!canvas) return false
    const el = document.elementFromPoint(event.clientX, event.clientY)
    if (!el) return false
    if (el === canvas) return true
    return el.closest('[data-node-id]') !== null
  }

  useEventListener(
    document,
    'dragover',
    (event: DragEvent) => {
      if (!isAssetDragOverCanvas(event)) return
      event.preventDefault()
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    },
    { capture: true }
  )

  useEventListener(
    document,
    'drop',
    async (event: DragEvent) => {
      if (!isAssetDragOverCanvas(event)) return
      const raw = event.dataTransfer?.getData(ASSET_DRAG_MIME)
      if (!raw) return
      // preventDefault is enough — app.ts's drop handler short-circuits on
      // event.defaultPrevented and LGraphNode.vue's @drop only acts when
      // node.onDragDrop returns true. Avoid stopPropagation so the asset
      // drag-preview's document-level drop cleanup listener still fires.
      event.preventDefault()

      let ids: string[]
      try {
        ids = JSON.parse(raw)
      } catch {
        return
      }
      if (!Array.isArray(ids) || ids.length === 0) return

      const allAssets = [
        ...assetsStore.historyAssets,
        ...assetsStore.inputAssets
      ]
      const byId = new Map(allAssets.map((asset) => [asset.id, asset]))
      const assets = ids
        .map((id) => byId.get(id))
        .filter((asset): asset is AssetItem => Boolean(asset))
      if (assets.length === 0) return

      const conv = useSharedCanvasPositionConversion()
      const basePos = conv.clientPosToCanvasPos([event.clientX, event.clientY])

      // Single-asset drop on an existing compatible loader node replaces its
      // widget value rather than creating a new node.
      if (assets.length === 1) {
        const nodeAtPos = comfyApp.canvas.graph?.getNodeOnPos(
          basePos[0],
          basePos[1]
        )
        if (nodeAtPos && assetActions.applyAssetToNode(nodeAtPos, assets[0])) {
          return
        }
      }

      await assetActions.addMultipleToWorkflow(assets, { basePos })
    },
    { capture: true }
  )
}
