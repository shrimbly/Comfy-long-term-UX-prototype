import { describe, expect, it } from 'vitest'
import { objectInfo } from './nodeDefs'
import { policyErrors } from './policyValidation'
import type { DeploymentContents } from './nodeDefs'

const contents: DeploymentContents = {
  models: ['flux1-dev-fp8'],
  nodePacks: [],
  allowedModelFiles: ['ae.safetensors']
}

describe('prototype policy enforcement', () => {
  it('filters model choices without removing built-in nodes', () => {
    const definitions = objectInfo(contents)
    expect(definitions.UNETLoader.input?.required?.unet_name[0]).toEqual([])
    expect(definitions.VAELoader.input?.required?.vae_name[0]).toEqual([
      'ae.safetensors'
    ])
    expect(definitions.KSampler).toBeDefined()
    expect(definitions.RMBG).toBeUndefined()
  })

  it('blocks a saved workflow that still contains a disallowed model or pack', () => {
    const errors = policyErrors(
      JSON.stringify({
        prompt: {
          '1': {
            class_type: 'UNETLoader',
            inputs: { unet_name: 'flux1-dev-fp8.safetensors' }
          },
          '2': { class_type: 'RMBG', inputs: {} }
        }
      }),
      contents
    )
    expect(Object.keys(errors)).toEqual(['1', '2'])
  })

  it('allows approved models and does not treat prompt text as a model', () => {
    const errors = policyErrors(
      JSON.stringify({
        prompt: {
          '1': {
            class_type: 'VAELoader',
            inputs: { vae_name: 'ae.safetensors' }
          },
          '2': {
            class_type: 'CLIPTextEncode',
            inputs: { text: 'draw a file named flux1-dev-fp8.safetensors' }
          }
        }
      }),
      contents
    )
    expect(errors).toEqual({})
  })
})
