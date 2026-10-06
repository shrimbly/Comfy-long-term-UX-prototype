// Implements:
//   decision: prototype/design-decisions.md — 2026-10-07 "Saved workflows
//             open as distinct graphs"
//
// The graph a saved (fixture) workflow opens as in the real editor. Each
// workflow gets one of a few text-to-image setups, picked from its id so it
// always opens the same way, framed by a group titled with its name — so
// switching workflows visibly changes the canvas. Only core nodes and base
// models the in-browser backend serves, so nothing loads red.

import type { TWidgetValue } from '@/lib/litegraph/src/types/widgets'
import type { ComfyWorkflowJSON } from '@/platform/workflow/validation/schemas/workflowSchema'

import type { Workflow } from '../types'

interface Slot {
  name: string
  type: string
}

interface NodeSpec {
  key: string
  type: string
  pos: [number, number]
  size: [number, number]
  inputs?: Slot[]
  outputs?: Slot[]
  widgets: TWidgetValue[]
}

// [from node, from output slot, to node, to input name]
type Wire = [string, number, string, string]

interface GraphShape {
  nodes: NodeSpec[]
  wires: Wire[]
}

const NEGATIVE = 'blurry, low quality, watermark, text, deformed'

const CLIP_IN: Slot[] = [{ name: 'clip', type: 'CLIP' }]
const MODEL_IN: Slot[] = [{ name: 'model', type: 'MODEL' }]
const MODEL_OUT: Slot[] = [{ name: 'MODEL', type: 'MODEL' }]
const CONDITIONING_OUT: Slot[] = [
  { name: 'CONDITIONING', type: 'CONDITIONING' }
]
const LATENT_OUT: Slot[] = [{ name: 'LATENT', type: 'LATENT' }]
const SAMPLER_IN: Slot[] = [
  { name: 'model', type: 'MODEL' },
  { name: 'positive', type: 'CONDITIONING' },
  { name: 'negative', type: 'CONDITIONING' },
  { name: 'latent_image', type: 'LATENT' }
]

function textEncode(
  key: string,
  pos: [number, number],
  text: string
): NodeSpec {
  return {
    key,
    type: 'CLIPTextEncode',
    pos,
    size: [400, 180],
    inputs: CLIP_IN,
    outputs: CONDITIONING_OUT,
    widgets: [text]
  }
}

function sampler(
  key: string,
  pos: [number, number],
  widgets: TWidgetValue[]
): NodeSpec {
  return {
    key,
    type: 'KSampler',
    pos,
    size: [300, 270],
    inputs: SAMPLER_IN,
    outputs: LATENT_OUT,
    widgets
  }
}

function decodeAndSave(x: number, prefix: string): NodeSpec[] {
  return [
    {
      key: 'decode',
      type: 'VAEDecode',
      pos: [x, 40],
      size: [220, 50],
      inputs: [
        { name: 'samples', type: 'LATENT' },
        { name: 'vae', type: 'VAE' }
      ],
      outputs: [{ name: 'IMAGE', type: 'IMAGE' }],
      widgets: []
    },
    {
      key: 'save',
      type: 'SaveImage',
      pos: [x, 140],
      size: [320, 360],
      inputs: [{ name: 'images', type: 'IMAGE' }],
      widgets: [prefix]
    }
  ]
}

function vaeLoader(pos: [number, number]): NodeSpec {
  return {
    key: 'vae',
    type: 'VAELoader',
    pos,
    size: [320, 60],
    outputs: [{ name: 'VAE', type: 'VAE' }],
    widgets: ['ae.safetensors']
  }
}

