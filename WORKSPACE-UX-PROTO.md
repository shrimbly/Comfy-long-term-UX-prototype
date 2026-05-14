# workspace-UX-proto — ComfyUI IA prototype

This repository is a **fork of `Comfy-Org/ComfyUI_frontend`** used to prototype user flows for the new ComfyUI information architecture. It is a companion to the IA wiki at `../IA_Plan/`.

`AGENTS.md` describes the upstream codebase conventions (still applicable here). **This file** describes the **prototype-specific** conventions: where prototype code lives, how to use the wiki, mock-data approach, persona toggle, cross-referencing, and the feedback loop back to the IA wiki.

---

## 1. The IA wiki — authoritative source for "what to build"

The wiki lives in a separate sibling repo at `../IA_Plan/`. Launch Claude Code in this directory with `--add-dir ../IA_Plan` so the wiki is readable.

```bash
claude --add-dir ../IA_Plan
```

The wiki is the **authoritative source** for entity definitions, permission rules, persona behaviour, and product decisions made so far. Always read it before doing IA-related work — and **do not modify it from this repo** (wiki edits happen in `IA_Plan`).

### 1.1 Wiki layout

| Path                                | What's there                                                                                                                              | Authority                                                                                                             |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `../IA_Plan/wiki/index.md`          | Table of contents — start here                                                                                                            | n/a                                                                                                                   |
| `../IA_Plan/wiki/decisions/`        | Settled positions (ADR-style). **Authoritative.**                                                                                         | Follow without re-litigating                                                                                          |
| `../IA_Plan/wiki/entities/`         | Entity definitions (User, Workspace, Project, Asset, Workflow, etc.)                                                                      | Authoritative for fixture shape, naming, relationships                                                                |
| `../IA_Plan/wiki/concepts/`         | Cross-cutting ideas (three-level-permissions, sharing-vs-publishing, local-vs-cloud-integration, instance-management, personas-and-flows) | Authoritative for rules / models                                                                                      |
| `../IA_Plan/wiki/open-questions.md` | Unresolved items, each with a `Proposed:` block                                                                                           | **Non-authoritative.** Use Proposed answers as working stance; record dependencies in `prototype/design-decisions.md` |
| `../IA_Plan/sources/`               | Raw Notion / CEO / meeting captures                                                                                                       | Generally don't read directly — the wiki has synthesized these. Open only for verbatim quotes                         |

### 1.2 Current decisions (snapshot — re-check `../IA_Plan/wiki/decisions/`)

- `drafts-as-default-private-project` — every workspace auto-creates a per-user Drafts (flavor of Private tier). New workflows save there.
- `fork-vs-copy-one-operation` — settle on "fork"; retire "copy" in product strings.
- `custom-nodes-as-configuration` — allowlist / config items, not assets.
- `prompts-mvp-internal-future-asset` — MVP = workflow-internal; saveable Prompt asset is post-MVP.
- `asset-bundling-on-share-is-mandatory` — sharing inherently bundles all dependencies.
- `install-is-runtime-not-permission-entity` — Install is runtime, not in the IA permission model. Personal workspace ≡ local workspace. Unauthenticated-local mode exists.
- `cloud-only-permissions` — permissions only constrain cloud assets; local files always accessible.

### 1.3 How to use the wiki for prototype tasks

| Task                            | Entry point                                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Building a screen for persona X | `concepts/personas-and-flows.md` — find X, see permission position + what they see/do                                |
| Where does a saved workflow go? | `decisions/drafts-as-default-private-project.md`                                                                     |
| Wiring permissions logic        | `concepts/three-level-permissions.md`                                                                                |
| Modeling fixture data           | `entities/<entity>.md` for shape + relationships                                                                     |
| About to invent a behavior      | Search `open-questions.md` for the topic. If a `Proposed:` exists, use it as the working answer + log the dependency |
| Sharing flow                    | `concepts/sharing-vs-publishing.md`                                                                                  |
| Local/cloud behavior            | `concepts/local-vs-cloud-integration.md`                                                                             |
| Multi-workspace UX              | persona #6 in `concepts/personas-and-flows.md`                                                                       |

### 1.4 Don't

- Don't modify the wiki from this repo.
- Don't duplicate wiki content into this file or anywhere else in this repo — keep this as a navigation guide so the wiki stays the single source of truth.
- Don't treat open questions as decisions.
- Don't paraphrase wiki content from memory — re-read the relevant page if it's been more than a session.

---

## 2. Prototype code conventions

### 2.1 Sidecar layout

All prototype code lives under **`src/prototype/`** and is reachable only via the `/prototype` route prefix. The real ComfyUI editor at all other routes is left untouched so upstream merges stay clean.

