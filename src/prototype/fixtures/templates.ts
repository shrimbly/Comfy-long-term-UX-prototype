// Implements:
//   ../IA_Plan/wiki/entities/workflow.md — templates are the shipping ComfyUI
//   template-workflows gallery, restored to MVP independent of the deferred
//   Hub (see design-decisions.md 2026-06-17, 2026-06-18).
//
// Shared global gallery — not persona-scoped. Consumed by the Home featured
// gallery (Templates tab) and the Templates page.
//
// These are REAL upstream templates pulled from Comfy-Org/workflow_templates'
// index.json: `id` is the upstream slug (also the key for the real thumbnail
// media — see utils/thumbnail.ts), `name`/`description`/`model`/`useCases`/
// `popularity` (usage)/`addedAt` (date) are the real values. Curated to ~28
// across the six generation types with a ComfyUI/API runtime mix. Authored
// order = the "Recommended" sort (an editorial interleave, distinct from
// Popular/Newest).

import type { WorkflowTemplate } from '../types'

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'image_z_image_turbo',
    name: 'Z-Image-Turbo Text to Image',
    description:
      'An efficient image generation foundation model with single-stream diffusion transformer; supports English & Chinese.',
    category: 'image',
    model: 'Z-Image-Turbo',
    useCases: ['Text to Image'],
    runtime: 'comfyui',
    popularity: 9813,
    addedAt: '2025-11-27'
  },
  {
    id: 'video_ltx2_3_i2v',
    name: 'LTX-2.3: Image to Video',
    description:
      'Upload an image to generate a video with improved motion consistency and fine details, including enhanced support for portrait formats and audio quality.',
    category: 'video',
    model: 'LTX-2.3',
    useCases: ['Image to Video'],
    runtime: 'comfyui',
    popularity: 7947,
    addedAt: '2026-03-05'
  },
  {
    id: 'api_nano_banana_pro',
    name: 'Nano Banana Pro',
    description:
      'Nano Banana Pro (Gemini 3 Pro Image) — studio-quality 4K image generation and editing with enhanced text rendering and character consistency.',
    category: 'image',
    model: 'Gemini 3 Pro Image',
    provider: 'Google',
    useCases: ['Text to Image'],
    runtime: 'api',
    popularity: 7465,
    addedAt: '2025-11-21'
  },
  {
    id: 'video_wan2_2_14B_i2v',
    name: 'Wan 2.2 14B Image to Video',
    description:
      'Transform static images into dynamic videos with precise motion control and style preservation using Wan 2.2.',
    category: 'video',
    model: 'Wan 2.2',
    useCases: ['Image to Video'],
    runtime: 'comfyui',
    popularity: 4514,
    addedAt: '2025-07-29'
  },
  {
    id: 'api_anthropic_claude',
    name: 'Anthropic Claude',
    description:
      'Input your query or image for analysis. Generate a natural language response powered by Anthropic Claude, supporting both text conversation and image understanding.',
    category: 'llm',
    model: 'Claude',
    provider: 'Anthropic',
    useCases: ['Text Generation'],
    runtime: 'api',
    popularity: 253,
    addedAt: '2026-05-01'
  },
  {
    id: '3d_triposplat_image_to_gaussian_splat',
    name: 'TripoSplat: Image to Gaussian Splat',
    description:
      'Upload a single 2D image. Generate a high-quality 3D Gaussian splat representation with controllable density and budget for rendering.',
    category: '3d',
    model: 'TripoSplat',
    useCases: ['Image to 3D'],
    runtime: 'comfyui',
    popularity: 627,
    addedAt: '2026-06-02'
  },
  {
    id: 'audio_stable_audio_3_medium',
    name: 'Stable Audio 3.0 Medium',
    description:
      'Input a short text idea, optional duration, seed, and category. Generate stereo audio (music, SFX, or instruments) using Stable Audio 3.',
    category: 'audio',
    model: 'Stable Audio',
    useCases: ['Text to Audio'],
    runtime: 'comfyui',
    popularity: 293,
    addedAt: '2026-05-20'
  },
  {
    id: 'image_qwen_image_edit_2509',
    name: 'Qwen Image Edit 2509',
    description:
      'Advanced image editing with multi-image support, improved consistency, and ControlNet integration.',
    category: 'image',
    model: 'Qwen-Image',
    thumbnailVariant: 'compareSlider',
    useCases: ['Image Edit', 'ControlNet'],
    runtime: 'comfyui',
    popularity: 8069,
    addedAt: '2025-09-25'
  },
  {
    id: 'api_grok_video',
    name: 'Grok: Video Generation',
    description:
      'Input text prompts or an initial image frame to generate up to 15-second videos with synchronized audio using the Grok model.',
    category: 'video',
    model: 'Grok',
    useCases: ['Text to Video'],
    runtime: 'api',
    popularity: 3394,
    addedAt: '2026-01-28'
  },
  {
    id: 'utility_seedvr2_image_upscale',
    name: 'SeedVR2: Image Upscale',
    description:
      'Upload an image to upscale it with SeedVR2 and generate a high-definition output.',
    category: 'utility',
    model: 'SeedVR2',
    thumbnailVariant: 'compareSlider',
    useCases: ['Image Upscale'],
    runtime: 'comfyui',
    popularity: 501,
    addedAt: '2026-02-06'
  },
  {
    id: 'image_flux2',
    name: 'Flux.2 Dev',
    description:
      'Generate photorealistic images with multi-reference consistency and professional text rendering.',
    category: 'image',
    model: 'Flux.2',
    thumbnailVariant: 'compareSlider',
    useCases: ['Image Edit'],
    runtime: 'comfyui',
    popularity: 3257,
    addedAt: '2025-11-26'
  },
  {
    id: 'api_elevenlabs_text_to_speech',
    name: 'ElevenLabs: Text to Speech',
    description:
      'Input text to generate speech with ultra-realistic voices, or upload a voice sample to clone it for synthesis.',
    category: 'audio',
    model: 'ElevenLabs',
    provider: 'ElevenLabs',
    useCases: ['Text to Speech'],
    runtime: 'api',
    popularity: 635,
    addedAt: '2026-02-23'
  },
  {
    id: 'api_hunyuan3d_image_to_model',
    name: 'HY 3D: Image to Model',
    description:
      'Upload an image to generate a 3D model with geometry and PBR textures.',
    category: '3d',
    model: 'Hunyuan3D',
    useCases: ['Image to 3D'],
    runtime: 'api',
    popularity: 284,
    addedAt: '2026-05-21'
  },
  {
    id: 'api_bytedance_seedream4',
    name: 'Seedream 4.0: Image Edit',
    description:
      'Multi-modal AI model for text-to-image and image editing. Generate 2K images in under 2 seconds with natural language control.',
    category: 'image',
    model: 'ByteDance Seedream',
    provider: 'ByteDance',
    useCases: ['Image Edit'],
    runtime: 'api',
    popularity: 3207,
    addedAt: '2025-09-11'
  },
  {
    id: 'video_ltx2_3_t2v',
    name: 'LTX-2.3: Text to Video',
    description:
      'Generate a video from a text prompt, optionally using an image for reference, with improved motion, audio, and detail for portrait or landscape formats.',
    category: 'video',
    model: 'LTX-2.3',
    useCases: ['Text to Video'],
    runtime: 'comfyui',
    popularity: 896,
    addedAt: '2026-03-05'
  },
  {
    id: 'utility_birefnet_remove_background',
    name: 'BiRefNet: Remove Background',
    description:
      'Upload an image with any background. Generate a version with the background removed and a precision segmentation mask.',
    category: 'utility',
    model: 'BiRefNet',
    thumbnailVariant: 'compareSlider',
    useCases: ['Remove Background'],
    runtime: 'comfyui',
    popularity: 232,
    addedAt: '2026-05-10'
  },
  {
    id: 'audio_ace_step1_5_xl_turbo',
    name: 'ACE-Step 1.5XL Turbo: Text to Music',
    description:
      'Generate high-quality music from text prompts using the distilled ACE-Step model. Produces commercial-ready audio in just 8 inference steps.',
    category: 'audio',
    model: 'ACE-Step',
    useCases: ['Text to Music'],
    runtime: 'comfyui',
    popularity: 364,
    addedAt: '2026-04-10'
  },
  {
    id: 'llm_qwen3_5_text_gen',
    name: 'Qwen3.5: Text Generation',
    description:
      'Use the Qwen3.5 model to analyze an input image and generate descriptive text prompts — image captioning and reverse prompt engineering.',
    category: 'llm',
    model: 'Qwen3.5',
    useCases: ['Text Generation'],
    runtime: 'comfyui',
    popularity: 234,
    addedAt: '2026-03-27'
  },
  {
    id: 'flux_fill_inpaint_example',
    name: 'Flux.1 Inpaint',
    description: 'Fill missing parts of images using Flux.1 Fill inpainting.',
    category: 'image',
    model: 'Flux.1',
    thumbnailVariant: 'compareSlider',
    useCases: ['Inpainting'],
    runtime: 'comfyui',
    popularity: 660,
    addedAt: '2025-03-01'
  },
  {
    id: 'video_wan2_2_14B_t2v',
    name: 'Wan 2.2 14B Text to Video',
    description:
      'Generate high-quality videos from text prompts with cinematic aesthetic control and dynamic motion generation using Wan 2.2.',
    category: 'video',
    model: 'Wan 2.2',
    useCases: ['Text to Video'],
    runtime: 'comfyui',
    popularity: 530,
    addedAt: '2025-07-29'
  },
  {
    id: 'api_tripo3_1_image_to_model',
    name: 'Tripo H3.1: Image to Model',
    description:
      'Upload a reference image of your object. Generate a high-detail 3D model with dense geometry and PBR-ready materials.',
    category: '3d',
    model: 'Tripo',
    provider: 'Tripo',
    useCases: ['Image to 3D'],
    runtime: 'api',
    popularity: 251,
    addedAt: '2026-05-09'
  },
  {
    id: 'api_grok_text_to_image',
    name: 'Grok: Text to Image',
    description:
      'Input text prompts to generate high-quality images quickly using the Grok model.',
    category: 'image',
    model: 'Grok',
    provider: 'Grok',
    useCases: ['Text to Image'],
    runtime: 'api',
    popularity: 1224,
    addedAt: '2026-01-28'
  },
  {
    id: 'utility_void_video_inpainting',
    name: 'VOID: Video Inpainting',
    description:
      'Upload a video and mask the object you want to remove. Generate a clean video with the object and its physical interactions deleted.',
    category: 'utility',
    model: 'VOID',
    thumbnailVariant: 'compareSlider',
    useCases: ['Video Inpainting'],
    runtime: 'comfyui',
    popularity: 213,
    addedAt: '2026-05-14'
  },
  {
    id: 'api_sonilo_t2m',
    name: 'Sonilo: Text to Music',
    description:
      'Generate high-quality, production-ready music from text prompts. Create original soundtracks with streaming playback and precise duration control.',
    category: 'audio',
    model: 'Sonilo',
    provider: 'Sonilo',
    useCases: ['Soundtrack'],
    runtime: 'api',
    popularity: 113,
    addedAt: '2026-04-12'
  },
  {
    id: 'api_rodin3d_gen2_5_image_to_3d',
    name: 'Rodin Gen2.5: Image to Model',
    description:
      'Upload single or multi-view images to create a 3D model with adjustable quality and enhanced texture.',
    category: '3d',
    model: 'Rodin',
    provider: 'Rodin',
    useCases: ['Image to 3D'],
    runtime: 'api',
    popularity: 198,
    addedAt: '2026-05-23'
  },
  {
    id: 'api_google_gemini',
    name: 'Google Gemini',
    description:
      "Experience Google's multimodal AI with Gemini's reasoning capabilities.",
    category: 'llm',
    model: 'Gemini',
    provider: 'Google',
    useCases: ['Text Generation'],
    runtime: 'api',
    popularity: 79,
    addedAt: '2025-03-01'
  },
  {
    id: 'sd3.5_large_canny_controlnet_example',
    name: 'SD3.5 Large Canny ControlNet',
    description:
      'Generate images guided by edge detection using SD 3.5 Canny ControlNet.',
    category: 'image',
    model: 'SD3.5',
    useCases: ['ControlNet'],
    runtime: 'comfyui',
    popularity: 118,
    addedAt: '2025-03-01'
  },
  {
    id: 'utility_moge_depth_estimation',
    name: 'MoGe: Depth Estimation',
    description:
      'Upload a single RGB image to generate a colored depth preview and a raw depth map.',
    category: 'utility',
    model: 'MoGe',
    thumbnailVariant: 'compareSlider',
    useCases: ['Depth Map'],
    runtime: 'comfyui',
    popularity: 102,
    addedAt: '2026-05-20'
  }
]
