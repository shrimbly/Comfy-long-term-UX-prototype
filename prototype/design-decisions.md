# Prototype design decisions

Append-only log of design decisions made while building the prototype, cross-referenced to the IA wiki.

Each entry follows the format:

```
## [YYYY-MM-DD] <topic>

Decision: <what we chose>
Reason: <why>
Wiki link: <which wiki entry this implements, supports, or extends>
Open question dependency: <if it depends on a Proposed answer, link the open question>
Promote? <yes / no / maybe — should this become a formal wiki decision?>
```

When an entry's "Promote? yes" cell is ticked AND the team has confirmed the position, raise a new decision page in `../IA_Plan/wiki/decisions/` referencing this log entry.

---

## [2026-05-12] Project tiers — retire user-creatable Private; rename Scoped → Restricted

Decision:

- User-creatable project visibility tiers are `workspace-wide` and `restricted`. `private` is reserved for the auto-created Drafts shape only.
- "Scoped" is renamed "Restricted" in product language.
- Visibility rule splits: inaccessible workspace-wide projects render grayed (let users see structure they're missing); restricted projects the user wasn't invited to are hidden entirely (confidentiality).

Reason: Willie's framing of the use case — "two people working on a client project, the rest of the team isn't allowed to see this stuff" — is `scoped` in the wiki, not the single-user Private tier. The single-user Private tier has no use case Drafts doesn't already cover. "Scoped" is a technical name; "Restricted" carries the confidentiality intent.

Wiki link: `../IA_Plan/wiki/prototype-log.md#flow-01-dashboard` (Working decisions made this pass, 2026-05-12 entry). Partially closes `project-visibility-lifecycle` open question.

Open question dependency: Surfaces a new question — should workspace Admins see _that_ restricted projects exist (without contents) for billing/audit? Currently no.

Promote? yes — if Willie confirms, propagate the rename through `concepts/three-level-permissions.md`, `entities/project.md`, and the related open questions; add a formal `wiki/decisions/project-tiers-restricted-rename.md`.

## [2026-05-12] Library group + Templates collapse into Comfy Hub + Workspace Library not user-facing

Decision:

- The sidebar surfaces asset types directly under a new `LIBRARY` group: Media assets, Models, Nodes, Prompts. Each is its own browser inside the workspace.
- "Workspace Library" is not exposed as a user-facing concept. It remains a back-end organizational notion if the wiki keeps it, but no UI surface maps to it directly.
- "Templates" merges into "Comfy Hub" — one Discover surface, one sidebar item, one entity.
- Restriction is inherited from each asset's containing project. Each library view has restriction-tier pills + a project dropdown.

Reason: Willie's framing — the user thinks in terms of "where are my media / models / nodes / prompts?", not "where is my Workspace Library?". Templates and Hub were two surfaces of the same discovery concept.

Wiki link: `../IA_Plan/wiki/prototype-log.md#flow-01-dashboard` (2026-05-12 second entry).

Open question dependency: Three wiki tensions to resolve before promotion:

1. `entities/workspace-library.md` — does the entity survive as an implementation note or get folded into Project/Asset?
2. `decisions/custom-nodes-as-configuration.md` — Nodes Library view as configuration browser vs revised "Nodes are assets too" stance.
3. `decisions/prompts-mvp-internal-future-asset.md` — Prompts Library in MVP either pushes the saveable-Prompt timeline forward, or the surface is empty/placeholder in MVP.

Promote? yes — if Willie confirms: promote the Library-group restructure + Templates-folded-into-Hub into formal wiki decisions, and resolve the three downstream tensions.

## [2026-05-15] Workflow context menu (My Workflows + Recents + Project detail)

Decision:

- Every `WorkflowCard` gets a right-click context menu via `WorkflowContextMenu.vue`, role-gated by the viewer's effective asset role (resolved in `useViewerWorkflowRole.ts`).
- **Owner branch** — Open, Rename, Duplicate (fork in place), Move to project…, Save destination ▸ Local/Cloud, Share…, Publish ▸ Direct link / Comfy Hub, View outputs, Open containing project (when applicable), Delete.
- **Runner branch** — Open (triggers fork-on-open semantics), Fork to My Workflows, View outputs, Open containing project.
- **App Runner branch** — Run app, View outputs, Open containing project.
- Verb is **Fork** universally; "Duplicate" appears in the Owner branch as an in-place clone synonym to match the user's mental model, but the underlying op is the same (clone into the actor's My Workflows in the host workspace).
- Share / Publish / View outputs are **prototype stubs** that toast — the real surfaces live in other flows and aren't wired through the menu in this pass.
- Move-to-project surfaces a small project picker dialog. The picker lists accessible non-Drafts projects in the _host workspace_, not the viewer's current workspace.

Reason:

- Wiki has no first-class "context menu" concept — operations are spec'd by capability. The role split mirrors the asset-level capability table in `concepts/three-level-permissions.md`.
- Per `decisions/fork-vs-copy-one-operation.md`, Copy is retired. The menu uses Fork everywhere as the destination-clone verb, with "Duplicate" surfaced only as the Owner-branch label when the user is already in their own My Workflows (familiar verb without contradicting the wiki).
- Per `decisions/published-workflow-model.md`, forks land in the actor's My Workflows **in the host workspace**, not the actor's home workspace. The fork store action resolves the host workspace from the source workflow's project rather than `currentWorkspace`.
- Per `open-questions.md#fork-auto-name-default` Proposed answer: new fork name is `"<Original name> (fork)"`.
- Per `open-questions.md#app-runner-fork-capability`: spec says App Runner cannot fork; FAQ contradicts. The prototype follows the spec — no Fork in the App Runner branch.

Wiki link:

- `wiki/entities/workflow.md` §"Permissions", §"Save destination", §"Published vs forked"
- `wiki/concepts/three-level-permissions.md` §"Asset level"
- `wiki/decisions/fork-vs-copy-one-operation.md`
- `wiki/decisions/save-destination-workflow-level.md`
- `wiki/decisions/published-workflow-model.md`

Open question dependency:

- `my-workflows-move-permissions` — Proposed answer is "re-confirm asset invitees on promotion". The prototype move dialog **does not** prompt for re-confirmation in this pass; it just moves. Logged here so the gap is visible. If promoted to a wiki decision, add the re-confirm step.
- `publish-direct-link-admin-gate` — direct-link publishing menu item is gated by `roleGrants['publish-direct-link']`; Hub submission gated by `roleGrants['submit-to-hub']`. Both currently toast stubs; if either becomes a real flow, the gate logic stays.
- `app-runner-fork-capability` — prototype follows spec stance (no Fork). Confirm with PM before promoting.
- `fork-auto-name-default` — prototype uses Option (a) `"<Original name> (fork)"`. Promotable if confirmed.
- **New question raised**: should "Duplicate" appear as a distinct verb in the Owner branch even though the underlying op is Fork? Working stance: yes, the verb matches user expectations for "make a copy of my own thing." Could be revisited if it muddies the wiki's one-verb-only stance.

Promote? maybe — once Willie confirms (a) the Owner / Runner / App-Runner menu shapes, (b) the move dialog can ship without the re-confirm dialog for now, (c) the "Duplicate" vs "Fork" verb split is OK. If confirmed, raise `wiki/decisions/workflow-context-menu-operations.md` documenting the menu shape and folding the open-question Proposed answers above into formal decisions.

## [2026-05-15] Project Settings — tabs inside ProjectDetailView, three sections

Decision:

- ProjectDetailView gains tabs in its body: **Workflows** (existing) and **Settings** (new). Members stays behind the existing header Share button for now.
- The Settings tab has three sections:
  1. **Allowlists** — Models and Custom Nodes, side by side. Each list has an "Override workspace allowlist" toggle. Off (default) = inherits workspace, shown read-only with a link to the workspace list. On = the project list **strictly overrides** workspace; workspace entries are not unioned in. Empty project list with override-on means "nothing is allowed in this project."
  2. **Usage** — read-only attribution. This-month project spend rendered as a slice of the workspace total; no per-project budget setting, no per-project cap.
  3. **Defaults** — a single field for now: `filenamePrefix`. When set, new save-node `filename_prefix` widgets are **prefilled** with this string; the user can freely edit or clear the value in the widget as normal. The project default is a _seed value_, not a runtime constraint.
- Tab visibility: Settings tab is shown to project **Owner** only (per `entities/project.md` "Owner-only operations: rename, edit settings"). Other roles see Workflows only.

Reason:

- **Strict override** (vs union/intersection) was chosen by Willie. Union/intersection would let a project Owner widen workspace policy unilaterally, which contradicts the workspace Admin's authority over workspace-level allowlists. Strict override is still bounded — a workspace Admin can lock the workspace allowlist into projects by _also_ removing the project Owner's ability to override (a follow-on delegation question, not in this pass).
- **Read-only attribution** keeps the wiki invariant intact: workspace remains the single billing entity. Per-project budgets would introduce a new constraint axis the wiki hasn't authored.
- **Filename prefix as a prefill seed** matches the `save-destination-workflow-level` precedent: save nodes carry no behavioral control of their own, but here the project provides a _starting value_ for a per-node widget rather than a per-workflow runtime setting. Crucially, edits in the widget always win — the project never overrides what the user typed.
- Tabs (vs sub-route / drawer) keep the project hero one click from settings without committing to a sub-route, and reuse the Settings primitives (`SettingsPanel`, `SettingsSubCard`, `AllowlistEditor`) from `SettingsView`.

Wiki link:

- Allowlists: `../IA_Plan/wiki/entities/project.md` §"What it contains" (model + custom-node allowlists are settled project state). `../IA_Plan/wiki/concepts/three-level-permissions.md` §"Project level" (Owner-only to edit). Strict override resolves the wiki-silent combine rule with workspace allowlists.
- Usage: `../IA_Plan/wiki/entities/workspace.md` §"Identity" (workspace = single billing entity). Project view is read-only slice; no new wiki claims.
- Defaults: extends `../IA_Plan/wiki/decisions/save-destination-workflow-level.md` with a new project-level prefill field. Wiki currently silent.

Open question dependency:

- **New question raised**: can a workspace Admin lock project allowlist overrides (a per-role delegable capability like "edit project allowlists")? Out of scope for this pass; would slot into the same `delegation-surface-in-ui` matrix as workspace-level grants if pursued.
- **New question raised**: does the project filename-prefix template support placeholder tokens (`{date}`, `{project-slug}`, `{workflow-name}`)? This pass treats the value as a plain string; tokenization is a v2 concern.

Promote? yes — once Willie confirms (a) strict-override is the right combine rule with workspace allowlists, (b) read-only attribution is the right billing posture, (c) the filename-prefix-as-prefill seed pattern is acceptable. If confirmed, raise three small decision pages: `wiki/decisions/project-allowlist-strict-override.md`, `wiki/decisions/project-usage-read-only.md`, `wiki/decisions/project-default-filename-prefix.md`.

## [2026-05-13] Workspace Members surface — three tabs, per-role delegation, multiple Admins

Decision:

