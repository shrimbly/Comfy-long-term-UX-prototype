# Flow 07 — Custom Comfy Cloud happy path (demo script)

The click path for the customer demo on Wednesday 8 Oct 2026: projects that run on their own Developer Platform deployment (Project Homestead). It shows the happy path only. Edge cases are out of scope (see the end).

Wiki: `../IA_Plan/wiki/concepts/custom-comfy-cloud.md`. Source: the 6 Oct "Custom cloud sync" (`../IA_Plan/sources/meeting-2026-10-06-custom-cloud-sync.md`).

## Actor

- **Workspace Admin** (Willie, workspace Comfy Org). This is the default persona.
- **Workspace Member** (Alex) can be shown for the read-only settings: no "Change deployment" button.

## Before you start

- Open `/prototype/dashboard`. The deployed prototype runs without a backend.
- The presenter controls sit at the bottom right, beside the persona toggle:
  - **Demo: drop incompatible workflow** opens `matte_pass` without a real file drop.
  - **Demo: nothing runs it** opens `matte_pass` as if no deployment ran it yet, to show step 1's other two states.
  - **Reset demo** reloads the page. Every store is in memory, so a reload restores the seed data. Use it between run-throughs.
- Have any file ready to drag in, e.g. a `.json` on the desktop. Every file dropped on the app opens as `matte_pass`.
- The tab strip starts in **Personal**, the personal project every user has.

## Fixture state

| Project         | Runs on                           | Who's in it (besides Willie) | Role in the demo                        |
| --------------- | --------------------------------- | ---------------------------- | --------------------------------------- |
| Coca-Cola Ad    | Acme Studio pipeline · v3 · ready | Alex                         | Already runs `matte_pass` ("✓ Runs it") |
| Personal R&D    | Matte tests · v7 · asleep         | nobody                       | Lacks 1 pack                            |
| Client X        | Comfy Cloud                       | Jane                         | Members example                         |
| Marketing 2026  | Comfy Cloud                       | everyone (workspace-wide)    | Where you drop the workflow             |
| Everything else | Comfy Cloud                       | —                            | —                                       |

`matte_pass` needs packs `comfyui-rmbg` and `acme-matte-tools`, and models `flux1-dev-fp8` and `acme_hero_lora_v5`.

## Click path

1. **Projects, and where each runs.**
   - From Home, click **Projects** in the sidebar. Each project card shows its deployment: "● Acme Studio pipeline · v3 · ready", "● Matte tests · v7 · asleep", or "Comfy Cloud".
   - Say: everything you create in a project is contained in that project.
2. **Different people in different projects.**
   - Click **Coca-Cola Ad**. The Share button shows Willie and Alex.
   - Go back to Projects and open **Client X**. It shows Willie and Jane.
3. **Project settings show the deployment.**
   - In Coca-Cola Ad, the header shows where it runs: "● Acme Studio pipeline". Open **Settings** (a tab, an icon button, or the rail, depending on the "Project page" switcher). It shows:
     - Runs on: Acme Studio pipeline · RTX 5090
     - Access: 2 people
     - **All settings** → the workspace settings Projects page, with this project's panel open on the right. Admins see **Change** there.
   - Optional: switch the persona to Workspace Member and open the same panel. "Change" is gone.
4. **Open a workflow, drop in an incompatible one.**
   - Open **Marketing 2026** and click **+ Workflow**.
   - The editor opens in Marketing 2026 straight away: like every Comfy Cloud project, it runs on the same deployment as the one you were in, so there is no reload. The project pill after the Home tab now reads Marketing 2026.
   - Drag any file onto the editor. It opens as `matte_pass` in a new tab.
   - The graph is the real editor. Four nodes have an amber ring and an **Issues** footer: Load Diffusion Model and Load LoRA (their models are missing), and RMBG and AcmeMatteRefine (their packs are missing). Run shows a warning icon. There is no error toast and no Issues panel.
