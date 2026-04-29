import type { LGraphNode } from '@/lib/litegraph/src/LGraphNode'
import type { ComfyNodeDef } from '@/schemas/nodeDefSchema'
import { applyTextReplacements } from '@/utils/searchAndReplace'
import { resolveTemplateVariables } from '@/utils/templateVariableResolver'

import { app } from '../../scripts/app'

const saveNodeTypes = new Set([
  'SaveImage',
  'SaveVideo',
  'SaveAnimatedWEBP',
  'SaveWEBM',
  'SaveAudio',
  'SaveGLB',
  'SaveAnimatedPNG',
  'CLIPSave',
  'VAESave',
  'ModelSave',
  'LoraSave',
  'SaveLatent'
])

const TAGS_WIDGET_NAME = 'asset_tags'

// Use widget values and dates in output filenames

app.registerExtension({
  name: 'Comfy.SaveImageExtraOutput',
  async beforeRegisterNodeDef(
    nodeType: typeof LGraphNode,
    nodeData: ComfyNodeDef
  ) {
    if (saveNodeTypes.has(nodeData.name)) {
      const onNodeCreated = nodeType.prototype.onNodeCreated
      nodeType.prototype.onNodeCreated = function () {
        const r = onNodeCreated
          ? // @ts-expect-error fixme ts strict error
            onNodeCreated.apply(this, arguments)
          : undefined

        const node = this as LGraphNode
        // @ts-expect-error fixme ts strict error
        const widget = this.widgets.find((w) => w.name === 'filename_prefix')
        if (widget) {
          if (!widget.options) widget.options = {}
          widget.options.templateInput = true
          widget.serializeValue = () => {
            const withTemplateVars = resolveTemplateVariables(
              app.graph,
              node,
              String(widget.value ?? '')
            )
            return applyTextReplacements(app.graph, withTemplateVars)
          }
        }

        // Tag widget for organizing saved assets. Persisted in the workflow,
        // but not sent to the backend (Python SaveImage doesn't accept it).
        if (!node.widgets?.some((w) => w.name === TAGS_WIDGET_NAME)) {
          node.addWidget('tags', TAGS_WIDGET_NAME, [], () => {}, {
            serialize: false
          })
        }

        return r
      }
    } else {
      // When any other node is created add a property to alias the node
      const onNodeCreated = nodeType.prototype.onNodeCreated
      nodeType.prototype.onNodeCreated = function () {
        const r = onNodeCreated
          ? // @ts-expect-error fixme ts strict error
            onNodeCreated.apply(this, arguments)
          : undefined

        if (!this.properties || !('Node name for S&R' in this.properties)) {
          this.addProperty('Node name for S&R', this.constructor.type, 'string')
        }

        return r
      }
    }
  }
})
