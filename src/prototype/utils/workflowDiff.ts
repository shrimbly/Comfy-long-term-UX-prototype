// Implements:
//   prototype: semantic workflow diff (prototype/design-decisions.md
//              2026-06-10 semantic workflow diff)
//
// Turns two ComfyUI workflow JSONs into a short, ranked, human summary —
// "Prompt edited · Seed changed · 6 nodes moved" — instead of a raw
// char/line count. Pure, dependency-free, and defensive: arbitrary JSON
// in, never throws.
//
// Design (P1 of the plan):
//   - Normalize: recurse into definitions.subgraphs so nested changes
//     (a seed bump / prompt edit inside a subgraph) are not missed. Strip
//     view-only noise (extra.ds pan/zoom, execution order, link ids).
//   - Match nodes by id within each scope (branches/edits keep ids).
//   - Classify each change into a channel, sub-classifying widget edits
//     semantically (seed / prompt / parameter) via a small node-type
//     dictionary + value heuristics — graceful when a node is unknown.
//   - Summarize into a ranked headline + counts + detail entries.
//
// UI formatting / i18n of the headline is P2; this layer returns plain
// English phrases so it is testable in isolation.

export type DiffChannel =
  | 'added'
  | 'removed'
  | 'rewired'
  | 'widget'
  | 'mode'
  | 'title'
  | 'layout'
  | 'group'

export type WidgetKind = 'seed' | 'prompt' | 'param'

export interface DiffEntry {
  channel: DiffChannel
  // 'root' or a subgraph label, e.g. 'subgraph "Generate"'.
  scope: string
  nodeId?: string
  nodeType?: string
  // Set for channel === 'widget'.
  widgetKind?: WidgetKind
  // Human phrase, e.g. "Seed changed" or "steps 20 → 25".
  label: string
  // Optional before/after text for a rich detail view (e.g. the changed
  // region of an edited prompt). Populated by the UI/P2 layer.
  before?: string
  after?: string
  // For added/removed: true when the node is a subgraph instance (its
  // `type` resolves to a subgraph definition), so the summary can count
  // subgraphs separately from plain nodes.
  isSubgraph?: boolean
}

export interface SemanticDiffCounts {
  added: number
  removed: number
  rewired: number
  prompts: number
  params: number
  seeds: number
  moved: number
  bypassed: number
  renamed: number
  groups: number
}

export interface SemanticDiff {
  headline: string[]
  counts: SemanticDiffCounts
  details: DiffEntry[]
}

// Positional widget names for common node types. Anything not listed
// falls back to value heuristics, so this only needs to cover the
// high-traffic nodes to lift accuracy.
const WIDGET_NAMES: Record<string, readonly string[]> = {
  KSampler: [
    'seed',
    'control_after_generate',
    'steps',
    'cfg',
    'sampler_name',
    'scheduler',
    'denoise'
  ],
  KSamplerAdvanced: [
    'add_noise',
    'noise_seed',
    'control_after_generate',
    'steps',
    'cfg',
    'sampler_name',
    'scheduler',
    'start_at_step',
    'end_at_step',
    'return_with_leftover_noise'
  ],
  CLIPTextEncode: ['text'],
  EmptyLatentImage: ['width', 'height', 'batch_size'],
  PrimitiveInt: ['value'],
  PrimitiveFloat: ['value'],
  PrimitiveString: ['value'],
  CheckpointLoaderSimple: ['ckpt_name'],
  LoraLoader: ['lora_name', 'strength_model', 'strength_clip']
}

const POS_TOLERANCE = 1

// --- defensive narrowing ---------------------------------------------

type Json = unknown
type Rec = Record<string, Json>

