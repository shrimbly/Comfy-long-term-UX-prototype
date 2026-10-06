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
  | 'solo-cloud-active'
  | 'solo-local-active'
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
type AssetRole = 'owner' | 'runner'

interface AssetAccess {
  userId: string
  role: AssetRole
}

// Project-level roles per ../IA_Plan/wiki/concepts/three-level-permissions.md.
export type ProjectRole = 'owner' | 'collaborator'

interface ProjectMember {
  userId: string
  role: ProjectRole
}

// Library sidebar sub-sections. MVP collapses the Library to Media only
// (see design-decisions.md 2026-06-16); the wider union is retained on the
// data type because fixtures may still carry non-media seed data that is
// simply not surfaced.
type LibrarySection = 'media' | 'models' | 'nodes' | 'prompts'

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

// One month of credit spend ("YYYY-MM" → credits). Drives the project Usage
// tab: current figure, month-over-month delta, recent-months list, export.
export interface MonthlyUsage {
  month: string
  credits: number
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
  // Recent monthly spend (most recent last, includes the current month whose
  // value mirrors creditsThisMonth). Prototype extension beyond the wiki's
  // single-month scalar — see design-decisions.md 2026-06-24.
  monthlyUsage?: MonthlyUsage[]
  // Custom Comfy Cloud: the deployment this project runs on. Absent = Comfy
  // Cloud, the shared default. See `Deployment`.
  deploymentId?: string
  // Colour tile shown in the tab-bar project switcher and project menus.
  color?: string
}

// Custom Comfy Cloud (Project Homestead): a project runs on a Developer
// Platform deployment. One deployment can back several projects, so updating
// it updates every project on it. Comfy Cloud is the shared default.
type DeploymentKind = 'comfy-cloud' | 'custom'
export type DeploymentStatus = 'ready' | 'asleep' | 'building'

export interface Deployment {
  id: string
  name: string
  kind: DeploymentKind
  // Build release on Platform, e.g. 'v3'. Custom deployments only.
  release?: string
  status: DeploymentStatus
  gpu?: string
  // Minutes the worker stays warm after a run.
  warmMinutes?: number
  // What the build contains — drives "runs it" vs "what it lacks".
  nodePacks: string[]
  models: string[]
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
  // The project this workflow is a draft *for* (provenance), even though the
  // draft itself lives in the owner's My Workflows. Set when the workflow was
  // copied from a project canonical (= that canonical's project) or created
  // via a project's "New workflow" button. Surfaces the draft in that
  // project's "My drafts" section and survives the source canonical being
  // deleted. See ../IA_Plan/wiki/entities/project.md §"Project surface (MVP)".
  provenanceProjectId?: string
  // On a canonical: the full Publish-to-workspace timeline (who/when).
  // Display/audit record; the latest publish is the current content. Per
  // ../IA_Plan/wiki/decisions/published-workflow-model.md §"Published-
  // version history". Kept as the MVP safety net for ungated overwrite.
  publishedVersions?: PublishedVersion[]
  // The folder this workflow sits in *within its container* (My Workflows or
  // a project). undefined = the container root. See `Folder`.
  folderId?: string
}

// A user-created folder for organizing workflows inside a container — either
// My Workflows (folder.projectId === the Drafts project) or a shared project
// (folder.projectId === that project). User-facing folders are single-level;
// `parentFolderId` is reserved for future nesting.
export interface Folder {
  id: string
  projectId: string
  name: string
  parentFolderId?: string
}

export interface PublishedVersion {
  byUserId: string
  at: string
  // Optional note the publisher added describing the change. Surfaced as a
  // hoverable comment glyph in the version-history popover.
  comment?: string
  // Admin curation of the timeline (design-decisions.md 2026-06-24):
  //   pinned  — marked the "stable / latest-good" version (at most one).
  //   deleted — soft-removed from the history. Kept in the array so version
  //             numbers (chronological index + 1) stay stable across deletes —
  //             the history can read 1, 2, 4, 5. Filtered out of display.
  pinned?: boolean
  deleted?: boolean
}

// Provenance for a workflow connected to a project, surfaced as a link badge.
// `linked` shows a link glyph whose tooltip reads "{project}: {workflow}" —
// the project it belongs to and the workflow it tracks (the source canonical
// for a copy, or its own name for one created in the project).
// `source-removed` is a copy whose source canonical no longer resolves.
export interface DraftMeta {
  state: 'linked' | 'source-removed'
  projectName: string
  workflowName: string
}

