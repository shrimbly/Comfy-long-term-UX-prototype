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

export type WorkspaceTier = 'personal' | 'team'
export type WorkspacePlan = 'free' | 'professional' | 'enterprise'
export type WorkspaceRole = 'admin' | 'member'

// Project visibility tiers, post-rename. Working stance (see prototype-log
// 2026-05-12 entry): user-creatable tiers are `workspace-wide` and
// `restricted`; `private` is reserved for the auto-created Drafts flavor.
export type ProjectTier = 'workspace-wide' | 'restricted' | 'private'

// Asset-level roles per ../IA_Plan/wiki/concepts/three-level-permissions.md.
// Post-MVP roles (Editor, Viewer) intentionally omitted.
export type AssetRole = 'owner' | 'runner'

export interface AssetAccess {
  userId: string
  role: AssetRole
}

// Project-level roles per ../IA_Plan/wiki/concepts/three-level-permissions.md.
export type ProjectRole = 'owner' | 'collaborator'

export interface ProjectMember {
  userId: string
  role: ProjectRole
}

// Library sidebar sub-sections. MVP collapses the Library to Media only
// (see design-decisions.md 2026-06-16); the wider union is retained on the
// data type because fixtures may still carry non-media seed data that is
// simply not surfaced.
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
  // Read-only spend attribution for the current calendar month, in
  // credits. The workspace total is derived by summing across projects
  // in the workspace — workspace remains the single billing entity per
  // ../IA_Plan/wiki/entities/workspace.md.
  creditsThisMonth?: number
}

// Storage medium for an asset. Per
//   decision: ../IA_Plan/wiki/decisions/save-destination-workflow-level.md
//   decision: ../IA_Plan/wiki/decisions/promoting-local-outputs-to-cloud.md
// 'local' = stored on the user's disk (Comfy output dir / local FS).
// 'cloud' = stored under a cloud workspace/project.
export type AssetStorage = 'local' | 'cloud'

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
  // Copy lineage per ../IA_Plan/wiki/decisions/published-workflow-model.md
  // and the MVP scope (design-decisions.md 2026-06-16). Set when this
  // workflow was created by copying another (copy-on-access from a project,
  // or an explicit Save to My Workflows). Points at the source workflow's
  // id. A copy whose source resolves to a canonical workflow in a shared
  // project is eligible for Publish to workspace (overwrite the canonical).
  // Absent on directly-authored workflows and on canonical workflows
  // themselves. `atVersion` is the canonical published-version date this
  // copy diverged from — drives the history graph's offshoot point.
  forkedFrom?: { workflowId: string; atVersion?: string }
  // On a canonical: the full Publish-to-workspace timeline (who/when).
  // Display/audit record; the latest publish is the current content. Per
  // ../IA_Plan/wiki/decisions/published-workflow-model.md §"Published-
  // version history". Kept as the MVP safety net for ungated overwrite.
  publishedVersions?: PublishedVersion[]
}

export interface PublishedVersion {
  byUserId: string
  at: string
}

// Workflow templates — the live ComfyUI template gallery, a pre-existing
// shipping feature restored to the MVP independent of the deferred Hub (see
// design-decisions.md 2026-06-17). Global content, not persona-scoped. The
// category drives the gallery's filter tabs; labels are i18n'd via
// prototype.templateCategory.{category}.
export type TemplateCategory =
  | 'image'
  | 'video'
  | 'audio'
  | '3d'
  | 'upscaling'
  | 'controlnet'

export interface WorkflowTemplate {
  id: string
  name: string
  category: TemplateCategory
  author: string
}

// Origin of a media file per ../IA_Plan/wiki/entities/media-file.md.
// `generated` (Comfy output dir) and `imported` (uploaded copy) are
// Comfy-owned bytes. `referenced` is the NON-FINAL third origin under
// exploration (prototype-log Flow 03 / open-q `local-media-as-references`):
// Comfy stores a pointer to a file the user keeps on their own disk and
// never copies it. Referenced assets have no cloud project and carry a
// link state + source path.
export type AssetOrigin = 'generated' | 'imported' | 'referenced'

// Link state of a `referenced` media file. `missing` = the original moved
// or was deleted; Comfy still holds the cached thumbnail and prompts a
// relink (After Effects / Lightroom pattern).
export type LinkState = 'linked' | 'missing'

export interface LibraryAsset {
  id: string
  name: string
  section: LibrarySection
  // Optional: a `referenced` local media file belongs to no cloud project
  // (Projects are cloud-only). Cloud-stored assets set this.
  projectId?: string
  updatedAt: string
  tags?: string[]
  folder?: string
  storage?: AssetStorage
  // `referenced`-origin fields. Non-final — logged in
  // prototype/design-decisions.md until media-file.md adopts them.
  origin?: AssetOrigin
  // Absolute path of the original file on the user's disk.
  sourcePath?: string
  // Content hash for move-detection and hash-based auto-relink.
  contentHash?: string
  linkState?: LinkState
  // Cached preview the app keeps so a referenced file still shows a
  // thumbnail even when its original has moved (the relink case).
  previewUrl?: string
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
export type DelegableCapability = 'publish-direct-link' | 'configure-workspace'

// Per-role grant baseline. Admin always implicitly has all. Member is the
// only interactive column.
export type RoleGrants = Record<DelegableCapability, boolean>

// Cloud vs local distinction per wiki:
//   decision: ../IA_Plan/wiki/decisions/projects-are-cloud-only.md
//   concept:  ../IA_Plan/wiki/concepts/local-dashboard-views.md
// 'local' personas have no projects, no workspace switcher, and a
// filesystem-backed library (Outputs replaces Prompts).
export type PersonaMode = 'cloud' | 'local'

export interface PersonaFixture {
  mode: PersonaMode
  currentUser: User
  workspaces: Workspace[]
  currentWorkspaceId: string
  projects: Project[]
  workflows: Workflow[]
  libraryAssets: LibraryAsset[]
  usage: UsageState | null
  members: WorkspaceMember[]
  pendingInvites: PendingInvite[]
  roleGrants: RoleGrants
  billing: WorkspaceBilling | null
  memberCreditLimits: MemberCreditLimit[]
}

export interface PersonaDef {
  id: PersonaId
  label: string
  description: string
  fixture: PersonaFixture
}