```
src/prototype/
  pages/         page-level prototype views (one per flow)
  components/    prototype-only components (built on existing design system)
  stores/        Pinia stores backed by fixtures
  fixtures/      seed datasets, one set per persona
  router.ts      prototype routes (mounted under /prototype)
  index.ts       barrel export
```

Mount the prototype routes from `src/router.ts` under a `/prototype` prefix. Lazy-load the page chunks so the prototype doesn't bloat the main bundle.

### 2.2 Mock data

The real ComfyUI backend doesn't yet have workspaces / projects / drafts / per-asset roles. The prototype runs entirely against **in-memory Pinia stores** seeded from `src/prototype/fixtures/`. **No mock HTTP layer.**

- Fixture shape must match wiki entity definitions exactly. If you find yourself adding a field that isn't in `../IA_Plan/wiki/entities/<entity>.md`, either (a) the field is wrong, or (b) the wiki needs updating — record it in `prototype/design-decisions.md`.
- One fixture set per persona (see persona toggle below). Each set should be minimal but complete enough to demonstrate the dashboard reshape.

### 2.3 Persona toggle

The prototype's signature dev affordance: a switcher that picks a persona from `../IA_Plan/wiki/concepts/personas-and-flows.md` and loads the corresponding fixture set. Surface only when `import.meta.env.DEV`.

Personas to support, in priority order:

1. **Solo creator** — default state for every new account; one workspace, just them.
2. **Workspace Admin** — owns a team workspace, billing payer.
3. **Workspace Member** — invited team collaborator.
4. **Project Collaborator** — external invitee, workspace Guest + project Collaborator.
5. **Asset-only Guest** — external invitee, asset-level only.

### 2.4 Cross-reference convention

Each prototype page or non-trivial component starts with a header comment block linking the wiki entries it implements. Example:

```ts
// Implements:
//   concept:  ../IA_Plan/wiki/concepts/personas-and-flows.md
//             — Solo Creator, Workspace Admin
//   decision: ../IA_Plan/wiki/decisions/drafts-as-default-private-project.md
//   open-q:   ../IA_Plan/wiki/open-questions.md#drafts-scope
//             — working: per-workspace
```

This keeps the prototype legible as a literal implementation of the IA.

### 2.5 Existing design system

The upstream uses **Tailwind 4** + a component library under `src/components/`. Reuse components and tokens; **do not invent a parallel styling system** for the prototype. If you need a component that doesn't exist upstream, build it inside `src/prototype/components/` using the same tokens.

---

## 3. Prototype documentation (`prototype/` directory)

Markdown docs specific to the prototype live at the **repo root** under `prototype/` (not under `src/`).

| File                            | Purpose                                                                                                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prototype/INDEX.md`            | Every prototyped flow: route, file path, wiki entries implemented                                                                                                                                    |
| `prototype/design-decisions.md` | Append-only log of design decisions made while building. Cross-ref each entry to wiki open questions. When something settles enough to feed back to the wiki, raise a new decision page in `IA_Plan` |
| `prototype/flows/<NN-name>.md`  | One file per flow: actor, entry point, step-by-step, branches, surfaces touched, edge cases, fixture state required                                                                                  |

### 3.1 Feedback loop back to the wiki

Prototype work will surface design decisions the wiki hasn't made yet. When that happens:

1. **Make a working decision** to keep the prototype moving.
2. **Log it** in `prototype/design-decisions.md` with a cross-ref to the relevant wiki open question (or note that the wiki is silent).
3. **Periodically** review the design-decisions log; promote settled items to formal decisions in `../IA_Plan/wiki/decisions/`.

Do not block on missing wiki decisions — record + continue.

---

## 4. Iteration tactics

- **Vite HMR** — `pnpm dev` (see `AGENTS.md` for full command list)
- **Storybook is already in the project** (`pnpm storybook`) — use it for component-level iteration when wiring full pages is too heavy.
- **Persona toggle** — once built, this is the fastest way to see flow shape across personas without log-in/out.

---

## 5. Upstream sync

This repo is a fork of `Comfy-Org/ComfyUI_frontend`. Remotes:

- `origin` → `shrimbly/workspace-UX-proto` (this fork)
- `upstream` → `Comfy-Org/ComfyUI_frontend`

Pull upstream periodically:

```bash
git fetch upstream
git merge upstream/main
```

The sidecar `src/prototype/` directory keeps merge conflicts minimal — upstream changes touch `src/*`, not `src/prototype/`.

---

## 6. When in doubt

- **Wiki has the answer**: follow it.
- **Wiki has a `Proposed:`**: use it, log dependency in `prototype/design-decisions.md`.
- **Wiki is silent**: make a working decision, log it in `prototype/design-decisions.md`, continue.
- **Wiki disagrees with itself**: stop and ask. (Shouldn't happen often — open questions track known conflicts.)
- **Codebase convention is unclear**: read `AGENTS.md` and `docs/guidance/*.md`.
