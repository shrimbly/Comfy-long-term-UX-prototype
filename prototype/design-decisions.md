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