function isRecord(v: Json): v is Rec {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function asArray(v: Json): Json[] {
  return Array.isArray(v) ? v : []
}

function asNumberPair(v: Json): [number, number] | null {
  const arr = Array.isArray(v)
    ? v
    : isRecord(v)
      ? [v[0] ?? v.x, v[1] ?? v.y]
      : []
  const x = arr[0]
  const y = arr[1]
  if (typeof x === 'number' && typeof y === 'number') return [x, y]
  return null
}

interface RawNode {
  id: string
  type?: string
  pos?: Json
  size?: Json
  mode?: number
  title?: string
  widgets_values?: Json
}

interface Scope {
  // Stable match key — 'root' or the subgraph id. Subgraph *names* are
  // not unique (a workflow can hold dozens of "New Subgraph"s), so they
  // must never be used to pair before/after scopes.
  key: string
  label: string
  nodes: Map<string, RawNode>
  linkKeys: Set<string>
  groupNames: string[]
}

function toRawNode(v: Json): RawNode | null {
  if (!isRecord(v) || v.id === undefined || v.id === null) return null
  return {
    id: String(v.id),
    type: typeof v.type === 'string' ? v.type : undefined,
    pos: v.pos,
    size: v.size,
    mode: typeof v.mode === 'number' ? v.mode : 0,
    title: typeof v.title === 'string' ? v.title : undefined,
    widgets_values: v.widgets_values
  }
}

function indexNodes(v: Json): Map<string, RawNode> {
  const map = new Map<string, RawNode>()
  for (const raw of asArray(v)) {
    const node = toRawNode(raw)
    if (node) map.set(node.id, node)
  }
  return map
}

// ComfyUI links are arrays [id, srcNode, srcSlot, dstNode, dstSlot, type].
// Newer formats use objects. Either way we key by endpoints only (drop the
// link id) so re-numbering is not mistaken for a topology change.
function linkKey(v: Json): string | null {
  if (Array.isArray(v) && v.length >= 5) {
    return `${v[1]}:${v[2]}→${v[3]}:${v[4]}`
  }
  if (isRecord(v)) {
    const o = v.origin_id ?? v.origin
    const t = v.target_id ?? v.target
    if (o !== undefined && t !== undefined) {
      return `${o}:${v.origin_slot ?? 0}→${t}:${v.target_slot ?? 0}`
    }
  }
  return null
}

function indexLinks(v: Json): Set<string> {
  const set = new Set<string>()
  for (const raw of asArray(v)) {
    const key = linkKey(raw)
    if (key) set.add(key)
  }
  return set
}

function groupNames(v: Json): string[] {
  return asArray(v)
    .map((g) => (isRecord(g) && typeof g.title === 'string' ? g.title : ''))
    .filter(Boolean)
}

function collectScopes(graph: Json): Scope[] {
  const root = isRecord(graph) ? graph : {}
  const scopes: Scope[] = [
    {
      key: 'root',
      label: 'root',
      nodes: indexNodes(root.nodes),
      linkKeys: indexLinks(root.links),
      groupNames: groupNames(root.groups)
    }
  ]
  const defs = isRecord(root.definitions) ? root.definitions : {}
  asArray(defs.subgraphs).forEach((sg, i) => {
    if (!isRecord(sg)) return
    const id = sg.id !== undefined && sg.id !== null ? String(sg.id) : `#${i}`
    const name = typeof sg.name === 'string' ? sg.name : id
    scopes.push({
      key: id,
      label: `subgraph "${name}"`,
      nodes: indexNodes(sg.nodes),
      linkKeys: indexLinks(sg.links),
      groupNames: groupNames(sg.groups)
    })
  })
  return scopes
}

// --- value formatting + word delta -----------------------------------

function fmt(v: Json): string {
  if (typeof v === 'string') {
    const trimmed = v.length > 24 ? `${v.slice(0, 24)}…` : v
    return `"${trimmed}"`
  }
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (v === null || v === undefined) return '∅'
  return '…'
}

function wordCounts(s: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const w of s.split(/\s+/)) {
    if (w) counts.set(w, (counts.get(w) ?? 0) + 1)
  }
  return counts
}

// Order-insensitive word delta — good enough for a summary chip.
function wordDelta(
  before: string,
  after: string
): { added: number; removed: number } {
  const a = wordCounts(before)
  const b = wordCounts(after)
  let added = 0
  let removed = 0
  for (const [w, n] of a) removed += Math.max(0, n - (b.get(w) ?? 0))
  for (const [w, n] of b) added += Math.max(0, n - (a.get(w) ?? 0))
  return { added, removed }
}

// --- widget classification -------------------------------------------

function looksLikeSeed(name: string, before: Json, after: Json): boolean {
  if (/seed/i.test(name)) return true
  return (
    typeof before === 'number' &&
    typeof after === 'number' &&
    Number.isInteger(before) &&
    Number.isInteger(after) &&
    Math.abs(before) >= 1_000_000
  )
}

function looksLikePrompt(name: string, before: Json, after: Json): boolean {
  if (/text|prompt|wildcard|string/i.test(name)) return true
  const long = (v: Json) =>
    typeof v === 'string' && (v.length > 80 || v.includes('\n'))
  return long(before) || long(after)
}