- The Members surface is a single page with three tabs: **Members** (list + role change + remove), **Pending** (invites with resend/revoke), **Permissions** (per-role delegation matrix).
- Delegation is **per-role baseline only** in this pass. The Permissions matrix has rows = delegable capabilities, columns = Admin / Member / Guest. Admin is always-on (locked), Guest is always-off (locked), Member is the single interactive column. No per-member overrides.
- The five delegable capabilities enumerated: `publish-direct-link`, `submit-to-hub`, `approve-hub-submissions`, `edit-allowlists`, `configure-workspace`. Billing and ownership transfer are **not** delegable.
- Multiple Admins are allowed. Member→Admin promotion exists, and so does Admin→Member demotion (both gated to Admin viewers). The Members table sorts Admins first.
- Members can invite/remove + change role for Members and Guests, but cannot act across the Admin boundary. The role-change menu hides Admin transitions when the viewer is a Member.
- The Permissions matrix is rendered read-only when the viewer is a Member (matches the wiki's "Admin-controlled" framing).

Reason: User chose per-role baseline and "multiple Admins" up front. The matrix matches the Proposed answer to `publish-direct-link-admin-gate` ("admin-controlled sharing-permissions UI with per-role grants") and is the first concrete surface for `delegation-surface-in-ui`, which the wiki flags as a prerequisite for resolving multiple open questions. Single-Admin literalism would force special-case transfer UX and contradict the FAQ language; the wiki's own working answer leans this way.

Wiki link: `../IA_Plan/wiki/concepts/three-level-permissions.md` (delegation layer), `../IA_Plan/wiki/concepts/personas-and-flows.md` (#2 Admin, #3 Member, "Send invite" flow). Surfaces the proposed first-class permission-controls UI from `../IA_Plan/wiki/open-questions.md#delegation-surface-in-ui`.

Open question dependency:

- `delegation-surface-in-ui` — the matrix **is** the surface; Proposed answer requested an enumeration of delegable capabilities, which this pass nails down to five items above.
- `publish-direct-link-admin-gate` — two of the five capabilities map directly to the Proposed per-role grants.
- `single-admin-or-many` — prototype takes the "multiple Admins" branch (matches FAQ language, contradicts the workspace-permissions doc line); needs PM resolution before promotion.
- **New question raised**: Persona #7 "Member with delegated capabilities" implies per-member overrides on top of role baseline ("two Members, different action surfaces"). This pass does **not** support that — only role baseline. Need to decide whether per-member overrides are a v2 addition or whether persona #7's framing is overreach.

Promote? maybe — promote once PM confirms (a) multiple-Admin stance, (b) the five-capability list is complete and correct, (c) per-role-only is acceptable for MVP (or list per-member overrides as a follow-on). If confirmed, raise `wiki/decisions/workspace-permissions-delegation.md` and update `concepts/three-level-permissions.md` §delegation-layer with the enumerated capabilities.

## [2026-05-13] Asset-level role model + tailored per-persona fixtures

Decision:

- Workflow type extended with three optional fields: `kind: 'workflow' | 'app'`, `ownerUserId`, and `access: AssetAccess[]` where `AssetRole = 'owner' | 'runner' | 'app-runner'`. Owner is implicit from `ownerUserId`; `access` lists non-owner grants. Editor / Viewer roles intentionally omitted (post-MVP per wiki).
- Each persona now has a tailored fixture matching the [Prototype test-coverage matrix](../IA_Plan/wiki/concepts/prototype-test-coverage.md):
  - **Workspace Member** (Alex) — independent fixture; only Personal + Comfy Org in switcher; Client X marked `currentUserHasAccess: false`; Alex has her own per-workspace My Workflows project.
  - **Project Collaborator** (Mira Voss) — narrow workspace (Comfy Org only), workspace role `guest`, only Client X visible, auto-created My Workflows in the host workspace per `fork-destination-in-host-workspace` proposal.
  - **Asset-only Guest** (Tomás Reyes) — two workspaces (Comfy Org + a new minimal Studio Atlas), workspace role `guest` in both, no project visibility, asset-only access to one workflow (Runner) + one app (App Runner), auto-created Drafts in each host.
- Q3 Launch Site reassigned to Jane Park (existing Member) so "Admin auto-Owner on workspace-wide tier, not ownership" is genuinely testable.
- Named project-scoped workflows + the first prototype app live in admin fixture with explicit Owner/Runner/App-Runner role assignments matching the matrix.

Reason: Without tailored fixtures the Project Collaborator and Asset-only Guest personas in the switcher silently reused the Admin fixture, which made the persona switcher misleading. The matrix already specifies the target shape — the fixtures now match it row-for-row, so persona switching is the primary test surface.

Wiki link: `../IA_Plan/wiki/concepts/prototype-test-coverage.md` — the matrix this implementation pass instantiates.

Open question dependency:

- `fork-destination-in-host-workspace` — the auto-created Drafts in host workspaces for Mira and Tomás encode the proposed answer (forks land in actor's My Workflows in host workspace).
- `my-workflows-scope` — Alex's per-workspace Drafts encodes the proposed answer (one per user per workspace).
- `zero-state-for-asset-only-guest` — Tomás's cross-workspace data shape is now in place; the UI surface (Shared-with-me tray) is the remaining work.

Promote? no — this entry tracks fixture state, not an IA decision. The underlying open-question answers being encoded already have entries elsewhere.

## [2026-05-13] Project Sharing panel — Drive-style General access + People with access

Decision:

- The project members surface in `ProjectDetailView` is replaced with a Drive-style **Sharing** panel composed of three sections:
  - **Add people** row (combobox suggesting workspace members not yet on the project; selecting one adds them as project Collaborator)
  - **People with access** list (explicit project members + the project Owner + workspace Admins for workspace-wide projects). Role pills are dropdowns where the viewer has authority.
  - **General access** row (tier label + description + tier dropdown — Restricted ↔ Workspace-wide).
- Drafts (`private` tier) does not surface the Sharing panel at all — Drafts is sticky-personal.
- "Anyone with the link" intentionally **not** surfaced at the project level. Publishing applies to assets, not projects (per `../IA_Plan/wiki/concepts/sharing-vs-publishing.md`). A footer note points users at asset-level sharing/publishing.
- Authority model:
  - **Change tier**: project Owner or workspace Admin (admins are auto-Owner on workspace-wide tier; we extend the privilege to admins on any tier they can see).
  - **Invite / change role / remove**: project Owner, project Collaborator, or workspace Admin.
  - **Promote to Owner**: project Owner only (collaborators cannot create new owners).
  - Implicit-via-workspace rows (workspace Admins on workspace-wide tier) are read-only — to change their role you'd promote/demote them at the workspace level.
- New `personaStore` actions: `setProjectTier`, `addProjectMember`, `changeProjectMemberRole`, `removeProjectMember`. All mutate the fixture in-place.

Reason: Willie's Drive screenshot showed the clearer pattern: a coarse "general access" policy plus an explicit "people with access" list. Our previous design — a flat members table with read-only role pills — was both less informative (no tier-change affordance) and less actionable (no role editing). The Drive translation maps cleanly onto our IA except for "Anyone with the link," which we keep separated to honor the wiki's deliberate sharing-vs-publishing split.

Wiki link: `../IA_Plan/wiki/entities/project.md`, `../IA_Plan/wiki/concepts/three-level-permissions.md` (project level).

Open question dependency:

- New question to log in the wiki: **`project-tier-change-authority`** — Who is allowed to change a project's visibility tier? Wiki is silent. Working answer: project Owner OR workspace Admin (with admin auto-Owner on workspace-wide). Affects Project Settings UX once that gets built.
- Tangential: the "Anyone with the link" decision at the project level is itself a non-decision but worth flagging — if PM later wants project-level shareable links, the Sharing panel would need to grow a third section.

Promote? maybe — promote the authority model + tier-change-from-here pattern to a formal wiki decision once PM confirms (a) project Owner + workspace Admin is the right set, (b) projects don't get a "shareable link" affordance. If confirmed, add `wiki/decisions/project-sharing-surface.md` documenting the surface shape + the authority model, and answer the `project-tier-change-authority` question.

## [2026-05-13] Workspace settings — Identity + Allowlists (rows 1–3)

Decision: First slice of the Workspace settings page is three sections: General (identity), Model allowlist, Custom-node allowlist. Subsequent slices (data/training, billing, member credit limits, Hub publishing approvals, ownership transfer, danger zone) follow the same role + delegation gating pattern.

- **General**: Workspace name + description (editable), Type pill (Personal/Team), Owner display. Admin-only edit; everyone else read-only.
- **Model allowlist** + **Custom-node allowlist**: add/remove entries with name + added-by metadata. Editable by Admin OR by Member when the `edit-allowlists` delegation is granted. Empty state renders for empty lists.
- Guests see a single empty-state stub on the page; the wiki excludes them from workspace browsing.
- Removed the placeholder "Delegations" section — that surface is already the Members → Permissions tab. A footer hint links there from non-edit personas.
- Allowlists are modeled at the fixture top level (`PersonaFixture.allowlists`), mirroring how `roleGrants` is shaped — current-workspace-scoped. Adequate for the prototype; a multi-workspace model would key them per-workspace later.
- New `personaStore` actions: `setWorkspaceName`, `setWorkspaceDescription`, `addAllowlistEntry(kind, name)`, `removeAllowlistEntry(kind, id)`.
- New reusable `AllowlistEditor.vue` component (kind-agnostic — name, description, entries, canEdit, addPlaceholder, addedByLabel).

Reason: Workspace settings was an empty placeholder. The wiki names a clear inventory (model allowlist, custom-node allowlist, data/training, billing, member credit limits) in `wiki/entities/workspace.md` §"What it contains", and `wiki/concepts/three-level-permissions.md` §"Workspace level" specifies which of those are delegable. Identity + Allowlists is the smallest first slice that exercises both the admin-only and delegable gates, and seeds the page structure that the remaining sections will plug into.

Wiki link: `../IA_Plan/wiki/entities/workspace.md` §"What it contains"; `../IA_Plan/wiki/concepts/three-level-permissions.md` §"Workspace level" + §"Delegation layer".

Open question dependency: None for this slice. Upcoming slices will depend on `per-member-credit-limits` (mechanism TBD, Proposed answer says surface required regardless).

Promote? no — this slice is a UX shape, not a wiki-level decision. The remaining sections may produce promotable decisions (e.g. how the credit-limit surface should look).

## [2026-05-13] Workspace settings — Billing + Member credit limits (rows 5–6)

Decision: Added Billing & subscription + Member credit limits sections to the Workspace Settings page. Both are Admin-only and not delegable, per `wiki/concepts/three-level-permissions.md` §"Workspace level".

- **Billing**: three cards — plan (with renew/cancel date + status badge), payment method (brand + last4 + expiry), credit balance (with progress bar + reset date) — followed by an invoice list. "Manage plan" / "Update payment" are affordance stubs; the real modals/Stripe portal are out of scope for the prototype.
- **Billing visibility**: shown whenever `fixture.billing` is populated AND viewer is Admin. Personal workspaces with a `free` plan still show the section (they are billing entities per wiki, just with a simpler shape). Local-only personas have `billing: null` and the section hides.
- **Member credit limits**: table of non-admin members with an editable limit (number input) + period (monthly/weekly/one-time) + a usage progress bar. Setting limit to 0 clears the row; "Clear" button explicit alongside.
- **Credit-limit gating**: only shown on **team** workspaces. Hidden on personal workspaces since the wiki frames it as a multi-member governance tool.
- **Mechanism-TBD copy**: an italic note states enforcement is unresolved (hard block / soft warn / pre-charge). This honors open-q `per-member-credit-limits`, whose Proposed answer is "surface required regardless of mechanism."
- **Ownership note**: a one-line italic footer reminds the admin that billing does **not** auto-transfer with workspace ownership, per the wiki Lifecycle section.
- New types: `Subscription`, `PaymentMethod`, `CreditBalance`, `Invoice`, `WorkspaceBilling`, `MemberCreditLimit`, `CreditLimitPeriod`.
- New store actions: `setMemberCreditLimit`, `removeMemberCreditLimit`.
- New components: `BillingSection.vue`, `MemberCreditLimitsSection.vue`.

Reason: Continues the Workspace Settings build order. Billing is the most-named-but-least-specified surface in the wiki, so we stayed display-only — enough to demonstrate IA shape without speculating on plan UX. Per-member credit limits is the only open question whose Proposed answer explicitly commits to a UI requirement, so we built the surface and labelled the mechanism gap.

Wiki link: `../IA_Plan/wiki/entities/workspace.md` §"What it contains" + §"Lifecycle"; `../IA_Plan/wiki/concepts/three-level-permissions.md` §"Workspace level"; `../IA_Plan/wiki/open-questions.md#per-member-credit-limits`.

Open question dependency: `per-member-credit-limits` (mechanism TBD) is the only live dependency. Adjacent open question to flag back to the wiki: **billing-entity-shape-on-personal-workspaces** — does a Personal workspace see the full billing surface, or a stripped-down one (e.g., only credit balance, no invoice list, no member limits)? Working answer in this prototype: full surface, but the member-limits section auto-hides on personal tier.

Promote? no — this is UX shape, not a wiki-level decision. Promotable bits surface once we hear back on the billing-on-personal question.

## [2026-05-13] Workspace settings — Data/training, Hub queue, Ownership, Danger zone (rows 4, 7, 8, 9)

Decision: Completed Workspace Settings page with the remaining four sections.

- **Data & training policy** (row 4): single opt-out checkbox stored on `Workspace.dataTrainingOptOut`. Editable by Admin OR by Member with `configure-workspace` delegation.
- **Hub publishing approval queue** (row 7): list of pending submissions with Approve/Reject buttons. Editable by Admin OR by Member with `approve-hub-submissions` delegation. Both actions remove the item from the queue (the prototype does not yet distinguish "approved → published" from "rejected → removed").
- **Workspace ownership** (row 8): dropdown of other Admins + Transfer button. Hidden on personal workspaces. Confirm prompt before transfer. Footer reiterates the wiki rule that billing does **not** transfer with ownership.
- **Danger zone** (row 9): Delete button with confirm prompt. Hidden on personal workspaces. On delete, switches the current workspace to the first remaining one in the fixture.
- **No new components** — all four sections inlined in `SettingsView.vue` since each is small and section-specific.
- New types: `HubSubmission`, `Workspace.dataTrainingOptOut`.
- New store actions: `setDataTrainingOptOut`, `approveHubSubmission`, `rejectHubSubmission`, `transferOwnership`, `deleteCurrentWorkspace`.
- Fixture seed change: moved the prior Pablo credit-limit row to `user-alex` (Pablo is an Admin and admins are filtered out of the credit-limits table); added 3 Hub submissions.

Reason: Closes out the Workspace Settings page per the build order. Data/training and Hub queue both exercise the delegable-grants pattern in a different shape (checkbox + queue), giving the persona toggle visible behavioral surface area. Ownership transfer + danger zone exercise the Personal-vs-Team gating from `wiki/entities/workspace.md` §"Lifecycle" — personal workspaces cannot be deleted or transferred.

Wiki link: `../IA_Plan/wiki/entities/workspace.md` §"What it contains" + §"Lifecycle"; `../IA_Plan/wiki/concepts/three-level-permissions.md` §"Workspace level" (data/training, Hub approval, transfer, delete).

Open question dependency: None new. Adjacent gaps surfaced by building this:

- **Hub queue resolution states** — wiki is silent on whether rejections need a reason, whether items are revisable, whether approvals show in a history. Prototype treats both as terminal removal; flag if PM wants richer state.
- **Self-transfer guard** — wiki says "between Admins" but is silent on whether the sole Admin must promote a Member before transferring. Prototype enforces this implicitly by requiring at least one other Admin in the dropdown.

Promote? maybe — once PM confirms the Hub-queue resolution model and self-transfer rule, both could feed a small formal decision page.

## [2026-05-14] Local-only — surface Create-a-workspace CTA in the workspace switcher slot

Decision:

- For Persona 1b (Solo creator — local-only), the slot at the top of the sidebar that normally holds the workspace switcher chip is now occupied by a dashed-outline **Create a workspace** CTA (`WorkspaceCreateChip.vue`). Previously, this slot was empty for local-only personas.
- Visual treatment: dashed border around the whole chip; plus-icon avatar (dashed square placeholder) where the colored workspace avatar normally sits; "Create a workspace" as the primary line; one-line subtitle hinting at the cloud value ("Sync, collaborate, share").
- The CTA is presentational in the prototype (no handler); in product it would route to sign-up / new-workspace creation.

Reason: The wiki's current position (`concepts/personas.md` §1b) lists the workspace switcher under **NOT seen**, and `concepts/personas.md` further says "**Workspace concept invisible in the UI** — there's nothing to switch between and no one else to share with." That keeps the team/sharing/permissions concepts hidden — good — but it also leaves the local user without any discoverable entry point to the cloud upgrade path. Putting a single, intentionally-low-density CTA in that slot threads the needle: it doesn't introduce members, sharing, or projects, but it does make the "you could have a workspace" affordance visible and ambient instead of relying on a separate Settings or banner surface.

Wiki link: `../IA_Plan/wiki/concepts/personas.md` §1b — Solo creator — local-only; `../IA_Plan/wiki/concepts/local-vs-cloud-integration.md`; `../IA_Plan/wiki/open-questions.md#workspace-label-in-local-only`.

Open question dependency:

- Lightly touches `workspace-label-in-local-only` — the open question asks what label the local user sees where "<Username>'s Workspace" would normally render. By replacing that slot with a CTA we sidestep the labeling question for the populated state but introduce a new shape (an _unpopulated_ workspace slot) that the question didn't anticipate. Worth recording so the next pass on that open question accounts for both modes.
- New question to log in the wiki: **`local-only-upgrade-affordance`** — Should the local-only sidebar surface an explicit upgrade/sign-in entry point in the workspace switcher slot, or should the upgrade path live elsewhere (Settings, top-bar user menu, contextual nudges)? Working answer in this prototype: yes, in the switcher slot, as a passive dashed-outline CTA. Affects how prominent the sign-up path becomes in the local-first experience.

Recommended wiki updates (for IA_Plan, not made from this repo):

1. `wiki/concepts/personas.md` §1b "What they see" — move the workspace switcher off the **NOT seen** list and add a bullet under "What they see" describing the Create-a-workspace CTA in its slot. Cross-ref the new open question.
2. `wiki/open-questions.md` — add `local-only-upgrade-affordance` with the working answer above.
3. Optionally revisit `workspace-label-in-local-only` to clarify it now only covers the **populated** workspace slot for the local persona (which still isn't displayed).

Promote? maybe — promote once PM confirms (a) the CTA belongs in this slot vs. a different surface, (b) the subtitle copy ("Sync, collaborate, share") strikes the right tone for the cold local user, and (c) clicking the CTA should kick off sign-up + workspace creation as a single flow rather than two steps.

## [2026-05-13] Node-graph project chip + workflow-level save destination (local disk vs cloud)

Decision:

- The top-left of the node graph carries a small **project chip**. Two states only:
  - In a real project → chip shows the project's initial (and on click, opens a popover with the project name + promote-to-different-project option + the save-destination toggle).
  - In My Workflows (i.e., "not in a project" from the user's mental model) → chip renders as a `+` Promote affordance (popover surfaces the same save-destination toggle plus "Promote to project…").
- Workspace identity is **not** displayed on the canvas — it lives in the top-right user menu instead. The chip is project + save-destination only.
- A workflow's **save destination** (where its save nodes write outputs) is a **workflow-level setting**, controlled from the chip's popover. Default: **local disk**. Alternative: **cloud** (resolves to the workflow's project, or My Workflows if it has no cloud identity yet).
- Save nodes themselves carry **no** destination control — they read from the workflow's setting. One run, one destination.
- For signed-out users on a local install, the cloud option renders **disabled** with a tooltip explaining that signing in unlocks it (the affordance stays visible for discoverability).
- For signed-in local users flipping `Save = cloud` on a workflow with no cloud identity yet, the cloud workflow record is **auto-created lazily** under My Workflows on the flip (or on first cloud-save fire) — no confirmation modal. Matches the wiki's "no ceremony for My Workflows" stance.

Reason: Two threads converged. (1) The new IA needs a canvas-level indicator that a workflow lives in a project (vs My Workflows). (2) Signed-in local users need a way to opt their workflow's outputs into cloud so they show up in their cloud library. A per-save-node toggle is incoherent (outputs of "one run" scattering across local and cloud), and a workspace-level default is too coarse (mixed local/cloud workflows in one workspace is a real case). Workflow-level via the chip is the right scope, and the chip is the right surface — it's already the project context, and the destination toggle is logically adjacent to project membership.

The wiki previously read as if any local→cloud output upload was forbidden ([`cloud-local-bridge.md`](../IA_Plan/wiki/concepts/cloud-local-bridge.md) rule 3). Per Willie's clarification, that rule was scoped to **bridge-driven auto-uploads** (where dragging an output file between cloud-bridged folders could launder provenance) — **not** user-initiated save-node writes, which preserve provenance because the output stays attached to its generating workflow. The wiki has been amended accordingly.

Wiki link: New formal decision: [`../IA_Plan/wiki/decisions/save-destination-workflow-level.md`](../IA_Plan/wiki/decisions/save-destination-workflow-level.md). Amended: [`../IA_Plan/wiki/concepts/cloud-local-bridge.md`](../IA_Plan/wiki/concepts/cloud-local-bridge.md) §rule 3 to distinguish bridge uploads from save-node writes. Updated: [`../IA_Plan/wiki/entities/workflow.md`](../IA_Plan/wiki/entities/workflow.md) §"Save destination" and [`../IA_Plan/wiki/entities/output.md`](../IA_Plan/wiki/entities/output.md) §"Where outputs are written".

Open question dependency:

- **`save-cloud-cost-surface`** (new) — Cloud saves cost storage credits. Does the chip popover need a billing hint on first cloud flip? Working answer: one-time tooltip; don't repeat on every save. Not yet logged in wiki open-questions.
- **`save-destination-offline-behavior`** (new) — Signed-in user is currently offline with chip set to cloud — queue, fail, or fall back to local? Not MVP; working answer: fail clearly at run time. Not yet logged.
- **`mixed-destination-per-save-node`** — Considered and rejected for MVP (some outputs local, some cloud, e.g. previews local + finals cloud). Revisit if a user need emerges.

Promote? **yes — already promoted.** The wiki decision page is filed. This log entry captures the trail and the open-question follow-ups. Pending PM confirmation: scope of the cloud-cost tooltip; offline behavior; whether the lazy auto-create on cloud-flip should be on chip-flip or first-run-fire (implementation detail, doesn't change the user-facing model).

## [2026-05-13] Promoting locally-saved outputs to cloud — inference, filters, per-card workflow badges

Decision:

- Locally-saved outputs can be **promoted to cloud** after the fact. Destination is inferred from the output's **embedded workflow metadata** — no project picker is shown to the user.
- Inference cascade: parent workflow's cloud project → actor's My Workflows → lazy-create a cloud workflow record under My Workflows if the workflow has no cloud identity yet. Fallback prompt only when metadata is missing or unreadable.
- **Media assets grid**: no per-thumbnail badge (noise across many items). Local/cloud is surfaced via (a) a filter control in the toolbar (All / Local only / Cloud only) and (b) the asset details panel.
- **Workflows grid**: per-card local/cloud badge is acceptable — fewer items, signal is design-relevant. Uses the same `hard-drive` / `cloud` iconography as the editor's project chip.
- **Promote action**: per-asset (details panel or context menu), bulk-select supported in principle. Additive — does **not** delete the local copy on promote.
- **Workflow identity in metadata** (whether ComfyUI writes a stable ID into output PNGs that resolves the same parent workflow across machines) is deferred — flagged as engineering open question, out of scope for IA design.

Reason: Two threads converged. (1) Users running locally accumulate outputs on disk; we need a one-way path to lift selected work into the cloud library without forcing them to re-execute cloud-side. (2) The wiki's permission model treats outputs as inheriting from their parent workflow, so the parent workflow is the source of truth for project membership — asking the user to pick at promote time would risk attribution mistakes and re-introduce the cross-project provenance laundering the cloud-local-bridge rule 3 was written to prevent. Embedded metadata closes the loop: output → parent → project, in that order, with no user input needed for the common case.

The per-thumbnail badge decision (no for media, yes for workflows) came from user feedback during design discussion — media-asset views have density that doesn't tolerate per-card chrome; workflow grids do.

Wiki link: New formal decision: [`../IA_Plan/wiki/decisions/promoting-local-outputs-to-cloud.md`](../IA_Plan/wiki/decisions/promoting-local-outputs-to-cloud.md). Extended: [`../IA_Plan/wiki/entities/output.md`](../IA_Plan/wiki/entities/output.md) §"Promoting local outputs to cloud". Index updated.

Open question dependency:

- **`output-workflow-identity-in-metadata`** (new, deferred) — engineering question on whether ComfyUI writes a stable workflow ID into output metadata. Tracked in wiki decision; user marked out of scope for IA design.
- **Media file promote** (no parent workflow → no inference) — flagged in the wiki decision as needing its own design pass. Working stance: explicit pick required; not yet specced.
- **Remove-local-copy-after-promote** affordance — not in first cut; revisit.
- **Bulk-promote UX** — supported in principle; first cut may scope to single-asset promote only.

Promote? **yes — already promoted.** Wiki decision is filed. This entry captures the prototype-side plan: filter on the global media assets page, per-card badge on workflows, details-panel field, promote action stub. Pending PM confirmation: the no-badge-on-media-thumbnails stance, the inference cascade fallbacks (esp. lost-access case), and bulk-promote scope.

## [2026-05-14] Guest personas — replace "Shared with me" tray with filtered normal nav + cross-workspace notifications

Decision:

- **Project Collaborator (Mira)** and **Asset-only Guest (Tomás)** no longer see a dedicated **Shared with me** sidebar item. Instead, they use the normal sidebar — Recents, Projects, etc. — filtered to whatever they have access to. The sidebar is already workspace-scoped; switching workspaces switches the view.
  - Project Collaborator: Projects shows only the projects she's a Collaborator on (Mira sees just Client X). Library and Members remain hidden. Inside the project she has full Collaborator capability.
  - Asset-only Guest: Projects shows the project shells that contain his accessible assets (Tomás sees Coca-Cola in Comfy Org and Brand systems in Studio Atlas). Inside the project, the workflow grid is filtered to just his accessible asset; the Share button, Media assets button, and `+ Workflow` button are hidden via an `isAssetOnlyGuest` guard. The project page becomes a transit shell.
- **Cross-workspace alerts** move to a new top-bar **Notifications** affordance (`TopBarNotifications.vue`): a bell button between the feedback button and the user chip, with a primary-color badge for unread count and a popover listing recent items. Clicking a row marks it read, switches workspace if the target is elsewhere, and routes to the project. "Mark all read" clears unread.
- **Notification kinds supported v1**: `asset-grant`, `asset-update`, `project-grant`, `workspace-invite`. Future kinds (@mentions, run-complete, Hub-submission state, push) deferred.
- **Data shape**: `PersonaFixture.notifications: Notification[]` with `{ id, kind, actorUserId, target: { workspaceId, projectId?, assetId? }, createdAt, readAt? }`. Seeded for both guest personas; empty for everyone else.
- **Store**: removed the previous `sharedProjects` / `sharedAssets` computeds and the `shared-with-me` / `shared-asset` ActiveView kinds; added `sortedNotifications`, `unreadNotificationCount`, `markNotificationRead`, `markAllNotificationsRead` to `personaStore`.
- **Files removed**: `views/SharedWithMeView.vue`, `views/SharedAssetView.vue`. The i18n blocks `prototype.views.sharedWithMe.*` and `prototype.views.sharedAsset.*` were dropped in favour of `prototype.views.notifications.*` and `prototype.tabs.notifications`.

Reason: The wiki's §4 already specifies that Project Collaborators see a narrow workspace view (only their projects). Our "Shared with me" tray was a prototype-only invention that diverged from that shape and forced two different navigation mental models for guests vs members. Sharing the navigation makes the role hierarchy feel additive (more access → more visible) instead of substitutive (different surface entirely). The sidebar is workspace-scoped, so Asset-only Guests who are present in multiple workspaces use the workspace switcher exactly like Members do — what they _can't_ see passively is activity in another workspace, which is what the Notifications bell solves: a global, cross-workspace cue surfaced at the top bar regardless of which workspace they're currently in.

Wiki link: `../IA_Plan/wiki/concepts/personas.md` §4, §5; `../IA_Plan/wiki/concepts/three-level-permissions.md`.

Recommended wiki updates (for IA_Plan, not made from this repo):

1. **`wiki/concepts/personas.md` §4 (Project Collaborator)** — "What they see" already implies filtered normal nav; add an explicit clarifier that the surface is the same as a Member's, just filtered. Remove any cross-reference to a dedicated "Shared with me" surface if one exists.
2. **`wiki/concepts/personas.md` §5 (Asset-only Guest)** — current text says "no project, no other assets … no workspace browsing." Revise to: the project _shell_ is visible (sidebar entry + detail page), but the project interior is filtered to just their accessible assets and all share/edit/create affordances are hidden. Workspace browsing happens via the standard switcher between the workspaces they're a guest in.
3. **New concept page** `wiki/concepts/notifications.md` — describe the bell affordance, its global (cross-workspace) scope, the v1 trigger types (`asset-grant`, `asset-update`, `project-grant`, `workspace-invite`), the routing-on-click contract (switch workspace if needed → navigate to project), and the read/unread model.
4. **`wiki/open-questions.md`** — add `notification-deep-link-targets` (should clicks route to project, asset detail when we have one, or the host-workspace inbox?) and `notification-cross-workspace-routing-contract` (do we always auto-switch, or prompt for workspace switch first?). Working answer in this prototype: auto-switch, route to project.
5. **`wiki/open-questions.md#zero-state-for-asset-only-guest`** — the prior "multi-workspace asset tray" framing is superseded; either close the question or rephrase it around the project-shell zero state (what does Tomás see when he opens a project where his only accessible asset has been revoked?).

Promote? maybe — once PM confirms (a) the project-shell-with-filtered-interior position for Asset-only Guest, (b) auto-switch routing on notification click, and (c) the v1 notification kind set. If confirmed, promote the persona revisions to formal wiki edits and add a `wiki/decisions/notifications-cross-workspace-alerts.md` page.

## [2026-05-18] Arc A1 — Multi-install foundation (Install type, switcher chip, three new personas)

Decision:

- New `Install` type per `../IA_Plan/wiki/entities/install.md` — `{ id, displayName, comfyUIVersion, packageSetTag?, registeredAt }`. Lives on `PersonaFixture` as `installs: Install[]` + `activeInstallId?: string`. Empty list means cloud-only (the chip hides).
- Active-install state lives **inside the persona fixture**, not a separate Pinia store. Mutations go through `personaStore.setActiveInstall(id)`. Persona-switching naturally resets the state.
- Three new switcher entries:
  - **Install Governor (Sasha Lin)** — persona 2a. Two installs (personal dev + VFX team build); active = VFX team build.
  - **Managed Artist (Jonah Park)** — persona 3a. One install (VFX team build). Switcher rarely engaged — matches Journey 2's success state.
  - **Freelancer (Reza Khalid)** — persona 4a. One install (personal dev on ComfyUI 0.4.0, deliberately outside the team project's allowed-install set). The fixture A2's compat-gate UX will trip against.
- **Install indicator placement: top bar, between the feedback button and `TopBarNotifications` bell.** This is the prototype's working answer to wiki open question `install-indicator-placement` — the design team had left placement deliberately open. Reinforces that install is global/cross-workspace, mirrors the notifications bell pattern.
- **Switching behavior in A1 is informational only.** The switcher updates `activeInstallId`; no tab-set swap, no compat re-evaluation, no dirty-tab prompt. Those land with Arc A2 (compat gate + attribution) and A3 (allowed-install set authoring + version bump).

Reason: Arc A1 establishes the foundation for the whole multi-install / VFX-team narrative — types, fixtures, indicator, switching mechanic. Keeping switching informational defers the higher-friction UX decisions (dirty-state handling, gate behavior, attribution) to the arcs where they're the focus, rather than half-implementing them upfront. The top-bar placement was chosen via design preview against two alternatives (sidebar-under-workspace-chip; sidebar-footer-near-settings); the wiki's principle that the install is the runtime — global and cross-workspace, not workspace-scoped — pointed to the top bar.

Wiki link:

- New: `concepts/install-switcher.md` (the switcher behavior this implements).
- New: `entities/install.md` (the type definition).
- New: `concepts/install-journeys.md` (the personas this fixture set serves, esp. Journeys 2, 3, 6).
- New: `decisions/team-locked-install.md` (the allowed-install set as a hard lock — referenced by Freelancer fixture's deliberately-off-set install).
- Updated: `concepts/personas.md` §2a, §3a, §4a — the new personas.

Open question dependency:

- **`install-indicator-placement`** (open) — working answer recorded here is **top bar**. If a future round picks differently, the chip relocates without changing the underlying store.
- **`install-switch-dirty-state`** (open) — deferred to A2. Working answer in the wiki: prompt before swap if any tab has unsaved changes. Not implemented in A1 because the prototype doesn't model tab-level dirty state yet.
- **`default-active-install`** (open) — working answer in the wiki: most-recently-used, falling back to most-recently-added. Honored in fixtures (Admin defaults to Personal dev; Install Governor to the VFX build they live on).
- **`project-install-allowed-set`** expression form (open) — working answer in the wiki: version range + package-set tag. Freelancer's fixture exercises the _negative_ case (their install lacks the `vfx-team-q2-2026` tag) so A2 can render the compat-gate against a clear miss.

Promote? **no, not yet.** Arc A1 surfaces the install model in the UI; promotion (to a formal wiki decision on placement, or to closing the relevant open questions) waits for the A2/A3 work to confirm the foundations hold up against the harder flows.

## [2026-05-18] Arc A2 — Compat gate + install attribution (Journey 6 load-bearing UX)

Decision:

- **Workflow + project compat are layered.** Compat resolves against a two-layer rule per `concepts/install-switcher.md` §"Workflow version compatibility" + §"Project install constraints":
  1. Project's `allowedInstallSet` (hard lock per `decisions/team-locked-install.md`) — fails first.
  2. Workflow's own `requiredInstallSet` — fails next.
  3. Workflow's `recommendedComfyUIVersion` — soft, surfaces only an advisory badge.
- **Compat result shape:** `{ status: 'compatible' | 'recommended-mismatch' | 'blocked' | 'no-install', reason?, required?, current? }`. Implemented in `composables/useWorkflowCompat.ts`. The composable is reactive against active-install + persona switches.
- **`no-install` is gate-free** in the prototype. Cloud-runtime personas (Mira Project Collaborator, Asset-only Guest) see no badge and no gate even on workflows in projects with `allowedInstallSet` — this matches the wiki's Journey 4 framing (cloud BE advertises its own compat identity). Wiring the cloud runtime as a compat-set member is an engineering question deferred per the wiki's open-q.
- **Visual surface — `WorkflowCard.vue`:**
  - **Blocked:** dark/danger lock badge in the top-left corner of the thumbnail.
  - **Recommended-mismatch:** amber/warning triangle badge.
  - **Compatible / no-install:** nothing.
- **Interception model:** the gate intercepts `Open` at the `WorkflowCard` level — both the click-the-thumbnail path and the right-click menu's Open action funnel through one `onOpen` handler. Blocked workflows open the gate dialog instead of emitting `open`. Compatible workflows behave as before.
- **Gate dialog (`InstallGateDialog.vue`) shape — Journey 6's load-bearing UX:**
  - Header: "This workflow needs a different runtime" + workflow name.
  - Required block: version range + package set tag (if present) + a one-line reason matched to the failure (`project-allowed-set` / `workflow-required-set` / `recommended`).
  - Current block: the active install's version + tag.
  - Two stub remediation actions: **Install the team build** (Journey 6 step 5 — additive new install) and **Use cloud runtime** (Journey 6 §"Cloud-runtime as an alternative" — Comfy Cloud BE for the host workspace).
  - Both stubs just close the gate in A1/A2; the real installer / cloud-runtime swap is a separate workstream.
- **Install attribution on the asset details panel** — the platform `AssetDetailPanel.vue` got a single new row, "Generated by `<install name> · ComfyUI <version> · <packageSetTag>`", sourced from `user_metadata.installAttribution`. Imported / pre-attribution assets omit the row, matching `entities/output.md` §"Install attribution" (which states _"imported media files carry no install attribution"_). Two fixture projects now seed attribution (Client X Pitch → VFX build, Personal Sketches → Personal dev) so the row exercises both cloud and local cases; Marketing Q3 / Coca-Cola intentionally omit attribution to validate the hidden-row case.

Reason: Journey 6 is the persona 4a Freelancer's load-bearing flow; in product reality it's the first thing they see when opening a team workflow. The gate's job per the wiki is _informative_, not just blocking — surface (a) the constraint, (b) the actual diff vs the contractor's install, (c) the next step. The dialog hews to that contract.

Touching the platform `AssetDetailPanel.vue` to add the attribution row is a small departure from the WORKSPACE-UX-PROTO.md guidance of "prototype code only under `src/prototype/`" — chosen because:

1. The same prototype-only-metadata pattern is already established in the file (`projectName`, `workflowName`, `storage` are all prototype-injected fields with the same hidden-when-absent treatment).
2. A single computed + a single row keeps the upstream-divergence cost minimal.
3. Attribution is a first-class output property per `entities/output.md`; it's reasonable for the production AssetDetailPanel to eventually carry it. The prototype validates the surface.

Wiki link:

- New formal decision target: none yet — the gate + attribution shape are direct implementations of `concepts/install-switcher.md` and `entities/output.md` §"Install attribution"; no promotion needed unless the design changes during use.
- Implements: `concepts/install-journeys.md` §6 (freelancer install gate); `entities/workflow.md` §"Runtime compatibility"; `entities/project.md` §"Install constraints"; `entities/output.md` §"Install attribution"; `decisions/team-locked-install.md`.

Open question dependency:

- **`workflow-runtime-compat-mechanisms`** (open) — whether soft + hard collapse to one mechanism later. The prototype keeps both flavors active (recommended badge + required gate) to let designers see them side by side.
- **`cloud-runtime-as-compat-set-member`** (open / engineering) — the prototype's `no-install` short-circuit assumes cloud personas pass the gate. Whether the cloud BE actually satisfies a `vfx-team-q2-2026` constraint at run time is an eng question outside A2.
- **`output-workflow-identity-in-metadata`** (open / engineering) — referenced by `decisions/promoting-local-outputs-to-cloud.md`. Attribution carries an `installId` independently of workflow identity, so this open-q doesn't gate A2.

Promote? **no, not yet.** A2 is direct implementation of settled wiki positions; the design-decisions worth promoting (gate shape, attribution row) wait for review of the running prototype + Willie sign-off.

## [2026-05-19] Arc A2 pivot — install gate is by _identity_, not by version-range + tag

Decision:

- **The project allowed-install set is a list of install identities, not a decomposed predicate.** Replaces the earlier prototype shape `{ versionRange, packageSetTag }` with `Project.allowedInstallIds: string[]`. The gate checks `activeInstall.id ∈ allowedInstallIds`. No version arithmetic, no tag matching.
- **The workspace-canonical install name** lives on the project (`Project.installLockDisplayName`) and is the string the gate dialog renders for the Required line. Per-user install `displayName` values are labels chosen by each user and are not used for the gate's required-name rendering.
- **Per-user install display names diverge.** The Managed Artist persona's fixture intentionally names the team build `"Comfy team"` while the Install Governor's fixture names the same bundle (same `id`) `"VFX team Q2 2026"`. This exercises the "names are user-chosen, identity is the bundle" invariant in the persona switcher.
- **`Install.packageSetTag` is removed.** Same for `InstallAttribution.packageSetTag`. The build-name-as-tag idea is dropped — display names are labels; identity is the install ID.
- **`Workflow.requiredInstallSet` is removed.** A workflow's hard runtime requirement, if there is one, is expressed via its containing project's allowed-install set. Workflow-level hard requirements layered on top of project-level hard requirements is double-counting; the project owns the lock.
- **`Workflow.recommendedComfyUIVersion` is preserved** as the soft / advisory path. Use case: a workflow author who knows their workflow uses node packs requiring ComfyUI ≥ X.Y.Z and wants to label that for users running the workflow _outside_ a locked project (e.g., Hub-published workflows where no team install applies). This is labeling, not blocking — surfaces a triangle-alert badge, doesn't open the gate dialog.

Reason: Desktop team confirmed (in conversation) that an install is one indivisible unit: ComfyUI version + Python deps + custom nodes + filesystem layout, all together. Custom nodes live _inside_ the install — switching installs swaps the node set. The "package-set tag" framing the wiki had proposed for `project-install-allowed-set` was conceived before this clarification and effectively tried to decompose the bundle. The right shape is: an install is identified by its bundle (in product, a manifest/content hash; for the prototype, the existing `id` string), and the project-level lock lists which bundle identities may run its workflows.

Names are intentionally not portable across users — Sasha calls the bundle "VFX team Q2 2026"; Jonah calls the same bundle "Comfy team"; Reza might never install it. The bundle's identity is what travels across machines; the names are local.

Wiki link:

- Closes the wiki's `project-install-allowed-set` open question's _proposed_ answer (version range + package-set tag). New proposed answer to log to the wiki: **list of install identities (bundle/manifest hashes); user-chosen display names are labels, not part of the identity.**
- Reinforces `decisions/custom-nodes-as-configuration.md` — the install gate doesn't need to express which custom nodes are allowed because they're already bundled in the install (and the workspace/project custom-node allowlist enforces per-workflow validation independently).
- Consistent with `decisions/team-locked-install.md` (still a hard lock, just expressed differently) and `decisions/install-is-runtime-not-permission-entity.md` (install stays out of the permission spine).

Open question dependency:

- **`project-install-allowed-set`** (open) — the prototype's working answer is now "list of install IDs." The wiki should update its proposed answer to match.
- **Cross-user install identity discoverability** (new, surfaced by this pivot) — if Sasha pins her local install ID into the project's allowed list, how do Jonah's, Reza's, and the cloud BE's installs end up with the same ID? In product, this is the desktop team's bundle-hash story (same bundle = same hash on any machine). For the prototype, we just use a shared string `install-vfx-team-q2-2026` across the fixtures of personas that have that bundle.

Recommended wiki updates (for IA_Plan, not made from this repo):

1. **`open-questions.md` §`project-install-allowed-set`** — replace the current proposed answer with: "list of install identities (bundle / manifest hashes); user-chosen display names are labels, not identifiers."
2. **`concepts/install-switcher.md` §"Project install constraints"** — replace the "compat predicate" language with identity-list language. The portable identity is the bundle hash, supplied by the desktop installer.
3. **`entities/project.md` §"Install constraints"** — same.
4. **`entities/install.md`** — clarify that `id` is the install's stable identity (bundle hash in product) and `displayName` is a user-chosen label.

Promote? **yes — promoted to wiki on 2026-05-19.** Landed as:

- New: [`wiki/decisions/workspace-install-registry.md`](../../IA_Plan/wiki/decisions/workspace-install-registry.md)
- New: [`wiki/concepts/workspace-install-registry.md`](../../IA_Plan/wiki/concepts/workspace-install-registry.md)
- Updated: `wiki/decisions/team-locked-install.md` (identity-based match), `wiki/entities/project.md` (`allowedInstallIds` + `installLockDisplayName`), `wiki/entities/install.md` (identity vs display name), `wiki/entities/workspace.md` (`blessedInstalls`), `wiki/concepts/install-switcher.md`, `wiki/concepts/install-journeys.md` (Journeys 1, 4, 5, 6, 7), `wiki/concepts/personas.md` §2a, `wiki/open-questions.md` (`project-install-allowed-set` closed), `wiki/index.md`.

## [2026-05-20] Workspace install registry — local-install state is desktop-only

Decision:

- **Installs are entirely a desktop-application concept.** The cloud-side workspace does not track which bundles any user has installed on which machine. The registry is purely cloud-side configuration metadata (bundle identity + canonical name + lock + publisher + bundle version); the _user has this bundle locally_ fact lives only on the desktop client.
- **The "Install on this machine" affordance on a registry row is a desktop-only surface.** When the desktop client renders Workspace Settings → Installs, it joins the registry with the local `installs[]` list and shows the button on entries the user doesn't have locally. In a cloud-only context (cloud.comfy.org), the button can still appear but must **deep-link to the desktop application** to complete the install — the cloud cannot install bundles on someone else's machine.
- **No personalized status pill in the registry row.** Earlier we discussed "Installed" / "Not installed" / "Active" labels. Dropping them — the _presence or absence_ of the Install button is the signal. Users who want to know what they have can check the install switcher. Avoids making per-device claims that don't generalize to cloud surfaces.
- **`BlessedInstall.comfyUIVersion`** added to the registry entry shape so the desktop client can show the bundle's version before installing and so a freshly-installed local Install starts with the right version stamped. Mirrors the bundled version; not an identifier (the bundle hash still is).

Reason: Willie clarified (2026-05-20) that installs are a desktop-only feature; the cloud workspace deliberately does not know about a user's local install state. Surfacing per-device "Installed / Not installed" labels in the workspace registry view would have implied cloud knowledge the IA explicitly does not include. The action-only model keeps the surface honest in both contexts (desktop joins locally; cloud deep-links to the desktop).

Wiki link:

- Extends [`wiki/concepts/workspace-install-registry.md`](../../IA_Plan/wiki/concepts/workspace-install-registry.md) — currently silent on _where_ the registry is rendered. Needs a new §"Where the registry is shown" section calling out (a) desktop-client view does the local-join + Install action, (b) cloud-only view shows registry metadata only and deep-links to desktop to install.
- Reinforces [`wiki/decisions/install-is-runtime-not-permission-entity.md`](../../IA_Plan/wiki/decisions/install-is-runtime-not-permission-entity.md) — install state stays out of the IA permission/cloud-tracking spine.

Open question dependency: none — this clarifies an under-specified part of the registry concept rather than depending on a Proposed answer.

Promote? **yes — promoted to wiki on 2026-05-20.** Updated:

- [`wiki/concepts/workspace-install-registry.md`](../../IA_Plan/wiki/concepts/workspace-install-registry.md) — added `comfyUIVersion` to the registry-entry shape note, added new §"Where the registry is shown" calling out the desktop-join vs cloud-deep-link split.

## [2026-05-20] Cloud runtime is not an install-gate satisfier

Decision:

- **Removed the "Use cloud runtime" button from the install gate dialog.** The dialog now offers two paths: dismiss, or install/switch to the project's required install. Cloud is no longer presented as a way to bypass the gate.
- **Removed the Comfy Cloud BE entry from the Comfy Org workspace registry fixture.** Cloud BE is no longer treated as a blessable install identity.
- The install gate is, by construction, a check against a fixed bundle identity (manifest hash). A cloud runtime is a service, not a bundle — it can be upgraded by the cloud team at any time, and the identity of "what's running in cloud right now" can shift under the user. That's incompatible with the hard-lock semantics the gate enforces.

Reason: Willie's IA call (2026-05-20). Putting cloud in the install identity space replicates the same category error the version-range pivot fixed — letting an inherently-changing satisfier sit alongside fixed bundles. If cloud were blessed as an install, the workspace would be making a claim about cloud's identity it cannot enforce.

Wiki link:

- Updates needed in [`wiki/concepts/install-journeys.md`](../../IA_Plan/wiki/concepts/install-journeys.md):
  - **Journey 4 (Cloud-runtime variant)** needs rewriting or removing. As written it assumes the cloud BE has a stable bundle identity that the workspace can bless and that satisfies the project's allowed-install set. Under this decision, that's no longer true.
  - **Journey 6 (Freelancer hits the install gate)** — the "cloud-runtime fallback for contractors whose local hardware can't run the team build" footnote should be removed or restated. Same reasoning.
- [`wiki/concepts/workspace-install-registry.md`](../../IA_Plan/wiki/concepts/workspace-install-registry.md) — the §"Where the registry is shown" mentions cloud-only surfaces; that's still fine (they show the registry read-only and deep-link to desktop). But the broader "blessable identities" framing should explicitly exclude cloud runtimes. Add a §"Not in scope" or expand "What this is not" in the decision page.
- [`wiki/decisions/team-locked-install.md`](../../IA_Plan/wiki/decisions/team-locked-install.md) §"What 'hard' means in practice" — the bullet about cloud-runtime satisfying via bundle identity should be retracted.

Open question this raises:

- **How do cloud-only users access a hard-locked team project?** Working stance to log alongside Journey 4 rewrite: they can read the project's content + structure, but workflows in it cannot execute from the cloud surface. If the team wants cloud-runnable workflows, that's a separate per-project flag ("allows cloud runtime: yes/no") orthogonal to the allowed-install set — not a bless-the-cloud workaround. Capturing as an open-question rather than settling here.

Promote? **yes — recommended for wiki promotion.** Three targeted edits (journeys page Journey 4 + Journey 6, decision page for team-locked-install, concept page for registry). Plus a new open question on cloud-only access to locked projects.

## [2026-05-27] Install lock gates publish, not use — "Save to My Workflows" escape hatch

Decision (Willie + team consensus, 2026-05-27):

- **The install lock moves from a use-time wall to a contribution-time gate.** A user whose active install is outside a project's allowed-install set may still **open and run** the workflow — but only as a fork in their own My Workflows (which is already the universal behaviour per [`decisions/published-workflow-model.md`](../../IA_Plan/wiki/decisions/published-workflow-model.md): fork-on-open). What they cannot do is **publish** changes (or push assets) back to the team.
- **The gate dialog stays — it still warns.** It is NOT silently dropped. When the active install is outside the allowed set, opening a locked workflow surfaces the gate, which now explains: you can work on your own copy with your current install, but you can't publish back until you're on the team build. Primary action becomes **"Save to My Workflows"** (fork + open on the current install); secondary actions remain _Install the team build_ / _Switch to {name}_ and _Not now_.
- **Publish-to-workspace gates on install IDENTITY, for everyone — including Owners and Admins.** There is no permission-based escape hatch. To overwrite the canonical team workflow, the actor must be running on an install in the project's allowed set. An Owner/Admin on a divergent install must either switch to a blessed install or change the project's allowed-install set first. This is _in addition to_ the existing permission gate (Owner/Admin-only) from the published-workflow-model — publish now requires **both** publish permission **and** a blessed active install.

Reason:

- The team's reproducibility guarantee is about _what becomes canonical_, not about every private experiment. A fork run on a non-blessed install produces outputs that live only in the actor's My Workflows; they never enter team space unless published, and publish is gated. So reproducibility of the team's source of truth is preserved without blocking people from working.
- This dissolves the cloud-only-access open question raised on 2026-05-20: a cloud-only user simply opens a fork and works; they cannot publish back. No "bless the cloud" workaround needed, consistent with the [2026-05-20 cloud-runtime decision](#).
- Identity-gating publish even for Owners/Admins keeps the lock meaningful: if an Owner could publish from any install, the lock would be advisory in practice. The deliberate act to change what the team runs on is "change the allowed-install set," not "publish from whatever I happen to have."

Relationship to existing wiki:

- **Extends [`decisions/published-workflow-model.md`](../../IA_Plan/wiki/decisions/published-workflow-model.md)** — fork-on-open is unchanged; this adds an install-identity precondition to the Publish-to-workspace act, alongside the existing permission precondition.
- **Revises [`decisions/team-locked-install.md`](../../IA_Plan/wiki/decisions/team-locked-install.md)** — the "hard lock blocks run" framing softens to "hard lock blocks publish; run is permitted on a fork." The §"What 'hard' means in practice" bullet that blocks the run button needs rewriting: the gate warns + offers Save to My Workflows rather than disabling run outright.
- **Touches [`open-questions.md#member-overwrite-request-flow`](../../IA_Plan/wiki/open-questions.md)** — the "ask an Owner to publish on my behalf" flow now also has to account for the install-identity precondition (the Owner they ask must themselves be on a blessed install).

Open questions this raises:

- **Does running a fork on a non-blessed install carry any persistent marker on its outputs?** (e.g. "generated on a non-blessed install" attribution badge, so if those outputs are later promoted the divergence is visible.) Working stance: outputs already carry install attribution; no extra marker needed for MVP.
- **Where exactly is the publish-time identity gate surfaced?** The publish action in the prototype is currently a context-menu stub. When the real publish flow is built, it must check active-install identity and block with a parallel explanation ("Publish requires the {name} install — switch installs or update the allowed-install set"). Logged for whenever the publish surface is built; not wired in this pass.

Promote? **yes — promoted to wiki on 2026-05-27.** Revised `team-locked-install.md` (run→publish framing), extended `published-workflow-model.md` (publish requires blessed install), updated `install-journeys.md` (Journeys 4 + 6, open questions), `install-switcher.md`, `personas.md`, `entities/project.md`.

### Follow-up clarification (2026-05-27) — the lock is desktop-only; cloud cannot publish to a locked project

Willie clarified the intent behind the publish gate: it targets **desktop users running a local install**. Reproducibility means "produced on the blessed _local_ bundle." The cloud BE is always-latest and dynamic, so it is outside the reproducibility world by nature — it cannot be blessed.

Resolution of the cloud-access question (which the 2026-05-20 + 2026-05-27 entries had left as an open "per-project allow-cloud flag"):

- **There is no cloud-publish path into a locked project, and no waiver flag.** A cloud-only user can open + Save to My Workflows (use is never gated), but cannot publish to a locked project because publishing requires a blessed _local_ install they don't have. The limitation falls directly out of the lock being a local-install concept — nothing to toggle.
- Cloud-only contributors route through hand-off: share the fork, a teammate on the blessed local install validates and publishes it. The cloud run is a proposal, never canonical.
- The prospective "allow cloud runtime: yes/no" per-project flag is **dropped** — it was a misframing (it implied cloud could be a publish source for a reproducibility lock, which contradicts the lock's purpose).

Wiki effect: removed the per-project-cloud-flag open question from `install-journeys.md` and `team-locked-install.md`; reframed those + `personas.md` cloud-only artist to "desktop/local-install mechanism; cloud users keep Save to My Workflows, hand off to publish." Promoted 2026-05-27.

### Review surface — detail page acts, queues triage (2026-06-09)

Willie raised that the submission review should happen on the **workflow detail page**, not (only) the project Review tab. Settled on a split:

- **Workflow detail page = where review _happens_.** A canonical with a pending submission shows a "Pending review" section (diff, note, Approve / Decline) scoped to that canonical. Approve/Decline is gated to reviewers (project Owner / workspace Admin); other viewers (incl. the submitter) see a read-only "Pending review" badge. This is the surface with full context — the canonical, its version history, and every branch are already here.
- **Project Review tab + workspace queue = triage indexes.** They list pending submissions with a **Review** button that links into the workflow detail page. No inline Approve/Decline anymore.

Rationale: a submission is "this branch wants to overwrite this canonical" — inherently per-workflow. The detail page is the one place with the lineage context to judge that. The queues keep their value as "what needs my attention" discovery surfaces. `published-workflow-model.md` already says the per-workflow branch list + version history live together (our detail page), so co-locating review there is faithful.

Implementation: `SubmissionReviewList` gained a `variant` (`queue` | `review`) + a `canonicalWorkflowId` filter; the detail page renders `variant="review"`, the two queues default to `variant="queue"`.

Promote? **candidate** — `published-workflow-model.md` names the project Review tab + workspace queue but doesn't pin where the act happens. Worth a one-line addition that the review acting surface is the workflow detail page, with the queues as indexes.

### Workflow promotion — My Workflows → project canonical (2026-06-09)

Built the third lifecycle path (the first two — branch→publish, write-private — were already wired). Closes the prototype side of open question [`workflow-promotion-flow`](../../IA_Plan/wiki/open-questions.md). Working decisions made (wiki was silent / flagged-for-exploration):

- **Entry point.** A "Publish to project…" item in the workflow context menu, shown only on a workflow the viewer **owns** that lives in **My Workflows** (a Drafts/private project) — i.e. a standalone draft or a detached copy, not a branch (branches publish over their canonical instead).
- **Permission.** Anyone who owns a draft and has at least one accessible shared project can promote — matching the wiki's "publish a _new_ workflow to a shared project = any Member with access to the target" row (vs. overwrite, which is Owner/Admin only).
- **Semantics = move, not copy.** The workflow **moves** into the target project and becomes its canonical (stable id, `forkedFrom` cleared). The author no longer keeps a private duplicate; to edit further they branch like everyone else. Chosen over copy to avoid two-canonicals ambiguity.
- **Seeds V1.** Promotion IS the initial publish, so it seeds `publishedVersions = [{ byUserId: promoter, at: today }]` if the workflow had none — the canonical's timeline starts at promotion.
- **Install lock.** Publishing into an install-locked project needs the blessed active install (same gate as Publish to workspace). The promote dialog lists locked targets but disables selecting them with a hint.
- **Landing.** After promoting, navigate to the workflow detail page so the fresh V1 + the (now empty) branch list are visible in context.

Implementation: `personaStore.promoteWorkflowToProject`, `components/PromoteToProjectDialog.vue`, wired in `WorkflowContextMenu.vue` (`isPromotable`).

Promote? **candidate** — this is a concrete proposal for `workflow-promotion-flow`. If accepted, fold the six decisions above into `published-workflow-model.md` (or a new `workflow-promotion.md`) and resolve the open question.

### Move-to-project = Publish-to-project — unified (2026-06-10)

Willie flagged that "Move to project" and "Publish to project" are the same thing. The wiki confirms it: [`concepts/cross-cutting-flows.md`](../../IA_Plan/wiki/concepts/cross-cutting-flows.md) defines promotion as **"generalises the existing move-asset-to-another-project verb"** — one operation, not two. The prototype had split them into two menu items with two dialogs and inconsistent behaviour (the old "Move" didn't seed V1, so moving a draft into a shared project left it canonical-but-historyless — a bug).

Consolidated to a single verb:

- **One menu item** — "Publish to project…" (label per Willie), shown on any owned workflow that isn't a branch (branches publish over their canonical instead).
- **One dialog** — the polished `PromoteToProjectDialog` picker (with create-new-project).
- **One store fn** — `moveWorkflowToProject`, now destination-aware: moving into a **shared** (non-Drafts, non-private) project publishes it as that project's canonical (clears lineage, seeds V1 if none); moving into My Workflows / a private project is a plain relocation.
- Retired `WorkflowMoveDialog.vue`, the separate `promoteWorkflowToProject` fn, and the `workflowMenu.move.*` / moved-toast / `moveToProject` i18n.

Note: `PrototypeProjectChip` (editor-chip, part of the explore WIP) still has the same move-vs-promote split in its menu — left untouched as it's unfinished; fold it into this model when that surface is built.

### Decline → revise → resubmit loop (2026-06-10)

The review flow dead-ended at decline: a reviewer could Decline-with-feedback, but the submitter had no way to act on it. Closed the loop on the submitter's side.

- **Surface = the workflow sidebar.** When the submitter selects the canonical they branched, the sidebar (already showing "Open branch") now shows their submission status: a muted "Submitted for review" while pending, or a "Changes requested" callout with the reviewer's verbatim feedback + a **Resubmit** button when declined. The submitter never sees the project Review tab (guests can't review), so the sidebar — their only per-workflow surface — is the right home. This supersedes the 2026-06-09 "detail page = where review happens" entry, which assumed a workflow detail page we've since replaced with the sidebar.
- **Resubmit = flip back to pending.** `personaStore.resubmitSubmission` flips the rejected submission to `pending`, bumps `submittedAt`, and re-notifies the project owner (a fresh `submission-received`), so it reappears in the reviewer's queue. No new submission record — the same submission cycles.
- **Cross-persona consistency.** Per-persona fixtures don't share state, so resolve/resubmit now **mirror** the submission's status into the other party's fixture (`mirrorSubmissionTo`) alongside the existing notification bridge (`deliverNotificationTo`, renamed from `notifySubmitter` since it now flows both ways). A live admin-declines → switch-to-Mira path stays consistent, and Mira's fixture also seeds the declined state directly so the surface is demoable without the live decline first.
- **Discoverability.** Clicking a `submission-rejected` / `submission-approved` notification now selects the canonical (new one-shot `requestSelectWorkflow` ui intent, consumed by `ProjectDetailView`), opening its sidebar straight onto the feedback.

Wiki link: [`published-workflow-model.md`](../../IA_Plan/wiki/decisions/published-workflow-model.md) §member-overwrite-request-flow — the decline half was specified; this adds the revise/resubmit return path it implies.

Promote? **candidate** — the resubmit return path isn't spelled out in the wiki. If accepted, add a line to §member-overwrite-request-flow: a declined submission returns to the submitter with feedback and can be revised and resubmitted, cycling the same request.

### Semantic workflow diff — P1 core util (2026-06-10)

Submissions currently carry a hand-set `diff: {added, removed}` ("+125 −32"). Willie wants a _semantic_ summary instead — "Spacing & positioning updates · new seed · new prompt · n nodes added/deleted". Validated the approach against a real pair (`Contact Sheet Home Grown` v1/v2, 3.4 MB each, 247 nodes / 32 subgraphs).

What that pair taught us — its entire delta is: a seed bump + a one-phrase prompt edit (both **two levels deep inside a subgraph**), 6 top-level nodes nudged, and a canvas pan/zoom. A naive line/char diff calls this "~5,000 chars changed" because the 5 KB prompt is one JSON line and floats wiggle. That's the case for semantic.

P1 = a pure, dependency-free util `src/prototype/utils/workflowDiff.ts`: `semanticWorkflowDiff(before, after) → { headline, counts, details }`. Decisions baked in:

- **Recurse into `definitions.subgraphs`.** The signal lived there; a top-level-only walk silently under-reports. Each change is scope-tagged.
- **Match scopes by subgraph _id_, never name.** This pair has 19 subgraphs named "Image to Video" and 10 named "New Subgraph" — name-matching cross-pairs them and invents dozens of phantom rewires. (Caught live; regression-tested.)
- **Strip view-only noise** up front: `extra.ds` pan/zoom, execution `order`, link ids. Float tolerance (1 px) on pos/size.
- **Topology by endpoint** (`src:slot→dst:slot`), so link-id renumbering ≠ a change.
- **Widget semantics, tiered + graceful** (chosen: dictionary + heuristics, offline): a small node-type→widget-name table (KSampler, CLIPTextEncode, …) names known widgets; heuristics catch the rest (big int that moved = seed; long/multiline string = prompt + word-delta; bounded scalar = parameter). Unknown → honest "X → Y" or "settings changed", never a 5 KB dump, never a throw. Product upgrade path (P3): swap the table for `nodeDefStore` `object_info` widget names.
- **Headline** = ranked phrases (add/remove ≫ rewire ≫ prompt ≫ param ≫ seed ≫ bypass ≫ rename ≫ move ≫ group), capped at 4 + "+k more". Plain English now; i18n formatting is P2 (UI wiring).

Result on the real pair: `["Prompt edited", "Seed changed", "6 nodes moved"]` — viewport dropped, both subgraph-deep edits found. Golden test (`workflowDiff.test.ts`, 8 cases) uses small synthetic fixtures mirroring the pattern (the 6.8 MB pair is not committed) and guards each channel + the name-collision regression + malformed-input safety.

Wiki link: none — this is presentation of the existing submission/diff concept, no IA rule. P2 wires it into `SubmissionReviewList` + the sidebar (chips + expandable details, replacing the `{added,removed}` field).

Promote? **no** — implementation detail, not an IA decision.

### Review UI — ideal-state semantic-diff presentation (2026-06-10)

With the diff engine proven, designed the review UX around it. Built `WorkflowChangeSummary.vue` (+ a Storybook story, `Prototype/WorkflowChangeSummary`) — a pure component that consumes a `SemanticDiff` and nothing else.

**Wired into the live prototype review surface** (`SubmissionReviewList.vue`, used by the project Review tab + the workspace queue), driven by a **mocked diff** rather than a real two-graph comparison: `WorkflowSubmission` gained an optional `semanticDiff` field, and Mira Voss's seeded submission (`wfsub-indie-establishing`) carries a hand-authored `SemanticDiff` matching her note ("Tweaked the sky gradient + added a depth pass" → 1 node added, 2 connections, prompt edited, a param, 3 moved). The old `+125 −32` line stays as a fallback for submissions without a `semanticDiff`. To see it: workspace-admin persona → Indie Short Film → Review.

Design (converged over a few rounds — chips → flat named list → **categorised rows with per-row disclosure**):

- **One row per (entity × action)**, count not names: Nodes / Subgraphs × {added, removed, skipped, moved}, plus Widgets edited, plus an "Other changes" catch-all (connections, groups). So a glance reads "1 subgraph added · 2 node widgets edited · 3 nodes moved" — the taxonomy Willie named.
- **Each row carries its own chevron** that expands to _that row's_ specifics: a subgraph-added row reveals the new subgraph titles; "N node widgets edited" reveals "Prompt edited · +6 / −2 words", "denoise 1.00 → 0.85", "Seed regenerated"; a moved row reveals the node names. Per-row disclosure replaced the earlier single global toggle — you drill into only the category you care about.
- **Count where the name is jargon, expand to the name when wanted.** The summary row stays a count (node-type names are noise at a glance); the detail under the chevron is where names/values live. Node vs subgraph split needs a per-entry `isSubgraph` flag on `DiffEntry` (mocked now; the real util sets it when a node's `type` resolves to a subgraph definition).
- **Ranking:** added → removed → widgets → skipped → moved (muted) → other (muted). Cosmetic rows (moved, other) are de-emphasised but still independently expandable. No global truncation — categorisation already compresses the list to a handful of rows.

Rows are built from `details` (`channel` / `widgetKind` / `isSubgraph`) via i18n (`prototype.changeSummary.*`), not the util's English `headline` (which stays a test/debug convenience).

Surfaced for P2: subgraph-instance nodes carry a UUID as their `type`; the mock resolves these to subgraph names (e.g. "Image Upscale (SeedVR2)") so a moved subgraph reads cleanly — the real util should do the same lookup when wired.

Promote? **no** — prototype UX, not an IA decision. View with `pnpm storybook`.

## [2026-06-10] Local media as managed references — Tier 1 (NON-FINAL)

Decision (working stance, pending product + engineering approval):

- **Always reference.** Added local media is never copied — Comfy stores a pointer (`sourcePath` + `contentHash` + cached thumbnail) and leaves the original in place. There is **no local managed store**; adding = recording a path. This inverts today's drop-to-`input/` copy behavior.
- **Third Media File origin `referenced`.** `LibraryAsset` gained `origin` (`generated` | `imported` | `referenced`), `sourcePath`, `contentHash`, `linkState` (`linked` | `missing`); `projectId` is now optional (a referenced file belongs to no cloud project). **These fields are not yet in `entities/media-file.md`** — per WORKSPACE-UX-PROTO §2.2 they're logged here because the entity is non-final.
- **Unified Media library + inline.** Referenced media surfaces in the existing Media Assets `LibraryView` (widened beyond `output/`). For **local mode only**, the sidebar "Media" item re-routes from the upstream `MediaAssetsView` tab to the prototype `LibraryView` (the upstream board showed cloud-project media to a local persona — a pre-existing mismatch; this is a fix, and keeps all work inside `src/prototype/`).
- **Relink lifecycle** (load-bearing): linked → missing (dimmed cached thumbnail + Relink CTA) → relink, with batch "relink siblings in the same folder." Mutable state lives in a new `mediaReferenceStore` (fixture is the seed).
- **Remove ≠ delete**, **no local permission surface**, dedupe by path/id, **link-status filter** (All / Linked / Missing) in the library sidebar.
- **Dev affordances** (`import.meta.env.DEV`): per-card "simulate move/delete" and a "simulate folder moved" control — to demo missing→relink without a real filesystem.

Reason: matches the creator mental model (AE/Lightroom), respects existing local folder organisation, and is the _simplest_ local implementation (no import pipeline, no managed store). The cost concentrates entirely in the relink UX, so Tier 1 builds exactly that loop first.

Wiki link: `../IA_Plan/wiki/open-questions.md#local-media-as-references` (full stance) + `../IA_Plan/wiki/prototype-log.md` Flow 03. Widens `concepts/local-dashboard-views.md`; adds proposed origin to `entities/media-file.md`.

Open question dependency: **gated** on `backend-architecture-decision` — referencing arbitrary external paths collides with the API constraint ("restricts touching anything outside Comfy folders"). The UX is prototyped against fixtures; real file access waits on that. Multi-install path resolution left open.

Scope built (Tier 1): card states, single + batch relink, add, remove, link-status filter, dev simulators, store unit tests (`mediaReferenceStore.test.ts`). Out of scope: cloud materialization, reference-as-workflow-input, multi-install presence.

Promote? **not yet** — explicitly held below `user-confirmed` until product + engineering sign off on the approach. Companion flow doc: `prototype/flows/06-local-media-references.md`.

### Pivot — render local media in the _real_ upstream browser (2026-06-10)

Willie asked for the local media tab to match the upstream media browser **perfectly**. Re-implementing the upstream CSS in the Tier-1 `LibraryView` masonry would only ever approximate it and would drift, so the only way to truly match is to **reuse the actual upstream components**. Pivoted accordingly:

- **Reverted the Tier-1 _presentation_** — `LibraryView` / `LibraryAssetCard` / `LibrarySidebar` / `PrototypeSidebar` reroute are back to their pre-Tier-1 state. The Tier-1 _logic_ is unchanged: `mediaReferenceStore`, the three dialogs, `localMedia` fixture, the `LibraryAsset` referenced-origin fields, and the store tests all carry over.
- **Forked the view** — new `components/LocalMediaView.vue` is a near-verbatim copy of upstream `MediaAssetsView.vue` that reuses the real `AssetMasonryGrid` → `MediaAssetCard`, `AssetsSidebar`, `MetadataSearchInput`, density/sort/lightbox via `useMediaAssetsBrowserState`. Styling matches _by construction_ (same components), not by approximation. `Dashboard.vue` renders `LocalMediaView` for the local persona's Media tab; cloud personas still get the stock `MediaAssetsView`.
- **Fed referenced media through the provider** — `usePrototypeAssetsProvider` returns the store's referenced files (mapped to `AssetItem`, `previewUrl` = a bundled image as the cached thumbnail; `sourcePath` + `linkState` in `user_metadata`) for the local persona. The provider's `allMedia` is a computed over the store, so relink/add/remove mutations propagate to the real grid reactively.
- **Two prototype-gated upstream edits** (both keyed on `user_metadata`, matching the file's existing creator-chip / `storage === 'local'` "Promote to cloud" precedents, so they never render for real assets):
  - `MediaAssetCard.vue` — missing → dim + Relink overlay (click relinks via the host view); linked → hover source-path badge.
  - `MediaAssetContextMenu.vue` — gated "Relink" (when missing) + "Remove from Comfy" items, emitting events the forked view handles.
- **Affordance triggers**: Add = toolbar button; Relink = click a missing card (or context menu); Remove ≠ delete = context menu → confirm dialog; link-status filter (All / Linked / Missing) + missing banner = a thin prototype toolbar under the upstream filter-chips bar; a DEV "simulate folder moved" control creates the missing state without a real filesystem.

Reason: "perfect" parity is only guaranteed by reusing the upstream components, and this fork keeps the prototype-specific surface to one new file + two small gated edits while inheriting masonry virtualization, real thumbnails, sort, density, selection, and the lightbox for free.

Wiki link: same as the Tier-1 entry — `open-questions.md#local-media-as-references`, `prototype-log.md` Flow 03.

Promote? **not yet** — same gate. The two upstream-gated edits are worth calling out to eng on review (they raise the upstream-merge surface slightly, though both are `user_metadata`-gated like existing prototype hooks).

### Detail-panel reference identity + materialize-via-Save-to-cloud (2026-06-11)

Two follow-ups from the "what else to represent" pass:

- **Reference identity in the detail panel.** `AssetDetailPanel.vue` (upstream, prototype-gated on `user_metadata.sourcePath` like the existing install-attribution row) gains three rows for referenced files: **Origin: Referenced (local)**, **Location** (source path), **Link status** (Linked / Missing, amber when missing). The generic "Storage" row is suppressed for referenced files since Origin conveys it. Makes the model self-explanatory on selection.
- **Materialization reuses the existing Save-to-cloud pattern (Willie's call).** No bespoke "materialize" UI. Referenced `AssetItem`s now carry `user_metadata.storage = 'local'`, which lights up the context menu's existing "Promote to cloud" action (`useSimulatedSaveToCloud`) — that _is_ materialization (upload one cloud copy). Recorded in the wiki open question ([promoting-local-outputs-to-cloud](../../IA_Plan/wiki/decisions/promoting-local-outputs-to-cloud.md) is the reused flow). Snapshot/hash-keyed/lazy semantics stay as documented; the prototype doesn't need a separate surface to show them.

New i18n: `mediaAsset.details.{origin,originReferenced,location,linkStatus,linkLinked,linkMissing}`.

Promote? **not yet** — same gate as the rest of Flow 03.

---

## [2026-06-16] MVP scope cut — collapse governance, revert to copy-on-access + open publish

Decision (team call, 2026-06-16): aggressively narrow to a fast, cloud-collaboration MVP. Cut the reproducibility/governance system wholesale and replace the branch model with a simpler copy-and-publish model.

**Cut / deferred for MVP:**

- **Explore view** — removed.
- **Library → Models, Custom nodes, Prompts** — removed. The Library section collapses to **Media assets** (outputs) only. The Workspace Library (linked-instance system) is cut entirely (was already partly NOT-MVP).
- **Allowlists** — model + custom-node allowlists, at both workspace and project level, removed.
- **Branching** — removed. See replacement model below.
- **Install locks + all install governance** — removed: the install registry, project allowed-install sets, the install switcher _as a governance tool_, install attribution, the project-access install notice, the lock editor. "Install" survives only as an invisible runtime detail (consistent with [install-is-runtime-not-permission-entity](../../IA_Plan/wiki/decisions/install-is-runtime-not-permission-entity.md)); every governance surface goes.
- **Review / submission flow** — removed (coupled to gated overwrite): review queue, decline-with-feedback dialog, `WorkflowChangeSummary`, semantic `workflowDiff`.
- **External guests + share-by-email + shared-with-me** — deferred. MVP is **workspace-internal collaboration only**. Removes the narrow guest view, cross-workspace tray/notifications, and asset-only invites.
- **Comfy Hub / anonymous publishing** — deferred (post-launch discovery surface anyway).
- **Local media references (Flow 06)** — deferred (exploration-tier; gated on `backend-architecture-decision`).
- **Blueprints, Prompts-as-asset** — out (already post-MVP).

**Replacement publish model:**

- **Copy-on-access.** Opening a workflow _from a project_ creates a fresh personal copy of the **current canonical** in the actor's **My Workflows**, on **every access** (not first-access-with-reuse) — so the copy always reflects the latest published version, never a stale earlier open. Workflows opened in one's own My Workflows are still edited in place. Copies carry a `copiedFrom: { workflowId }` lineage pointer. _(Phase-2 sub-questions: how accumulating copies are surfaced/deduped in My Workflows, and what happens to a prior copy with unpublished edits when the canonical is re-accessed — resolve when building the publish model.)_
- **Open publish-to-workspace.** **Any workspace member** with access to the target project can publish: either **overwrite** an existing canonical (resolved via `copiedFrom`) or **publish-as-new** into a chosen project. The published workflow **inherits the destination project's visibility**. No Owner-gate, no review/submission step.
- **Version history is the safety net.** Each publish appends to the canonical's published-version history (who, when). This is what makes ungated overwrite _recoverable_ rather than silent data loss — kept deliberately even though the review flow around it is cut.
- **Accepted loss:** no team-visible work-in-progress. A copy is private in My Workflows until published; branches' project-wide visibility of in-progress work is gone for MVP.

**What survives (the MVP core):** Workspaces (billing) · Members (Admin / Member; no external Guest) · Projects + visibility tiers (workspace-wide / restricted / private-as-My-Workflows) · My Workflows · Workflows + Apps (run both modes) · copy-on-access · open publish-to-workspace · version history · Media assets (outputs) · run + credits/billing · slim Settings (identity, members, billing, danger zone).

Reason: the team needs to ship quickly. Branching and install locks were one system, not two — the branch model existed _to keep working copies under project governance (locks + allowlists)_, so removing governance removes branching's reason to exist. The replacement is essentially the pre-2026-06-06 (pre-branch) model with overwrite ungated. Version history is the one piece kept from the governance era because it is cheap and makes open overwrite survivable.

Wiki link: **supersedes** for MVP — [branch-vs-personal-copy](../../IA_Plan/wiki/decisions/branch-vs-personal-copy.md) (retire), [published-workflow-model](../../IA_Plan/wiki/decisions/published-workflow-model.md) (revise to ungated copy+publish), [team-locked-install](../../IA_Plan/wiki/decisions/team-locked-install.md) (retire), [workspace-install-registry](../../IA_Plan/wiki/decisions/workspace-install-registry.md) (retire). Narrows [three-level-permissions](../../IA_Plan/wiki/concepts/three-level-permissions.md) (allowlists out; guest tiers deferred) and [sharing-vs-publishing](../../IA_Plan/wiki/concepts/sharing-vs-publishing.md) (Hub + external share deferred).

Open question dependency: closes the MVP cut of `workflow-promotion-flow`, `project-collaborator-library-publish` (moot — no guests), `member-overwrite-request-flow` (moot — open overwrite). Defers `local-media-as-references`.

Promote? **yes — promoted to wiki 2026-06-18.** Landed as [`wiki/decisions/mvp-scope.md`](../../IA_Plan/wiki/decisions/mvp-scope.md) (the authoritative in/out decision, incl. the replacement publish model + the supersede list) and [`wiki/mvp.md`](../../IA_Plan/wiki/mvp.md) (the MVP-in-one-page overview with the full-vision-vs-MVP diff table); `wiki/index.md` + `wiki/overview.md` got pointers. Per the agreed scope, the superseded full-vision decision pages were left **intact** — `mvp-scope.md` is the single record of what's in/out — rather than rewritten. The 2026-06-16 Phase 3 persona/guest entry below is folded into the same `mvp-scope.md`.

---

## [2026-06-16] MVP Phase 3 — collapse personas + remove external-guest support

Executing the scope cut above on the supporting surfaces. Two rounds:

**Persona registry trimmed to the workspace-internal core (4).** Dropped the three install/compat personas (Install Governor, Managed Artist, Freelancer) — they only existed to demo install-locking / allowlists / compat-gates, all cut. Then, per the "workspace-internal collaboration only" line in the scope-cut entry above (confirmed by Willie 2026-06-16), also dropped the two **external-guest** personas (Project Collaborator, Asset-only Guest). Surviving personas: **Workspace Admin, Workspace Member, Solo (cloud), Solo (local)**.

**External-guest support removed wholesale.** Concretely: `WorkspaceRole` → `admin | member` (no `guest`); `ProjectRole` → `owner | collaborator` (no `project-guest`); `AssetRole` → `owner | runner` (no `app-runner`). The **notifications tray** (`TopBarNotifications`, the `Notification` subsystem, the store getters) is deleted — it existed solely as the cross-workspace cue for guests. Removed share-by-email / `inviteExternalCollaborator`, the "shared with me" surfaces (`sharedWorkflows` getter, the Recents "Shared" pill, the Drafts "Shared with me" tab), the Permissions-matrix Guest column, and the guest-view gating in the sidebar / project detail / members / settings.

Two non-obvious calls worth recording:

- **`runner` survives; only `app-runner` is guest-only.** `runner` is the role a workspace Member holds on a shared-project workflow they don't own (run + copy-on-access, no in-place canonical edit) — core to internal collaboration. `app-runner` (run-only, no copy) was exclusively the asset-only-guest tier, so it goes. `useViewerWorkflowRole` now maps any scoped-project member to `runner`.
- **Restored a restricted-project collaboration demo with an internal member.** The admin fixture's restricted-project story was anchored on external client _Mira Voss_ (client-x.com, a Guest). Rather than delete the demo, her collaborator/runner slots + forked working copy were **reassigned to Jane Park** (an existing comfy.org Member). This keeps "restricted project + internal collaborator + copy-on-access" demonstrable without any external guest. Also removed the `acme` guest-membership workspace the Admin no longer belongs to.

Wiki link: same as the scope-cut entry — when `mvp-scope.md` is drafted, it should state plainly that **external guests / asset-only access are out of MVP** (not merely "deferred"), narrowing [three-level-permissions](../../IA_Plan/wiki/concepts/three-level-permissions.md) to two levels (workspace + project) for launch.

Promote? **with the parent entry** — this is the implementation of the scope cut, not a separate decision.

---

## [2026-06-17] Apply colleague's dashboard visual style + add Home page

Applying a visual style developed by a colleague (Figma: `Onboarding - Errors ComfyUI`, frames Home `1641-14382`, Templates `1641-14256`, Projects `1641-14107`) to the surviving MVP surfaces — left nav, background colours, typography — and adding the Home landing page. Pages in the design that we cut (Explore, Models / Custom nodes / Prompts library sub-sections) are ignored.

**Colours already match.** The colleague built on the same `@comfyorg/design-system` dark-theme tokens we already use — `base-background #171718`, `secondary-background #262729`, `secondary-background-hover #313235`, `border-subtle #3c3d42`, `muted-foreground #8a8a8a` all line up exactly. So "apply the background colours" required no recolour; the work is structural (layout, sidebar grouping, type scale). Only `brand-yellow` differs trivially (`#f0ff41` ours vs `#f2ff59` in the file) — kept ours.

**Templates is NOT cut — restored.** Correcting a mis-classification: the formal scope cut (2026-06-16) removed **Explore** (a new IA discovery concept) but never Templates. The only prior note touching Templates is the 2026-05-12 "Templates folds into Comfy Hub" framing; Hub was then deferred (2026-06-16), orphaning that framing. Templates is a **pre-existing, shipping ComfyUI feature** (the template-workflows gallery), so it stands on its own as an MVP surface — sidebar item + Home tab + dedicated gallery page — **independent of the deferred Hub**. This supersedes the 2026-05-12 "Templates folds into Hub" note. (Willie, 2026-06-17.)

**Search + Explore nav items omitted.** The Figma sidebar's top quick-links group is Home · Explore · Search · Recents · Templates. Explore is cut. **Search** is dropped as a sidebar nav item too: there is no global-search surface/backend in MVP, and the new Home search bar covers "find my own stuff" (decided: client-side filter over the viewer's workflows + media assets). The old inline sidebar search box (which was non-functional) is removed. Net surviving quick-links: **Home · Recents · Templates**.

**Cards → single full-bleed 3:2.** Project + recents cards switch from the 2×2 gradient mosaic (2026-06-?? direction) to a single full-bleed 3:2 placeholder, matching the new style. (Willie, 2026-06-17.)

Build order (separate commits): (1) sidebar restyle + Comfy wordmark, (2) Home view, (3) Templates gallery page, (4) Projects restyle + single-3:2 cards.

Promote? **no** — prototype styling pass; no wiki impact beyond confirming Templates is in-MVP (fold into `mvp-scope.md` when drafted: "Templates is an MVP surface, decoupled from the deferred Hub").

---

## [2026-06-18] Templates gallery — categorization, filters, and sort

Fleshed out the restored Templates gallery (`TemplatesView.vue`) to mirror the categorization/filter/sort of the two shipping surfaces it stands in for: the **production template library** (`WorkflowTemplateSelectorDialog` + `useTemplateFiltering`, fed by `Comfy-Org/workflow_templates`' `index.json` — 534 templates) and the **ComfyHub** browse page (`comfy.org/workflows`).

What those surfaces do, and how it maps here under the no-second-sidebar constraint:

- **Categorization = generation type.** Production's primary axis is a left-rail tree grouped under `GENERATION TYPE` (Use Cases · Image · Video · Audio · 3D · LLM · Utility), and ComfyHub's top chips are media types too (Image, Video…). We can't add a second sidebar, so that axis becomes the **chip-filter row** (Projects/Recents pattern): `All · Image · Video · Audio · 3D · LLM · Utility`. Note: the prototype's old `controlnet` / `upscaling` categories were really _use-cases_ in prod, so they moved out of `TemplateCategory` into use-case tags.
- **Use Case filter.** Prod has an 84-tag "Use Case" multiselect (Text to Image, Image Edit, ControlNet, Inpainting, Upscale…). Modeled as a `ToolbarSelect` dropdown over the distinct `useCases` tags present in the fixture.
- **Runtime filter ("Runs on").** Prod splits ComfyUI (open-source/local) vs External/Remote API (partner), derived from `openSource`; ComfyHub surfaces this as "Partner Nodes". Modeled as a `runtime: 'comfyui' | 'api'` field + dropdown.
- **Search.** Prod has fuzzy search (Fuse.js); ComfyHub has a search box. Modeled as a client-side substring match over name / author / use-cases.
- **Sort.** Prod offers default · recommended · popular · newest · alphabetical · VRAM · model-size. Kept the four meaningful for a fixture: **Recommended** (authored order) · **Popular** (`popularity`) · **Newest** (`addedAt`) · **A–Z**. Dropped VRAM / model-size (need per-template hardware metadata not worth fixturing) and **Model** as a filter axis (Willie, 2026-06-18 — chips by generation type, secondary filters = use-case + runtime + search, no model filter).

Fixture (`fixtures/templates.ts`) grew 13 → 28 entries spanning all six generation types with realistic models/runtimes/dates so the filters and sorts actually differentiate. `WorkflowTemplate` gained `useCases`, `runtime`, `popularity`, `addedAt` (additive — Home's featured-tab consumer only reads `id`/`name`).

Promote? **no** — prototype fidelity pass against shipping behavior; no new IA position. Worth noting in `mvp-scope.md` only as "Templates gallery mirrors the production library's type/use-case/runtime/sort model."

---

## [2026-06-18] Templates gallery — real thumbnail media + ComfyHub card chrome

Replaced the gradient placeholder cards with real template media and a card modeled on ComfyHub / the production template library.

- **Real media, pulled live.** Thumbnails come from the upstream `Comfy-Org/workflow_templates` repo via jsDelivr: `https://cdn.jsdelivr.net/gh/Comfy-Org/workflow_templates@main/templates/<slug>-1.webp` (helper `templateThumbnailUrl` in `utils/thumbnail.ts`). Verified the URLs resolve (200, `image/webp`); they're animated webp previews. No backend / no local copies — the prototype has no `/templates` static server, so the CDN is the source.
- **Fixture rebuilt from real templates.** The 13→28 invented entries became 28 _real_ upstream templates (curated across the six generation types, ComfyUI/API mix). `id` = the real upstream slug (doubles as the media key); `name`, `model`, `useCases` (tags), `popularity` (usage), `addedAt` (date) are the real values. `WorkflowTemplate.author` → `model` (the provider/model is what the card shows + what ComfyHub/the library surface).
- **Aspect ratio = 1:1.** The source media is square (≈350²/400²) and the production library renders `ratio="square"`; ComfyHub's live DOM isn't scrapable (JS-rendered) but the media being square settles it. New `TemplateCard.vue` uses `aspect-square`, `object-cover`.
- **Card chrome (mocked).** Runtime badge ("API") top-left for partner templates, a use-case pill bottom-left, and a hover "Open" CTA over a scrim — mirroring the library's overlay tags + click-to-load. Title + model beneath. The hover CTA is presentational (no template-detail route in the prototype yet). Scrims are black-on-media (legibility over arbitrary imagery), intentionally not themed.

Open question / caveat: media is hot-linked from jsDelivr `@main`, so it tracks upstream and needs network. If we ever want offline/pinned media, snapshot into `public/` and pin a tag. Logged here rather than solved.

Revised same day (Willie): dropped the API badge and the hover "Open" CTA; added the real `description` to the fixture + a 2-line clamp under the title (replacing the model line); enlarged the cards (4-up → 3-up on large screens). Surviving on-thumbnail chrome is just the use-case pill. `runtime` stays (still the Runs-on filter), `model` stays (search only).

Revised again (Willie): ported the prod gallery's before/after **wipe** thumbnail (`CompareSliderThumbnail`) — a `thumbnailVariant: 'compareSlider'` field renders the real `-2` overlay clip-revealed to the pointer X with a divider line; 7 of the 28 fixtures already carry the variant upstream (verified the `-2.webp` media exists), the rest keep the plain hover-zoom image. Also matched the gallery card typography/spacing: title `text-sm`/`line-clamp-1` (normal weight), description `text-sm`/`line-clamp-2`/muted, `gap-2 pt-3`, with `title` attrs for full-text on hover. (hoverDissolve, the other prod variant, left as plain image — only the wipe was requested.)

Revised again (Willie): added the **provider logo badge** (top-left), ported from the prod `LogoOverlay` — new `TemplateProviderBadge.vue` renders the partner logo + name in a pill. A `provider` field on the fixture drives it; logo media resolves from the same upstream repo (`templates/logo/<provider>.<ext>`, mapped in `templateProviderLogoUrl`) via the CDN — verified the images resolve. Following the real upstream `logos` data, the badge appears on the 9 partner templates that actually carry it (Google, Anthropic, ElevenLabs, ByteDance, Tripo, Grok, Sonilo, Rodin). NOTE: real data is sparse — some partner templates (e.g. Grok Video, Hunyuan3D) have no upstream logo, so they show no badge; could extend to all `runtime: 'api'` templates if fuller coverage is wanted.

Also relabeled the Runs-on filter's API option **"External API" → "Partner Nodes"** to match ComfyHub's terminology (the underlying `runtime: 'api'` value is unchanged).

Promote? **no** — prototype fidelity; no IA impact.

---

## [2026-06-18] Media assets stubbed in the dashboard prototype

The sidebar "Media assets" item no longer opens the media-library workbench tab (`tabsStore.openMediaAssets`); it now shows a placeholder dialog ("This will open Alex's Media Assets tab.") via a new `MediaAssetsNoticeDialog`. The media library is a workbench surface outside this dashboard prototype's scope — the stub acknowledges the destination without building it here. (`openMediaAssets` still exists; `ProjectDetailView` uses it.)

Promote? **no** — prototype scoping stub.

---

## [2026-06-18] Project page — provenance-tracked "My drafts" section (design-team catch-up)

The project page now stacks two sections: **Published** (the canonical registry, unchanged) and a new **My drafts** below it — the viewer's own unpublished copies whose provenance points at this project. Keeps the workflow↔project association without putting WIP in shared team space (drafts stay private, surfaced not moved).

Decisions (with Willie, this session):

- **Copy-on-access stays "every access = a copy"; no dedup / no resume.** Willie's call: resuming a stale draft would silently hide that it diverged from the canonical. Instead, each draft is labelled with its provenance + **drift** ("Copy of X · N versions behind"); a fresh copy each time keeps divergence explicit.
- **One new field — `provenanceProjectId`** on `Workflow` (denormalized). Set on copy (= source canonical's project) or create-in-project. Derivable-from-`forkedFrom` for the copy case, but denormalizing also powers the **Source removed** state (canonical deleted → `forkedFrom` no longer resolves, provenance still known). `forkedFrom.atVersion` + the canonical's `publishedVersions` give the drift count.
- **Three draft states surfaced:** _Copy of <canonical>_ (+ "N versions behind" when drift > 0, amber), _New in this project_ (created-in-project, no source), _Source removed_ (danger).
- Publish from My drafts → becomes/overwrites the canonical and leaves My drafts. Drafts live in My Workflows; the project page surfaces by `provenanceProjectId` (no move). Section labelled "My drafts". The project "+ New workflow" button is the create-in-project entry point (presentational stub in the prototype).

Fixtures: `wf-cocacola-hero` gained `publishedVersions`; the cocacola project now demonstrates all four states (in-sync copy, 2-versions-behind, new-in-project, source-removed). client-x + indie-short also seed a draft each.

Not built this pass (deliberate): the live "open Published → creates the copy + a copy-time toast" interaction — the dashboard's open = preview sidebar, so there's no clean access event to hook without the editor-open flow. The provenance/drift labels + the empty-state hint carry the copy-model clarity for now.

Wiki: promoted same day — resolved the parked dedup sub-question in [`mvp-scope.md`](../../IA_Plan/wiki/decisions/mvp-scope.md) (copy-on-access bullet) and added [§"Project surface (MVP)"](../../IA_Plan/wiki/entities/project.md) describing the Published + My drafts model.

Promote? **yes — promoted to wiki 2026-06-18** (mvp-scope.md + project.md).

Revised same day (Willie): published-in-project workflows are **always cloud** (no local shared workflows) — confirmed no project canonical carries `storage: 'local'`. On their cards the personal cloud/local storage icon is replaced with a **team icon** (`lucide--users-round`) and a **version badge** (`v{n}` from `publishedVersions.length`, default v1) after the date. Derived in `WorkflowCard` from the workflow itself (`!forkedFrom` + canonical lives in a real non-Drafts project), so it applies wherever such a card renders; drafts/copies keep their cloud/local icon.

---

## [2026-06-18] Project workflows — card hover actions replace the detail sidebar

Now that the version badge/popover lives on the card (above), the right-hand `WorkflowSidebar` (name + Open-a-copy + version history) is redundant. Selecting a workflow on the project page no longer opens it — the sidebar is **deleted**. Actions moved onto the card as a hover overlay (grid only) over the thumbnail:

- **Published** cards → one **Copy** button (copy-on-access into My Workflows). Clicking the card body does the same (primary action).
- **My drafts** cards → **Open** (primary) + **Publish** (secondary). Card-body click = Open. Open is a toast in the prototype (no editor); Publish reuses the existing promote flow.

Mechanics: overlay buttons are rendered as **siblings** of the card's root `<button>` (not children) to avoid invalid nested buttons, revealed via `group-hover`, `pointer-events-none` container + `pointer-events-auto` buttons so the rest of the card still hovers/clicks. New optional `actions?: 'published' | 'draft'` prop on `WorkflowCard` gates the overlay (so Recents/Home cards are unaffected) and `copy`/`publish` emits were added.

Refactor: the publish handler (overwrite-vs-new canonical + toasts + navigate) was duplicated between the context menu and would have been again here, so it was extracted to **`useWorkflowPublish`** (drives `PromoteToProjectDialog`). `WorkflowContextMenu` now consumes it too. Deleted the dead `prototype.workflowSidebar.*` and `prototype.history.*` i18n namespaces (copy-toast strings relocated to `workflowCard.copied*`).

Promote? **no** — interaction-model fidelity; no new IA rule. (Reinforces version-history-as-safety-net already in mvp-scope.md.)

---

## [2026-06-18] Publishing a draft-copy updates its source canonical in place

Refines the My-drafts publish behavior from the 2026-06-18 provenance entry (which had publishing _leave_ My drafts). New rule, per Willie: clicking **Publish** on a draft that is a copy of a project canonical publishes **over that canonical** (appends a published version → the canonical's version badge increments) and **leaves the draft in the drafts section**, link intact. There's no destination to choose — it always targets the source canonical in its original project, so the publish dialog is skipped for this case.

A draft with no resolvable source (created-in-project, or `source-removed`) still falls back to the choose-a-destination `PromoteToProjectDialog`.

Implementation: new `publishDraft(workflowId)` in `useWorkflowPublish` (resolves `forkedFrom` → source, calls `publishOverWorkflow`, no navigation); the project page's draft cards call it instead of `openPublish`. The draft's `forkedFrom.atVersion` is intentionally left pointing at the pre-publish version, but drift is no longer surfaced (removed earlier), so this is invisible.

Consistent with the wiki's "drafts are surfaced, not moved" ([project.md §Project surface (MVP)](../../IA_Plan/wiki/entities/project.md)).

Promote? **no** — interaction refinement within the existing published-workflow model.

---

## [2026-06-20] Solo-creator personas split into a New × Established / Cloud × Local-only matrix

Reworked the persona toggle's solo entries from two empty personas into a 2×2:

- **New solo creator — Cloud** (`solo`, unchanged fixture) — first-run empty cloud account.
- **Solo creator — Cloud** (`solo-cloud-active`, new) — established; a full My Workflows, every workflow `storage: 'cloud'`.
- **New solo creator — Local only** (`solo-local`, unchanged fixture) — first-run empty desktop install.
- **Solo creator — Local only** (`solo-local-active`, new) — established; a full My Workflows, every workflow `storage: 'local'`.

The "New" pair stays empty to demo the first-run zero-state; the "Established" pair carries ~18 workflows each so the Drafts / Recents / Home density, search, sort, and the cloud/local storage icon all have something to render. Cloud-only vs local-only is the defining split (mirror images), so the two storage states are each exercised in isolation.

`isSoloPersona` in `PrototypeSidebar` was switched from an explicit id list to a tier check (`currentWorkspace.tier === 'personal'`) so all four solo flavors — and any future one — get the flatter, Projects-less sidebar without per-id maintenance.

**Local My Workflows modeled as an isDrafts "project".** The empty local persona had `projects: []`, but the Drafts view keys off `draftsProject` (an isDrafts project in the current workspace), so a local persona's workflows had nowhere to surface. `solo-local-active` therefore carries a single isDrafts project. This does **not** violate [`projects-are-cloud-only.md`](../../IA_Plan/wiki/decisions/projects-are-cloud-only.md): My Workflows is the on-disk workflow folder, not a shareable cloud Project, and it is filtered out of every Projects listing by `isDrafts` (and the Projects nav is cloud-only regardless). Same modeling the cloud personas already use.

Promote? **no** — prototype fixture/demo scaffolding; no new IA rule.

---

## [2026-06-20] Home Recents empty state — tutorials-first onboarding

New users (no workflows yet) previously saw the Recents section simply vanish (`v-if="recentWorkflows.length"`). It now renders an empty state in that slot that mirrors the populated section: the same "Recents" header (top-left, height-matched), then — in place of the card grid — a dashed-outline box on the page background (no fill). Inside: just the heading "No recent workflows yet" + two CTAs, no description copy. **Open tutorials** is primary and sits on the right (switches the featured gallery below to its Tutorials tab); **Start from scratch** is secondary on the left. Tutorials-first is deliberate — first-run guidance over a blank canvas for someone who has nothing yet.

Prototype fidelity: "Start from scratch" is a presentational stub (no editor to open), matching the existing no-op "+ Workflow" buttons in DraftsView. "Open tutorials" activates the in-page Tutorials tab (still a "coming soon" placeholder). The empty state only shows in the non-search view; the featured gallery remains below it.

Promote? **no** — onboarding UX detail; no new IA rule.

---

## [2026-06-20] Home featured gallery — Tutorials tab leads for new users, shows the Getting Started curriculum

The featured gallery's **Tutorials** tab was a "coming soon" placeholder. It now renders the production **Getting Started** curriculum — the `gsc_*` learning series (Starter 1.1–1.3, Creator 2.1–2.3) from Comfy-Org/workflow_templates' "Getting Started" category — as real `TemplateCard`s with the upstream thumbnail media.

For new users (empty Recents, `isNewUser`), Tutorials is promoted to the **first** tab and is **selected by default**; established users keep What's new first. The default resets on persona switch via a `watch(isNewUser, …, { immediate: true })`.

Data: a separate `gettingStartedTemplates` array in `fixtures/templates.ts` (kept out of `workflowTemplates` so it doesn't leak into the generation-type-grouped Templates page). `popularity`/`addedAt` are nominal there — the tab renders authored order and never sorts. Removed the now-dead `tutorialsPlaceholder` i18n key.

Prototype fidelity: tutorial cards are presentational (no editor to open), matching the Templates page's `TemplateCard` (also no-op on click).

Promote? **no** — onboarding surfacing of existing template content; no new IA rule.

---

## [2026-06-20] New-project dialog with inline General access

The Projects page "New project" button now opens a `NewProjectDialog` instead of being inert. It carries a name field, then the **General access** section from the sharing surface (tier icon + label + description + `TierDropdown`). A fresh project **defaults to Workspace-wide** ("Anyone in {workspace}") — the common case is a shared team project. Switching the dropdown to **Restricted** reveals a "People with access" picker (search workspace members → add as collaborators, each removable) so invitees can be seeded at creation rather than in a second step.

Commit happens on **Create**: `personaStore.createProject(name, tier, collaborators)` (extended with optional `tier` + `collaboratorIds`; the bare `PromoteToProjectDialog` caller still gets the restricted/owner-only default). The view then navigates to the new project's detail page.

Reuse: `TierDropdown` and the sharing tier i18n (`views.project.sharing.tier.*`, `generalAccessHeading`, `addPlaceholder`) are shared with `ProjectSharing`; the picker/people-list is a local reimplementation because the dialog drives local state (the project doesn't exist until Create) rather than mutating a stored project.

Promote? **no** — UI flow over the existing project-creation + three-level-permissions model.

---

## [2026-06-20] Project "+ Workflow" creates a draft, opens a tab, with an editor placeholder

The project page "+ Workflow" button was inert. It now creates a fresh draft in the viewer's My Workflows tied to the project (`personaStore.createDraftInProject` → `provenanceProjectId` set), so it surfaces in that project's "My drafts" without entering the shared Published registry. It then simulates opening the editor: a new workflow tab is pushed to the top tab strip (`tabsStore.openWorkflow`) and a placeholder dialog (`WorkflowEditorNoticeDialog`, "This will open the workflow in a tab.") stands in for the out-of-scope editor.

Promote? **no** — prototype create+open flow; no new IA rule.

---

## [2026-06-20] Publish-as-new keeps the draft (fix)

Publishing a draft "as a new workflow" in a project previously **moved** the draft into the project as the new canonical, removing it from My drafts. Fixed: `personaStore.publishAsNewWorkflow` now mints a fresh **v1** canonical from the draft's content and **keeps the draft** in My Workflows, re-pointing its `forkedFrom` at the new canonical (`atVersion = today`) and its `provenanceProjectId` at the target. So the draft stays in the project's "My drafts" and shows the **v1** tag — symmetric with publishing OVER an existing canonical (which also leaves the draft in place). Replaced the unused `moveWorkflowToProject` verb.

Promote? **no** — corrects the prototype to match the published-workflow model (draft is surfaced, not moved).

---

## [2026-06-20] Shared workflows empty-state across Home / Recents / My Workflows

Extracted the Home Recents empty state into a reusable `WorkflowsEmptyState` component (dashed-outline box on the page background, a heading prop, and Blank canvas + Open templates CTAs) and applied it to the **Recents page** and **My Workflows page** too — so new users (New solo creator, cloud and local) get one consistent empty state everywhere workflows are listed, instead of the older filled-panel "+ Workflow" variants. Button labels live in a shared `prototype.workflowsEmpty.*` namespace; each page passes its own heading ("Your recent workflows will show up here" / "Your workflows will show up here"). Removed the per-page `emptySubtitle` / `createWorkflow` strings.

Promote? **no** — UI consistency; no new IA rule.

---

## [2026-06-24] Project Usage tab — trend + recent months + mocked export

The Usage tab grew from a single this-month count to: the current-month credit count, a **month-over-month delta** (↗ amber for an increase in spend / ↘ green for a decrease, "{pct}% vs last month"), the **last 3 months** as compact cells, and an **Export usage history** button.

Export is **mocked client-side**: it serialises the project's full monthly history to CSV and downloads it via a Blob URL — no backend. Real data would come from the billing service.

Data: added **`monthlyUsage?: { month: 'YYYY-MM'; credits }[]`** (most recent last, includes the current month) to `Project`. This is a **prototype extension** — the wiki ([project.md](../../IA_Plan/wiki/entities/project.md), [workspace.md](../../IA_Plan/wiki/entities/workspace.md)) models only the `creditsThisMonth` scalar. The array's last entry mirrors `creditsThisMonth`; the tab derives current/delta/recent/export from the array, and `creditsThisMonth` is retained for wiki fidelity. Seeded 6 months on each admin-fixture project (varied up/down deltas). The component caps at `max-w-md` so it doesn't span wide screens.

Promote? **maybe** — if usage history/export becomes a real surface, the wiki's project/workspace billing model should gain a monthly-history shape (today it's current-month only). Flagged here pending that.

---

## [2026-06-24] Copies/drafts mirror their source's thumbnail

A copy's thumbnail now always matches the workflow it was copied from. Previously the placeholder image was seeded off the workflow's own id, so a copy (fresh `wf-copy-…` id) hashed to a different example image than its source.

Fix is by **derivation, not stored data**: `personaStore.resolveWorkflowThumbnail(workflow)` walks `forkedFrom` to the resolvable lineage-root canonical and resolves _its_ image (explicit `thumbnailUrl` or seeded fallback). This covers runtime copy-on-access **and** all mocked fixture drafts uniformly — any draft whose `forkedFrom` resolves to an existing published workflow shares that workflow's image, with no fixture edits. A copy whose source was deleted (`wf-cocacola-deleted`) falls back to its own image. The thumbnail-override ("Set thumbnail") counter keys off the lineage root, so cycling a source updates its copies.

Promote? **no** — placeholder-media fidelity; no IA impact.

---

## [2026-06-24] Project context menu on the projects listing

Right-clicking a project card (`ProjectCard`) opens a role-gated `ProjectContextMenu`, mirroring `WorkflowContextMenu` (PrimeVue `ContextMenu`, `role`-filtered `items`, `separator` dividers, module-scope single-open tracking). Gated on the three-level model:

- **Anyone with access:** Open · Media assets · Copy link (+ **Share** unless the project is private)
- **Owner / workspace-Admin (on workspace-wide):** View usage · Rename · **Delete** (danger-styled)
- **Non-owner members (restricted/private):** Leave project

Deliberately **omits New workflow** (per request). Right-click is suppressed on inaccessible (grayed) cards.

New store ops: `renameProject`, `deleteProject` (also removes the project's canonical workflows → their copies become "source removed"), `leaveProject` (drops membership **and** flips `currentUserHasAccess` so a restricted project falls out of `visibleProjects` — plain `removeProjectMember` wouldn't, since the list also keys off that flag). **View usage** uses a new one-shot `uiStore` tab intent (`requestProjectTab`/`consumeProjectTab`, mirroring the share intent) consumed in `ProjectDetailView.onMounted` to land on the Usage tab. **Copy link** writes a mock `…/prototype/projects/<id>` URL to the clipboard + toasts.

Promote? **no** — surfaces existing wiki lifecycle ops (rename/delete/leave/share/usage); no new IA rule.

---

## [2026-06-24] Optional publish comment → version-history note

Publishing a workflow now offers an **optional comment** ("Add a comment (optional)"), skippable. It's captured in both publish surfaces: `PublishConfirmDialog` (the overwrite-the-canonical confirm — the common draft-publish path) and `PromoteToProjectDialog` step 2 (publish-as-new / choose-destination). The comment is attached to the resulting published version.

Data: `PublishedVersion` gains `comment?: string`. Threaded through `publishOverWorkflow` / `publishAsNewWorkflow` (both take an optional `comment`), the `useWorkflowPublish` payload, and the two dialogs. Empty/whitespace comments are dropped (stored only when non-blank).

Display: the `WorkflowVersionBadge` history popover shows a `message-square-text` glyph next to a version's number when it has a comment; hovering it reveals the note (native `title`). Versions without a comment show nothing — so the column reads as a mix.

Seeded the Matrix comp shots with comments (the bullet-time comp has one per version; the lobby comp mixes commented + uncommented) so the popover demonstrates it out of the box.

Promote? **maybe** — published-version history is a wiki concept ([published-workflow-model.md](../../IA_Plan/wiki/decisions/published-workflow-model.md)); a per-version commit message is a natural addition there if it sticks.

---

## [2026-06-24] "Check out" replaces "Save a copy"; publish-as-new name validation; scrollable version-comment popout

Three changes from the 2026-06-23 Team workspace sync (Doug + Pablo + Willie). Source: Fireflies `01KVRP1N9QWJ4VE2H5KKXY2993`. Tracked in `temp/in_progress/workspace-sync-jun23-todos.md`.

**1. Terminology: "Save a copy" → "Check out".** Doug found "save a copy" misleading — his mental model is checking out a library book (pull → edit → publish back). Pablo: it's the same as branch-out/branch-in. The underlying mechanism is unchanged copy-on-access; only the user-facing label moved. Strings updated: `workflowCard.copyAction`, `copiedSummary`, `workflowMenu.toast.savedCopySummary`/`savedCopyDetail`, `views.project.publishedInfo.copy`. Removed the dead `workflowCard.copyBadge` string (the copy badge was retired earlier for the link icon). Internal code names (`copyToMyWorkflows`, the `copy` emit) stay — the operation _is_ a copy; "Check out" is just its label.

**2. Publish-as-new name-conflict validation.** Doug: publishing a new workflow into a project should reject a name that collides with an existing canonical there, with a nudge. `PromoteToProjectDialog` now computes `nameConflict` (case-insensitive match against the target project's existing canonicals, only when publishing-as-new — not when replacing or into a new project), gates the confirm button, and shows an inline `text-danger` message (`promoteToProject.nameConflict`).

**3. Version comments pop out to the side, hoverable + scrollable.** Doug: long multi-line publish notes shouldn't stack as messy hover tooltips. `WorkflowVersionBadge`'s comment glyph swapped from the reka-ui `Tooltip` (auto-dismiss, non-interactive, `max-w-xs`) to a reka-ui `HoverCard` (`side="right"`, `max-h-60 overflow-y-auto`, `whitespace-pre-wrap`) — it stays open when the pointer moves into it, so long notes scroll. The glyph `@click.stop.prevent`s so reading a comment doesn't fire the row's open-version.

Wiki: items 1 + 2 recorded in [mvp-scope.md](../../IA_Plan/wiki/decisions/mvp-scope.md) ("Check out" verb under the replacement publish model; publish-as-new name-collision rule on the open-publish bullet). Item 3 is pure UI — log only.

Promote? **done** for 1 + 2 (folded into mvp-scope). **No** for 3.

---

## [2026-06-24] Admin curation of version history — pin "stable" + soft-delete; comment hover on whole row

From the 2026-06-23 sync (Pablo's asks). Source: Fireflies `01KVRP1N9QWJ4VE2H5KKXY2993`.

**Pin a stable version + delete a version (admin/owner only).** The version-history popover (`WorkflowVersionBadge`) gains, for viewers who can manage the canonical's project (owner, or workspace admin on a workspace-wide project — `canManageVersions` in `WorkflowCard`, mirroring `ProjectContextMenu.canManage`), two per-row hover actions: **pin as stable** (at most one; clears any other pin; re-clicking unpins) and **delete version**. A pinned version shows a persistent pin glyph + "Stable version" tooltip next to its number. Non-managers see the history read-only (unchanged).

Data: `PublishedVersion` gains `pinned?` and `deleted?`. Store: `pinVersion(workflowId, n)` / `deleteVersion(workflowId, n)`, `n` = 1-based version number. **Delete is soft** — the entry stays in the array, flagged `deleted`, and display filters it out — so version numbers (chronological index + 1) stay stable across deletes (history reads 1, 2, 4, 5, per Pablo/Willie's "numbers don't renumber"). Seeded `wf-mtx-bul-comp` v3 as pinned to demo.

**Comment hover moved to the whole row.** The publish-comment popout now triggers on hovering anywhere in the version row (not just the comment glyph, which stays as an indicator), no special cursor, and is anchored to the right of the popover with a ~4px gap (reka-ui HoverCard, `side="right"`, `side-offset=9` to clear the panel's 4px padding + 1px border). The row became a `div role="button"` (was `<button>`) so the pin/delete `Button`s can nest without invalid button-in-button.

**Pin sets the card's effective current version (= the MVP restore).** Follow-up from Willie same day: restoring a prior version is **not** out of scope. Pinning a version makes it the **effective current version** — the published card's version badge shows the pinned version's number (not the latest), and **check-out forks from the pinned version** (`copyToMyWorkflows` reads pinned-else-latest, filtering soft-deleted). Re-pin/unpin to change what the canonical serves; later publishes aren't lost. `WorkflowVersionBadge.currentVersion` and the store's check-out both prefer the pinned version.

Wiki: **promoted** (now a settled decision). [mvp-scope.md](../../IA_Plan/wiki/decisions/mvp-scope.md) — added the admin version-curation bullet (pin-as-restore + soft delete) and corrected the copy-on-access line to "effective current version." [published-workflow-model.md](../../IA_Plan/wiki/decisions/published-workflow-model.md) — revised the version-history note and marked the "Version restore" open question **resolved for MVP** (via pin-a-stable-version).

Promote? **done.**

---

## [2026-06-24] Outdated-copy affordance — amber "behind" version tag + Get latest

Group 2 follow-up (Pablo's stale-pin scenario). A checked-out copy whose forked version trails the canonical's **effective current version** (pinned-else-latest) is now surfaced and fixable.

**Behind detection** (`personaStore.versionsBehind(workflow)`): resolves the canonical, computes its effective version (`effectiveVersion` helper: pinned non-deleted, else latest non-deleted), and returns `effective.n − copyForkedVersion` when positive (0 if not a copy, current, or ahead of a pinned older version — version numbers are the stable chronological index, matching the soft-delete model).

**Tag** (`WorkflowCard`): the copy's version chip turns **soft amber** (`bg-amber-500/15 text-amber-500`) with a `circle-alert` glyph when behind; tooltip leads with "{n} versions behind the current" (+ provenance). No amber semantic token exists in the theme, so Tailwind's amber palette is used.

**Get latest** (`WorkflowContextMenu`): when behind, a "Get latest version" item appears; it opens a styled confirm ("…replaces this workflow and any content in it with the current published version") then calls `personaStore.updateToLatest`, which advances the copy's `forkedFrom.atVersion` to the effective version + bumps `updatedAt` (the prototype's stand-in for replacing content). After it, `versionsBehind` → 0 and the tag returns to neutral.

The confirm uses a **new reusable `ConfirmDialog`** (design-system Dialog) instead of the native `window.confirm` — same Comfy styling as the publish dialogs, with an optional `danger` (destructive Button) variant.

**Follow-up — swept the menus off native dialogs.** Added a sibling `PromptDialog` (styled single-field text input, replaces `window.prompt`). Converted the rest of the context-menu confirms/prompts: delete-version (`WorkflowVersionBadge`), rename + delete (`WorkflowContextMenu`), rename + delete + leave (`ProjectContextMenu`). Each menu now drives a small `activeDialog` discriminated ref (`'rename' | 'delete' | …`) and renders the right dialog. Reused existing menu-label/confirm strings as dialog titles/bodies (only `workflowMenu.renameTitle`/`deleteTitle` + `projectMenu.leaveAction` are new; `workflowMenu.renamePrompt` removed). Remaining native confirms live in **MembersView** (remove member) and **SettingsView** (danger zone, type-the-name) — out of this batch's scope.

**Pinning interaction:** "behind" is measured against the _effective_ (pinned) version, and Get latest syncs to the pin — not necessarily the newest publish. Demo: retargeted `wf-mw-mtx-bul-comp` to fork from v1 so it reads "2 behind" the pinned v3 and Get latest pulls v3 (not the latest v4). The Coke drift copies (`wf-mw-coke-hero-wip` etc.) demo the no-pin case.

Note: this re-adds a "versions behind" signal that was cut earlier in the project ("users can handle this themselves") — now wanted back, and made actionable, off the back of pinning.

Wiki: the "fallen behind" label was already in [mvp-scope.md](../../IA_Plan/wiki/decisions/mvp-scope.md) copy-on-access bullet; appended the amber-tag + **Get latest** re-sync to it.

Promote? **done** (folded into mvp-scope).

---

## [2026-06-24] Copy version chip stays a read-only indicator (no per-version switcher)

Doug asked (2026-06-23) for the copy's version chip to open a dropdown for switching between versions, like the project (canonical) cards. **Declined.** A click-to-switch dropdown on the chip makes it too easy to blow away local changes — switching/overwriting a working copy should be a **deliberate** action, not a one-click on a hover chip. The copy chip stays a static indicator (version number + amber "behind" treatment); changing which version you're on goes through the explicit **Get latest** (with its replace-content confirm). Reinforces the copy-on-access / deliberate-publish stance already in [mvp-scope.md](../../IA_Plan/wiki/decisions/mvp-scope.md).

Promote? **no** — a UI-affordance call consistent with the existing model; nothing new for the wiki.

---

## [2026-06-24] Kebab (⋯) menu on workflow cards

Doug's discoverability ask: right-click worked but wasn't obvious. Added a **vertical-ellipsis kebab Button** in the **upper-right of the grid card's thumbnail**, revealed on hover (and `group-focus-within` for keyboard). It opens the same role-gated `WorkflowContextMenu` as right-click — so Rename / Set thumbnail / Delete / etc. are now reachable without right-clicking.

Built as a sibling overlay of the card `<button>` (not nested — avoids button-in-button), `pointer-events-none` container + `pointer-events-auto` button so thumbnail clicks still pass through to open the workflow. The right-click handler and the kebab share one `openMenu(event)` (PrimeVue `ContextMenu.show` positions at the event coords for both). Grid layout only; list rows keep right-click. Sits top-right; the existing Check out / Open hover actions stay bottom-right.

Promote? **no** — surfaces existing actions; no IA change.

---

## [2026-06-24] My Workflows = personal project; single-level folders in My Workflows + projects

Two features (built together, user gave autonomy).

**1. My Workflows = personal project.** Per the 2026-06-23 sync (Pablo + Doug + Willie): My Workflows no longer shows _other projects'_ drafts. `DraftsView` now lists only **personal** workflows — drafts-project workflows whose `provenanceProjectId` is _not_ a real shared project (those live in that project's "My drafts"). Orphans (provenance project deleted) fall back to My Workflows so nothing is stranded.

- **Recents kept (not dropped).** The meeting's resolution was "My Workflows = personal, **Recents = everything**" — so Recents becomes the cross-project recency view (it already shows all accessible workflows). Dropping it would have removed the only place project copies surface by recency. Left the Recents nav as-is.

**2. Folders.** Users can add folders to **My Workflows** and to a **project's Published section** (the two foldered containers; a project's "My drafts" stays flat). Single-level (no nesting) — `Folder.parentFolderId` is reserved for later. Pablo's "everything is a folder" was an architecture concept, not a user requirement, so it's not modelled.

- Data: `Folder { id, projectId (container), name }`; `Workflow.folderId`; `PersonaFixture.folders?` (normalized to `[]` at store init). Store: `createFolder`/`renameFolder`/`deleteFolder` (non-destructive — contained workflows fall back to root)/`moveWorkflowToFolder`.
- UI: `useFolderBrowser(containerId, workflows)` composable (current-folder nav, drops to root if the container changes or the open folder is deleted); `FolderCard` (folder tile, click to enter, kebab/right-click → Rename/Delete via the styled dialogs); `MoveToFolderDialog`; "New folder" buttons + breadcrumb in both views; "Move to folder…" in the workflow context menu (gated to canonicals + personal My Workflows workflows). Search in My Workflows is container-wide (hides folders); otherwise the view shows the active folder level.
- Permissions: the prototype does **not** gate folder edits by role (any viewer who sees a card can move/organize). Real folder-management permissions are out of scope — noted for the wiki.
- Demo (admin persona): **The Matrix** seeds folders **BUL / LOB / RUN** with the matching comp/fx canonicals inside (greenkey/sen/con stay at root); **My Workflows** seeds an **Experiments** folder holding two untitled workflows.

Wiki: not yet promoted — folders weren't in the IA model. Worth a short addition to [mvp-scope.md](../../IA_Plan/wiki/decisions/mvp-scope.md) (folders as a per-container org layer for My Workflows + project published) once the shape settles; flagged, not written, pending confirmation.

Promote? **maybe** (folders) — pending confirmation. My-Workflows-as-personal-project is already implied by the copy-on-access model; the personal-only filter is the implementation.

---

## [2026-06-24] Folder UX refinements — drag-and-drop, no-X prompt, move dialog is folders-only

Follow-ups from the user same day.

- **Drag a workflow onto a folder.** New `useWorkflowDrag` (module-scope `draggingWorkflowId` + start/end). `WorkflowCard` gains an opt-in `draggable` prop (HTML5 DnD on the card root; passed by the foldered grids — My Workflows when not searching, project Published). `FolderCard` is a drop target: highlights (primary border) only for a same-container workflow not already in it, and on drop calls `moveWorkflowToFolder` + toasts. Click-to-open still works (a click without movement isn't a drag).
- **Prompt dialog loses its top-right X.** Removed `DialogClose` from `PromptDialog` (Cancel + Esc + overlay remain) — affects all single-field dialogs (new folder + renames).
- **Move-to-folder dialog is folders-only.** Dropped the "No folder" (move-to-root) option per request; Move is disabled until a folder is picked, and the "Move to folder…" menu item now only shows when the container actually has folders. Net: organizing _into_ folders is the dialog's job (and drag-and-drop); pulling a workflow back to root is via deleting the folder (non-destructive — its workflows pop back to root).

Promote? **no** — interaction polish on the folder feature above.

---

## [2026-06-24] Multi-select for workflow grids

Checkbox + shift-range + marquee + bulk context menu, in the foldered grids (My Workflows + project Published).

- **Composables:** `useMultiSelect(orderedIds)` (selection Set, anchor, toggle, shift-range, `setSelection`, and drops ids that leave the list); `useMarquee(containerRef, …)` (rubber-band over empty space, intersects `[data-wf-id]` boxes; a no-drag mousedown = click-empty → clear).
- **Wrapper:** `SelectableWorkflowGrid` renders the cards via slot inside the marquee container and owns the bulk **context menu** (Move N to folder… / Delete N / Deselect all) + the move/delete dialogs. The slot exposes `{ isSelected, selectionActive, onSelect, onContextMenu }`. Esc clears.
- **WorkflowCard:** opt-in `selectable` + `selectionActive`; a subtle top-left checkbox (hover/selected/active-revealed) toggles without opening; plain click still opens; shift/cmd/ctrl-click selects; right-click routes to the bulk menu when 2+ are selected, else the card's own menu. `data-wf-id` added for marquee hit-testing.
- **Bulk move** reuses `MoveToFolderDialog` (now takes `workflowIds: string[]`; single callers pass `[id]`). **Bulk delete** loops `deleteWorkflow`.
- Scope: checkbox is grid-only (list view selects via modifier-click/marquee).

**Bulk drag (added same day).** Dragging a card that's part of a multi-selection drags the **whole selection** into a folder; an unselected card drags just itself. `useWorkflowDrag` now carries `draggingWorkflowIds: string[]`; `WorkflowCard` emits `dragstart` (no longer decides the ids) and `SelectableWorkflowGrid` resolves them from the selection (`onDragStart` slot prop). `FolderCard` accepts every dragged id that belongs to its container and isn't already inside, and toasts a count.

Promote? **no** — UI interaction; no IA change.

---

## [2026-06-24] Breadcrumb navigation + folder-dialog Enter fix

Two tidy-ups.

- **Page breadcrumbs.** New reusable `PrototypeBreadcrumb` (items[] + `navigate(index)` emit; last item = current, earlier items are links). Project detail's `← All projects` back link is replaced by a full trail **Projects › ‹project› [› ‹folder›]**; My Workflows shows **My Workflows › ‹folder›** only when inside a folder. The folder segment reflects the open Published/My-Workflows folder, so the duplicated in-section folder navs are removed from both views. Retired the now-orphaned `views.project.back` string.
- **New-folder dialog reopened on Enter.** Confirming with Enter closed the dialog, reka-ui restored focus to the "New folder" trigger button, and Enter's default action re-activated it (classic focus-restore bleed-through). Fixed with `@keydown.enter.prevent` in `PromptDialog` — applies to every single-field dialog (new folder + renames).

Promote? **no** — UI navigation polish + bug fix; no IA change.

---

## [2026-06-25] Project "Drafts" section — folder-scoped

- **Renamed** the project-detail "My drafts" heading to **Drafts** (`views.project.draftsHeading`). Still the viewer's own private copies (the InfoTooltip "only you can see them" is unchanged) — no cross-user broadening, consistent with `drafts-as-default-private-project`.
- **Folder scoping.** At the project root the section shows every draft for the project; inside a folder it shows only the drafts checked out from a published workflow that lives in that folder (`draft.forkedFrom.workflowId` ∈ the folder's canonicals). Drafts created fresh in-project (no `forkedFrom`) have no source workflow, so they belong to the root only. New `draftsFolderEmpty` empty-state copy for an empty folder.

Promote? **maybe** — `entities/project.md §"Project surface (MVP)"` still labels this section "My drafts"; worth aligning the wiki name + noting drafts now mirror the Published folder structure. Flagged, not yet edited.

---

## [2026-06-25] Custom collapsing drag ghost

Dragging a workflow card onto a folder no longer drags the full-size card image.

- **Suppress the native drag image** (`setDragImage` with a 1×1 transparent pixel) and render a custom ghost (`WorkflowDragGhost`, mounted once in `Dashboard`, teleported to body, `pointer-events-none`).
- **Collapse animation.** The ghost appears at the source card's captured width + 3:2 thumbnail height, then the thumbnail height/opacity transition to 0 over 150ms (triggered one frame after mount via rAF), leaving just the card's text area to follow the cursor.
- **Single vs multi.** Single shows the workflow name + modified date (the card's text area). Multi keeps the same width/collapse but the detail reads "{n} workflows" (`dragGhost.count`).
- `useWorkflowDrag` now also carries `ghostGeometry` (width + thumbHeight captured from the source card's rect) and a `pointer` ref updated from a document-level `dragover` listener.

Promote? **no** — drag-interaction polish; no IA change.

---

## [2026-06-25] Move-to-folder dialog regains a root option

Refines the 2026-06-24 "folders-only" call. The move dialog now lists the **container root** as its first option, labelled with the container's own name — **"My Workflows"** for the personal drafts project, otherwise the **project name** — with an open-folder icon to set it apart from the closed-folder sub-folders. Picking it calls `moveWorkflowToFolder(id, null)`, so a workflow sitting in a folder can be pulled back out (the earlier "delete the folder" route is no longer the only way). For a single workflow the dialog pre-selects its current location (its folder, or the root when it has none). Applies to both the per-card and bulk (multi-select) move paths.

Earlier rejection of "No folder" stands in spirit — the difference is the option is now a concrete, named destination (the container) rather than a vague negation.

Promote? **no** — folder-interaction polish; no IA change.

---

## [2026-06-25] Home search returns Projects

Home dashboard search now matches across three result groups — **Workflows**, **Media assets**, and **Projects** (in that order) — and the input placeholder reads "Search your workflows, media and projects…". Projects come from `visibleProjects` (the same accessible, current-workspace, non-drafts set the Projects page uses), so the confidentiality contract holds — still scoped to the viewer, not global search. A project result opens via `uiStore.go({ kind: 'project' })`.

Plan pruned (user): dropped **Onboarding** (deferred) and the **Per-project Assets tab** (a per-project assets link already exists; tab may not make MVP).

Promote? **no** — search-scope refinement within the existing "no global search in MVP" stance.

---

## [2026-06-25] Home search: folders + typed result chips

Built on the same-day "search returns Projects" change.

- **Folders in results.** Folder matches (from the viewer's accessible containers — My Workflows + visible projects) now appear as a result group. Clicking one opens its container with the folder pre-selected, via a new one-shot `folderIntent` on `uiStore` (`requestFolder`/`consumeFolder`) that `useFolderBrowser` consumes when the matching container mounts — mirrors the existing `projectTabIntent` pattern.
- **Typed result groups + filter chips.** Workflow matches are split into **Published** (canonicals in real projects), **Drafts** (personal-project workflows carrying a real project's provenance), and **My Workflows** (purely personal). Combined with **Projects**, **Folders**, and **Media assets**, results render as up to six labelled groups in that order. When more than one type is present, a chip row (All + one chip per present type) filters to a single type; a new query resets to All.
- **Media kept.** The user's chip list named Projects/Folders/Published/Drafts/My Workflows; Media assets is retained as a sixth group + chip since the search still covers media (placeholder unchanged). Flag for confirmation.
- Retired the single "Workflows" results heading (`resultsWorkflows`) now that workflows are bucketed.

Promote? **no** — search-results presentation; no IA change.

**Chip styling (same day).** The Home search result-filter chips now use the shared `FilterPill` component (active = inverted, inactive = secondary, `size="md"`) — the same control the Templates page uses for its category row — rather than bespoke rounded pills, so the two filter rows read identically.

**Templates in search (same day).** Home search gains a seventh result type — **Templates** (matched on name + model from the gallery fixture, rendered with `TemplateCard`) — placed last, below every other group, with its own `FilterPill` chip when more than one type matches.

## [2026-06-25] Drag a workflow onto the breadcrumb to move it up

Observed: a user inside a project folder dragged a workflow onto the breadcrumb to get it back to the project root. Now supported. `PrototypeBreadcrumb` takes an optional `dropFolderIds` array parallel to `items` (`null` = container root, a string = a folder, `undefined` = not a drop target); link segments with a defined target accept a workflow drop, highlight on drag-over, move every dragged id not already at that level, and toast a count. Wired so the **project-root crumb** (project detail) and the **My Workflows crumb** move dropped workflows to root. Reuses `useWorkflowDrag` + the existing folder move/toast strings.

Promote? **no** — drag-interaction affordance; no IA change.

---

## [2026-07-07] Project page: checkout + publish reachable by drag and right-click

From the Aaron Dabelow user interview (Fireflies `01KW3DKQH2VRRECNWRR1F54F4K`, "Comfy Teams Feedback"). He read the published↔draft model correctly only once it was explained, and reached for drag to move between the two sections ("I drag it up here and then that launches the publish"). Three changes to `ProjectDetailView`:

- **"Check out" in the right-click menu.** `WorkflowContextMenu` now shows a **Check out** item as the primary action on a published canonical (a non-draft project workflow with no `forkedFrom`), replacing the mislabeled "Save to My Workflows" for that case only. Same `copyToMyWorkflows` op; the label + toast match the published card's hover button and the checkout mental model. Personal copies/drafts keep "Save to My Workflows". New i18n `workflowMenu.checkOut`.
- **Drag published → Drafts = check out; drag draft → Published = publish.** The two sections are drop zones (dashed outline on drag-over). A published canonical of this project dropped on Drafts runs checkout (`copyToMyWorkflows`, multi-select aware); a single project draft dropped on Published enters the shared publish flow (`publishDraft` — same as the draft card's Publish button, so overwrite-vs-new confirm behaves identically). Draft cards are now `draggable`. Reuses `useWorkflowDrag` + the collapsing ghost.
- **One context menu at a time.** New `useActiveContextMenu` singleton: opening any prototype right-click menu dismisses whichever was open. Replaces three duplicated module-scoped `closeActiveMenu` vars (WorkflowContextMenu, FolderCard, ProjectContextMenu — which only dismissed same-type menus) and closes the previously-uncoordinated `SelectableWorkflowGrid` bulk menu. Fixes stale menus when right-clicking a workflow then a folder (both coexist on this page). Unit-tested.

The **checkout terminology** concern Aaron raised (reads as file-locking; suggested "snapshot"/"craft") is logged but **not** actioned here — that's a naming decision to settle separately. This change only makes the existing checkout action reachable/consistent.

Promote? **no** — surfaces existing operations via new affordances; no IA change. Checkout-naming question remains open for the wiki.

---

## [2026-10-06] Custom Comfy Cloud happy path (Flow 07) — build decisions

Built for the 8 Oct customer demo from the 6 Oct "Custom cloud sync". Flow: `prototype/flows/07-custom-cloud-happy-path.md`. Wiki: `concepts/custom-comfy-cloud.md` and the six decisions it links.

**Editor surface: a capture with live overlays, not the real GraphView.**

- Decision: workflow tabs render `DemoEditorView`. It shows a real editor capture (1280×863, ComfyUI's own tab bar cropped off), scaled to fit. Live overlays are drawn in capture pixels: `matte_pass` node patches, red rings and Error tabs, the Run button, the run counter and the cold-start note.
- Reason: the deployed prototype has no backend. The real `GraphView` fails in `userStore.initialize` (`getUserConfig` gets HTML back) and renders blank, in dev and on Vercel.
- Side effect: workflow tabs now open an editor instead of staying on the dashboard. `WorkflowEditorNoticeDialog` ("editor is out of scope") is retired, and a project draft's Open now opens an editor tab instead of a toast.
- Promote? **no**.

**Project ↔ deployment fixture shape.**

- Decision:
  - `Project.deploymentId?` and `Project.color?` are new.
  - A new `PersonaFixture.deployments[]` holds `{ id, name, kind: 'comfy-cloud' | 'custom', release?, status: 'ready' | 'asleep' | 'building', gpu?, warmMinutes?, nodePacks[], models[] }`.
  - Comfy Cloud is implicit: no `deploymentId` means `COMFY_CLOUD`.
  - "Runs it" means the deployment has every pack and model the workflow needs and is not building.
- Wiki link: `entities/project.md` § Deployment (updated in the same change), `decisions/project-runs-on-shared-deployment.md`.
- Promote? **done**.

**Tabs belong to the current project; switching is a reload.**

- Decision:
  - The tab strip belongs to one project. The switcher sits at its far left, and the personal project, My Workflows, is where every session starts.
  - Switching shows a 900 ms "Opening {project}" screen. It then restores that project's tabs, lands the dashboard on Home and clears any run in flight, as a real reload would.
  - Opening a workflow from another project's page switches into that project first.
  - A persona change is another account: it starts on its personal project with no tabs.
- Wiki link: `decisions/project-switcher-in-tab-bar.md`. Open question: `open-questions.md#project-switch-reload` (working: reload).
- Promote? **done**.

**"Choose where it runs" selector.**

- Decision:
  - The selector preselects the first project that already runs `matte_pass`. The presenter then picks "A new project, on a new build", matching "but we make a new one anyway".
  - Projects that lack nodes are listed with what they lack, in amber, but **can't be picked**. Picking one means updating or branching its build, which is out of scope.
  - "Switch and reload" moves the workflow into a project that runs it.
  - "Not now" keeps the red nodes, and Run reopens the dialog.
  - The canvas's Upload button on the Models row is dropped. The build's first stage uploads the local-only model.
- Open question dependency: `open-questions.md#dropped-workflow-other-deployment`.
- Promote? **maybe**, once that question settles.

**Build lock scope.**

- Decision:
  - While the current project's deployment builds, the lock covers everything under the tab strip, including Home, not just the editor. The tab strip stays live.
  - "Switch to another project" opens the tab-bar switcher.
  - There is no Cancel build: failed and cancelled builds are out of scope.
  - The demo plays about 19 simulated minutes in 18 s.
  - When ready, the deployment turns `ready`, the red nodes clear and a toast offers "Run matte_pass".
- Wiki link: `decisions/build-locks-project-until-ready.md`. Open questions: `#build-lockout-acceptable`, `#build-wait-acceptable`.
- Promote? **done**.

**Cold start and the `asleep` status.** _Willie to check._

- Decision:
  - `asleep` appears only as a deployment status in lists, menus and settings. It comes from the canvas sample data ("Matte tests v7, asleep").
  - The editor has no warm/cold indicator.
  - Every Run on a custom deployment shows the small "Starting a worker … usually under 20 seconds" note for 4 s. The prototype can't tell a first run from a warm one.
  - Runs don't change a deployment's status.
- Reason: Willie at 42:23 asked for "some very minimal things saying cold start will take a bit longer". At 42:03–42:36 he also liked a green/grey dot on the project, which is what the status dot (green ready, grey asleep) shows. The brief says no warm/cold indicator, but its sample data uses "asleep", so the dot stays out of the editor.
- Promote? **maybe**.

**Home and project page.**

- Decision:
  - Home gains a **Projects** section above Recents, in three columns. Its list cards show where each project runs in place of the workflow count. Grid cards keep the count and add the deployment line.
  - The project page gains a **Settings** toggle, beside Usage, that shows the read-mostly Deployment section. "Change deployment" shows for workspace admins only.
- Promote? **no**.

**Presenter affordances.**

- Decision:
  - Any file dropped on the app (outside Media Assets, cloud personas) opens as `matte_pass`. So does **Demo: drop incompatible workflow** beside the persona toggle.
  - **Reset demo** reloads the page. Every store is in memory, so a reload is the only reset that also undoes drafts and renames made during the demo.
- Promote? **no**.

**Names with `&` in i18n strings.**

- Decision: `useTextT` calls `t(…, { escapeParameter: false })` for strings that carry project or deployment names. They render only into text nodes or the clipboard.
- Reason: the app-wide `escapeParameter: true` showed "Matte R&amp;D".
- Promote? **no**.

---

## [2026-10-06] Flow 07 follow-up: Home tab first; no projects list on Home

Willie's review of the deployed preview:

- **The Home tab comes first** in the tab strip, and the project switcher sits right after it, before the project's workflow tabs. This replaces "far left of the tab strip" from the earlier entry.
- **Home no longer lists projects.** The Projects section added earlier the same day is removed. "Where each project runs" now shows on the Projects page (sidebar → Projects), whose cards carry the deployment line.

Wiki link: `decisions/project-switcher-in-tab-bar.md` still says "far left of the tab bar", and `concepts/custom-comfy-cloud.md` step 1 still says "Home shows projects". Both need a small update in the wiki.
Promote? **yes**, as an amendment to those pages.

---

## [2026-10-06] Flow 07: real node graph on an in-browser backend

Willie asked for the real node graph, "with all the happy path UI we already discussed", and confirmed it only needs to show the UI, not execute.

- **Decision:** the editor tab is the real ComfyUI editor (`GraphView` inside `components/RealEditor.vue`). It replaces the capture-based `DemoEditorView` and its screenshot. It stays mounted, hidden while Home is active, so the app boots once.
- **In-browser backend (`src/prototype/mockBackend/`).** This departs from WORKSPACE-UX-PROTO §2.2 ("no mock HTTP layer"). The deployed prototype has no server, and without answers to its API calls the real editor can't boot. Installed from `src/main.ts` for `PROTOTYPE_DEPLOY` builds only, it patches `fetch` for `/api/*`:
  - settings and userdata are kept in memory
  - `object_info` follows the current project's deployment
  - the queue is empty, and a stand-in WebSocket replaces the server's
  - Run is accepted, but nothing executes. On a custom deployment the backend reports a 4 s cold start, which drives the "Starting a worker" note under Run.
- **Editor settings it serves:**
  - Nodes 2.0, as on Comfy Cloud. Its red ring and "Error" footer flag both missing nodes and missing models.
  - The Errors tab setting is on, because Nodes 2.0 needs it to flag missing models.
  - Every warning is surfaced silently, and a guard closes the Errors overlay if anything opens it, so the brief's "no error toast or Issues panel" holds.
  - Workflow tabs are moved to the editor's sidebar, and the prototype tab strip is the only one.
  - No restored drafts, no unload prompt (Reset demo reloads), no tutorial.
- **`matte_pass` is a real workflow** (`fixtures/mattePassGraph.ts`). It is a Flux dev product shot with the hero LoRA, then RMBG (`comfyui-rmbg`) and AcmeMatteRefine (`acme-matte-tools`). On Comfy Cloud four nodes are red: two missing models and two missing packs. On Personal R&D (Matte tests) only AcmeMatteRefine is red.
- **Deployment ↔ node types.** On a project switch, or when a build turns ready, `RealEditor` points the backend at the new deployment and calls `app.reloadNodeDefs()`. It unregisters pack node types the deployment lacks, then reloads the active workflow so its nodes resolve again. It does this only while a workflow tab is showing: re-measuring Nodes 2.0 in a hidden editor collapses node sizes.
- **Run with missing nodes** opens "choose where it runs". A capture-phase click on the editor's Run button stops the queue.
- **GraphView:** the per-workflow `PrototypeProjectChip` is hidden under `/prototype`, where the tab-bar switcher replaces it.
- **Known:** Escape doesn't close the tab-bar switcher menu while the editor is mounted; clicking outside does.

Promote? **no** — prototype infrastructure, no IA change.

---

## [2026-10-07] Flow 07: project pill in the tab bar, hidden on Home

Willie picked direction F from the design canvas "Tab bar: Home and project switcher" (https://claude.ai/artifact/67jL5HegqgJSsSsoiVvqQv).

- **Decision: the project switcher is a neutral pill.** It has a grey fill and border and holds the deployment's status dot:
  - blue with a halo and "Building · N min" while the deployment builds
  - green when ready, and on Comfy Cloud, which is always up
  - grey when asleep

  The personal project shows a person icon instead of a dot. The name is cut at `15ch` (about 15 characters) and shown in full on hover. The menu keeps the colour tiles.

- **The pill hides while the Home tab is active.** Home is workspace-wide, and Willie asked for the homepage not to show the project chip. The one exception is a building project, where the pill stays visible so the lock screen's "Switch to another project" can open it.
- **Consequence: a project switch lands on that project's page** (My Workflows for the personal project) rather than the Home view. Without this, switching to a project with no open tabs left you on Home with no pill, so there was no sign of which project you were in. The pill comes back when you open a workflow.
- **Fix:** while another tab is active, the real editor is now invisible but still laid out, not `display: none`. With `display: none`, Nodes 2.0 re-measured the nodes at zero width and saved the shrunken sizes, so a workflow came back narrower after a round trip through Home.

Open question: should Home show some neutral sign of the current project? Today a presenter on Home can't switch projects without opening a workflow.

Promote? **maybe**: a small amendment to `decisions/project-switcher-in-tab-bar.md`, saying the switcher hides on Home.

---

## [2026-10-07] Flow 07: the pill is back on Home; a project switch opens its drafts

This replaces two points in the entry above, "project pill in the tab bar, hidden on Home", after Willie reviewed it.

- **Decision: the project pill shows on Home too.** The pill is how you see and change the project from anywhere, so hiding it on Home cost more than it gained.
- **Decision: a project switch reloads into the editor.** The tabs are, in order of preference:
  1. the tabs you left open in that project;
  2. the first time, your drafts for the project (the workflows in My Workflows whose provenance is that project), newest first;
  3. a blank workflow, if you have no drafts there.

  A project switch no longer lands on the project page.

- Drafts open as saved workflows. In the prototype, each one shows the default graph, except matte_pass.

Promote? **yes**. Add it to `decisions/project-switcher-in-tab-bar.md` as "switching project restores its tabs, else opens your drafts for it". Relates to `decisions/drafts-as-default-private-project.md`.

---

## [2026-10-07] Merge upstream ComfyUI_frontend main (2026-10-06)

The fork last synced with upstream on 2026-05-07. Willie wants the current upstream chrome around the node graph for the 8 Oct Custom Comfy Cloud demo. Branch `merge-upstream-main`, merge commit `6dd757292c`.

- **Decision:** upstream wins everywhere outside `src/prototype/` and `prototype/`. The fork keeps only its hooks into upstream code: the router base and `prototypeRoutes`, `installMockBackend` in `main.ts`, `build:prototype`, the `/prototype` gating in `App.vue` and `GraphView.vue`, the PP Formula font, and the `prototype` i18n subtree.
- **Editor chrome is upstream's:** the left toolbar, the Graph mode switch with a panel toggle, Run with the queue count, the right-panel toggle, the minimap and upstream's Media Assets sidebar.
- **Flow 07 change: missing nodes are amber, not red.** Upstream now marks missing nodes and models as warnings: an amber ring and an "Issues" footer (upstream #19151). Run shows a warning icon while they exist. Severity is hardcoded, so red would need a revert of upstream code. The demo script's "four nodes go red" wording needs an update. Everything else in Flow 07 is unchanged.
- **Fork features removed, because upstream replaced the code that wired them in:**
  - the Media Assets tab in the editor's workflow tab bar, and dragging assets onto the canvas
  - the save-node asset tags widget and filename template variables (`@variable` autocomplete, the Filename Variables settings panel)
  - "Move to" for media assets, and the lightbox's compare mode
- **Dashboard Media tab (`MediaAssetsView`, Flow 01; `LocalMediaView`, Flow 06):** the browser check shows the masonry grid, the sidebar and the context menu working. Search with `@` filters, tags and favorites keep the fork's code; they were not clicked through. The tab now reads only the prototype provider. It uses upstream's `MediaAssetCard`, so:
  - cards are square crops, not natural aspect, and each card's filename line is partly covered by the next row
  - Flow 06 loses the card overlays: the dimmed "Relink" state on a missing reference and the hover source-path badge. The context menu keeps Relink, Remove from Comfy and Promote to cloud.
  - the Explore-feed creator chip is gone
  - restoring the fork's card is possible but needs its drag-preview code reworked; not done.
- **Lint and i18n changes the upgrade forced:**
  - New oxlint rules flag existing fork code. Those violations are baselined in `oxlint-suppressions.json`, upstream's own mechanism. The 29 `no-primevue-imports` entries are the largest group.
  - Color classes that never existed (`text-danger`, `text-success`, `text-warning`, `text-neutral`) now map to design-system tokens, so danger menu items and the delete hover turn red. Before, these classes rendered no color.
  - vue-i18n 11 needs `{'@'}` for a literal `@`.
  - The `gradient` Button variant is now `subscribe`: the local persona's Upgrade button is solid gold, not purple.
- Wiki link: none; prototype infrastructure.
- Promote? **no**.

---

## [2026-10-07] Tab bar: upstream tab styling, a cloud icon for Comfy Cloud, Recents open the editor

- **Decision: workflow tabs use upstream's tab components.** They use the same `Tabs` components and classes as the real editor's `WorkflowTab`, so hover, active state, the unsaved dot and the close button match. Home and the project pill keep the prototype's own design.
- **Decision: Comfy Cloud projects show a cloud icon in the pill.** It replaces the status dot. Comfy Cloud is always up, so a green dot said nothing. The dot stays for custom deployments (building, ready, asleep). The personal project keeps its person icon.
- **Decision: clicking a workflow card on Home opens it in the editor.** This covers Recents and search results. A draft opens in its provenance project, and any other workflow in its own project. The project switch works as before: the project's remembered tabs, else its drafts. A workflow that's already open reuses its tab.

Wiki is silent on what opening a recent does across projects. Promote? **maybe**, with the project-switch entry above.

---

## [2026-10-07] Project switch: the loading screen looks like ComfyUI's own

- **Decision: the project-switch transition is still a fake reload, styled as ComfyUI's real loading screen.** It uses the palette background and upstream's `LogoComfyWaveLoader` at the real splash size, so the Comfy logo fills with a rising wave. A muted "Opening {project}" caption stays under the logo, so the audience knows which project is loading.
- **The switch now lasts 2.4 s instead of 0.9 s.** Before about 1.2 s, the wave hasn't reached the logo, so a shorter screen showed only an outline. The demo build's clock starts when the switch ends, so the lock screen still opens at the start of the build.

---

## [2026-10-07] Project switch: no reload between projects on the same deployment

- **Decision: switching between projects on the same deployment is instant.** That includes every switch between two Comfy Cloud projects. The reload only exists because a deployment can load different frontend extensions. Moving to a project on a different deployment still shows the loading screen. Examples: Comfy Cloud to Coca-Cola Ad's Acme Studio, custom to custom, or into a new build.
- The rule is "same deployment", not "both on Comfy Cloud". So two projects sharing one custom deployment (`decisions/project-runs-on-shared-deployment.md`) also switch instantly. The demo data has no such pair yet.

---

## [2026-10-07] Project switcher menu: search, recent first

Willie picked direction H from the design canvas "Project switcher menu: search and cleanup" (https://claude.ai/artifact/PUXMPpzcUU8dJjRVmhmr9j), with two changes: the tick takes the place of the row's glyph instead of its own column, and the search field's corners nest inside the menu's.

- **Decision: the menu opens on a search field.** You can type at once. The search matches any part of a project's name and ignores case. The arrow keys move, Enter switches and Esc closes. When nothing matches, the menu says "No projects match “…”" and keeps **All projects** below.
- **Decision: recent projects first, then the rest A–Z.** Recent holds up to three projects, in this order:
  1. the current project;
  2. the projects you switched away from this session, newest first;
  3. the projects of your latest workflow edits. A draft counts for its provenance project.

  While you search, the two sections become one list, recent first.

- **Decision: one-line rows with no colour tile.** Each row leads with the pill's glyph: a person for My Workflows, a cloud for Comfy Cloud, or the deployment's status dot (blue with a halo while building, green when ready, grey when asleep). The current project shows a tick there instead. A custom deployment's row names the deployment on the right, or shows "Building · N min" while it builds. A Comfy Cloud row shows nothing more, because the cloud says it.
- **Decision: no current-project header.** The pill and the tick already show which project you are in.
- The menu follows upstream's menus and search field: `bg-base-background`, `searchInputVariants` at size md, and one highlight colour for hover and the keyboard. The corners nest: the menu is 12px, and the search field and rows are 8px at a 4px inset.
- When the menu opens, the current project's row is highlighted as well as ticked, because reka's listbox highlights the selected option. So ↓ then Enter takes you back to your last project.
- **Escape over the editor:** the reported bug did not reproduce on this base (`16432a5`). Escape closed both the old and the new menu in 11 headless Chromium cases, including the build lock screen and a canvas-focused open. The menu now also closes on Escape from its own keydown, as upstream's `NodeSearchTypeFilterPopover` does, so an editor listener on the document or window cannot swallow the key.
- Built with reka-ui `Listbox` and `ListboxFilter` inside the existing `PopoverContent`. Upstream's `SearchInput` wraps its own `Combobox`, so it cannot drive the list's arrow keys.
- The pill is unchanged.

Wiki: `decisions/project-switcher-in-tab-bar.md` says "The menu lists projects with where each runs"; this keeps that. The wiki says nothing about search or what "recent" means. Promote? **maybe**: add "search, recent first" to that decision.

---

## [2026-10-07] Editor Workflows sidebar is about the current project

Inside `/prototype`, the editor's left-sidebar **Workflows** tab is a prototype panel (`components/sidebar/ProjectWorkflowsSidebarTab.vue`). It replaces upstream's tab in place, with the same id, icon and toolbar position, while the prototype editor is mounted. Outside `/prototype` the real editor is unchanged.

- **Decision: sections and labels.** Willie chose the labels.
  - **Workflows:** your drafts for this project (the workflows in My Workflows whose provenance is this project). Flat, newest first.
  - **Project templates:** the project's published workflows. They keep the project's folders, as on the project page.
  - In **My Workflows**, there is one **Workflows** section: its own workflows, with folders. A draft whose provenance is another visible project shows under that project, not here. My Workflows has no Project templates section.
  - The wiki calls these sections "My drafts" and "Published" (`entities/project.md` §"Project surface (MVP)"), and the project page says "Drafts" and "Project templates".
- **Decision: other projects sit under "Other projects", collapsed by default.** It's a quiet disclosure with the count of workflows behind it. Opened, each other visible project is a folder holding its Workflows and Project templates; empty projects are left out. Copy options considered: "Show hidden", "Show other projects", "Workflows in other projects", "Browse other projects", "From other projects".
- **Decision: search covers other projects too, but their matches stay collapsed.** This project's sections show their matches; a section with none drops out. The "Other projects" count becomes the number of matches elsewhere, so "No matches in this project · Other projects 2" says where to look.
- **Decision: opening.** A workflow opens in the project it's listed under, using the same rule as Home's cards. A workflow from another project switches project, with the reload, and then opens it. A workflow already open reuses its tab. The active tab's workflow is highlighted.
- **Decision: a project switch resets the panel.** The search clears, Other projects collapses and folders close, as a real reload would.
- **Decision: upstream's sections are dropped.**
  - **Open:** the prototype tab bar already lists this project's open workflows.
  - **Bookmarks:** these are upstream file-path bookmarks, which the IA has no equivalent for.
  - **Browse:** the in-browser backend's `/userdata` is empty; the project sections replace it.
  - Refresh is also dropped, because there is no backend sync.

Wiki is silent on the editor's workflow browser. Promote? **maybe**: an addition to `decisions/project-switcher-in-tab-bar.md` ("the editor's Workflows panel is scoped to the current project; other projects one step away").

---

## [2026-10-07] Saved workflows open as distinct graphs

Every saved workflow opened in the real editor showed the same default graph, so switching tabs didn't read as switching workflows. `fixtures/demoWorkflowGraphs.ts` now gives each saved workflow one of three text-to-image setups — SDXL with a refine pass, Z-Image Turbo, HiDream + detail LoRA — picked from its id so it always opens the same way, framed by a group titled with the workflow's name, with the name in the prompt and Save Image filename prefix. Only core nodes and base models the in-browser backend serves, so nothing loads red. New blank workflows keep the default graph; matte_pass is unchanged.

Promote? **no** — demo content; no IA change. The wiki has no stance on what a workflow's graph contains.
---

## [2026-10-07] Flow 07: the incompatible-workflow dialog, redesigned on a canvas

Willie explored the "choose where it runs" dialog on a design canvas, <https://claude.ai/artifact/PQby9iCSzrR7WMvbsqnY11>. It shows today's screens and the full new flow with its branches. Of four directions (one sheet, a side panel, a canvas banner, a table of who runs it), only the one-sheet modal was worth keeping. Willie then refined today's dialog one step at a time instead. Built in `components/RunTargetDialog.vue` and its step components.

- **Decision: step 1 states the problem, then offers where to run it.**
  - The title is "This workflow can't run on {deployment}", with no workflow name and no eyebrow.
  - A compact table follows: "n missing node packs" and "n missing models", with the names.
  - The pitch paragraph and the "Switching reloads the page" note are gone.
- **Decision: step 1 has three states.**
  - **A deployment already runs it.** The main action is "Create project", on that deployment, with no build. The "Create a new project that runs on" picker also offers "A new deployment" (the button then reads "Create deployment"). Deployments that lack something are listed but can't be picked. "Open in another project" is a quiet footer button with a project chooser styled like the project switcher. In the demo, Acme Studio pipeline runs `matte_pass`.
  - **Nothing runs it, from a Comfy Cloud project.** The main action is "Create deployment", under "Create a new deployment for this workflow" and the three sell ticks. "Update an existing deployment ↗" is the quiet option, done on Platform.
  - **Nothing runs it, from a project on its own deployment.** The main action is "Update on Platform ↗" (for example Matte tests v7 → v8, which adds the missing pack). The note says every project on that deployment gets the release. "Create a new deployment instead" is the quiet option.
- **Decision: step 2 is Platform's build summary card.** It has "Suggested settings": Name, ComfyUI, Runtime, Open-source models, Partner models, Custom nodes, Python packages. The name edits in place. Every other row asks "Customise the build on Platform?" first, because the detail lives on Platform. The footer is Back, Build with your agent, and Next: deployment.
- **Decision: step 3 is Platform's deploy dialog, copied from live Platform.** Live Platform is newer than the platform repo's code. It has the GPU list with prices (RTX PRO 6000 $4.54, H100 SXM $6.23, H200 SXM $7.71, B200 $11.23), always-warm and max workers, Location, ComfyUI startup flags, the estimated cost (idle and full load, storage at $0.20/GB/mo) and the estimated time. The picked GPU becomes the new deployment's GPU. The old $0.89 RTX 5090 figure is gone.
- **Decision: a presenter control, "Demo: nothing runs it".** It drops `matte_pass` as if no deployment ran it, to show the two other step-1 states.
- **Changed but not redesigned:** the lock modal's eyebrow no longer says "Step 3 of 3"; it says "Building". The lock and ready screens are the next to refine.

Why: the dialog is the centrepiece of the 8 Oct customer demo. It should read as a choice with an obvious next action, and leave what Platform owns to Platform.

Wiki: `decisions/missing-nodes-choose-where-it-runs.md` (step 1 order, review, agent secondary, "Customise on Platform"), and `decisions/project-runs-on-shared-deployment.md` (a new project on an existing deployment; updating a deployment updates every project on it). Open question `dropped-workflow-other-deployment`: working answer, update the project's own deployment on Platform or make a new one. Promote? **yes**: update the decision page for the three states, the deployment picker (not a project picker), and Platform's summary and deploy steps.

---

## [2026-10-07] Flow 07: the runs-on picker like the project switcher; no graph while it builds

- **Decision: the "Create a new project that runs on" menu is built like the project switcher (Willie picked "B" of three on the canvas, <https://claude.ai/artifact/PQby9iCSzrR7WMvbsqnY11>).** It has a search field and one list with no section headers. The deployments that run the workflow come first, marked "Ready". The ones that can't are greyed out, with the reason on the right ("Missing 1 node pack", "Missing 2 packs, 2 models"). **+ Create a new deployment · About 20 min** is the row below the list. "A new deployment with everything it needs" read as clunky. The project chooser uses the same "Missing …" wording.
- **Decision: while a project's deployment builds, its graph is not shown.** The graph needs the deployment to load at all, so behind the build progress the lock screen shows the editor's sidebar and an empty canvas grid, both dimmed and inactive. Before, it showed a dimmed but visible graph; a flat grey screen in between hid the sidebar too.

Wiki: `decisions/build-locks-project-until-ready.md` says the node graph is disabled. This goes further: nothing of the graph shows until the deployment is ready. Promote? **yes**, as a refinement of that decision.

---

## [2026-10-07] Flow 07: a new project is named and shared before it's made

- **Decision: every path in the dialog that makes a project now passes a "New project" step.** It has Name, General access (Workspace or Restricted) and, when restricted, People with access. These are the dashboard's New project fields, now one shared component (`ProjectAccessFields.vue`). A chip says where the project will run: "● Runs on Acme Studio pipeline" or "+ Runs on a new deployment".
  - **On a deployment that already runs it:** step 1's **Create project** opens this step, and its **Create project** makes the project and reloads into it.
  - **On a new deployment:** step 1's **Create deployment** opens this step, and **Next: build** goes on to the build summary. The summary's Name row is now the deployment's name. It starts as the project's name.
- Before, the dialog made projects as restricted with nobody else in them, under a fixed name.

Canvas: <https://claude.ai/artifact/PQby9iCSzrR7WMvbsqnY11>, row "New step: name the project and choose who can access it". Wiki: `decisions/project-runs-on-shared-deployment.md` ("you name it and choose a backend for it"), and `concepts/three-level-permissions.md` for the access tiers. Promote? **maybe**: add "named and shared at creation, from any entry point" to the project entity page.

---

## [2026-10-07] Flow 07: the project opens only once its deployment is done

- **Decision: a new deployment builds in the background, and its project is named and opened only once the deployment is done.**
  - **Create deployment** turns the dialog into the build's progress. You stay in the project you were in.
  - **Keep working** closes the dialog. A "● Building Matte R&D · 18 min" chip in the tab strip opens it again.
  - When the deployment is done, the dialog comes back on the New project step: name and access. **Create project** opens the project, with the "ready" toast.
- **The build no longer locks a project.** No project exists until the deployment runs, so the full-screen lock is gone.
- The New project step now always names a project on a deployment that runs the workflow. On the new-deployment path it comes after the build, not before the build summary.
- Before, **Create deployment** made the project at once and reloaded into it, locked behind the build.

Supersedes "the build locks the project" in the entries above. Wiki: `decisions/build-locks-project-until-ready.md` says you shouldn't use the project until it's ready. This keeps that rule by not making the project until then. Promote? **yes**: update that decision page to say the project is created once the build is done.

---

## [2026-10-07] "My Workflows" is now "Personal"

- **Decision: the personal project is called "Personal" everywhere in the prototype**: the project switcher, the sidebar, page titles, menus ("Save to Personal", "Fork to Personal") and toasts.
- Reason: projects hold more than workflows (assets, outputs, models), so "My Workflows" undersold what the personal project holds and read as a workflow list.
- Code names (`drafts`, `isDrafts`, `saveToMyWorkflows`) are unchanged. One upstream ComfyUI string (`mediaAsset.actions.promoteToCloudFallbackDestination`) still says "My Workflows", because it sits outside the prototype.

Wiki: `decisions/drafts-as-default-private-project.md` names the per-user project "Drafts". Promote? **yes**: settle the user-facing name as "Personal" there.

---

## [2026-10-07] Demo controls fold into one "Demo" pill

The presenter bar (persona `<select>` + "Demo: drop incompatible workflow" + "Demo: nothing runs it" + "Reset demo") sat bottom-right as a wide strip, covering the editor's fit / zoom / minimap / links toolbar. It's now a single small **Demo · {persona}** pill bottom-left, just past the sidebar, opening a menu: personas as a checked list, then the two drop actions, then Reset demo. `PersonaSwitcher.vue` folded into `DemoControls.vue`. Still shown only on the dev server and the deployed prototype.

Promote? **no** — presenter tooling; no IA change.

---

## [2026-10-07] Project page: three header variants, environment on the page, settings → Projects

Scope is the dashboard only. Flows where a dropped workflow does not fit the project stay as they are.

**Three project-page headers, picked by a presenter switcher.** "Project page: Tabs / Quiet / Rail" sits beside the persona toggle and survives a reload.

- **Tabs.** The environment chip sits next to the title. Workflows, Media, Usage and Settings are a tab strip under it. Media is another surface, so its tab opens Media assets instead of switching the body.
- **Quiet.** No tabs. One meta line under the title: environment, people, workflow count. Media and Settings are icon buttons, and Settings opens a sheet on the right.
- **Rail.** Title and "+ Workflow" only. A right-hand rail holds Runs on, Access with Share, Usage, Media assets and All settings.

**The environment shows on the project page in every variant**, as a dot and a name. The status word shows only when it is not ready ("asleep", "building · 12 min"), so a healthy project reads as one name. Comfy Cloud shows too: the ask was to make the environment and its status explicit.

**Project settings stay minimal and link out.** On the project page, settings are three rows: Runs on, Access, Usage. "All settings" opens the workspace settings page with that project selected. The old Deployment section (GPU, warm time, Manage on Platform, Change deployment) is gone from the project page.

**Workspace settings gains a Projects page.** A list of every project the viewer can open, with where it runs, people and workflow count. Picking one opens a panel on the right with the same rows, "Change" for admins, and "Open project". Modeled on the Claude Console Workspaces page, where their workspaces map to our projects.

Wiki link: `concepts/custom-comfy-cloud.md` step 3 ("in the settings you can see where it's deployed") now points at the project page rows and the settings Projects panel. `decisions/opinionated-roles-no-permission-matrix.md` still holds: only admins see Change.

Open question: which header to keep. The switcher exists so Willie can compare them on the deployed preview.

Promote? **maybe**, once a header is picked.

---

## [2026-10-07] Project page: Tabs chosen; credit attribution per member

Pablo picked the Tabs header. The Quiet and Rail variants stay behind the switcher for now.

- **Media assets is a button again, not a tab.** It opens its own top-bar tab, so a tab in the project strip misled: the strip now reads Workflows · Usage · Settings.
- **The Usage tab attributes credits per member.** A donut for the share and a table with runs, credits and a limit bar per member. Rows come from the same sample records as workspace Usage, filtered to the project. API keys and other unattributed runs are their own row.
- **Per-member limits are per project.** `ProjectMember.creditLimit` is new and optional. The bar reads "{used} of {limit}" and turns amber at 80% and red at 100%. A member without a project limit falls back to their workspace limit, and otherwise shows "No limit". The Matrix seeds Alex over his limit so the red state is visible.
- Reason: enterprises ask for clear credit attribution first. The project page is where a lead looks for it, and a limit bar answers "who is about to run out" without a second screen.

Wiki link: `entities/workspace.md` §Identity (workspace stays the billing entity; this is attribution only). Open question dependency: `open-questions.md#per-member-credit-limits`, which only proposes workspace-level limits. The per-project cap is a prototype extension to feed back.

Promote? **maybe**, if per-project caps survive review.

---

## [2026-10-07] Project page: Tabs is final; Quiet and Rail removed

- **Decision: the Tabs header is the project page.** The presenter switcher and the Quiet and Rail variants are deleted, with the side sheet, the rail rows and the switcher's store state. One header, no toggle.
- Reason: Pablo picked Tabs after comparing the three on the dev server. Dead variants cost more to keep in sync than they tell.

Promote? **no**: the earlier "Tabs chosen" entry already carries the decision.

---

## [2026-10-07] Project settings for a studio; Members tab; usage ranges on the workspace page

- **Decision: project settings are six sections, full width.** General (name, colour), Environment (runs on, Change for admins), Access (general access, people with a link to Members), Credits (monthly budget, default limit per member), Policies (follows the workspace, link to workspace policies) and Delete. Owners and workspace admins edit; everyone else reads.
- **Decision: a Members tab on the project page.** It is the sharing panel inline, after Settings. The Share button in the header keeps opening the same panel as a dialog.
- **Decision: project credit caps.** `Project.monthlyCreditBudget` and `Project.defaultMemberCreditLimit` are new and optional. A member's limit resolves project member → project default → workspace limit. The Matrix seeds a budget of 12,000 and a default of 2,000.
- **Decision: the workspace Usage page uses the same range picker as the project Usage tab**, and its table sits on the page without an outer box.
- **Sidebar: Environments moves next to Media assets**, out of the Create group. An environment is something you pick, not something you make here.
- Not built, logged as options: archive a project when a production wraps; output storage and retention; naming rules for versions; a default template for new workflows; notifications per project.

Wiki link: `entities/project.md`, `concepts/three-level-permissions.md`. Open question dependency: `open-questions.md#per-member-credit-limits` (workspace-level only in the wiki; project caps are a prototype extension).

Promote? **maybe**, with the per-member limit entry.

---

## [2026-10-07] Project settings as a bento grid; environment sheet

- **Decision: the settings sections are cards in a two-column grid.** Same six sections, each with its title and hint at the top and its rows below.
- **Decision: the environment row opens a sheet on the right.** Two tabs:
  - **Contents:** the custom nodes and models the build pins. On Comfy Cloud there is nothing pinned, so it shows "All that the workspace allows" with the counts from the workspace policies. The intro says projects inherit the workspace policies and can only narrow them.
  - **Status:** the status chip, build, GPU, keep-warm time and the projects on it. Custom environments link to the Environments page.
- Reason: the environment is the setting a studio asks about most, and its contents are what decide whether a workflow runs. The sheet keeps that one click from settings without leaving the project.

Wiki link: `concepts/custom-comfy-cloud.md`, `decisions/custom-nodes-as-configuration.md`. The wiki is silent on whether a project may narrow the workspace allowlists; the sheet states the inheritance rule as the working answer.

Promote? **maybe**: the inherit-and-narrow rule, once reviewed.

---

## [2026-10-07] Project settings: one column, no dividers, a thumbnail; Change environment is real; Policies card dropped

- **Layout:** the cards stack in one column with a lifted background. Rows inside a card have no dividers.
- **General shows the project thumbnail**, the same four-tile preview as the project card, instead of the colour swatch.
- **Change environment opens a picker.** Comfy Cloud and the workspace's custom environments as radio rows, each with its GPU and how many projects use it. "New deployment" opens the existing create dialog, and the new one is selected on return. Switch sets `project.deploymentId`. The same picker serves the settings Projects panel.
- **The Policies card is gone.** The rule lives in the environment sheet, whose Contents tab links to Workspace policies.

Wiki link: `decisions/project-runs-on-shared-deployment.md`. The wiki does not say who may move a project between deployments; the picker shows for owners and workspace admins, like the rest of the settings.

Promote? **no**.

---

## [2026-10-07] Workflow cards open on double click

- **Decision: a double click opens a workflow in the editor**, in its project: a draft's provenance project, else its own. A single click no longer opens anything, and a shift, cmd or ctrl click still selects. Published cards keep their buttons, since opening one means checking it out first.
- Reason: Pablo asked for file-browser behaviour on Home. It also stops accidental editor loads while scanning cards.
- Also this round: the environment sheet lists Comfy Cloud's allowed packs and models by name, its tabs show only a bottom stroke, and admins get an "Edit deployment" button that hands off to the Developer Platform.

Promote? **no**.

---

## [2026-10-07] Media assets live in the dashboard, with filters in one row

- **Decision: the sidebar's Media assets opens a dashboard view**, like Projects or Environments, instead of a workbench tab with its own sidebar. The project page's Media assets button and the project context menu land there with the project filter set.
- **Decision: one row of filters.** Modality tabs with counts (All, Images, Videos, 3D, Audio), a Project dropdown and a Favorites toggle. Counts follow the other two filters, so a tab says what it would show.
- **Decision: cards carry the file name and "project · size · age"** under a square preview. Video gets a play badge, audio and 3D an icon in place of a preview. A star on hover favorites the asset; favorites live in memory.
- **Fixture:** media assets now point at the workspace's real projects, carry a modality and a size, and include a few videos, audio files and a 3D model. The old notice dialog is gone.

Wiki link: `entities/media-file.md`, `entities/output.md`. The wiki is silent on favorites; working answer: per viewer, not shared.

Promote? **maybe**: the "media as a dashboard view" shape, once Willie has seen it.

---

## [2026-10-07] Project cards show members; Edit deployment opens the deployment dialog

- **Project cards** show the member count instead of the workflow count, and Comfy Cloud gets a cloud icon in place of the status dot, matching the tab-bar pill.
- **Edit deployment opens the editor's build steps** (Willie's "Create a deployment", merged from `mvp-scope-cut`): the build summary with the deployment's own name, version, runtime, models and packs under "Current settings", then Platform's deploy dialog with its GPU preselected, then the build's progress. Back closes instead of returning to the workflow choice.
- **Save and rebuild bumps the release and runs the same background build.** The deployment shows "building · N min" wherever it appears and the tab strip's Building chip reopens the progress. When done it turns ready and the dialog closes; unlike a new deployment it does not ask to name a project.
- `Deployment.comfyVersion` and `Deployment.runtime` are new and optional; the summary falls back to the build defaults.

Wiki link: `concepts/custom-comfy-cloud.md`, `decisions/build-locks-project-until-ready.md`.

Promote? **maybe**, together with the environment sheet.

---

## [2026-10-07] Custom nodes modal: Platform's table, with pinned versions

- **Decision: the editor's extensions button opens a Custom nodes modal for the current project's deployment.** Its table follows Platform's Builder custom nodes step (Comfy-Org/platform `pages/profile/builds/new.vue`): pack (linked to its GitHub repo), publisher, installs, GitHub stars, version, then status or action. Counts read like the registry's ("4.5M", "1.9k"). A private pack shows a Private badge and "—" for installs and stars.
  - Installed packs come first, then the ones the deployment can add, then a collapsed "Not allowed in {workspace}" group from Settings › Policies. Section headers for installed and available were dropped at the operator's request.
  - **Versions:** every pack has a picker. **Follow latest** takes the newest release at each rebuild. Picking a release **pins** it. Badges are uncoloured: "latest", or "pinned" with a pin icon.
  - **Installing a pack or changing an installed pack's version is a new release of the shared deployment.** A confirm says "Adds" or "Changes", v3 → v4, and lists every project on the deployment. Rebuild builds in the background. The tab strip shows "Building Acme Studio pipeline v4", the modal reads "Adding in v4" or "Changing in v4", runs stay on v3, and a toast says when v4 is ready.
  - **Members** see "Ask an admin" in place of Install (open question: who can install). **Comfy Cloud projects** see the list read-only, with a note that packs can't be added to a shared deployment.
- Not built from the canvas: the V2 (list + detail) and V3 (tabs, batched changes) variations, pinning a commit hash, and a full build-progress dialog for a rebuild.
- Fixture fix: Acme Studio pipeline listed `comfyui-impact-pack`, but the policy catalog calls the pack `impact-pack`, so the editor treated Impact Pack as not allowed. It now uses `impact-pack`.

Canvas: <https://claude.ai/artifact/PQby9iCSzrR7WMvbsqnY11>, section "Custom nodes modal: three variations" (V1). Wiki: silent on pack versions, pinning and stars; `decisions/custom-nodes-as-configuration.md` (packs are allowlist configuration); `decisions/project-runs-on-shared-deployment.md` (updating a deployment updates every project on it). Open: does "Follow latest" rebuild by itself when a pack releases? Built: no. Promote? **maybe**: record that a pack version change is a release of the deployment.

Update (same day): **packs install in batches.** Each row ends in a checkbox (an installed pack shows a plain check, a blocked one a lock). The footer's **Install N packs** button asks once and builds every ticked pack into one release. Members get **Ask an admin for N packs**. A version change on an installed pack still confirms on its own. Notes under a pack's name show "8.29.1 available", "Adding in v4 · about 16 min" or "Requested from admins".

Update (same day): **the table now matches Platform's layout.** Search sits next to Status, License and Sort dropdowns. The columns are Pack Name, Publisher, Installs, Stars, Version, License and Install, in a bordered table with a shaded header. Packs sort by one key (installs by default) with no groups, and blocked packs show dimmed in place with a lock. A version shows a pin icon when pinned, and an up arrow when a newer release is out. The "Review policies" link was dropped; the lock's tooltip points to Settings › Policies.

---

## [2026-10-07] Edit deployment end to end: items, impact, update or fork

- **Decision: models and custom nodes are edited inside the build summary.** The two rows open a list: remove with the x, add from what the workspace policies allow. Projects inherit the workspace allowlists and can only narrow them, so nothing outside them can be added. The ComfyUI version is a select in the same summary. Nothing applies until the deployment rebuilds.
- **Decision: an impact step before any rebuild.** It names the projects on the deployment and lists the changes (release, version, GPU, packs and models added or removed), then offers three ways out: Update deployment, Create a new deployment instead, Cancel.
- **Decision: "Create a new deployment instead" forks.** A new deployment with the edits and release 1, and only the project the edit was opened from moves to it. The others stay on the original.
- Reason: one deployment backs many projects, so a studio admin needs to see the blast radius before cutting a release, and a way to try a change on one project without touching the rest.
- Fixture: the Acme pack and model ids now match the policy catalog, so the picker's names line up.

Wiki link: `decisions/project-runs-on-shared-deployment.md`, `decisions/custom-nodes-as-configuration.md`. Open question: `open-questions.md#dropped-workflow-other-deployment` asked "update or branch"; this gives both at the same step.

Promote? **maybe**: the impact step and the fork rule.

---

## [2026-10-07] Edit deployment: its own dialog, two modes, a change counter

- **Decision: Edit deployment is its own dialog (`EditDeploymentDialog.vue`), apart from the editor's "Create a deployment" steps.** The create flow's copy ("Next: deployment", "Create deployment") described creating, and the two flows need to change on their own.
- **Decision: two modes, switched at the top: Configuration (name, ComfyUI version, models, custom nodes) and Machine (GPU, keep warm).** Each segment counts its pending changes. A changed row carries a "Changed" badge.
- **Decision: the primary CTA is off until something differs from the live deployment.** It reads "Nothing changed yet", then "Review N changes". Review shows the projects on the deployment and the diff, then: Cancel · Create a new deployment and use it for this project · Update the existing deployment.
- Alternatives, mocked at `/prototype/design/edit-deployment` (`pages/EditDeploymentOptions.vue`): A a three-step stepper, B one page with both cards, C "What do you want to change?" tiles first. D (segmented) is built and was picked on 2026-10-07. Notes: <https://claude.ai/code/artifact/e813e766-0bcc-4a57-9968-ff2ee122f792>.

Wiki link: `decisions/project-runs-on-shared-deployment.md`. Promote? **maybe**: the review step's three ways out.
