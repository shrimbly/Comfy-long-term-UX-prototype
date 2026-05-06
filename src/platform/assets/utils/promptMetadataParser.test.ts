import { describe, expect, it } from 'vitest'

import { parsePromptMetadata } from './promptMetadataParser'

describe('parsePromptMetadata', () => {
  it('returns null for null/undefined input', () => {
    expect(parsePromptMetadata(null)).toBeNull()
    expect(parsePromptMetadata(undefined)).toBeNull()
  })

  it('returns null for non-object input', () => {
    expect(parsePromptMetadata('string')).toBeNull()
    expect(parsePromptMetadata(42)).toBeNull()
  })

  it('extracts all fields from a complete prompt', () => {
    const promptData = {
      '1': {
        class_type: 'CheckpointLoaderSimple',
        inputs: { ckpt_name: 'models/sd_xl_base_1.0.safetensors' }
      },
      '2': {
        class_type: 'LoraLoader',
        inputs: { lora_name: 'detail_enhancer.safetensors' }
      },
      '3': {
        class_type: 'VAELoader',
        inputs: { vae_name: 'sdxl_vae.safetensors' }
      },
      '4': {
        class_type: 'CLIPTextEncode',
        inputs: { text: 'a beautiful sunset over the ocean' }
      }
    }

    const result = parsePromptMetadata(promptData)
    expect(result).toEqual({
      model: 'sd_xl_base_1.0.safetensors',
      lora: 'detail_enhancer.safetensors',
      vae: 'sdxl_vae.safetensors',
      workflowTitle: null,
      prompt: 'a beautiful sunset over the ocean',
      steps: null,
      seed: null
    })
  })

  it('handles multiple LoRA loaders', () => {
    const promptData = {
      '1': {
        class_type: 'LoraLoader',
        inputs: { lora_name: 'lora_a.safetensors' }
      },
      '2': {
        class_type: 'LoraLoaderModelOnly',
        inputs: { lora_name: 'lora_b.safetensors' }
      }
    }

    const result = parsePromptMetadata(promptData)
    expect(result!.lora).toBe('lora_a.safetensors, lora_b.safetensors')
  })

  it('returns null fields when none are present', () => {
    const promptData = {
      '1': {
        class_type: 'SomeOtherNode',
        inputs: { value: 42 }
      }
    }

    const result = parsePromptMetadata(promptData)
    expect(result).toEqual({
      model: null,
      lora: null,
      vae: null,
      workflowTitle: null,
      prompt: null,
      steps: null,
      seed: null
    })
  })

  it('strips directory paths from model names', () => {
    const promptData = {
      '1': {
        class_type: 'CheckpointLoaderSimple',
        inputs: { ckpt_name: 'z-image\\model.safetensors' }
      }
    }

    const result = parsePromptMetadata(promptData)
    expect(result!.model).toBe('model.safetensors')
  })

  it('ignores linked inputs (array references)', () => {
    const promptData = {
      '1': {
        class_type: 'CLIPTextEncode',
        inputs: { text: ['5', 0], clip: ['3', 0] }
      }
    }

    const result = parsePromptMetadata(promptData)
    expect(result!.prompt).toBeNull()
  })

  it('extracts UNETLoader as model source', () => {
    const promptData = {
      '1': {
        class_type: 'UNETLoader',
        inputs: { unet_name: 'flux1-dev.safetensors' }
      }
    }

    const result = parsePromptMetadata(promptData)
    expect(result!.model).toBe('flux1-dev.safetensors')
  })

  it('extracts model from ImageOnlyCheckpointLoader', () => {
    const promptData = {
      '1': {
        class_type: 'ImageOnlyCheckpointLoader',
        inputs: { ckpt_name: 'svd_xt.safetensors' }
      }
    }

    expect(parsePromptMetadata(promptData)!.model).toBe('svd_xt.safetensors')
  })

  it('extracts model from UnetLoaderGGUF variant', () => {
    const promptData = {
      '1': {
        class_type: 'UnetLoaderGGUF',
        inputs: { unet_name: 'flux1-dev-Q4_0.gguf' }
      }
    }

    expect(parsePromptMetadata(promptData)!.model).toBe('flux1-dev-Q4_0.gguf')
  })

  it('ignores linked array refs for ckpt_name', () => {
    const promptData = {
      '1': {
        class_type: 'CheckpointLoaderSimple',
        inputs: { ckpt_name: ['5', 0] }
      }
    }

    expect(parsePromptMetadata(promptData)!.model).toBeNull()
  })

  it('skips nodes without class_type or inputs', () => {
    const promptData = {
      '1': { class_type: 'CheckpointLoaderSimple' },
      '2': { inputs: { ckpt_name: 'model.safetensors' } },
      '3': {}
    }

    const result = parsePromptMetadata(promptData)
    expect(result).toEqual({
      model: null,
      lora: null,
      vae: null,
      workflowTitle: null,
      prompt: null,
      steps: null,
      seed: null
    })
  })

  it('extracts steps and seed from KSampler', () => {
    const promptData = {
      '1': {
        class_type: 'KSampler',
        inputs: { steps: 20, seed: 42, cfg: 7.5 }
      }
    }

    const result = parsePromptMetadata(promptData)
    expect(result!.steps).toBe(20)
    expect(result!.seed).toBe(42)
  })

  it('extracts steps and seed from KSamplerAdvanced', () => {
    const promptData = {
      '1': {
        class_type: 'KSamplerAdvanced',
        inputs: { steps: 30, seed: 12345 }
      }
    }

    const result = parsePromptMetadata(promptData)
    expect(result!.steps).toBe(30)
    expect(result!.seed).toBe(12345)
  })

  it('ignores linked array refs for steps and seed', () => {
    const promptData = {
      '1': {
        class_type: 'KSampler',
        inputs: { steps: ['5', 0], seed: ['6', 0] }
      }
    }

    const result = parsePromptMetadata(promptData)
    expect(result!.steps).toBeNull()
    expect(result!.seed).toBeNull()
  })

  it('extracts model and prompt from a Bytedance API node', () => {
    const promptData = {
      '25': {
        class_type: 'ByteDanceSeedreamNode',
        _meta: { title: 'ByteDance Seedream 4.5 & 5.0' },
        inputs: {
          model: 'seedream 5.0 lite',
          prompt: 'Refer to the second image and change the style.',
          height: 2048,
          seed: 99,
          image: ['31', 0]
        }
      },
      '40': { class_type: 'SaveImage', inputs: { filename_prefix: 'foo' } }
    }

    const result = parsePromptMetadata(promptData)
    expect(result!.model).toBe('seedream 5.0 lite')
    expect(result!.prompt).toBe(
      'Refer to the second image and change the style.'
    )
    expect(result!.seed).toBe(99)
  })

  it('extracts model and prompt from a Grok API node', () => {
    const promptData = {
      '2': {
        class_type: 'GrokImageNode',
        inputs: {
          model: 'grok-imagine-image-beta',
          aspect_ratio: '1:1',
          prompt: 'Cinematic portrait',
          number_of_images: 1
        }
      }
    }

    const result = parsePromptMetadata(promptData)
    expect(result!.model).toBe('grok-imagine-image-beta')
    expect(result!.prompt).toBe('Cinematic portrait')
  })

  it('does not strip API model strings without paths or weight extensions', () => {
    const promptData = {
      '1': {
        class_type: 'GrokImageNode',
        inputs: { model: 'grok-imagine-image-beta' }
      }
    }
    expect(parsePromptMetadata(promptData)!.model).toBe(
      'grok-imagine-image-beta'
    )
  })

  it('skips negative-titled CLIPTextEncode and prefers positive', () => {
    const promptData = {
      '6': {
        class_type: 'CLIPTextEncode',
        _meta: { title: 'Negative Prompt' },
        inputs: { text: 'low quality, blurry' }
      },
      '7': {
        class_type: 'CLIPTextEncode',
        _meta: { title: 'Positive Prompt' },
        inputs: { text: 'a beautiful sunset' }
      }
    }

    const result = parsePromptMetadata(promptData)
    expect(result!.prompt).toBe('a beautiful sunset')
  })

  it('extracts seed from API nodes outside KSampler', () => {
    const promptData = {
      '1': {
        class_type: 'SomeApiNode',
        inputs: { seed: 1234 }
      }
    }
    expect(parsePromptMetadata(promptData)!.seed).toBe(1234)
  })

  it('ignores graph-link arrays in model input', () => {
    const promptData = {
      '1': {
        class_type: 'KSampler',
        inputs: { model: ['10', 0], steps: 20, seed: 5 }
      }
    }
    const result = parsePromptMetadata(promptData)
    expect(result!.model).toBeNull()
    expect(result!.steps).toBe(20)
    expect(result!.seed).toBe(5)
  })
})