function describeWidget(
  name: string,
  before: Json,
  after: Json
): { kind: WidgetKind; label: string } {
  if (looksLikeSeed(name, before, after)) {
    return { kind: 'seed', label: 'Seed changed' }
  }
  if (looksLikePrompt(name, before, after)) {
    const { added, removed } = wordDelta(
      String(before ?? ''),
      String(after ?? '')
    )
    const parts: string[] = []
    if (added) parts.push(`+${added}`)
    if (removed) parts.push(`−${removed}`)
    const suffix = parts.length ? ` (${parts.join(' / ')} words)` : ''
    return { kind: 'prompt', label: `Prompt edited${suffix}` }
  }
  const label = name
    ? `${name} ${fmt(before)} → ${fmt(after)}`
    : `${fmt(before)} → ${fmt(after)}`
  return { kind: 'param', label }
}

function widgetEntries(node: RawNode, before: Json, after: Json): DiffEntry[] {
  // Non-array widget bags: collapse to a single generic entry.
  if (!Array.isArray(before) || !Array.isArray(after)) {
    if (JSON.stringify(before) === JSON.stringify(after)) return []
    return [
      {
        channel: 'widget',
        scope: '',
        nodeId: node.id,
        nodeType: node.type,
        widgetKind: 'param',
        label: 'settings changed'
      }
    ]
  }
  const names = node.type ? WIDGET_NAMES[node.type] : undefined
  const len = Math.max(before.length, after.length)
  const out: DiffEntry[] = []
  for (let i = 0; i < len; i++) {
    const bv = before[i]
    const av = after[i]
    if (JSON.stringify(bv) === JSON.stringify(av)) continue
    const name = names?.[i] ?? ''
    const { kind, label } = describeWidget(name, bv, av)
    out.push({
      channel: 'widget',
      scope: '',
      nodeId: node.id,
      nodeType: node.type,
      widgetKind: kind,
      label
    })
  }
  return out
}

// --- per-scope diff ---------------------------------------------------

function movedBeyondTolerance(a: Json, b: Json): boolean {
  const pa = asNumberPair(a)
  const pb = asNumberPair(b)
  if (!pa || !pb) return false
  return (
    Math.abs(pa[0] - pb[0]) > POS_TOLERANCE ||
    Math.abs(pa[1] - pb[1]) > POS_TOLERANCE
  )
}

function diffScope(scope: Scope, before: Scope | undefined): DiffEntry[] {
  const prev = before ?? {
    key: scope.key,
    label: scope.label,
    nodes: new Map<string, RawNode>(),
    linkKeys: new Set<string>(),
    groupNames: []
  }
  const entries: DiffEntry[] = []
  const ids = new Set([...prev.nodes.keys(), ...scope.nodes.keys()])

  for (const id of ids) {
    const a = prev.nodes.get(id)
    const b = scope.nodes.get(id)
    if (!a && b) {
      entries.push({
        channel: 'added',
        scope: scope.label,
        nodeId: id,
        nodeType: b.type,
        label: b.type ?? 'node'
      })
      continue
    }
    if (a && !b) {
      entries.push({
        channel: 'removed',
        scope: scope.label,
        nodeId: id,
        nodeType: a.type,
        label: a.type ?? 'node'
      })
      continue
    }
    if (!a || !b) continue

    if ((a.mode ?? 0) !== (b.mode ?? 0)) {
      entries.push({
        channel: 'mode',
        scope: scope.label,
        nodeId: id,
        nodeType: b.type,
        label: b.mode === 0 ? 'enabled' : 'bypassed'
      })
    }
    if ((a.title ?? '') !== (b.title ?? '')) {
      entries.push({
        channel: 'title',
        scope: scope.label,
        nodeId: id,
        nodeType: b.type,
        label: `renamed → ${b.title ?? ''}`
      })
    }
    if (JSON.stringify(a.widgets_values) !== JSON.stringify(b.widgets_values)) {
      for (const e of widgetEntries(b, a.widgets_values, b.widgets_values)) {
        entries.push({ ...e, scope: scope.label })
      }
    }
    if (
      movedBeyondTolerance(a.pos, b.pos) ||
      movedBeyondTolerance(a.size, b.size)
    ) {
      entries.push({
        channel: 'layout',
        scope: scope.label,
        nodeId: id,
        nodeType: b.type,
        label: 'moved'
      })
    }
  }

  // Topology: endpoint set difference.
  for (const key of scope.linkKeys) {
    if (!prev.linkKeys.has(key)) {
      entries.push({
        channel: 'rewired',
        scope: scope.label,
        label: `+ ${key}`
      })
    }
  }
  for (const key of prev.linkKeys) {
    if (!scope.linkKeys.has(key)) {
      entries.push({
        channel: 'rewired',
        scope: scope.label,
        label: `− ${key}`
      })
    }
  }

  // Groups: add / remove by title (moves are folded into layout noise).
  const beforeGroups = new Set(prev.groupNames)
  const afterGroups = new Set(scope.groupNames)
  for (const g of afterGroups) {
    if (!beforeGroups.has(g)) {
      entries.push({ channel: 'group', scope: scope.label, label: `+ ${g}` })
    }
  }
  for (const g of beforeGroups) {
    if (!afterGroups.has(g)) {
      entries.push({ channel: 'group', scope: scope.label, label: `− ${g}` })
    }
  }

  return entries
}

