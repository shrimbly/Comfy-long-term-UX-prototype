// Implements:
//   entities: ../IA_Plan/wiki/entities/{user,workspace,project,workflow,asset}.md
//
// Fixture-level types only. Mirrors wiki entity shape so the prototype is a
// literal implementation of the IA. If a field is needed that isn't in the
// wiki, either the field is wrong or the wiki needs updating — log it in
// prototype/design-decisions.md.

export type PersonaId =
  | 'solo'
  | 'solo-local'
  | 'workspace-admin'
  | 'workspace-member'
  | 'project-collaborator'
  | 'asset-only-guest'
  | 'install-governor'
  | 'managed-artist'
  | 'freelancer'

export type WorkspaceTier = 'personal' | 'team'
export type WorkspacePlan = 'free' | 'professional' | 'enterprise'
export type WorkspaceRole = 'admin' | 'member' | 'guest'

// Project visibility tiers, post-rename. Working stance (see prototype-log
// 2026-05-12 entry): user-creatable tiers are `workspace-wide` and
// `restricted`; `private` is reserved for the auto-created Drafts flavor.
export type ProjectTier = 'workspace-wide' | 'restricted' | 'private'

// Asset-level roles per ../IA_Plan/wiki/concepts/three-level-permissions.md.
// Post-MVP roles (Editor, Viewer) intentionally omitted.
export type AssetRole = 'owner' | 'runner' | 'app-runner'

export interface AssetAccess {
  userId: string
  role: AssetRole
}

// Project-level roles per ../IA_Plan/wiki/concepts/three-level-permissions.md.
export type ProjectRole = 'owner' | 'collaborator' | 'project-guest'

export interface ProjectMember {
  userId: string
  role: ProjectRole
}

// Library sidebar sub-sections. `media` and `models` map cleanly to wiki
// asset types. `nodes` and `prompts` are surfaced as Library items even
// though the wiki today treats them as configuration / workflow-internal —
// flagged as working decision in prototype-log.
export type LibrarySection = 'media' | 'models' | 'nodes' | 'prompts'

export interface User {
  id: string
  name: string
  email: string
}

export interface Workspace {
  id: string
  name: string
  tier: WorkspaceTier
  ownerUserId: string
  plan: WorkspacePlan
  avatarColor: string
  memberCount: number
  currentUserRole: WorkspaceRole
  description?: string
  // Workspace-level data/training policy per
  // ../IA_Plan/wiki/entities/workspace.md §"What it contains" and
  // ../IA_Plan/wiki/concepts/three-level-permissions.md §"Workspace level".
  dataTrainingOptOut?: boolean
  // Workspace install registry per
  // ../IA_Plan/wiki/concepts/workspace-install-registry.md and
  // ../IA_Plan/wiki/decisions/workspace-install-registry.md — the
  // curated list of blessed install identities + workspace-canonical
  // metadata. Project allowed-install sets pick identities from here.
  blessedInstalls?: BlessedInstall[]
}

// Workspace install registry entry per
// ../IA_Plan/wiki/concepts/workspace-install-registry.md §"What a
// 'blessed install' is". References a bundle by its identity; carries
// workspace-canonical metadata (name, publish provenance, lock,
// bundle version). `comfyUIVersion` is metadata about the referenced
// bundle so the desktop client can show the version before the user
// installs it locally and so a freshly-installed bundle starts with
// the right version stamped on its local Install entry.
export interface BlessedInstall {
  installId: string
  canonicalDisplayName: string
  comfyUIVersion: string
  publishedByUserId: string
  publishedAt: string
  isLocked: boolean
  description?: string
}

// Hub publishing approval queue item. Per
// ../IA_Plan/wiki/concepts/three-level-permissions.md §"Workspace level"
// — "Approve Comfy Hub publishing (delegable to Members)".
export interface HubSubmission {
  id: string
  assetName: string
  submittedByUserId: string
  submittedAt: string
}

