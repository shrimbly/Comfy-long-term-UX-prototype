# Prototype flow index

Catalog of every flow being prototyped here. Each entry links the live route, the source file(s), and the wiki entries the flow implements.

When adding a new flow:

1. Add a row to the table below.
2. Add a plan in `prototype/flows/<NN-name>.md`.
3. Add the cross-reference header comment at the top of the source file(s) (see `WORKSPACE-UX-PROTO.md` §2.4).

## Flows

| #   | Flow                                                                                                                | Route                                                             | Source                                                                                                               | Wiki entries implemented                                                                                                                                                      | Status      |
| --- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 01  | Dashboard / home (persona-driven)                                                                                   | `/prototype/dashboard`                                            | `src/prototype/pages/Dashboard.vue`                                                                                  | `concepts/personas-and-flows.md`, `decisions/drafts-as-default-private-project.md`, `entities/workspace.md`, `entities/project.md`                                            | in progress |
| 02  | Workspace members (list, invite, pending, delegation matrix)                                                        | `/prototype/dashboard` → sidebar → Members                        | `src/prototype/views/MembersView.vue` + `components/{InviteMemberDialog,MemberRowActions,PermissionsMatrix}.vue`     | `concepts/three-level-permissions.md`, `concepts/personas-and-flows.md` (#2, #3), open-q `delegation-surface-in-ui`, `publish-direct-link-admin-gate`, `single-admin-or-many` | in progress |
| 03  | Shared with me (cross-workspace tray for guest personas)                                                            | `/prototype/dashboard` (guest persona) → sidebar → Shared with me | `src/prototype/views/{SharedWithMeView,SharedAssetView}.vue`, project members panel in `ProjectDetailView.vue`       | `concepts/personas.md` (#4, #5), `concepts/prototype-test-coverage.md`, open-q `zero-state-for-asset-only-guest`, `fork-destination-in-host-workspace`                        | in progress |
| 04  | Workspace settings — Identity, Allowlists, Data/training, Hub queue, Billing, Credit limits, Ownership, Danger zone | `/prototype/dashboard` → sidebar → Settings                       | `src/prototype/views/SettingsView.vue` + `components/{AllowlistEditor,BillingSection,MemberCreditLimitsSection}.vue` | `entities/workspace.md` §"What it contains" + §"Lifecycle", `concepts/three-level-permissions.md` §"Workspace level" + §"Delegation layer", open-q `per-member-credit-limits` | in progress |

_(Add rows as flows are built. The dashboard is the anchor — every other flow gets cheap state from it via the persona toggle.)_

## Roadmap (from IA wiki review)

Priority candidates beyond the dashboard + members surface, per `../IA_Plan/wiki/concepts/personas-and-flows.md`:

- **03 — First-run as Solo Creator** — signup → first workflow saved in Drafts → first run
- **04 — Solo → Team transition** — invite collaborator → promote Drafts asset → visibility tier pick → invitee accepts
- **05 — Accept invite as Project Collaborator** — narrow workspace view + gray-out
- **06 — Asset Share dialog** — invite-by-email + role, mandatory bundling disclosure
- **07 — Project members panel** — project-scoped invite + role management inside ProjectDetailView
- **08 — Fork a workflow as a Guest** — lands in actor's Drafts in host workspace
- **09 — Run a Hub workflow** — current-workspace prominence, credit attribution
- **10 — Switching workspaces** — Figma-style left-panel switcher

Pick the next flow based on what the dashboard surfaces as the highest-friction next-click.
