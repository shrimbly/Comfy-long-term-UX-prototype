// Implements:
//   concept: ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — the
//            incompatible workflow the demo drops in
//
// matte_pass as a real ComfyUI workflow: a Flux dev product shot with the
// customer's hero LoRA, then background removal (comfyui-rmbg) and an edge
// refine (acme-matte-tools). On Comfy Cloud both packs and both models are
// missing, so the editor draws those four nodes red.

import type { ComfyWorkflowJSON } from '@/platform/workflow/validation/schemas/workflowSchema'

const PROMPT =
  'studio product shot of a frosted glass perfume bottle on a seamless warm grey backdrop, soft rim light, hero three-quarter angle, acme brand look'

function properties(type: string, pack?: { id: string; ver: string }) {
  return {
    ...(pack ? { cnr_id: pack.id, ver: pack.ver } : {}),
    'Node name for S&R': type
  }
}

const RMBG_PACK = { id: 'comfyui-rmbg', ver: '2.9.3' }
const MATTE_PACK = { id: 'acme-matte-tools', ver: '1.4.0' }

export const MATTE_PASS_GRAPH: ComfyWorkflowJSON = {
  last_node_id: 13,
  last_link_id: 14,
  nodes: [
    {
      id: 1,
      type: 'UNETLoader',
      pos: [40, 60],
      size: [320, 110],
      flags: {},
      order: 0,
      mode: 0,
      inputs: [],
      outputs: [{ name: 'MODEL', type: 'MODEL', links: [1], slot_index: 0 }],
      properties: properties('UNETLoader'),
      widgets_values: ['flux1-dev-fp8.safetensors', 'fp8_e4m3fn']
    },
    {
      id: 2,
      type: 'LoraLoaderModelOnly',
      pos: [400, 60],
      size: [320, 110],
      flags: {},
      order: 4,
      mode: 0,
      inputs: [{ name: 'model', type: 'MODEL', link: 1 }],
      outputs: [{ name: 'MODEL', type: 'MODEL', links: [2], slot_index: 0 }],
      properties: properties('LoraLoaderModelOnly'),
      widgets_values: ['acme_hero_lora_v5.safetensors', 0.85]
    },
    {
      id: 3,
      type: 'DualCLIPLoader',
      pos: [40, 230],
      size: [320, 130],
      flags: {},
      order: 1,
      mode: 0,
      inputs: [],
      outputs: [{ name: 'CLIP', type: 'CLIP', links: [3, 4], slot_index: 0 }],
      properties: properties('DualCLIPLoader'),
      widgets_values: [
        'clip_l.safetensors',
        't5xxl_fp8_e4m3fn.safetensors',
        'flux'
      ]
    },
    {
      id: 4,
      type: 'CLIPTextEncode',
      pos: [400, 230],
      size: [380, 180],
      flags: {},
      order: 5,
      mode: 0,
      inputs: [{ name: 'clip', type: 'CLIP', link: 3 }],
      outputs: [
        {
          name: 'CONDITIONING',
          type: 'CONDITIONING',
          links: [5],
          slot_index: 0
        }
      ],
      properties: properties('CLIPTextEncode'),
      widgets_values: [PROMPT]
    },
    {
      id: 5,
      type: 'FluxGuidance',
      pos: [820, 230],
      size: [270, 60],
      flags: {},
      order: 7,
      mode: 0,
      inputs: [{ name: 'conditioning', type: 'CONDITIONING', link: 5 }],
      outputs: [
        {
          name: 'CONDITIONING',
          type: 'CONDITIONING',
          links: [6],
          slot_index: 0
        }
      ],
      properties: properties('FluxGuidance'),
      widgets_values: [3.5]
    },
    {
      id: 6,
      type: 'CLIPTextEncode',
      pos: [400, 450],
      size: [380, 140],
      flags: {},
      order: 6,
      mode: 0,
      inputs: [{ name: 'clip', type: 'CLIP', link: 4 }],
      outputs: [
        {
          name: 'CONDITIONING',
          type: 'CONDITIONING',
          links: [7],
          slot_index: 0
        }
      ],
      properties: properties('CLIPTextEncode'),
      widgets_values: ['']
    },
    {
      id: 7,
      type: 'EmptySD3LatentImage',
      pos: [40, 420],
      size: [320, 110],
      flags: {},
      order: 2,
      mode: 0,
      inputs: [],
      outputs: [{ name: 'LATENT', type: 'LATENT', links: [8], slot_index: 0 }],
      properties: properties('EmptySD3LatentImage'),
      widgets_values: [1024, 1024, 1]
    },
    {
      id: 8,
      type: 'KSampler',
      pos: [1130, 60],
      size: [320, 470],
      flags: {},
      order: 8,
      mode: 0,
      inputs: [
        { name: 'model', type: 'MODEL', link: 2 },
        { name: 'positive', type: 'CONDITIONING', link: 6 },
        { name: 'negative', type: 'CONDITIONING', link: 7 },
        { name: 'latent_image', type: 'LATENT', link: 8 }
      ],
      outputs: [{ name: 'LATENT', type: 'LATENT', links: [9], slot_index: 0 }],
      properties: properties('KSampler'),
      widgets_values: [
        431829657120233,
        'randomize',
        24,
        1,
        'euler',
        'simple',
        1
      ]
    },
    {
      id: 9,
      type: 'VAELoader',
      pos: [40, 580],
      size: [320, 60],
      flags: {},
      order: 3,
      mode: 0,
      inputs: [],
      outputs: [{ name: 'VAE', type: 'VAE', links: [10], slot_index: 0 }],
      properties: properties('VAELoader'),
      widgets_values: ['ae.safetensors']
    },
    {
      id: 10,
      type: 'VAEDecode',
      pos: [1490, 60],
      size: [210, 50],
      flags: {},
      order: 9,
      mode: 0,
      inputs: [
        { name: 'samples', type: 'LATENT', link: 9 },
        { name: 'vae', type: 'VAE', link: 10 }
      ],
      outputs: [{ name: 'IMAGE', type: 'IMAGE', links: [11], slot_index: 0 }],
      properties: properties('VAEDecode'),
      widgets_values: []
    },
    {
      id: 11,
      type: 'RMBG',
      pos: [1490, 170],
      size: [270, 110],
      flags: {},
      order: 10,
      mode: 0,
      inputs: [{ name: 'image', type: 'IMAGE', link: 11 }],
      outputs: [
        { name: 'IMAGE', type: 'IMAGE', links: [12], slot_index: 0 },
        { name: 'MASK', type: 'MASK', links: [13], slot_index: 1 }
      ],
      properties: properties('RMBG', RMBG_PACK),
      widgets_values: ['RMBG-2.0', 1]
    },
    {
      id: 12,
      type: 'AcmeMatteRefine',
      pos: [1800, 60],
      size: [290, 110],
      flags: {},
      order: 11,
      mode: 0,
      inputs: [
        { name: 'image', type: 'IMAGE', link: 12 },
        { name: 'mask', type: 'MASK', link: 13 }
      ],
      outputs: [{ name: 'IMAGE', type: 'IMAGE', links: [14], slot_index: 0 }],
      properties: properties('AcmeMatteRefine', MATTE_PACK),
      widgets_values: [2, true]
    },
    {
      id: 13,
      type: 'SaveImage',
      pos: [1800, 220],
      size: [320, 360],
      flags: {},
      order: 12,
      mode: 0,
      inputs: [{ name: 'images', type: 'IMAGE', link: 14 }],
      outputs: [],
      properties: properties('SaveImage'),
      widgets_values: ['matte_pass']
    }
  ],
  links: [
    [1, 1, 0, 2, 0, 'MODEL'],
    [2, 2, 0, 8, 0, 'MODEL'],
    [3, 3, 0, 4, 0, 'CLIP'],
    [4, 3, 0, 6, 0, 'CLIP'],
    [5, 4, 0, 5, 0, 'CONDITIONING'],
    [6, 5, 0, 8, 1, 'CONDITIONING'],
    [7, 6, 0, 8, 2, 'CONDITIONING'],
    [8, 7, 0, 8, 3, 'LATENT'],
    [9, 8, 0, 10, 0, 'LATENT'],
    [10, 9, 0, 10, 1, 'VAE'],
    [11, 10, 0, 11, 0, 'IMAGE'],
    [12, 11, 0, 12, 0, 'IMAGE'],
    [13, 11, 1, 12, 1, 'MASK'],
    [14, 12, 0, 13, 0, 'IMAGE']
  ],
  groups: [],
  config: {},
  extra: { ds: { scale: 0.62, offset: [60, 130] } },
  version: 0.4
}
