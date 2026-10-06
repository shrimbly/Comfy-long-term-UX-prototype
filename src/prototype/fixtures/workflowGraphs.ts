// Implements:
//   entity:  ../IA_Plan/wiki/entities/workflow.md
//   decision: prototype/design-decisions.md — 2026-10-07 "Each saved
//             workflow opens its own graph"
//
// A real graph for every saved fixture workflow, so switching tabs changes
// what the editor shows. Each workflow gets one of a few pipelines, picked
// from its name, with its own prompt, seed and size. Every node and model
// is one the in-browser backend serves on Comfy Cloud, so nothing is
// flagged missing.

import type { ComfyWorkflowJSON } from '@/platform/workflow/validation/schemas/workflowSchema'

type Slot = [node: number, slot: number]

interface NodeSpec {
  type: string
  pos: [number, number]
  size: [number, number]
  inputs?: Record<string, Slot>
  outputs?: string[]
  widgets?: (string | number)[]
}

const SLOT_TYPES: Record<string, string> = {
  model: 'MODEL',
  clip: 'CLIP',
  vae: 'VAE',
  conditioning: 'CONDITIONING',
  positive: 'CONDITIONING',
  negative: 'CONDITIONING',
  latent_image: 'LATENT',
  samples: 'LATENT',
  images: 'IMAGE'
}

// Node ids are 1-based positions in `specs`; inputs name the node and output
// slot they come from.
function buildGraph(specs: NodeSpec[], scale: number): ComfyWorkflowJSON {
  const links: [number, number, number, number, number, string][] = []
  const nodes = specs.map((spec, index) => {
    const inputs = Object.entries(spec.inputs ?? {}).map(
      ([name, [from, slot]], inputSlot) => {
        const type = specs[from - 1].outputs?.[slot] ?? SLOT_TYPES[name]
        const id = links.length + 1
        links.push([id, from, slot, index + 1, inputSlot, type])
        return { name, type, link: id }
      }
    )
    return { spec, inputs }
  })
  return {
    last_node_id: specs.length,
    last_link_id: links.length,
    nodes: nodes.map(({ spec, inputs }, index) => ({
      id: index + 1,
      type: spec.type,
      pos: spec.pos,
      size: spec.size,
      flags: {},
      order: index,
      mode: 0,
      inputs,
      outputs: (spec.outputs ?? []).map((type, slot) => ({
        name: type,
        type,
        slot_index: slot,
        links: links
          .filter(
            ([, from, fromSlot]) => from === index + 1 && fromSlot === slot
          )
          .map(([id]) => id)
      })),
      properties: { 'Node name for S&R': spec.type },
      widgets_values: spec.widgets ?? []
    })),
    links,
    groups: [],
    config: {},
    extra: { ds: { scale, offset: [60, 120] } },
    version: 0.4
  }
}

interface Look {
  prompt: string
  seed: number
  prefix: string
}

const NEGATIVE = 'blurry, low quality, watermark, text'

function checkpointGraph(look: Look, sdxl: boolean) {
  const size = sdxl ? 1024 : 512
  return buildGraph(
    [
      {
        type: 'CheckpointLoaderSimple',
        pos: [40, 200],
        size: [320, 100],
        outputs: ['MODEL', 'CLIP', 'VAE'],
        widgets: [
          sdxl
            ? 'sd_xl_base_1.0.safetensors'
            : 'v1-5-pruned-emaonly-fp16.safetensors'
        ]
      },
      {
        type: 'CLIPTextEncode',
        pos: [400, 60],
        size: [420, 180],
        inputs: { clip: [1, 1] },
        outputs: ['CONDITIONING'],
        widgets: [look.prompt]
      },
      {
        type: 'CLIPTextEncode',
        pos: [400, 290],
        size: [420, 140],
        inputs: { clip: [1, 1] },
        outputs: ['CONDITIONING'],
        widgets: [NEGATIVE]
      },
      {
        type: 'EmptyLatentImage',
        pos: [400, 480],
        size: [320, 110],
        outputs: ['LATENT'],
        widgets: [size, size, sdxl ? 4 : 1]
      },
      {
        type: 'KSampler',
        pos: [860, 60],
        size: [320, 270],
        inputs: {
          model: [1, 0],
          positive: [2, 0],
          negative: [3, 0],
          latent_image: [4, 0]
        },
        outputs: ['LATENT'],
        widgets: sdxl
          ? [look.seed, 'randomize', 30, 6.5, 'dpmpp_2m', 'karras', 1]
          : [look.seed, 'randomize', 20, 8, 'euler', 'normal', 1]
      },
      {
        type: 'VAEDecode',
        pos: [1220, 60],
        size: [220, 50],
        inputs: { samples: [5, 0], vae: [1, 2] },
        outputs: ['IMAGE']
      },
      {
        type: 'SaveImage',
        pos: [1480, 60],
        size: [360, 400],
        inputs: { images: [6, 0] },
        widgets: [look.prefix]
      }
    ],
    0.8
  )
}