// Workflow templates — the live ComfyUI template gallery, a pre-existing
// shipping feature restored to the MVP independent of the deferred Hub (see
// design-decisions.md 2026-06-17). Global content, not persona-scoped.
//
// Categorization mirrors the production library + ComfyHub: `category` is the
// generation type driving the chip-filter row (labels i18n'd via
// prototype.templateCategory.{category}); `useCases` are the cross-cutting task
// tags (Text to Image, ControlNet, Upscale…) shown as the on-card pill + fed to
// search; `runtime` splits open-source/local ComfyUI workflows from partner/
// external API workflows; `model` is the primary model/provider shown under the
// title. `popularity` and `addedAt` back the Popular / Newest sorts.
//
// `id` is the REAL upstream template slug (from Comfy-Org/workflow_templates'
// index.json), so it doubles as the key for the real thumbnail media — see
// utils/thumbnail.ts `templateThumbnailUrl`.
export type TemplateCategory =
  | 'image'
  | 'video'
  | 'audio'
  | '3d'
  | 'llm'
  | 'utility'

type TemplateRuntime = 'comfyui' | 'api'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  model: string
  // Partner/provider name for the top-left logo badge (the prod LogoOverlay).
  // Must be a key in utils/thumbnail.ts `PROVIDER_LOGO_PATHS`. Omitted = no badge.
  provider?: string
  // `compareSlider` = the prod before/after wipe (needs a `-2` overlay image);
  // omitted = a plain single-image thumbnail with hover zoom.
  thumbnailVariant?: 'compareSlider'
  useCases: string[]
  runtime: TemplateRuntime
  popularity: number
  addedAt: string
}

// Origin of a media file per ../IA_Plan/wiki/entities/media-file.md.
// `generated` (Comfy output dir) and `imported` (uploaded copy) are
// Comfy-owned bytes. `referenced` is the NON-FINAL third origin under
// exploration (prototype-log Flow 03 / open-q `local-media-as-references`):
// Comfy stores a pointer to a file the user keeps on their own disk and
// never copies it. Referenced assets have no cloud project and carry a
// link state + source path.
type AssetOrigin = 'generated' | 'imported' | 'referenced'

// Link state of a `referenced` media file. `missing` = the original moved
// or was deleted; Comfy still holds the cached thumbnail and prompts a
// relink (After Effects / Lightroom pattern).
type LinkState = 'linked' | 'missing'

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

interface UsageState {
  creditsRemainingPct: number
  showUpgrade: boolean
}

// Billing per ../IA_Plan/wiki/entities/workspace.md §"What it contains"
// and §"Lifecycle" (billing does not auto-transfer with ownership).

type SubscriptionStatus = 'active' | 'past-due' | 'cancelled'

interface Subscription {
  plan: WorkspacePlan
  status: SubscriptionStatus
  renewsAt: string
  cancelsAt?: string
  seatsIncluded: number
}

type PaymentMethodKind = 'card' | 'invoice'

interface PaymentMethod {
  kind: PaymentMethodKind
  brand?: string
  last4?: string
  expiresMonth?: number
  expiresYear?: number
  billingEmail?: string
}

interface CreditBalance {
  remaining: number
  monthlyAllowance: number
  resetsAt: string
}

type InvoiceStatus = 'paid' | 'open' | 'past-due'

interface Invoice {
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

interface MemberCreditLimit {
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

interface PendingInvite {
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
type PersonaMode = 'cloud' | 'local'

export interface PersonaFixture {
  mode: PersonaMode
  currentUser: User
  workspaces: Workspace[]
  currentWorkspaceId: string
  projects: Project[]
  workflows: Workflow[]
  // User-created folders organizing workflows within My Workflows / projects.
  folders?: Folder[]
  libraryAssets: LibraryAsset[]
  usage: UsageState | null
  members: WorkspaceMember[]
  pendingInvites: PendingInvite[]
  roleGrants: RoleGrants
  billing: WorkspaceBilling | null
  memberCreditLimits: MemberCreditLimit[]
  // Custom deployments projects can run on. Comfy Cloud is implicit.
  deployments?: Deployment[]
}

export interface PersonaDef {
  id: PersonaId
  label: string
  description: string
  fixture: PersonaFixture
}
