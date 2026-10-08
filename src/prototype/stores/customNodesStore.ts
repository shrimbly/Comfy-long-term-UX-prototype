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

import { useHomesteadStore } from '../homestead/store'
import { useIntervalFn } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'

import { DEMO_BUILD_MS } from '../fixtures/customCloud'
import { NODE_PACK_DETAILS, SEEDED_PINS } from '../fixtures/nodePacks'
import { policyCatalog } from '../fixtures/policyCatalog'
import type { PersonaFixture } from '../types'
import {
  ANY_LICENSE,
  changeTarget,
  filterRows,
  packRows,
  pinsAfter,
  sortRows
} from '../utils/customNodes'
import type { PackChange, PackSort, PackStatus } from '../utils/customNodes'
import {
  buildProgress,
  nextRelease,
  simulatedSeconds
} from '../utils/deployment'
import { usePrototypeCustomCloudStore } from './customCloudStore'
import { usePrototypePersonaStore } from './personaStore'
import { usePrototypePolicyStore } from './policyStore'

interface Rebuild {
  deploymentId: string
  release: string
  changes: PackChange[]
  startedAt: number
  fixture: PersonaFixture
}

// A release adds one or more packs, or changes one pack's version.
interface ReadyRelease {
  deploymentName: string
  release: string
  kind: PackChange['kind']
  packNames: string[]
  version: string
}

function packName(packId: string) {
  return policyCatalog.find((item) => item.id === packId)?.name ?? packId
}