// A request from a collaborator to publish their working copy over a
// team canonical workflow they lack overwrite permission for. Per
// ../IA_Plan/wiki/decisions/published-workflow-model.md §"member-overwrite
// -request-flow" (promoted from open question 2026-05-27). Reviewed by
// the project Owner / workspace Admin, who publishes (approve) or
// declines (reject). Denormalized name fields so the review queue
// renders without the submitter's fork being present in the reviewer's
// fixture (per-persona fixtures don't share state).
export type WorkflowSubmissionStatus = 'pending' | 'approved' | 'rejected'

export interface WorkflowSubmission {
  id: string
  // The submitter's working copy (may not exist in a reviewer's fixture).
  forkWorkflowId: string
  // The canonical workflow this would overwrite, + its project.
  canonicalWorkflowId: string
  workflowName: string
  projectId: string
  submittedByUserId: string
  submittedAt: string
  status: WorkflowSubmissionStatus
  note?: string
  // Rough lines-changed summary vs the canonical, for the review row.
  diff?: { added: number; removed: number }
}

// Workspace-level allowlists per
// ../IA_Plan/wiki/concepts/three-level-permissions.md §Workspace level.
// "Set workspace-level model + custom-node allowlists (delegable to Members)".
// Partner nodes are vendor-vetted custom nodes — a distinct allowlist
// from the open community custom-node list.
export type AllowlistKind = 'model' | 'custom-node' | 'partner-node'

export interface AllowlistEntry {
  id: string
  name: string
  addedAt: string
  addedByUserId: string
  note?: string
}

// Each allowlist is an enabled flag + curated entries. When `enabled`
// is false the gate is off — anything is permitted regardless of what
// the entries list says. Admins may still curate entries while the
// gate is off.
export interface AllowlistConfig {
  enabled: boolean
  entries: AllowlistEntry[]
}

export interface WorkspaceAllowlists {
  models: AllowlistConfig
  customNodes: AllowlistConfig
  partnerNodes: AllowlistConfig
}

// Project-level allowlists per
// ../IA_Plan/wiki/entities/project.md §"What it contains"
// ("Settings — model allowlist, custom-node allowlist") combined with
// the prototype's strict-override rule (see design-decisions.md
// 2026-05-15): `override = false` inherits the workspace allowlist
// read-only; `override = true` replaces it entirely (workspace entries
// are not unioned in). The `entries` list is curatable while
// `override` is off so an Owner can stage a list before flipping it on.
export type ProjectAllowlistKind = 'model' | 'custom-node'

export interface ProjectAllowlistConfig {
  override: boolean
  entries: AllowlistEntry[]
}

export interface ProjectAllowlists {
  models: ProjectAllowlistConfig
  customNodes: ProjectAllowlistConfig
}

// Project-level defaults per prototype/design-decisions.md 2026-05-15.
// filenamePrefix prefills new save-node `filename_prefix` widgets;
// edits inside the widget always win — it is a seed value, not a
// runtime constraint.
export interface ProjectDefaults {
  filenamePrefix?: string
}

export interface Project {
  id: string
  workspaceId: string
  name: string
  tier: ProjectTier
  ownerUserId: string
  isDrafts: boolean
  currentUserHasAccess: boolean
  // Project-level role assignments. Owner is also represented here for
  // completeness when surfacing a project members panel; workspace-wide
  // projects may leave this sparse since Members are implicit via
  // workspace role.
  members?: ProjectMember[]
  // Owner-editable settings surfaced through the Settings tab on
  // ProjectDetailView. Optional because the auto-created Drafts /
  // My Workflows project has no Owner-managed settings surface.
  allowlists?: ProjectAllowlists
  defaults?: ProjectDefaults
  // Read-only spend attribution for the current calendar month, in
  // credits. The workspace total is derived by summing across projects
  // in the workspace — workspace remains the single billing entity per
  // ../IA_Plan/wiki/entities/workspace.md.
  creditsThisMonth?: number
  // Allowed-install set per ../IA_Plan/wiki/entities/project.md §"Install
  // constraints (allowed-install set)" and
  // decisions/team-locked-install.md — a hard lock by install IDENTITY.
  //
  // Per the desktop team (clarified in prototype/design-decisions.md
  // 2026-05-19 entry): an install is one indivisible bundle (ComfyUI
  // version + Python deps + custom nodes + ...). The only stable
  // identity for "this install" is the install's id / bundle hash.
  // User-chosen display names are labels, not identifiers — Sasha's
  // "VFX team Q2 2026" can be Reza's "Titanic v1" referring to the same
  // bundle on different machines.
  //
  // `installLockDisplayName` is the *workspace-canonical* name chosen
  // by the Install Governor when they set the lock; the gate dialog
  // renders this rather than whatever local label any user has applied.
  allowedInstallIds?: string[]
  installLockDisplayName?: string
}