// SDXL checkpoint, then a second low-denoise pass to refine.
function sdxlRefine(prompt: string, prefix: string): GraphShape {
  return {
    nodes: [
      {
        key: 'ckpt',
        type: 'CheckpointLoaderSimple',
        pos: [40, 200],
        size: [320, 100],
        outputs: [
          { name: 'MODEL', type: 'MODEL' },
          { name: 'CLIP', type: 'CLIP' },
          { name: 'VAE', type: 'VAE' }
        ],
        widgets: ['sd_xl_base_1.0.safetensors']
      },
      textEncode('pos', [400, 40], `${prompt}, cinematic lighting, 35mm`),
      textEncode('neg', [400, 270], NEGATIVE),
      {
        key: 'latent',
        type: 'EmptyLatentImage',
        pos: [400, 500],
        size: [320, 110],
        outputs: LATENT_OUT,
        widgets: [1024, 1024, 1]
      },
      sampler(
        'base',
        [840, 40],
        [48213, 'fixed', 25, 7, 'dpmpp_2m', 'karras', 1]
      ),
      sampler(
        'refine',
        [1180, 40],
        [48213, 'fixed', 15, 5, 'dpmpp_2m_sde', 'karras', 0.45]
      ),
      ...decodeAndSave(1520, prefix)
    ],
    wires: [
      ['ckpt', 0, 'base', 'model'],
      ['ckpt', 0, 'refine', 'model'],
      ['ckpt', 1, 'pos', 'clip'],
      ['ckpt', 1, 'neg', 'clip'],
      ['pos', 0, 'base', 'positive'],
      ['neg', 0, 'base', 'negative'],
      ['pos', 0, 'refine', 'positive'],
      ['neg', 0, 'refine', 'negative'],
      ['latent', 0, 'base', 'latent_image'],
      ['base', 0, 'refine', 'latent_image'],
      ['refine', 0, 'decode', 'samples'],
      ['ckpt', 2, 'decode', 'vae'],
      ['decode', 0, 'save', 'images']
    ]
  }
}

// Z-Image Turbo: few steps, low CFG, portrait frame.
function zImageTurbo(prompt: string, prefix: string): GraphShape {
  return {
    nodes: [
      {
        key: 'unet',
        type: 'UNETLoader',
        pos: [40, 40],
        size: [320, 110],
        outputs: MODEL_OUT,
        widgets: ['z_image_turbo_bf16.safetensors', 'default']
      },
      {
        key: 'shift',
        type: 'ModelSamplingAuraFlow',
        pos: [400, 40],
        size: [300, 60],
        inputs: MODEL_IN,
        outputs: MODEL_OUT,
        widgets: [3]
      },
      {
        key: 'clip',
        type: 'CLIPLoader',
        pos: [40, 200],
        size: [320, 110],
        outputs: [{ name: 'CLIP', type: 'CLIP' }],
        widgets: ['qwen_3_4b.safetensors', 'lumina2']
      },
      textEncode('pos', [400, 150], `${prompt}, soft natural light`),
      textEncode('neg', [400, 380], ''),
      vaeLoader([40, 360]),
      {
        key: 'latent',
        type: 'EmptySD3LatentImage',
        pos: [400, 610],
        size: [320, 110],
        outputs: LATENT_OUT,
        widgets: [832, 1216, 1]
      },
      sampler(
        'sampler',
        [840, 40],
        [7741, 'fixed', 8, 1, 'res_multistep', 'simple', 1]
      ),
      ...decodeAndSave(1180, prefix)
    ],
    wires: [
      ['unet', 0, 'shift', 'model'],
      ['shift', 0, 'sampler', 'model'],
      ['clip', 0, 'pos', 'clip'],
      ['clip', 0, 'neg', 'clip'],
      ['pos', 0, 'sampler', 'positive'],
      ['neg', 0, 'sampler', 'negative'],
      ['latent', 0, 'sampler', 'latent_image'],
      ['sampler', 0, 'decode', 'samples'],
      ['vae', 0, 'decode', 'vae'],
      ['decode', 0, 'save', 'images']
    ]
  }
}