5. **"Choose where it runs".** The dialog opens on its own.
   - Step 1. The title reads "This workflow can't run on Comfy Cloud". A short table lists what is missing: 2 missing node packs, 2 missing models.
   - "Create a new project that runs on" shows **Acme Studio pipeline · Ready now**: that deployment already has everything.
   - Open the field. It works like the project switcher: a search field, then one list. Acme Studio pipeline is ticked and marked "Ready". Matte tests ("Missing 1 node pack") and Comfy Cloud ("Missing 2 packs, 2 models") are greyed out. Below the list is **+ Create a new deployment · About 20 min**.
   - Say: one deployment already runs it, but we make a new one anyway. Pick **Create a new deployment**. The main button changes to **Create deployment**. Click it.
   - Step 2 · the build summary, as Platform shows it. Under "Suggested settings": Name (the deployment's name, Matte R&D, editable in place), ComfyUI v0.39.1, Runtime (CUDA 13.0 · Python 3.12 · Torch 2.12.1), Open-source models (all allowed, 2 pre-installed), Partner models, Custom nodes (2 packs), Python packages.
   - Optional: click any setting except the name. A confirmation asks, for example, "Change Runtime on Platform?". Click **Cancel**.
   - Optional: click **Build with your agent** to show the prompt (`comfy skills show comfy-build`, `comfy build from-workflow …`), then **Back to the summary**. It is secondary on purpose.
   - Click **Next: deployment**.
   - Step 3 · Platform's deploy dialog, as it is live: GPU (RTX PRO 6000, H100 SXM, H200 SXM, B200, with VRAM and price an hour), always-warm workers 0, max workers 3, Location, and ComfyUI startup flags. On the right: the estimated cost and, once a GPU is picked, the estimated time.
   - Pick **RTX PRO 6000**. GPU time shows $0.00 an hour idle and $13.62 at full load; model storage is $2.44 a month. Click **Create deployment**.
6. **The deployment builds in the background.**
   - The dialog turns into the build's progress: "Building Matte R&D". You stay in Marketing 2026; nothing is created or opened yet.
   - Build progress runs: resolve, upload, install, bake. Deploy follows: start an RTX PRO 6000 worker, load models. Each stage shows a time.
   - The copy says about 19 minutes and "We'll ask you to name the project when it's done". The demo plays it in about 18 seconds.
   - Click **Keep working**. A chip in the tab strip reads "● Building Matte R&D · 18 min". Click it to see the progress again.
7. **Name the project, then it opens.**
   - When the deployment is done, the dialog comes back on **New project**: a "● Runs on Matte R&D" chip, **Name** (Matte R&D) and **General access** (Anyone in Comfy Org · Workspace ▾), the same fields as the dashboard's New project dialog. Optional: switch to **Restricted** and add Alex under People with access.
   - Click **Create project**. The app reloads into Matte R&D. The amber rings are gone and the pill's dot is green.
   - A toast says "Matte R&D is ready".
8. **Cold start.**
   - Click the editor's **Run** button.
   - A small note under Run says "Starting a worker. The first run takes a little longer: usually under 20 seconds." The editor also shows its own "Job queued" toast. Nothing actually runs.
   - There is no warm/cold indicator anywhere else.
9. **Switch projects from the tab bar.**
   - Click the project pill, just right of the Home tab. The menu lists your recent projects first, then the rest A–Z. A cloud marks Comfy Cloud; a custom deployment shows its status dot and name.
   - Type "coca" and press Enter, or click **Coca-Cola Ad**. It runs on its own deployment, so the app reloads: a loading screen like ComfyUI's own (the Comfy logo filling with a wave, "Opening Coca-Cola Ad"), then the editor with your four Coca-Cola Ad drafts as tabs, newest first.
   - Switch back to **Matte R&D** from the pill: it is now under Recent. Its `matte_pass` tab is still there.

Then click **Reset demo** and run it again.

## Shortcut and alternative

- **Demo: drop incompatible workflow** does the same as step 4's drop, in whatever project is current. From a fresh reset that is Personal, which runs on Comfy Cloud.
- In step 5, keep **Acme Studio pipeline** and click **Create project**. The New project step shows "● Runs on Acme Studio pipeline": name it and choose its access, then **Create project**. The app reloads into it and `matte_pass` runs there with no build.
- In step 5, click **Open in another project** and pick **Coca-Cola Ad**. `matte_pass` moves into Coca-Cola Ad and runs there.
- **Demo: nothing runs it** from a Comfy Cloud project: the title reads "This workflow can't run on Comfy Cloud". It shows the three ticks and **Create deployment**, which goes to step 2. **Update an existing deployment ↗** is the quiet option; it opens on Platform.
- **Demo: nothing runs it** from Personal R&D (on Matte tests): the title reads "This workflow can't run on Matte tests" and the table lists only acme-matte-tools. The main action is **Update on Platform ↗** (Matte tests v7 → v8; every project on it gets the release). **Create a new deployment instead** goes to step 2.
- Close the dialog with **Not now**. The nodes stay flagged, and pressing **Run** reopens the dialog.

## Surfaces touched

- Projects page → project cards (`views/ProjectsView.vue`, `components/ProjectCard.vue`)
- Project page → header variants and settings rows (`views/ProjectDetailView.vue`, `components/project/*.vue`); workspace settings → Projects (`components/settings/ProjectsSettings.vue`)
- Tab strip → project switcher (`components/PrototypeTabs.vue`, `components/ProjectSwitcher.vue`, `components/ProjectSwitcherMenu.vue`)
- The real editor (`components/RealEditor.vue` around `src/views/GraphView.vue`, served by `mockBackend/`), run-target dialog (`components/RunTargetDialog.vue` with `RunTargetChoose.vue`, `RunTargetDeploymentPicker.vue`, `RunTargetProjectChooser.vue`, `RunTargetBuildSummary.vue`, `RunTargetAgent.vue`, `RunTargetDeploy.vue`), build lock (`components/BuildLockModal.vue`), ready toast, reload screen
- State: `stores/customCloudStore.ts`, tabs per project in `stores/tabsStore.ts`, data in `fixtures/customCloud.ts` + `fixtures/admin.ts`

## Editor approach

The editor tab is the real ComfyUI editor (`GraphView`): node graph, Nodes 2.0, sidebars, Run button, minimap. The deployed prototype has no ComfyUI server, so `src/prototype/mockBackend/` answers the editor's API calls in the browser:

- settings and userdata are kept in memory
- `object_info` follows the current project's deployment
- the queue is empty, and a stand-in WebSocket replaces the server's

Nothing executes. Run is accepted, and on a custom deployment the prototype shows the cold-start note.

How it ties into the prototype:

- **Tabs.** Each prototype tab maps to one real workflow. The editor's own workflow tabs are moved to its sidebar, so the prototype's tab strip is the only one on screen.
- **Switching projects.** The node types re-register for the new project's deployment, and the graph reloads against them. That is how `matte_pass` loads flagged on Comfy Cloud and clean on its own build.
- **Run with missing nodes.** It opens "choose where it runs" instead of queueing.

## Out of scope

- Usage per user, billing, invoices (Alex, real platform code).
- Node manager installs, workspace policies, staging and production (Pablo).
- The permission matrix (replaced by opinionated roles).
- Edge cases: a guest dropping a workflow, a workflow that needs a different deployment from the project's, failed builds, out of credits. In the dialog's pickers, deployments and projects that lack something are listed for context but can't be picked.

## Open questions surfaced

All are in `../IA_Plan/wiki/open-questions.md` § Custom Comfy Cloud:

- `project-assets-global-or-scoped`
- `build-wait-acceptable`
- `who-can-create-builds`
- `guest-drops-incompatible-workflow`
- `dropped-workflow-other-deployment`
- `build-lockout-acceptable`
- `projects-in-usage`
- `create-project-from-scratch`
- `project-switch-reload`