// Storage medium for an asset. Per
//   decision: ../IA_Plan/wiki/decisions/save-destination-workflow-level.md
//   decision: ../IA_Plan/wiki/decisions/promoting-local-outputs-to-cloud.md
// 'local' = stored on the user's disk (Comfy output dir / local FS).
// 'cloud' = stored under a cloud workspace/project.
export type AssetStorage = 'local' | 'cloud'

// Snapshot of the install that generated an output. Captured at run
// time and embedded in the output's metadata so attribution survives
// even if the install is later removed. Per ../IA_Plan/wiki/entities/
// output.md §"Install attribution".
export interface InstallAttribution {
  installId: string
  displayName: string
  comfyUIVersion: string
}

export interface Workflow {
  id: string
  projectId: string
  name: string
  description?: string
  thumbnailUrl?: string
  updatedAt: string
  kind?: 'workflow' | 'app'
  ownerUserId?: string
  access?: AssetAccess[]
  storage?: AssetStorage
  // Fork lineage per ../IA_Plan/wiki/decisions/published-workflow-model.md.
  // Set when this workflow was created by forking another (fork-on-open,
  // explicit Fork, or the install gate's "Save to My Workflows"). Points
  // at the source workflow's id. A fork whose source resolves to a
  // canonical workflow in a shared project is eligible for Publish to
  // workspace (overwrite the canonical). Absent on directly-authored
  // workflows and on canonical workflows themselves. `atVersion` is the
  // canonical published-version date this fork diverged from — drives the
  // history graph's offshoot point.
  forkedFrom?: { workflowId: string; atVersion?: string }
  // On a canonical: the full Publish-to-workspace timeline (who/when).
  // Display/audit record; the latest publish is the current content. Per
  // ../IA_Plan/wiki/decisions/published-workflow-model.md §"Published-
  // version history".
  publishedVersions?: PublishedVersion[]
}

export interface PublishedVersion {
  byUserId: string
  at: string
}

export interface LibraryAsset {
  id: string
  name: string
  section: LibrarySection
  projectId: string
  updatedAt: string
  tags?: string[]
  folder?: string
  storage?: AssetStorage
}

export interface Template {
  id: string
  name: string
  thumbnailUrl?: string
  description?: string
}

export interface UsageState {
  creditsRemainingPct: number
  showUpgrade: boolean
}

// Billing per ../IA_Plan/wiki/entities/workspace.md §"What it contains"
// and §"Lifecycle" (billing does not auto-transfer with ownership).

export type SubscriptionStatus = 'active' | 'past-due' | 'cancelled'

export interface Subscription {
  plan: WorkspacePlan
  status: SubscriptionStatus
  renewsAt: string
  cancelsAt?: string
  seatsIncluded: number
}

export type PaymentMethodKind = 'card' | 'invoice'

export interface PaymentMethod {
  kind: PaymentMethodKind
  brand?: string
  last4?: string
  expiresMonth?: number
  expiresYear?: number
  billingEmail?: string
}

export interface CreditBalance {
  remaining: number
  monthlyAllowance: number
  resetsAt: string
}

export type InvoiceStatus = 'paid' | 'open' | 'past-due'

export interface Invoice {
  id: string
  issuedAt: string
  amountUsd: number
  status: InvoiceStatus
}

export interface WorkspaceBilling {
  subscription: Subscription
  paymentMethod: PaymentMethod
  creditBalance: CreditBalance
  invoices: Invoice[]
}

// Per-member credit limit. Per open-q `per-member-credit-limits` the
// enforcement mechanism is TBD, but the wiki commits to the surface:
// per-member ceiling + period + reset cadence.
export type CreditLimitPeriod = 'monthly' | 'weekly' | 'one-time'

