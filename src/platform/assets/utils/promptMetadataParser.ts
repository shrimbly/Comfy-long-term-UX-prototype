export interface PromptMetadata {
  model: string | null
  lora: string | null
  vae: string | null
  workflowTitle: string | null
  prompt: string | null
  steps: number | null
  seed: number | null
}

interface PromptNode {
  class_type?: string
  inputs?: Record<string, unknown>
  _meta?: Record<string, unknown>
}

type PromptData = Record<string, PromptNode>

const PATH_SEPARATOR_RE = /[/\\]/
const WEIGHT_EXTENSION_RE = /\.(safetensors|ckpt|pt|pth|gguf|bin)$/i
const MODEL_INPUT_KEYS = [
  'ckpt_name',
  'unet_name',
  'diffusion_model_name',
  'model_name',
  'model'
] as const

function stripPath(name: string): string {
  const lastSep = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'))
  return lastSep >= 0 ? name.slice(lastSep + 1) : name
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function maybeStripWeightPath(name: string): string {
  if (PATH_SEPARATOR_RE.test(name) || WEIGHT_EXTENSION_RE.test(name)) {
    return stripPath(name)
  }
  return name
}

function isNegativeTitled(node: PromptNode): boolean {
  const title = node._meta?.title
  return typeof title === 'string' && /negative/i.test(title)
}

function extractModel(inputs: Record<string, unknown>): string | null {
  for (const key of MODEL_INPUT_KEYS) {
    const value = inputs[key]
    if (isNonEmptyString(value)) return maybeStripWeightPath(value)
  }
  return null
}

function extractPrompt(node: PromptNode): string | null {
  const inputs = node.inputs
  if (!inputs) return null
  if (isNegativeTitled(node)) return null
  if (node.class_type === 'CLIPTextEncode' && isNonEmptyString(inputs.text)) {
    return inputs.text
  }
  if (isNonEmptyString(inputs.prompt)) return inputs.prompt
  return null
}

export function parsePromptMetadata(
  promptData: unknown
): PromptMetadata | null {
  if (!promptData || typeof promptData !== 'object') return null

  const nodes = promptData as PromptData
  let model: string | null = null
  const loras: string[] = []
  let vae: string | null = null
  let prompt: string | null = null
  let steps: number | null = null
  let seed: number | null = null

  for (const node of Object.values(nodes)) {
    if (!node.class_type || !node.inputs) continue

    if (!model) model = extractModel(node.inputs)

    if (isNonEmptyString(node.inputs.lora_name)) {
      loras.push(maybeStripWeightPath(node.inputs.lora_name))
    }

    if (!vae && isNonEmptyString(node.inputs.vae_name)) {
      vae = maybeStripWeightPath(node.inputs.vae_name)
    }

    if (!prompt) {
      const candidate = extractPrompt(node)
      if (candidate) prompt = candidate
    }

    if (steps === null && typeof node.inputs.steps === 'number') {
      steps = node.inputs.steps
    }
    if (seed === null && typeof node.inputs.seed === 'number') {
      seed = node.inputs.seed
    }
  }

  return {
    model,
    lora: loras.length > 0 ? loras.join(', ') : null,
    vae,
    workflowTitle: null,
    prompt,
    steps,
    seed
  }
}