export const usePrototypeCustomNodesStore = defineStore(
  'prototype-custom-nodes',
  () => {
    const personaStore = usePrototypePersonaStore()
    const homestead = useHomesteadStore()
    const customCloud = usePrototypeCustomCloudStore()
    const policies = usePrototypePolicyStore()

    const isOpen = ref(false)
    const query = ref('')
    const status = ref<PackStatus>('all')
    const license = ref(ANY_LICENSE)
    const sort = ref<PackSort>('installs')
    const pinsByDeployment = ref<Record<string, Record<string, string>>>(
      structuredClone(SEEDED_PINS)
    )
    const drafts = ref<Record<string, string | null>>({})
    const requested = ref<string[]>([])
    // Packs ticked to install together.
    const selected = ref<string[]>([])
    const buildMode = ref<'create' | 'update'>('update')
    const buildName = ref('')
    const privateArchives = ref<string[]>([])
    const archiveError = ref(false)
    const selectedCount = computed(
      () => selected.value.length + privateArchives.value.length
    )
    function addArchives(files: File[]) {
      archiveError.value = files.some(
        (file) => !/\.(zip|tar\.gz)$/i.test(file.name) || file.size === 0
      )
      if (archiveError.value) return
      privateArchives.value = [
        ...new Set([
          ...privateArchives.value,
          ...files.map((file) => file.name)
        ])
      ]
    }
    function clearSelection() {
      selected.value = []
      privateArchives.value = []
      archiveError.value = false
    }
    function setBuildMode(mode: 'create' | 'update') {
      buildMode.value = mode
      buildName.value =
        mode === 'create'
          ? `${homestead.active.name} Cloud`
          : homestead.environment.name
    }
    const pendingChanges = ref<PackChange[] | null>(null)
    const rebuild = shallowRef<Rebuild | null>(null)
    const ready = ref<ReadyRelease | null>(null)
    const now = ref(Date.now())

    const deployment = computed(() => customCloud.currentDeployment)
    const isCustom = computed(
      () => homestead.enabled || deployment.value.kind === 'custom'
    )
    const canInstall = computed(() =>
      homestead.enabled ? homestead.editableBuild : policies.canEdit
    )
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
        building: rebuildHere.value?.changes
      })
    )

    const visibleRows = computed(() =>
      sortRows(
        filterRows(rows.value, {
          query: query.value,
          status: status.value,
          license: license.value
        }),
        sort.value
      )
    )

    const licenses = computed(() =>
      [...new Set(rows.value.map((row) => row.license))].sort()
    )

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
      if (homestead.enabled && homestead.version === 1) {
        homestead.dialog = 'nodesInfo'
        return
      }
      query.value = ''
      status.value = 'all'
      license.value = ANY_LICENSE
      sort.value = 'installs'
      clearSelection()
      setBuildMode(
        homestead.environment.id === 'dep-comfy-cloud' ? 'create' : 'update'
      )
      isOpen.value = true
    }

    function close() {
      isOpen.value = false
      pendingChanges.value = null
    }

    function setSelected(packId: string, on: boolean) {
      selected.value = on
        ? [...new Set([...selected.value, packId])]
        : selected.value.filter((id) => id !== packId)
    }

    function pickDraftVersion(packId: string, version: string | null) {
      drafts.value = { ...drafts.value, [packId]: version }
    }

    function requestInstall() {
      if (!selectedCount.value) return
      if (homestead.enabled) {
        if (
          homestead.version === 1 ||
          !homestead.editableBuild ||
          !buildName.value.trim() ||
          archiveError.value ||
          homestead.build.phase === 'building'
        )
          return
        homestead.selectedPacks = [
          ...selected.value,
          ...privateArchives.value.map((name) => `private:${name}`)
        ]
        homestead.startBuild('manager', {
          ...(buildMode.value === 'create'
            ? { mode: 'create' as const }
            : { mode: 'update' as const, sourceId: homestead.environment.id }),
          name: buildName.value.trim(),
          gpu:
            homestead.environment.gpu === 'Comfy Cloud'
              ? 'RTX PRO 6000'
              : homestead.environment.gpu,
          instructions: ''
        })
        homestead.agentOpen = true
        isOpen.value = false
        return
      }
      pendingChanges.value = selected.value.map((packId) => ({
        kind: 'add',
        packId,
        to: drafts.value[packId] ?? null
      }))
    }

    function requestVersion(packId: string, to: string | null) {
      if (homestead.enabled) return
      const from = rows.value.find((row) => row.id === packId)?.version
      if (!from) return
      const isPinned = packId in pins.value
      if ((to === null && !isPinned) || to === pins.value[packId]) return
      pendingChanges.value = [{ kind: 'change', packId, from, to }]
    }

    function askAdmin() {
      requested.value = [...new Set([...requested.value, ...selected.value])]
      selected.value = []
    }

    const ticker = useIntervalFn(tick, 200, { immediate: false })

    function tick() {
      now.value = Date.now()
      if (progress.value?.done) finishRebuild()
    }

    function confirmRebuild() {
      const changes = pendingChanges.value
      if (!changes?.length || rebuild.value || !isCustom.value) return
      rebuild.value = {
        deploymentId: deployment.value.id,
        release: nextRelease(deployment.value.release),
        changes,
        startedAt: Date.now(),
        fixture: personaStore.fixture
      }
      now.value = Date.now()
      pendingChanges.value = null
      selected.value = []
      ticker.resume()
    }

    function finishRebuild() {
      const active = rebuild.value
      if (!active) return
      ticker.pause()
      const { changes, deploymentId, release } = active
      const packIds = changes.map((change) => change.packId)
      const deployments = active.fixture.deployments ?? []
      active.fixture.deployments = deployments.map((d) =>
        d.id === deploymentId
          ? {
              ...d,
              release,
              nodePacks: [...new Set([...d.nodePacks, ...packIds])]
            }
          : d
      )
      pinsByDeployment.value = {
        ...pinsByDeployment.value,
        [deploymentId]: pinsAfter(
          pinsByDeployment.value[deploymentId] ?? {},
          changes
        )
      }
      const [first] = changes
      ready.value = {
        deploymentName:
          deployments.find((d) => d.id === deploymentId)?.name ?? '',
        release,
        kind: first.kind,
        packNames: packIds.map(packName),
        version: changeTarget(
          first,
          NODE_PACK_DETAILS[first.packId]?.releases[0]?.version ?? ''
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
        pendingChanges.value = null
        selected.value = []
        rebuild.value = null
        ready.value = null
        drafts.value = {}
        requested.value = []
        pinsByDeployment.value = structuredClone(SEEDED_PINS)
      }
    )

    return {
      isOpen,
      query,
      status,
      license,
      sort,
      licenses,
      deployment,
      isCustom,
      canInstall,
      rows,
      visibleRows,
      requested,
      selected,
      selectedCount,
      buildMode,
      buildName,
      privateArchives,
      archiveError,
      addArchives,
      clearSelection,
      setBuildMode,
      pendingChanges,
      rebuild: rebuildHere,
      rebuildChipName,
      progress,
      ready,
      projectsOnDeployment,
      open,
      close,
      pickDraftVersion,
      setSelected,
      requestInstall,
      requestVersion,
      askAdmin,
      confirmRebuild
    }
  }
)