// HiDream with a detail LoRA, wide frame.
function hidreamLora(prompt: string, prefix: string): GraphShape {
  return {
    nodes: [
      {
        key: 'unet',
        type: 'UNETLoader',
        pos: [40, 40],
        size: [320, 110],
        outputs: MODEL_OUT,
        widgets: ['hidream_i1_dev_fp8.safetensors', 'fp8_e4m3fn']
      },
      {
        key: 'lora',
        type: 'LoraLoaderModelOnly',
        pos: [400, 40],
        size: [320, 90],
        inputs: MODEL_IN,
        outputs: MODEL_OUT,
        widgets: ['detail_tweaker_xl.safetensors', 0.6]
      },
      {
        key: 'clip',
        type: 'DualCLIPLoader',
        pos: [40, 200],
        size: [320, 130],
        outputs: [{ name: 'CLIP', type: 'CLIP' }],
        widgets: ['clip_l.safetensors', 't5xxl_fp8_e4m3fn.safetensors', 'sd3']
      },
      textEncode('pos', [400, 170], `${prompt}, wide establishing frame`),
      textEncode('neg', [400, 400], NEGATIVE),
      vaeLoader([40, 380]),
      {
        key: 'latent',
        type: 'EmptySD3LatentImage',
        pos: [400, 630],
        size: [320, 110],
        outputs: LATENT_OUT,
        widgets: [1344, 768, 1]
      },
      sampler(
        'sampler',
        [840, 40],
        [90210, 'fixed', 28, 5, 'uni_pc', 'beta', 1]
      ),
      ...decodeAndSave(1180, prefix)
    ],
    wires: [
      ['unet', 0, 'lora', 'model'],
      ['lora', 0, 'sampler', 'model'],
      ['clip', 0, 'pos', 'clip'],
      ['clip', 0, 'neg', 'clip'],
      ['pos', 0, 'sampler', 'positive'],
      ['neg', 0, 'sampler', 'negative'],
      ['latent', 0, 'sampler', 'latent_image'],
      ['sampler', 0, 'decode', 'samples'],
      ['vae', 0, 'decode', 'vae'],
      ['decode', 0, 'save', 'images']
    ]
  }
}

const SHAPES = [sdxlRefine, zImageTurbo, hidreamLora]

function shapeIndex(id: string) {
  let sum = 0
  for (const char of id) sum += char.charCodeAt(0)
  return sum % SHAPES.length
}

function filenamePrefix(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || 'ComfyUI'
  )
}

function toGraph({ nodes, wires }: GraphShape, title: string) {
  const ids = new Map(nodes.map((node, i) => [node.key, i + 1]))
  const specOf = new Map(nodes.map((node) => [node.key, node]))
  const links = wires.map(([from, fromSlot, to, input], i) => {
    const type = specOf.get(from)?.outputs?.[fromSlot]?.type ?? '*'
    const toSlot = specOf.get(to)?.inputs?.findIndex((s) => s.name === input)
    return {
      id: i + 1,
      from,
      fromSlot,
      to,
      toSlot: toSlot ?? -1,
      type
    }
  })

  const graphNodes = nodes.map((node, i) => ({
    id: i + 1,
    type: node.type,
    pos: node.pos,
    size: node.size,
    flags: {},
    order: i,
    mode: 0,
    inputs: (node.inputs ?? []).map((slot, slotIndex) => ({
      ...slot,
      link:
        links.find((l) => l.to === node.key && l.toSlot === slotIndex)?.id ??
        null
    })),
    outputs: (node.outputs ?? []).map((slot, slotIndex) => ({
      ...slot,
      links: links
        .filter((l) => l.from === node.key && l.fromSlot === slotIndex)
        .map((l) => l.id),
      slot_index: slotIndex
    })),
    properties: { 'Node name for S&R': node.type },
    widgets_values: node.widgets
  }))

  const right = Math.max(...nodes.map((n) => n.pos[0] + n.size[0]))
  const bottom = Math.max(...nodes.map((n) => n.pos[1] + n.size[1]))

  return {
    last_node_id: nodes.length,
    last_link_id: links.length,
    nodes: graphNodes,
    links: links.map((l) => [
      l.id,
      ids.get(l.from) ?? 0,
      l.fromSlot,
      ids.get(l.to) ?? 0,
      l.toSlot,
      l.type
    ]),
    groups: [
      {
        id: 1,
        title,
        bounding: [10, -50, right + 20, bottom + 80],
        color: '#3f789e',
        font_size: 24
      }
    ],
    config: {},
    extra: { ds: { scale: 0.62, offset: [150, 140] } },
    version: 0.4
  } satisfies ComfyWorkflowJSON
}

export function demoWorkflowGraph(
  workflow: Pick<Workflow, 'id' | 'name'>
): ComfyWorkflowJSON {
  const shape = SHAPES[shapeIndex(workflow.id)]
  return toGraph(
    shape(workflow.name, filenamePrefix(workflow.name)),
    workflow.name
  )
}
