// Implements:
//   concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md
//   decision: ../IA_Plan/wiki/decisions/project-runs-on-shared-deployment.md
//   decision: ../IA_Plan/wiki/decisions/custom-nodes-as-configuration.md
//   decision: prototype/design-decisions.md — 2026-10-07 "Custom nodes
//             modal: Platform's table, with pinned versions"
//   open-q:   who can install packs — working: workspace admins; members
//             ask an admin
//
// The editor's Custom nodes modal (the action bar's extensions button):
// the current project's deployment's packs, what it can add, and what the
// workspace policy blocks. Installing a pack or changing a pinned version
// is a new release of the shared deployment: a confirm, then a background
// build. Runs stay on the current release until the new one is ready.

import { useIntervalFn } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'

import { DEMO_BUILD_MS } from '../fixtures/customCloud'
import { NODE_PACK_DETAILS, SEEDED_PINS } from '../fixtures/nodePacks'
import { policyCatalog } from '../fixtures/policyCatalog'
import type { PersonaFixture } from '../types'
import { changeTarget, packRows, pinsAfter } from '../utils/customNodes'
import type { PackChange } from '../utils/customNodes'
import {
  buildProgress,
  nextRelease,
  simulatedSeconds
} from '../utils/deployment'
import { usePrototypeCustomCloudStore } from './customCloudStore'
import { usePrototypePersonaStore } from './personaStore'
import { usePrototypePolicyStore } from './policyStore'

export type PackFilter = 'all' | 'installed' | 'available'

interface Rebuild {
  deploymentId: string
  release: string
  change: PackChange
  startedAt: number
  fixture: PersonaFixture
}

interface ReadyRelease {
  deploymentName: string
  release: string
  kind: PackChange['kind']
  packName: string
  version: string
}