export interface MemberCreditLimit {
  memberId: string
  limit: number
  period: CreditLimitPeriod
  used: number
  resetsAt: string
}

export interface WorkspaceMember {
  id: string
  name: string
  email: string
  role: WorkspaceRole
  avatarColor?: string
  joinedAt: string
}

export interface PendingInvite {
  id: string
  email: string
  role: WorkspaceRole
  invitedByUserId: string
  invitedAt: string
}

// Admin-delegable capabilities surfaced in the Permissions matrix. Per
// concepts/three-level-permissions.md and open-questions
// publish-direct-link-admin-gate / delegation-surface-in-ui.
export type DelegableCapability =
  | 'publish-direct-link'
  | 'submit-to-hub'
  | 'approve-hub-submissions'
  | 'edit-allowlists'
  | 'configure-workspace'

// Per-role grant baseline. Admin always implicitly has all; Guest never has
// any workspace-wide grant. Member is the only interactive column.
export type RoleGrants = Record<DelegableCapability, boolean>

// Cloud vs local distinction per wiki:
//   decision: ../IA_Plan/wiki/decisions/projects-are-cloud-only.md
//   concept:  ../IA_Plan/wiki/concepts/local-dashboard-views.md
// 'local' personas have no projects, no workspace switcher, and a
// filesystem-backed library (Outputs replaces Prompts).
export type PersonaMode = 'cloud' | 'local'

// Install per ../IA_Plan/wiki/entities/install.md. Runtime entity — owns
// a ComfyUI version + locally installed packages and models. NOT in the
// permission spine per
//   decision: ../IA_Plan/wiki/decisions/install-is-runtime-not-permission-entity.md
// Cardinality: many installs per user; many installs per workspace; one
// install shared across workspaces (all at the user level).
//
// `id` is the install's stable identity (in product, a bundle/manifest
// hash assigned by the desktop installer; for the prototype, a string).
// `displayName` is the user-chosen label and is NOT an identifier — two
// users can give the same bundle different names. Identity comparisons
// for the project-level allowed-install set go through `id` only.
export interface Install {
  id: string
  displayName: string
  comfyUIVersion: string
  registeredAt: string
}

// Cross-workspace activity surfaced through the top-bar notifications
// popover. Drives the alert path for Guest personas who otherwise have
// no in-workspace cue that something changed in another workspace.
//
//   asset-grant      — granted access to a specific asset
//   project-grant    — added to a project
//   workspace-invite — invited to a new workspace
//   asset-update     — owner changed a shared asset
export type NotificationKind =
  | 'asset-grant'
  | 'project-grant'
  | 'workspace-invite'
  | 'asset-update'
  // Submission lifecycle (member-overwrite-request-flow):
  | 'submission-received' // → owner/admin: a workflow was submitted for review
  | 'submission-approved' // → submitter: their submission was published
  | 'submission-rejected' // → submitter: their submission was declined

export interface NotificationTarget {
  workspaceId: string
  projectId?: string
  assetId?: string
}

export interface Notification {
  id: string
  kind: NotificationKind
  actorUserId: string
  target: NotificationTarget
  createdAt: string
  readAt?: string
}

export interface PersonaFixture {
  mode: PersonaMode
  currentUser: User
  workspaces: Workspace[]
  currentWorkspaceId: string
  projects: Project[]
  workflows: Workflow[]
  libraryAssets: LibraryAsset[]
  templates: Template[]
  usage: UsageState | null
  members: WorkspaceMember[]
  pendingInvites: PendingInvite[]
  roleGrants: RoleGrants
  allowlists: WorkspaceAllowlists
  billing: WorkspaceBilling | null
  memberCreditLimits: MemberCreditLimit[]
  hubSubmissions: HubSubmission[]
  workflowSubmissions: WorkflowSubmission[]
  notifications: Notification[]
  // Multi-install state per ../IA_Plan/wiki/concepts/install-switcher.md.
  // Empty for cloud-only personas — they have no install presence. The
  // active install determines runtime (not visibility); content is
  // aggregated across `installs`, not scoped to active.
  installs: Install[]
  activeInstallId?: string
}

export interface PersonaDef {
  id: PersonaId
  label: string
  description: string
  fixture: PersonaFixture
}
