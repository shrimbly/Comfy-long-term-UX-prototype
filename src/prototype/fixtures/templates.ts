// Implements:
//   ../IA_Plan/wiki/entities/workflow.md — templates are the shipping ComfyUI
//   template-workflows gallery, restored to MVP independent of the deferred
//   Hub (see design-decisions.md 2026-06-17).
//
// Shared global gallery — not persona-scoped. Consumed by the Home featured
// gallery (Templates tab) and the Templates page. Thumbnails are gradient
// placeholders derived from the id (see utils/thumbnail).

import type { WorkflowTemplate } from '../types'

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'tpl-intro-comfy',
    name: 'Intro to Comfy',
    category: 'image',
    author: 'Comfy Org'
  },
  {
    id: 'tpl-comfy-101',
    name: 'Comfy 101',
    category: 'image',
    author: 'Comfy Org'
  },
  {
    id: 'tpl-sdxl-t2i',
    name: 'SDXL Text to Image',
    category: 'image',
    author: 'Comfy Org'
  },
  {
    id: 'tpl-flux-dev',
    name: 'Flux Dev',
    category: 'image',
    author: 'Comfy Org'
  },
  {
    id: 'tpl-multiple-models',
    name: 'Multiple Models',
    category: 'image',
    author: 'Comfy Org'
  },
  {
    id: 'tpl-wan-i2v',
    name: 'Image to Video (Wan)',
    category: 'video',
    author: 'Comfy Org'
  },
  {
    id: 'tpl-ltx-video',
    name: 'LTX Video',
    category: 'video',
    author: 'Comfy Org'
  },
  {
    id: 'tpl-product-animation',
    name: 'Product Animation',
    category: 'video',
    author: 'Community'
  },
  {
    id: 'tpl-canny-controlnet',
    name: 'Canny ControlNet',
    category: 'controlnet',
    author: 'Comfy Org'
  },
  {
    id: 'tpl-depth-to-image',
    name: 'Depth to Image',
    category: 'controlnet',
    author: 'Comfy Org'
  },
  {
    id: 'tpl-upscale-esrgan',
    name: 'Upscale 4x (ESRGAN)',
    category: 'upscaling',
    author: 'Comfy Org'
  },
  {
    id: 'tpl-stable-audio',
    name: 'Text to Audio',
    category: 'audio',
    author: 'Comfy Org'
  },
  {
    id: 'tpl-tripo-3d',
    name: 'Image to 3D (TripoSR)',
    category: '3d',
    author: 'Community'
  }
]