export const usePrototypeCustomNodesStore = defineStore(
  'prototype-custom-nodes',
  () => {
    const personaStore = usePrototypePersonaStore()
    const customCloud = usePrototypeCustomCloudStore()
    const policies = usePrototypePolicyStore()

    const isOpen = ref(false)
    const filter = ref<PackFilter>('all')
    const query = ref('')
    const showBlocked = ref(false)
    const pinsByDeployment = ref<Record<string, Record<string, string>>>(
      structuredClone(SEEDED_PINS)
    )
    const drafts = ref<Record<string, string | null>>({})
    const requested = ref<string[]>([])
    const pendingChange = ref<PackChange | null>(null)
    const rebuild = shallowRef<Rebuild | null>(null)
    const ready = ref<ReadyRelease | null>(null)
    const now = ref(Date.now())

    const deployment = computed(() => customCloud.currentDeployment)
    const isCustom = computed(() => deployment.value.kind === 'custom')
    const canInstall = computed(() => policies.canEdit)
    const pins = computed(
      () => pinsByDeployment.value[deployment.value.id] ?? {}
    )
    const rebuildHere = computed(() =>
      rebuild.value?.deploymentId === deployment.value.id
        ? rebuild.value
        : undefined
    )

    const rows = computed(() =>
      packRows({
        catalog: policyCatalog,
        details: NODE_PACK_DETAILS,
        deployment: deployment.value,
        pins: pins.value,
        drafts: drafts.value,
        isAllowed: policies.isAllowed,
        building: rebuildHere.value?.change
      })
    )

    const visibleRows = computed(() => {
      const needle = query.value.trim().toLowerCase()
      return rows.value.filter((row) => {
        if (
          needle &&
          !`${row.name} ${row.publisher}`.toLowerCase().includes(needle)
        )
          return false
        if (row.state === 'blocked') return filter.value !== 'installed'
        const installed = row.state === 'installed' || row.state === 'changing'
        if (filter.value === 'installed') return installed
        if (filter.value === 'available') return !installed
        return true
      })
    })

    const progress = computed(() => {
      const active = rebuild.value
      if (!active) return null
      return buildProgress(
        simulatedSeconds(now.value - active.startedAt, DEMO_BUILD_MS)
      )
    })

    // "Acme Studio pipeline v4", for the tab strip's Building chip.
    const rebuildChipName = computed(() => {
      const active = rebuild.value
      const name = (personaStore.fixture.deployments ?? []).find(
        (d) => d.id === active?.deploymentId
      )?.name
      return active && name ? `${name} ${active.release}` : undefined
    })

    // Projects that get the new release, the current one first.
    const projectsOnDeployment = computed(() =>
      personaStore.fixture.projects
        .filter((p) => p.deploymentId === deployment.value.id)
        .sort(
          (a, b) =>
            Number(b.id === customCloud.currentProject?.id) -
            Number(a.id === customCloud.currentProject?.id)
        )
    )

    function open() {
      filter.value = 'all'
      query.value = ''
      showBlocked.value = false
      isOpen.value = true
    }

    function close() {
      isOpen.value = false
      pendingChange.value = null
    }

    function pickDraftVersion(packId: string, version: string | null) {
      drafts.value = { ...drafts.value, [packId]: version }
    }

    function requestInstall(packId: string) {
      pendingChange.value = {
        kind: 'add',
        packId,
        to: drafts.value[packId] ?? null
      }
    }

    function requestVersion(packId: string, to: string | null) {
      const from = rows.value.find((row) => row.id === packId)?.version
      if (!from) return
      const isPinned = packId in pins.value
      if ((to === null && !isPinned) || to === pins.value[packId]) return
      pendingChange.value = { kind: 'change', packId, from, to }
    }

    function askAdmin(packId: string) {
      if (!requested.value.includes(packId))
        requested.value = [...requested.value, packId]
    }

    const ticker = useIntervalFn(tick, 200, { immediate: false })

    function tick() {
      now.value = Date.now()
      if (progress.value?.done) finishRebuild()
    }

    function confirmRebuild() {
      const change = pendingChange.value
      if (!change || rebuild.value || !isCustom.value) return
      rebuild.value = {
        deploymentId: deployment.value.id,
        release: nextRelease(deployment.value.release),
        change,
        startedAt: Date.now(),
        fixture: personaStore.fixture
      }
      now.value = Date.now()
      pendingChange.value = null
      ticker.resume()
    }

    function finishRebuild() {
      const active = rebuild.value
      if (!active) return
      ticker.pause()
      const { change, deploymentId, release } = active
      const deployments = active.fixture.deployments ?? []
      active.fixture.deployments = deployments.map((d) =>
        d.id === deploymentId
          ? {
              ...d,
              release,
              nodePacks: d.nodePacks.includes(change.packId)
                ? d.nodePacks
                : [...d.nodePacks, change.packId]
            }
          : d
      )
      pinsByDeployment.value = {
        ...pinsByDeployment.value,
        [deploymentId]: pinsAfter(
          pinsByDeployment.value[deploymentId] ?? {},
          change
        )
      }
      ready.value = {
        deploymentName:
          deployments.find((d) => d.id === deploymentId)?.name ?? '',
        release,
        kind: change.kind,
        packName:
          policyCatalog.find((item) => item.id === change.packId)?.name ??
          change.packId,
        version: changeTarget(
          change,
          NODE_PACK_DETAILS[change.packId]?.releases[0]?.version ?? ''
        )
      }
      rebuild.value = null
    }

    // Another persona is another account: nothing carries over.
    watch(
      () => personaStore.currentPersonaId,
      () => {
        ticker.pause()
        isOpen.value = false
        pendingChange.value = null
        rebuild.value = null
        ready.value = null
        drafts.value = {}
        requested.value = []
        pinsByDeployment.value = structuredClone(SEEDED_PINS)
      }
    )

    return {
      isOpen,
      filter,
      query,
      showBlocked,
      deployment,
      isCustom,
      canInstall,
      rows,
      visibleRows,
      requested,
      pendingChange,
      rebuild: rebuildHere,
      rebuildChipName,
      progress,
      ready,
      projectsOnDeployment,
      open,
      close,
      pickDraftVersion,
      requestInstall,
      requestVersion,
      askAdmin,
      confirmRebuild
    }
  }
)