function zImageGraph(look: Look) {
  return buildGraph(
    [
      {
        type: 'UNETLoader',
        pos: [40, 60],
        size: [320, 90],
        outputs: ['MODEL'],
        widgets: ['z_image_turbo_bf16.safetensors', 'default']
      },
      {
        type: 'ModelSamplingAuraFlow',
        pos: [400, 60],
        size: [280, 60],
        inputs: { model: [1, 0] },
        outputs: ['MODEL'],
        widgets: [3]
      },
      {
        type: 'CLIPLoader',
        pos: [40, 220],
        size: [320, 90],
        outputs: ['CLIP'],
        widgets: ['qwen_3_4b.safetensors', 'lumina2']
      },
      {
        type: 'CLIPTextEncode',
        pos: [400, 180],
        size: [420, 180],
        inputs: { clip: [3, 0] },
        outputs: ['CONDITIONING'],
        widgets: [look.prompt]
      },
      {
        type: 'CLIPTextEncode',
        pos: [400, 400],
        size: [420, 140],
        inputs: { clip: [3, 0] },
        outputs: ['CONDITIONING'],
        widgets: [NEGATIVE]
      },
      {
        type: 'EmptySD3LatentImage',
        pos: [400, 590],
        size: [320, 110],
        outputs: ['LATENT'],
        widgets: [1024, 1024, 1]
      },
      {
        type: 'KSampler',
        pos: [860, 60],
        size: [320, 270],
        inputs: {
          model: [2, 0],
          positive: [4, 0],
          negative: [5, 0],
          latent_image: [6, 0]
        },
        outputs: ['LATENT'],
        widgets: [look.seed, 'randomize', 8, 1, 'res_multistep', 'simple', 1]
      },
      {
        type: 'VAELoader',
        pos: [860, 400],
        size: [320, 60],
        outputs: ['VAE'],
        widgets: ['ae.safetensors']
      },
      {
        type: 'VAEDecode',
        pos: [1220, 60],
        size: [220, 50],
        inputs: { samples: [7, 0], vae: [8, 0] },
        outputs: ['IMAGE']
      },
      {
        type: 'SaveImage',
        pos: [1480, 60],
        size: [360, 400],
        inputs: { images: [9, 0] },
        widgets: [look.prefix]
      }
    ],
    0.7
  )
}

function hiDreamGraph(look: Look, wide: boolean) {
  return buildGraph(
    [
      {
        type: 'UNETLoader',
        pos: [40, 60],
        size: [320, 90],
        outputs: ['MODEL'],
        widgets: ['hidream_i1_dev_fp8.safetensors', 'fp8_e4m3fn']
      },
      {
        type: 'LoraLoaderModelOnly',
        pos: [400, 60],
        size: [320, 90],
        inputs: { model: [1, 0] },
        outputs: ['MODEL'],
        widgets: ['detail_tweaker_xl.safetensors', 0.6]
      },
      {
        type: 'DualCLIPLoader',
        pos: [40, 220],
        size: [320, 110],
        outputs: ['CLIP'],
        widgets: ['clip_l.safetensors', 't5xxl_fp8_e4m3fn.safetensors', 'flux']
      },
      {
        type: 'CLIPTextEncode',
        pos: [400, 200],
        size: [420, 180],
        inputs: { clip: [3, 0] },
        outputs: ['CONDITIONING'],
        widgets: [look.prompt]
      },
      {
        type: 'FluxGuidance',
        pos: [860, 200],
        size: [280, 60],
        inputs: { conditioning: [4, 0] },
        outputs: ['CONDITIONING'],
        widgets: [3.5]
      },
      {
        type: 'CLIPTextEncode',
        pos: [400, 420],
        size: [420, 140],
        inputs: { clip: [3, 0] },
        outputs: ['CONDITIONING'],
        widgets: ['']
      },
      {
        type: 'EmptySD3LatentImage',
        pos: [400, 610],
        size: [320, 110],
        outputs: ['LATENT'],
        widgets: wide ? [1344, 768, 1] : [896, 1152, 1]
      },
      {
        type: 'KSampler',
        pos: [1180, 60],
        size: [320, 270],
        inputs: {
          model: [2, 0],
          positive: [5, 0],
          negative: [6, 0],
          latent_image: [7, 0]
        },
        outputs: ['LATENT'],
        widgets: [look.seed, 'randomize', 28, 1, 'euler', 'beta', 1]
      },
      {
        type: 'VAELoader',
        pos: [1180, 400],
        size: [320, 60],
        outputs: ['VAE'],
        widgets: ['ae.safetensors']
      },
      {
        type: 'VAEDecode',
        pos: [1540, 60],
        size: [220, 50],
        inputs: { samples: [8, 0], vae: [9, 0] },
        outputs: ['IMAGE']
      },
      {
        type: 'SaveImage',
        pos: [1800, 60],
        size: [360, 400],
        inputs: { images: [10, 0] },
        widgets: [look.prefix]
      }
    ],
    0.6
  )
}

function hash(text: string) {
  let value = 2166136261
  for (const char of text) {
    value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0
  }
  return value
}

const PIPELINES = [
  (look: Look) => zImageGraph(look),
  (look: Look) => hiDreamGraph(look, true),
  (look: Look) => checkpointGraph(look, true),
  (look: Look) => hiDreamGraph(look, false),
  (look: Look) => checkpointGraph(look, false)
]

// The saved workflow's own graph: same name, same graph, every time.
export function savedWorkflowGraph(workflow: {
  id: string
  name: string
}): ComfyWorkflowJSON {
  const seed = hash(workflow.id)
  const subject = workflow.name.replace(/\s+[—–-]\s+/g, ', ').toLowerCase()
  const look = {
    prompt: `${subject}, professional photography, detailed, sharp focus, natural light`,
    seed,
    prefix: workflow.name.replace(/[^\w]+/g, '_').replace(/^_|_$/g, '')
  }
  return PIPELINES[seed % PIPELINES.length](look)
}
