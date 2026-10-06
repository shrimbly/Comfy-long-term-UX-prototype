import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  COLD_START_MS,
  installMockBackend,
  onMockRunStateChange,
  setMockDeployment
} from './index'
import type { MockRunState } from './index'

const comfyCloud = { nodePacks: [], models: [], coldStart: false }
const matteBuild = {
  nodePacks: ['comfyui-rmbg', 'acme-matte-tools'],
  models: ['flux1-dev-fp8', 'acme_hero_lora_v5'],
  coldStart: true
}

async function nodeDefs() {
  const res = await fetch('/prototype/api/object_info')
  return res.json()
}

describe('mockBackend', () => {
  beforeAll(() => {
    // happy-dom has no WebSocket; the backend wraps whatever the page has.
    vi.stubGlobal('WebSocket', class {})
    installMockBackend()
  })

  afterEach(() => {
    vi.useRealTimers()
    setMockDeployment(comfyCloud)
  })

  it("serves the current deployment's packs and models as node definitions", async () => {
    setMockDeployment(comfyCloud)
    const cloud = await nodeDefs()
    expect(cloud.AcmeMatteRefine).toBeUndefined()
    expect(cloud.UNETLoader.input.required.unet_name[0]).not.toContain(
      'flux1-dev-fp8.safetensors'
    )

    setMockDeployment(matteBuild)
    const build = await nodeDefs()
    expect(build.AcmeMatteRefine).toBeDefined()
    expect(build.RMBG).toBeDefined()
    expect(build.UNETLoader.input.required.unet_name[0]).toContain(
      'flux1-dev-fp8.safetensors'
    )
  })

  it('accepts a queued prompt and reports a cold start on a custom deployment', async () => {
    vi.useFakeTimers()
    const states: MockRunState[] = []
    const stop = onMockRunStateChange((state) => states.push(state))
    setMockDeployment(matteBuild)

    const res = await fetch('/prototype/api/prompt', {
      method: 'POST',
      body: '{}'
    })
    expect(res.status).toBe(200)
    expect(states).toEqual(['starting'])

    vi.advanceTimersByTime(COLD_START_MS)
    expect(states).toEqual(['starting', 'idle'])
    stop()
  })

  it('runs straight away on Comfy Cloud', async () => {
    const states: MockRunState[] = []
    const stop = onMockRunStateChange((state) => states.push(state))
    setMockDeployment(comfyCloud)

    await fetch('/prototype/api/prompt', { method: 'POST', body: '{}' })

    expect(states).toEqual([])
    stop()
  })
})
