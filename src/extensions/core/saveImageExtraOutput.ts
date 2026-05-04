import type { LGraphNode } from '@/lib/litegraph/src/LGraphNode'
import { setTagsForKey } from '@/platform/assets/composables/useAssetTags'
import type { NodeExecutionOutput } from '@/schemas/apiSchema'
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

const OUTPUT_RESULT_FIELDS = ['images', 'video', 'audio'] as const

function applyTagsFromWidget(
  node: LGraphNode,
  output: NodeExecutionOutput | undefined
): void {
  if (!output) return
  const widget = node.widgets?.find((w) => w.name === TAGS_WIDGET_NAME)
  const tags = widget?.value
  if (!Array.isArray(tags) || tags.length === 0) return

  for (const field of OUTPUT_RESULT_FIELDS) {
    const items = output[field]
    if (!Array.isArray(items)) continue
    for (const item of items) {
      const filename = item?.filename
      if (!filename) continue
      const type = item.type === 'output' ? 'output' : 'input'
      // Recents/jobs view keys assets by bare filename;
      // directory listing keys by `subfolder/filename`. Write both so
      // tags appear in either view.
      setTagsForKey(`${type}:${filename}`, tags)
      if (item.subfolder) {
        setTagsForKey(`${type}:${item.subfolder}/${filename}`, tags)
      }
    }
  }
}

// Use widget values and dates in output filenames

app.registerExtension({
  name: 'Comfy.SaveImageExtraOutput',
  async beforeRegisterNodeDef(
    nodeType: typeof LGraphNode,
    nodeData: ComfyNodeDef
  ) {
    if (saveNodeTypes.has(nodeData.name)) {
      const prevOnExecuted = nodeType.prototype.onExecuted
      nodeType.prototype.onExecuted = function (output: NodeExecutionOutput) {
        prevOnExecuted?.call(this, output)
        applyTagsFromWidget(this as LGraphNode, output)
      }

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
        // Pair a STRING input with the tags widget so connecting an upstream
        // node renders a connection dot beside the widget. Comma-separated
        // input strings are split into tags by WidgetTags.vue.
        if (!node.inputs?.some((i) => i.widget?.name === TAGS_WIDGET_NAME)) {
          const input = node.addInput(TAGS_WIDGET_NAME, 'STRING')
          input.widget = { name: TAGS_WIDGET_NAME }
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
