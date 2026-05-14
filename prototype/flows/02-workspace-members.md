# Flow 02 — Workspace members surface

## Actor

- **Workspace Admin** — full surface (`../IA_Plan/wiki/concepts/personas-and-flows.md#2-workspace-admin-team-owner`)
- **Workspace Member** — read on Permissions tab, write on Members + Pending tabs (`../IA_Plan/wiki/concepts/personas-and-flows.md#3-workspace-member-team-collaborator`)
- Hidden for Solo personas (cloud + local), Project Collaborator, Asset-only Guest

## Entry point

Sidebar → WORKSPACE group → "Members". Active view = `{ kind: 'members' }`.

The sidebar group `WORKSPACE` only renders when the active workspace `tier === 'team'`, so this surface never appears for Solo personas (their workspaces are `personal`).

## Surfaces

`src/prototype/views/MembersView.vue` — three tabs:

1. **Members** — table (avatar, name + "(You)" marker, email, role pill, join date, row actions).
2. **Pending** — table of outstanding invites (email, invited-as role, invited-by, date, Resend/Revoke).
3. **Permissions** — per-role delegation matrix; Admin / Member / Guest columns. Admin column is always-on (lucide check), Guest is always-off (lucide minus), Member column is the only interactive toggle. Read-only when viewer is not an Admin.

Supporting components:

- `components/InviteMemberDialog.vue` — modal; email + role picker.
- `components/MemberRowActions.vue` — per-row popover (change role, remove). Role transitions across the Admin boundary are gated to Admins; Members can only act on Guests + Members.
- `components/PermissionsMatrix.vue` — the delegation grid.

## Step-by-step

### Inviting

1. Click "+ Invite" → `InviteMemberDialog` opens.
2. Enter email; pick a role (Admin only visible to Admin viewer).
3. Submit → invite is appended to `fixture.pendingInvites`; active tab auto-switches to **Pending** so the new row is visible.

### Changing a member's role

1. Hover row → click ⋯ → popover with role change options + Remove.
2. Pick a role → `personaStore.changeMemberRole(memberId, role)` mutates `fixture.members`. UI re-sorts (Admins → Members → Guests).

### Removing a member

1. ⋯ → "Remove from workspace" → `window.confirm` → on accept, member is removed and `currentWorkspace.memberCount` decremented.

### Editing the delegation matrix

1. Switch to **Permissions** tab.
2. Toggle a checkbox in the Member column → `personaStore.setRoleGrant(capability, value)` flips the grant on `fixture.roleGrants`.
3. When viewer is a Member, the entire matrix is rendered read-only with a hint above the table.

## Branches / decision points

| Branch                          | Behavior                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------ |
| Viewer role = Admin             | Full read/write; can invite Admins; can promote across Admin boundary          |
| Viewer role = Member            | Can invite Member/Guest; can act on Member↔Guest; cannot edit matrix           |
| Viewer role = Guest             | Whole surface hidden by sidebar gating; defensive: header has no Invite button |
| `tier === 'personal'` workspace | Sidebar hides the WORKSPACE group; view unreachable                            |

## Fixture state required

- `members[]` populated with diverse roles (≥1 Admin other than viewer for Admin↔Member demo, ≥1 Guest)
- `pendingInvites[]` with at least one invite from a non-current-user (exercises the inviter resolver)
- `roleGrants` with a mix of true/false so the matrix renders both states
- A second workspace where the viewer is a Guest (exercises hide-Invite-for-Guest branch — admin fixture already has Acme Studio as guest)

`fixtures/admin.ts` supplies 12 members (2 Admins, 8 Members, 2 Guests), 3 pending invites, and a default grant set.
`fixtures/workspace-member.ts` reuses the admin workspace data but flips `currentUser` to Alex Carmoid and `currentUserRole` to `'member'` — same workspace, member's vantage.

## Wiki cross-refs

- `concepts/three-level-permissions.md` — workspace-level capabilities, delegation layer.
- `concepts/personas-and-flows.md` — personas #2, #3; "Send invite" cross-cutting flow.
- `entities/workspace.md` — workspace role tables.

## Open questions surfaced or addressed

- `delegation-surface-in-ui` — the Permissions tab **is** the proposed surface. Working answer in this prototype: per-role baseline grid (Admin always on, Guest always off, Member toggleable). No per-member overrides in this pass.
- `publish-direct-link-admin-gate` — surfaced as two of the five delegable capabilities (`publish-direct-link`, `submit-to-hub`).
- `single-admin-or-many` — prototype stance: **multiple Admins allowed**. The Members table sorts Admins first; the role-change menu offers Admin promotion to other Admins. Persona note: this contradicts the workspace-permissions doc line "only one admin can exist at a time" — flagged for PM resolution.
- New question raised: should the Permissions tab support per-member overrides on top of the role baseline? Persona #7 in the wiki implies yes ("two Members, different action surfaces") but Proposed answer for `publish-direct-link-admin-gate` is per-role only. **Currently: per-role only** — see design-decisions entry 2026-05-13.

## Edge cases handled

- Member can never act on themselves (`canActOn` returns false for current user).
- "Remove" uses `window.confirm` — placeholder for a real destructive dialog; sufficient for the prototype.
- Empty pending invites renders a dashed-border empty state.
- Members fixture is empty for solo-local — view is unreachable in that persona anyway.

## Not in this pass

- Pending-invites count badge in the sidebar.
- "You are about to lose admin access" guardrail when the sole Admin demotes themselves.
- Billing / ownership-transfer warning UX (separate flow — referenced by `personas-and-flows.md` flow 11).
- Per-member credit limit field (wiki: mechanism TBD).
- Per-member capability overrides on top of the role baseline.
