type PolicyKind = 'nodes' | 'models'

export interface PolicyItem {
  id: string
  kind: PolicyKind
  name: string
  publisher: string
  license: string
  version: string
  installs: number
  allowed: boolean
  files?: string[]
  // Imported by the workspace, not from the registry.
  private?: boolean
}

export const policyCatalog: PolicyItem[] = [
  {
    id: 'comfyui-kjnodes',
    kind: 'nodes',
    name: 'ComfyUI-KJNodes',
    publisher: 'Kijai',
    license: 'GPL-3.0',
    version: '1.5.0',
    installs: 4500000,
    allowed: true
  },
  {
    id: 'rgthree-comfy',
    kind: 'nodes',
    name: 'rgthree-comfy',
    publisher: 'rgthree',
    license: 'MIT',
    version: '1.0.0',
    installs: 4100000,
    allowed: true
  },
  {
    id: 'comfyui-easy-use',
    kind: 'nodes',
    name: 'ComfyUI-Easy-Use',
    publisher: 'yolain',
    license: 'GPL-3.0',
    version: '1.3.6',
    installs: 3600000,
    allowed: false
  },
  {
    id: 'video-helper',
    kind: 'nodes',
    name: 'ComfyUI-VideoHelperSuite',
    publisher: 'Kosinkadink',
    license: 'GPL-3.0',
    version: '1.7.9',
    installs: 3500000,
    allowed: true
  },
  {
    id: 'impact-pack',
    kind: 'nodes',
    name: 'ComfyUI Impact Pack',
    publisher: 'ltdrdata',
    license: 'GPL-3.0',
    version: '8.28.3',
    installs: 3400000,
    allowed: true
  },
  {
    id: 'essentials',
    kind: 'nodes',
    name: 'ComfyUI Essentials',
    publisher: 'cubiq',
    license: 'MIT',
    version: '1.1.0',
    installs: 3000000,
    allowed: true
  },
  {
    id: 'controlnet-aux',
    kind: 'nodes',
    name: 'comfyui_controlnet_aux',
    publisher: 'Fannovel16',
    license: 'Apache-2.0',
    version: '1.1.5',
    installs: 2700000,
    allowed: false
  },
  {
    id: 'comfyui-gguf',
    kind: 'nodes',
    name: 'ComfyUI-GGUF',
    publisher: 'city96',
    license: 'Apache-2.0',
    version: '1.1.10',
    installs: 2600000,
    allowed: false
  },
  {
    id: 'layer-style',
    kind: 'nodes',
    name: 'ComfyUI LayerStyle',
    publisher: 'chflame163',
    license: 'MIT',
    version: '2.0.40',
    installs: 2100000,
    allowed: false
  },
  {
    id: 'comfyui-rmbg',
    kind: 'nodes',
    name: 'ComfyUI-RMBG',
    publisher: '1038lab',
    license: 'GPL-3.0',
    version: '2.0.0',
    installs: 1800000,
    allowed: true
  },
  {
    id: 'acme-matte-tools',
    kind: 'nodes',
    name: 'Acme Matte Tools',
    publisher: 'Acme Studio',
    license: 'Private',
    version: '1.2.0',
    installs: 0,
    allowed: true
  },
  {
    id: 'z-image',
    kind: 'models',
    name: 'Z-Image Turbo',
    publisher: 'Tongyi',
    license: 'Apache-2.0',
    version: 'BF16',
    installs: 2400000,
    allowed: true,
    files: ['z_image_turbo_bf16.safetensors']
  },
  {
    id: 'flux1-dev-fp8',
    kind: 'models',
    name: 'FLUX.1 dev',
    publisher: 'Black Forest Labs',
    license: 'Custom',
    version: 'FP8',
    installs: 4100000,
    allowed: true,
    files: ['flux1-dev-fp8.safetensors']
  },
  {
    id: 'hidream',
    kind: 'models',
    name: 'HiDream I1 Dev',
    publisher: 'HiDream',
    license: 'MIT',
    version: 'FP8',
    installs: 850000,
    allowed: true,
    files: ['hidream_i1_dev_fp8.safetensors']
  },
  {
    id: 'sdxl',
    kind: 'models',
    name: 'Stable Diffusion XL',
    publisher: 'Stability AI',
    license: 'Open RAIL++',
    version: '1.0',
    installs: 5800000,
    allowed: true,
    files: ['sd_xl_base_1.0.safetensors']
  },
  {
    id: 'sd15',
    kind: 'models',
    name: 'Stable Diffusion 1.5',
    publisher: 'Runway',
    license: 'Open RAIL',
    version: 'FP16',
    installs: 6200000,
    allowed: true,
    files: ['v1-5-pruned-emaonly-fp16.safetensors']
  },
  {
    id: 'detail-tweaker',
    kind: 'models',
    name: 'Detail Tweaker XL',
    publisher: 'Community',
    license: 'Custom',
    version: 'LoRA',
    installs: 180000,
    allowed: true,
    files: ['detail_tweaker_xl.safetensors']
  },
  {
    id: 'acme_hero_lora_v5',
    kind: 'models',
    name: 'Acme Hero',
    publisher: 'Acme Studio',
    license: 'Private',
    version: 'v5',
    installs: 0,
    allowed: true,
    files: ['acme_hero_lora_v5.safetensors']
  },
  {
    id: 'qwen',
    kind: 'models',
    name: 'Qwen 3 4B',
    publisher: 'Qwen',
    license: 'Apache-2.0',
    version: '4B',
    installs: 910000,
    allowed: true,
    files: ['qwen_3_4b.safetensors']
  },
  {
    id: 't5',
    kind: 'models',
    name: 'T5 XXL',
    publisher: 'Google',
    license: 'Apache-2.0',
    version: 'FP8',
    installs: 1200000,
    allowed: true,
    files: ['t5xxl_fp8_e4m3fn.safetensors']
  },
  {
    id: 'clip',
    kind: 'models',
    name: 'CLIP L',
    publisher: 'OpenAI',
    license: 'MIT',
    version: 'ViT-L',
    installs: 3200000,
    allowed: true,
    files: ['clip_l.safetensors']
  },
  {
    id: 'vae',
    kind: 'models',
    name: 'Image VAE',
    publisher: 'Comfy',
    license: 'Custom',
    version: 'FP16',
    installs: 1900000,
    allowed: true,
    files: ['ae.safetensors', 'sdxl_vae.safetensors']
  }
]
