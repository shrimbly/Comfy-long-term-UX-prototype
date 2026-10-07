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

const PRIVATE_LICENSE = 'Private'

// A version change or a new pack, made by rebuilding the deployment.
// `to: null` follows the latest release.
export type PackChange =
  | { kind: 'add'; packId: string; to: string | null }
  | { kind: 'change'; packId: string; from: string; to: string | null }

type PackState = 'installed' | 'available' | 'blocked' | 'adding' | 'changing'

export interface PackRow {
  id: string
  name: string
  publisher: string
  license: string
  installs: number
  stars?: number
  repoUrl?: string
  releases: PackRelease[]
  latest: string
  state: PackState
  // Not on the public registry: the workspace's own pack.
  private: boolean
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

// Every node pack in the catalog, as the table shows it on this deployment.
export function packRows(input: RowInput): PackRow[] {
  const { deployment, pins, drafts, building } = input
  return input.catalog
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
        license: item.license,
        installs: item.installs,
        stars: details.stars,
        repoUrl: details.repo && `https://github.com/${details.repo}`,
        releases: details.releases,
        latest,
        private: item.license === PRIVATE_LICENSE,
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
}

export type PackStatus = 'all' | 'installed' | 'available' | 'blocked'
export type PackSort = 'installs' | 'stars' | 'name'

export const ANY_LICENSE = 'all'

interface RowFilter {
  query: string
  status: PackStatus
  license: string
}

function statusOf(row: PackRow): Exclude<PackStatus, 'all'> {
  if (row.state === 'installed' || row.state === 'changing') return 'installed'
  return row.state === 'blocked' ? 'blocked' : 'available'
}

export function filterRows(rows: PackRow[], filter: RowFilter): PackRow[] {
  const needle = filter.query.trim().toLowerCase()
  return rows.filter(
    (row) =>
      (!needle ||
        `${row.name} ${row.publisher}`.toLowerCase().includes(needle)) &&
      (filter.status === 'all' || statusOf(row) === filter.status) &&
      (filter.license === ANY_LICENSE || row.license === filter.license)
  )
}

// Installed packs first, then the workspace's own private packs, then the
// rest; each by the chosen column, most first (names A to Z).
export function sortRows(rows: PackRow[], sort: PackSort): PackRow[] {
  const by: Record<PackSort, (a: PackRow, b: PackRow) => number> = {
    installs: (a, b) => b.installs - a.installs,
    stars: (a, b) => (b.stars ?? -1) - (a.stars ?? -1),
    name: (a, b) => a.name.localeCompare(b.name)
  }
  const rank = (row: PackRow) =>
    statusOf(row) === 'installed' ? 0 : row.private ? 1 : 2
  return [...rows].sort((a, b) => rank(a) - rank(b) || by[sort](a, b))
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

// A private pack the workspace imports itself: a GitHub repository at a
// branch or tag, or an uploaded .zip.
export type PrivatePackSource =
  | { kind: 'github'; url: string; ref: string }
  | { kind: 'zip'; fileName: string }

export interface PrivatePack {
  item: PolicyItem
  details: NodePackDetails
}

const GITHUB_REPO =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i

// "owner/repo" from a GitHub repository URL, or undefined if it isn't one.
export function parseGithubRepo(url: string): string | undefined {
  const match = GITHUB_REPO.exec(url.trim())
  return match ? `${match[1]}/${match[2]}` : undefined
}

function packId(name: string) {
  return `private-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

// The catalog entry and details a private import adds. A repository's
// owner publishes it at the chosen ref; an upload is the workspace's own,
// versioned by the day it was uploaded.
export function privatePack(
  source: PrivatePackSource,
  { workspace, today }: { workspace: string; today: string }
): PrivatePack | undefined {
  if (source.kind === 'zip') {
    const name = source.fileName.replace(/\.zip$/i, '')
    return name
      ? privateEntry({ name, publisher: workspace, version: today, today })
      : undefined
  }
  const repo = parseGithubRepo(source.url)
  if (!repo) return undefined
  const [owner, name] = repo.split('/')
  return privateEntry({
    name,
    publisher: owner,
    version: source.ref.trim() || 'main',
    today,
    repo
  })
}

function privateEntry({
  name,
  publisher,
  version,
  today,
  repo
}: {
  name: string
  publisher: string
  version: string
  today: string
  repo?: string
}): PrivatePack {
  return {
    item: {
      id: packId(name),
      kind: 'nodes',
      name,
      publisher,
      license: PRIVATE_LICENSE,
      version,
      installs: 0,
      allowed: true
    },
    details: { repo, releases: [{ version, date: today }] }
  }
}
