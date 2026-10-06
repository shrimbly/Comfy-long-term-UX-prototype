// Implements:
//   concept: ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — what a
//            deployment can run (its node packs and models)
//
// The `/api/object_info` the prototype's in-browser backend serves: the core
// nodes the demo graphs use, plus the two custom packs matte_pass needs.
// Which packs and models appear depends on the current project's deployment,
// so matte_pass loads red on Comfy Cloud and clean on its own build.

import type { ComfyNodeDef } from '@/schemas/nodeDefSchema'

type Inputs = ComfyNodeDef['input']

function nodeDef(
  name: string,
  display_name: string,
  category: string,
  input: Inputs,
  outputs: string[],
  {
    python_module = 'nodes',
    output_node = false,
    description = ''
  }: Partial<
    Pick<ComfyNodeDef, 'python_module' | 'output_node' | 'description'>
  > = {}
): ComfyNodeDef {
  return {
    name,
    display_name,
    category,
    description,
    input,
    output: outputs,
    output_is_list: outputs.map(() => false),
    output_name: outputs,
    output_node,
    python_module,
    deprecated: false,
    experimental: false
  }
}

export interface DeploymentContents {
  nodePacks: string[]
  models: string[]
  allowedModelFiles?: string[]
}

// Model names as the workflows reference them, keyed by the model id a
// deployment lists.
const MODEL_FILES: Record<string, string> = {
  'flux1-dev-fp8': 'flux1-dev-fp8.safetensors',
  acme_hero_lora_v5: 'acme_hero_lora_v5.safetensors'
}

const BASE_DIFFUSION_MODELS = [
  'z_image_turbo_bf16.safetensors',
  'hidream_i1_dev_fp8.safetensors'
]
const BASE_LORAS = ['detail_tweaker_xl.safetensors']

function withModels(base: string[], contents: DeploymentContents) {
  const extra = contents.models
    .map((id) => MODEL_FILES[id])
    .filter((file): file is string => !!file && !base.includes(file))
  return [...base, ...extra]
}

const SAMPLERS = [
  'euler',
  'euler_ancestral',
  'heun',
  'dpmpp_2m',
  'dpmpp_2m_sde',
  'res_multistep',
  'uni_pc'
]
const SCHEDULERS = ['normal', 'karras', 'exponential', 'simple', 'beta']