// --- summarize --------------------------------------------------------

const MAX_HEADLINE = 4

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many.replace('{n}', String(n))
}

function buildHeadline(
  counts: SemanticDiffCounts,
  details: DiffEntry[]
): string[] {
  const out: string[] = []
  if (counts.added)
    out.push(plural(counts.added, '1 node added', '{n} nodes added'))
  if (counts.removed)
    out.push(plural(counts.removed, '1 node removed', '{n} nodes removed'))
  if (counts.rewired)
    out.push(
      plural(counts.rewired, '1 connection changed', '{n} connections changed')
    )
  if (counts.prompts)
    out.push(plural(counts.prompts, 'Prompt edited', '{n} prompts edited'))
  if (counts.params) {
    if (counts.params === 1) {
      const only = details.find((d) => d.widgetKind === 'param')
      out.push(only?.label ?? '1 parameter changed')
    } else {
      out.push(`${counts.params} parameters changed`)
    }
  }
  if (counts.seeds)
    out.push(plural(counts.seeds, 'Seed changed', '{n} seeds changed'))
  if (counts.bypassed)
    out.push(plural(counts.bypassed, '1 node bypassed', '{n} nodes bypassed'))
  if (counts.renamed)
    out.push(plural(counts.renamed, '1 node renamed', '{n} nodes renamed'))
  if (counts.moved)
    out.push(plural(counts.moved, '1 node moved', '{n} nodes moved'))
  if (counts.groups)
    out.push(plural(counts.groups, '1 group changed', '{n} groups changed'))

  if (out.length <= MAX_HEADLINE) return out
  const shown = out.slice(0, MAX_HEADLINE)
  shown.push(`+${out.length - MAX_HEADLINE} more`)
  return shown
}

function tally(details: DiffEntry[]): SemanticDiffCounts {
  const counts: SemanticDiffCounts = {
    added: 0,
    removed: 0,
    rewired: 0,
    prompts: 0,
    params: 0,
    seeds: 0,
    moved: 0,
    bypassed: 0,
    renamed: 0,
    groups: 0
  }
  for (const d of details) {
    switch (d.channel) {
      case 'added':
        counts.added++
        break
      case 'removed':
        counts.removed++
        break
      case 'rewired':
        counts.rewired++
        break
      case 'mode':
        if (d.label === 'bypassed') counts.bypassed++
        break
      case 'title':
        counts.renamed++
        break
      case 'layout':
        counts.moved++
        break
      case 'group':
        counts.groups++
        break
      case 'widget':
        if (d.widgetKind === 'seed') counts.seeds++
        else if (d.widgetKind === 'prompt') counts.prompts++
        else counts.params++
        break
    }
  }
  return counts
}

export function semanticWorkflowDiff(before: Json, after: Json): SemanticDiff {
  const beforeScopes = collectScopes(before)
  const afterScopes = collectScopes(after)
  const beforeByKey = new Map(beforeScopes.map((s) => [s.key, s]))
  const afterKeys = new Set(afterScopes.map((s) => s.key))

  const details = afterScopes.flatMap((scope) =>
    diffScope(scope, beforeByKey.get(scope.key))
  )
  // Scopes that existed only in `before` (a whole subgraph removed).
  for (const scope of beforeScopes) {
    if (!afterKeys.has(scope.key)) {
      details.push(
        ...diffScope(
          {
            key: scope.key,
            label: scope.label,
            nodes: new Map(),
            linkKeys: new Set(),
            groupNames: []
          },
          scope
        )
      )
    }
  }

  const counts = tally(details)
  return { headline: buildHeadline(counts, details), counts, details }
}
