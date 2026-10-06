import { render, screen } from '@testing-library/vue'
import { getActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'

import enMessages from '@/locales/en/main.json' with { type: 'json' }

import type { Deployment, DeploymentStatus } from '../../types'
import ProjectEnvironmentChip from './ProjectEnvironmentChip.vue'

function deployment(status: DeploymentStatus): Deployment {
  return {
    id: 'dep',
    name: 'Acme Studio pipeline',
    kind: 'custom',
    status,
    nodePacks: [],
    models: []
  }
}

describe('ProjectEnvironmentChip', () => {
  it.for([
    ['ready', 'Acme Studio pipeline'],
    ['asleep', 'Acme Studio pipeline · asleep'],
    ['building', 'Acme Studio pipeline · building']
  ] as const)(
    'shows the status word only when not ready: %s',
    ([status, text]) => {
      const i18n = createI18n({
        legacy: false,
        locale: 'en',
        messages: { en: enMessages }
      })
      render(ProjectEnvironmentChip, {
        props: { deployment: deployment(status) },
        global: { plugins: [getActivePinia()!, i18n] }
      })
      expect(screen.getByText(text)).toBeTruthy()
    }
  )
})
