// Implements:
//   decision: ../IA_Plan/wiki/decisions/cloud-only-permissions.md — projects
//             inherit the workspace allowlists and can only narrow them

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePrototypePolicyStore } from '../stores/policyStore'

// Comfy Cloud runs everything it supports unless the workspace policies
// narrow it: a kind is restricted when any catalog item is not allowed.
export function useWorkspaceAllowlist() {
  const { t } = useI18n()
  const policies = usePrototypePolicyStore()

  return computed(() =>
    (['nodes', 'models'] as const).map((kind) => {
      const items = policies.catalog.filter((item) => item.kind === kind)
      const allowed = items
        .filter((item) => policies.isAllowed(item.id))
        .map((item) => item.name)
      return {
        id: kind,
        label: t(
          kind === 'nodes'
            ? 'prototype.projectPage.environmentSheet.customNodes'
            : 'prototype.projectPage.environmentSheet.models'
        ),
        restricted: allowed.length < items.length,
        allowed,
        total: items.length
      }
    })
  )
}
