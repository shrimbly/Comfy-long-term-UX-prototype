// Implements:
//   decision: ../IA_Plan/wiki/decisions/custom-nodes-as-configuration.md
//   decision: prototype/design-decisions.md — 2026-10-07 "Custom nodes
//             modal: Platform's table, with pinned versions"
//
// Pure helpers for the editor's Custom nodes modal: the rows of its table,
// and the changes a version pick or an Install makes to a deployment.

import { omit } from 'es-toolkit'

import type { PolicyItem } from '../fixtures/policyCatalog'
import type { NodePackDetails, PackRelease } from '../fixtures/nodePacks'
import type { Deployment } from '../types'

// A version change or a new pack, made by rebuilding the deployment.
// `to: null` follows the latest release.
export type PackChange =
  | { kind: 'add'; packId: string; to: string | null }
  | { kind: 'change'; packId: string; from: string; to: string | null }

export type PackState =
  | 'installed'
  | 'available'
  | 'blocked'
  | 'adding'
  | 'changing'

export interface PackRow {
  id: string
  name: string
  publisher: string
  installs: number
  stars?: number
  repoUrl?: string
  releases: PackRelease[]
  latest: string
  state: PackState
  // The version the row shows: installed, or what Install would add.
  version: string
  pinned: boolean
  // A newer release than the pinned one.
  newer?: string
}

// Counts the way the registry shows them ("4.5M", "1.9k"), floored so a
// pack never rounds up past a threshold it hasn't reached.
export function formatCount(count: number | undefined): string {
  if (count == null) return '—'
  if (count >= 1e6) return `${trimDecimal(count / 1e6)}M`
  if (count >= 1e3) return `${trimDecimal(count / 1e3)}k`
  return String(count)
}

function trimDecimal(value: number): string {
  const fixed = (Math.floor(value * 10) / 10).toFixed(1)
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed
}

export function changeTarget(change: PackChange, latest: string): string {
  return change.to ?? latest
}

interface RowInput {
  catalog: PolicyItem[]
  details: Record<string, NodePackDetails>
  deployment: Deployment
  pins: Record<string, string>
  // Versions picked for packs not installed yet.
  drafts: Record<string, string | null>
  isAllowed: (id: string) => boolean
  // The changes the deployment's next release is building.
  building?: PackChange[]
}

// Installed packs first, then the ones the deployment can add, then the
// ones the workspace policy blocks; most installs first within each.
export function packRows(input: RowInput): PackRow[] {
  const { deployment, pins, drafts, building } = input
  const rows = input.catalog
    .filter((item) => item.kind === 'nodes')
    .map((item): PackRow => {
      const details = input.details[item.id] ?? { releases: [] }
      const latest = details.releases[0]?.version ?? item.version
      const installed = deployment.nodePacks.includes(item.id)
      const pin = installed ? pins[item.id] : drafts[item.id]
      const version = pin ?? latest
      const buildsThis = !!building?.some((c) => c.packId === item.id)
      return {
        id: item.id,
        name: item.name,
        publisher: item.publisher,
        installs: item.installs,
        stars: details.stars,
        repoUrl: details.repo && `https://github.com/${details.repo}`,
        releases: details.releases,
        latest,
        state: buildsThis
          ? installed
            ? 'changing'
            : 'adding'
          : installed
            ? 'installed'
            : input.isAllowed(item.id)
              ? 'available'
              : 'blocked',
        version,
        pinned: !!pin,
        newer: installed && pin && pin !== latest ? latest : undefined
      }
    })
  const order = (row: PackRow) =>
    row.state === 'blocked'
      ? 2
      : row.state === 'available' || row.state === 'adding'
        ? 1
        : 0
  return rows.sort((a, b) => order(a) - order(b) || b.installs - a.installs)
}

// The deployment's pins once its changes are built.
export function pinsAfter(
  pins: Record<string, string>,
  changes: PackChange[]
): Record<string, string> {
  return changes.reduce((next, change) => {
    const rest = omit(next, [change.packId])
    return change.to ? { ...rest, [change.packId]: change.to } : rest
  }, pins)
}
