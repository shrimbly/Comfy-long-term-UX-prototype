import { describe, expect, it } from 'vitest'
import { usePrototypePersonaStore } from './personaStore'
import { usePrototypePolicyStore } from './policyStore'

describe('workspace policies', () => {
  it('keeps changes within the selected workspace', () => {
    const personas = usePrototypePersonaStore()
    const policies = usePrototypePolicyStore()
    const workspace = personas.fixture.currentWorkspaceId
    expect(policies.setAllowed('flux1-dev-fp8', false)).toBe(true)
    expect(policies.allowedModelFiles).not.toContain(
      'flux1-dev-fp8.safetensors'
    )
    personas.setCurrentWorkspace('ws-personal')
    expect(policies.allowedModelFiles).toContain('flux1-dev-fp8.safetensors')
    personas.setCurrentWorkspace(workspace)
    expect(policies.allowedModelFiles).not.toContain(
      'flux1-dev-fp8.safetensors'
    )
    policies.setAllowed('flux1-dev-fp8', true)
    expect(policies.allowedModelFiles).toContain('flux1-dev-fp8.safetensors')
  })

  it('does not let a member change the allowlist', () => {
    const personas = usePrototypePersonaStore()
    const policies = usePrototypePolicyStore()
    personas.setPersona('workspace-member')
    const before = [...policies.allowedIds]
    expect(policies.canEdit).toBe(false)
    expect(policies.setAllowed('flux1-dev-fp8', false)).toBe(false)
    expect(policies.allowedIds).toEqual(before)
  })
})
