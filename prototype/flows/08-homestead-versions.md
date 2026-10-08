# Homestead: V1, V2 and V3

Source: [Project Homestead PRD](https://app.notion.com/p/3f16d73d3650819f894bed7f77313295). V2/V3 are concept previews.

## Run locally

```sh
pnpm install --frozen-lockfile
pnpm dev:homestead
```

Open http://127.0.0.1:5178/prototype/homestead?v=1. V1 and V2 open `matte_pass` directly in the Desktop editor; V3 opens the original Projects view; returned deployment URLs still open their Cloud environment. Branch: `homestead-prototype`, based on `mvp-scope-cut`.

## Built on the existing prototype

The Homestead route is a child of `PrototypeLayout`, inside `LayoutDefault`. It renders the existing `Dashboard`, `PrototypeSidebar`, `HomeView`, `WorkflowCard`, `PrototypeTabs`, and `RealEditor`. Workflow tabs mount the real `GraphView` with the repository's node graph fixtures and mock backend. The original spacing, typography, colors, cards, media, navigation, and editor controls remain in use. There is no alternate canvas or dashboard shell.

A compact toolbar adds Homestead entry points and environment status. The existing Demo pill includes V1/V2/V3. The top-right configuration popover adds access, dependency, build-outcome, and recovery scenarios. Config stays closed by default.

## Walkthrough

1. **V1 / existing workflows:** double-click a recent workflow card. Edit the actual graph's prompts and parameters. Use its normal Run button, node library, canvas controls, and workflow tabs. The extensions icon opens an informational modal: add and test nodes in Comfy Desktop, ask a local agent to create another build, then open the resulting Cloud link.
2. **Desktop to Cloud:** Start from Desktop opens the repository's `matte_pass` graph. Run demonstrates OOM. The white Run on cloud action beside Run first asks whether to create a new build (selected by default) or update an existing build. The suggested build name is editable; the existing-build dropdown appears only for Update. The form lets you create a named build or select an existing build to update, choose a GPU, and add agent instructions. Send to agent opens a simulated skill transcript with planning, skill loading, workflow inspection, manifest creation, CLI packaging/build/deployment output, and readiness checks. A copyable local Open UI URL appears only after successful readiness. Updates create a separate revision and keep the old build available. The URL can reopen the prepared fixture in a new tab in the same browser profile.
3. **Cloud import:** set Import dependencies in configuration, then Import workflow. Matching uses the current workspace's actual deployment fixture identifiers. Missing or unknown dependencies produce a copyable local-agent handoff.
4. **Deployment entry:** the original Environments grid → deployment details → Open UI. Edit build opens the simulated Developer Platform destination. No actual deployment is created.
5. **Sleep and recovery:** the configuration scenarios demonstrate sleep, startup failure and safe updates. Graph interaction freezes during startup; Run wakes compute. Machine startup is brief. After Run, a separate job status shows cold-start preparation, a 20-second to 4–5-minute estimate, elapsed time, and cancellation while the canvas remains editable. The prototype completes cold-start preparation in 5 real seconds while retaining the user-facing estimate of 20 seconds to 4–5 minutes. The preparation toast disappears when execution begins. Warm jobs skip preparation; sleeping clears the warm runtime. Cold-start jobs prevent idle sleep and duplicate submissions. Native graph state survives tab changes and environment reloads during the session. Build completion requires an explicit Open UI/switch action; existing builds remain selectable.
6. **V2:** choose V2 in Demo or configuration. The original Custom nodes table handles search, filters, installed packs and registry-pack selection. Private custom nodes can be added as non-empty .zip or .tar.gz archives (filename simulation only). Choose Update current build or Create new build and edit the name. Build & deploy prepares a distinct build/revision in Cloud and reports progress in a side panel. Completion asks the user to Switch to new build. Failure shows contextual error details and a Fix with agent action that carries the original workflow, selected nodes, private archive names, build target, and error into the simulated repair skill. Pack pinning and version changes are hidden in the Homestead flow. Develop locally provides the local node build/test handoff.
7. **V3:** the repo's Projects view opens by default, with its existing project cards, project pages, and project switcher. Environment changes require a compatibility review of every workflow in the selected project and explicit confirmation. Each project keeps one build, shared by all of its workflows; switching one project does not change another project. The original project environment picker also routes through this confirmation.
8. **Access:** configuration can simulate member, admin, outsider and signed-out states. This is a UI simulation, not backend authorization.

The unchanged `/prototype/dashboard` route remains available for comparison.

## Scope

Builds, compute, users, billing, and agents are simulated. The real ComfyUI frontend uses the repository's in-browser backend; it does not execute models. Graph editing and saving use existing repository behavior, not a new Cloud persistence service. Reloading resets the native demo session, except returned agent links retain their build/workflow fixture in browser storage. Registry and deployment manifests are fixtures; matching metadata does not guarantee runtime success.

## Verification

```sh
pnpm test:unit src/prototype/homestead/ src/prototype/stores/customCloudStore.test.ts src/prototype/stores/environmentStore.test.ts
pnpm exec vue-tsc --noEmit -p tsconfig.homestead.json
```

Focused checks cover fixture/workspace mapping, real node identifiers, isolated build revisions, project scope, compatibility, access, sleep, failures and explicit switching. Browser verification covers the inherited dashboard, actual graph nodes, Desktop handoff, the native V2 manager, and V3 project confirmation.

Agent tool calls and CLI command strings are illustrative prototype activity. They do not execute commands, contact agents, upload dependencies, or create real deployments.
