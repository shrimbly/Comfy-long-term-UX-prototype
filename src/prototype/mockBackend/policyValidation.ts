import { z } from 'zod'
import { objectInfo } from './nodeDefs'
import type { DeploymentContents } from './nodeDefs'

const modelInputs = new Set([
  'ckpt_name',
  'unet_name',
  'clip_name',
  'clip_name1',
  'clip_name2',
  'lora_name',
  'vae_name'
])

const requestSchema = z.object({
  prompt: z.record(
    z.object({ class_type: z.string(), inputs: z.record(z.unknown()) })
  )
})

export function policyErrors(
  body: string | undefined,
  contents: DeploymentContents
) {
  if (!body || !contents.allowedModelFiles) return {}
  let request: unknown
  try {
    request = JSON.parse(body)
  } catch {
    return {}
  }
  const parsed = requestSchema.safeParse(request)
  if (!parsed.success) return {}
  const definitions = objectInfo(contents)
  return Object.fromEntries(
    Object.entries(parsed.data.prompt).flatMap(([id, node]) => {
      const invalid =
        !(node.class_type in definitions) ||
        Object.entries(node.inputs).some(
          ([name, value]) =>
            modelInputs.has(name) &&
            typeof value === 'string' &&
            value.endsWith('.safetensors') &&
            !contents.allowedModelFiles?.includes(value)
        )
      return invalid
        ? [
            [
              id,
              {
                class_type: node.class_type,
                dependent_outputs: [],
                errors: [
                  {
                    type: 'workspace_policy',
                    message: 'Not allowed by workspace policy',
                    details: node.class_type,
                    extra_info: {}
                  }
                ]
              }
            ]
          ]
        : []
    })
  )
}
