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

Promote? **yes — high priority.** This is a major direction change that must go back to the wiki as a formal `wiki/decisions/mvp-scope.md` once the team confirms, with the four superseded decisions marked accordingly. Confirm before propagating.