function coreNodeDefs(contents: DeploymentContents): ComfyNodeDef[] {
  const diffusionModels = withModels(BASE_DIFFUSION_MODELS, contents)
  const loras = withModels(BASE_LORAS, contents)
  return [
    nodeDef(
      'CheckpointLoaderSimple',
      'Load Checkpoint',
      'loaders',
      {
        required: {
          ckpt_name: [
            [
              'v1-5-pruned-emaonly-fp16.safetensors',
              'sd_xl_base_1.0.safetensors'
            ],
            {}
          ]
        }
      },
      ['MODEL', 'CLIP', 'VAE']
    ),
    nodeDef(
      'UNETLoader',
      'Load Diffusion Model',
      'advanced/loaders',
      {
        required: {
          unet_name: [diffusionModels, {}],
          weight_dtype: [['default', 'fp8_e4m3fn', 'fp8_e5m2'], {}]
        }
      },
      ['MODEL']
    ),
    nodeDef(
      'CLIPLoader',
      'Load CLIP',
      'advanced/loaders',
      {
        required: {
          clip_name: [
            ['qwen_3_4b.safetensors', 't5xxl_fp8_e4m3fn.safetensors'],
            {}
          ],
          type: [['lumina2', 'flux', 'sd3', 'stable_diffusion'], {}]
        }
      },
      ['CLIP']
    ),
    nodeDef(
      'DualCLIPLoader',
      'DualCLIPLoader',
      'advanced/loaders',
      {
        required: {
          clip_name1: [
            ['clip_l.safetensors', 't5xxl_fp8_e4m3fn.safetensors'],
            {}
          ],
          clip_name2: [
            ['t5xxl_fp8_e4m3fn.safetensors', 'clip_l.safetensors'],
            {}
          ],
          type: [['flux', 'sdxl', 'sd3', 'hunyuan_video'], {}]
        }
      },
      ['CLIP']
    ),
    nodeDef(
      'FluxGuidance',
      'FluxGuidance',
      'advanced/conditioning/flux',
      {
        required: {
          conditioning: ['CONDITIONING', {}],
          guidance: ['FLOAT', { default: 3.5, min: 0, max: 100, step: 0.1 }]
        }
      },
      ['CONDITIONING']
    ),
    nodeDef(
      'VAELoader',
      'Load VAE',
      'loaders',
      { required: { vae_name: [['ae.safetensors'], {}] } },
      ['VAE']
    ),
    nodeDef(
      'LoraLoaderModelOnly',
      'LoraLoaderModelOnly',
      'loaders',
      {
        required: {
          model: ['MODEL', {}],
          lora_name: [loras, {}],
          strength_model: [
            'FLOAT',
            { default: 1, min: -100, max: 100, step: 0.01 }
          ]
        }
      },
      ['MODEL']
    ),
    nodeDef(
      'ModelSamplingAuraFlow',
      'ModelSamplingAuraFlow',
      'advanced/model',
      {
        required: {
          model: ['MODEL', {}],
          shift: ['FLOAT', { default: 1.73, min: 0, max: 100, step: 0.01 }]
        }
      },
      ['MODEL']
    ),
    nodeDef(
      'CLIPTextEncode',
      'CLIP Text Encode (Prompt)',
      'conditioning',
      {
        required: {
          text: ['STRING', { multiline: true, dynamicPrompts: true }],
          clip: ['CLIP', {}]
        }
      },
      ['CONDITIONING']
    ),
    nodeDef(
      'EmptyLatentImage',
      'Empty Latent Image',
      'latent',
      {
        required: {
          width: ['INT', { default: 512, min: 16, max: 16384, step: 8 }],
          height: ['INT', { default: 512, min: 16, max: 16384, step: 8 }],
          batch_size: ['INT', { default: 1, min: 1, max: 4096 }]
        }
      },
      ['LATENT']
    ),
    nodeDef(
      'EmptySD3LatentImage',
      'EmptySD3LatentImage',
      'latent/sd3',
      {
        required: {
          width: ['INT', { default: 1024, min: 16, max: 16384, step: 16 }],
          height: ['INT', { default: 1024, min: 16, max: 16384, step: 16 }],
          batch_size: ['INT', { default: 1, min: 1, max: 4096 }]
        }
      },
      ['LATENT']
    ),
    nodeDef(
      'KSampler',
      'KSampler',
      'sampling',
      {
        required: {
          model: ['MODEL', {}],
          seed: [
            'INT',
            {
              default: 0,
              min: 0,
              max: 0xfffffffffffff,
              control_after_generate: true
            }
          ],
          steps: ['INT', { default: 20, min: 1, max: 10000 }],
          cfg: ['FLOAT', { default: 8, min: 0, max: 100, step: 0.1 }],
          sampler_name: [SAMPLERS, {}],
          scheduler: [SCHEDULERS, {}],
          positive: ['CONDITIONING', {}],
          negative: ['CONDITIONING', {}],
          latent_image: ['LATENT', {}],
          denoise: ['FLOAT', { default: 1, min: 0, max: 1, step: 0.01 }]
        }
      },
      ['LATENT']
    ),
    nodeDef(
      'VAEDecode',
      'VAE Decode',
      'latent',
      { required: { samples: ['LATENT', {}], vae: ['VAE', {}] } },
      ['IMAGE']
    ),
    nodeDef(
      'SaveImage',
      'Save Image',
      'image',
      {
        required: {
          images: ['IMAGE', {}],
          filename_prefix: ['STRING', { default: 'ComfyUI' }]
        }
      },
      [],
      { output_node: true }
    )
  ]
}

// The custom packs matte_pass needs, by pack id.
const PACK_NODE_DEFS: Record<string, ComfyNodeDef[]> = {
  'comfyui-rmbg': [
    nodeDef(
      'RMBG',
      'Remove Background (RMBG)',
      'image/background',
      {
        required: {
          image: ['IMAGE', {}],
          model: [['RMBG-2.0', 'INSPYRENET', 'BEN2'], {}],
          sensitivity: ['FLOAT', { default: 1, min: 0, max: 1, step: 0.01 }]
        }
      },
      ['IMAGE', 'MASK'],
      { python_module: 'custom_nodes.comfyui-rmbg' }
    )
  ],
  'acme-matte-tools': [
    nodeDef(
      'AcmeMatteRefine',
      'AcmeMatteRefine',
      'acme/matte',
      {
        required: {
          image: ['IMAGE', {}],
          mask: ['MASK', {}],
          edge_feather: ['FLOAT', { default: 2, min: 0, max: 64, step: 0.5 }],
          despill: ['BOOLEAN', { default: true }]
        }
      },
      ['IMAGE'],
      { python_module: 'custom_nodes.acme-matte-tools' }
    )
  ]
}

// Every custom-pack node type, whichever deployment is current.
export const PACK_NODE_TYPES = Object.values(PACK_NODE_DEFS)
  .flat()
  .map((def) => def.name)

export function objectInfo(
  contents: DeploymentContents
): Record<string, ComfyNodeDef> {
  const defs = [
    ...coreNodeDefs(contents),
    ...contents.nodePacks.flatMap((pack) => PACK_NODE_DEFS[pack] ?? [])
  ]
  if (contents.allowedModelFiles) {
    for (const def of defs) {
      for (const input of Object.values(def.input?.required ?? {})) {
        const options = input[0]
        if (
          Array.isArray(options) &&
          options.some(
            (value) =>
              typeof value === 'string' && value.endsWith('.safetensors')
          )
        ) {
          input[0] = options.filter(
            (value) =>
              typeof value === 'string' &&
              contents.allowedModelFiles?.includes(value)
          )
        }
      }
    }
  }
  return Object.fromEntries(defs.map((def) => [def.name, def]))
}
