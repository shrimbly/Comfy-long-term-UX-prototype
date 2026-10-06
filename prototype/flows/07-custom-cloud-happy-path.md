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
  - **Reset demo** reloads the page. Every store is in memory, so a reload restores the seed data. Use it between run-throughs.
- Have any file ready to drag in, e.g. a `.json` on the desktop. Every file dropped on the app opens as `matte_pass`.
- The tab strip starts in **My Workflows**, the personal project every user has.

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
   - The graph is the real editor. Four nodes have a red ring and an **Error** footer: Load Diffusion Model and Load LoRA (their models are missing), and RMBG and AcmeMatteRefine (their packs are missing). There is no error toast and no Errors panel.
5. **"Choose where it runs".** The dialog opens on its own.
   - Step 1 · Where it runs: the pitch, then what Comfy Cloud lacks (2 packs, 2 models).
   - Open the **Open it in** selector:
     - Coca-Cola Ad comes first, marked "✓ Runs it".
     - The rest follow, each with what it lacks.
     - Last: "A new project, on a new build".
   - Say: one project already runs it, but we make a new one anyway. Pick **A new project, on a new build**, then **Review the build**.
   - Step 2 · Review the build:
     - The name field reads "Matte R&D".
     - The summary shows: custom nodes 2 added; models 1 to upload; GPU RTX 5090; cost $0.89 an hour running, nothing while it sleeps.
   - Optional: click **Build with your agent** to show the prompt (`comfy skills show comfy-build`, `comfy build from-workflow …`). Then click **Back to the summary**. It is secondary on purpose.
   - Click **Build and deploy**.
6. **The build locks the project.**
   - The app reloads into the new project, Matte R&D. A full-screen modal covers its editor, and the node graph is not usable.
   - Build progress runs: resolve, upload, install, bake. Deploy follows: start a worker, load models. Each stage shows a time.
   - The copy says about 19 minutes and "we'll email you". The demo plays it in about 18 seconds.
   - The project pill shows a blue dot and "Building · 12 min".
   - Optional: click **Switch to another project**. The project menu opens with its search field ready to type in, and the tab strip stays live. Press Esc to stay.
7. **Ready: the red nodes are gone.**
   - The modal closes, the nodes are no longer red, and the pill's dot turns green.
   - A toast says "Matte R&D is ready" and offers **Run matte_pass**.
8. **Cold start.**
   - Click **Run matte_pass** in the toast, or the editor's **Run** button.
   - A small note under Run says "Starting a worker. The first run takes a little longer: usually under 20 seconds." The editor also shows its own "Job queued" toast. Nothing actually runs.
   - There is no warm/cold indicator anywhere else.
9. **Switch projects from the tab bar.**
   - Click the project pill, just right of the Home tab. The menu lists your recent projects first, then the rest A–Z. A cloud marks Comfy Cloud; a custom deployment shows its status dot and name.
   - Type "coca" and press Enter, or click **Coca-Cola Ad**. It runs on its own deployment, so the app reloads: a loading screen like ComfyUI's own (the Comfy logo filling with a wave, "Opening Coca-Cola Ad"), then the editor with your four Coca-Cola Ad drafts as tabs, newest first.
   - Switch back to **Matte R&D** from the pill: it is now under Recent. Its `matte_pass` tab is still there.

Then click **Reset demo** and run it again.

## Shortcut and alternative

- **Demo: drop incompatible workflow** does the same as step 4's drop, in whatever project is current. From a fresh reset that is My Workflows, which runs on Comfy Cloud.
- In step 5, keep **Coca-Cola Ad** selected and click **Switch and reload**. `matte_pass` moves into Coca-Cola Ad and runs there with no red nodes.
- Close the dialog with **Not now**. The nodes stay red, and pressing **Run** reopens the dialog.

## Surfaces touched

- Projects page → project cards (`views/ProjectsView.vue`, `components/ProjectCard.vue`)
- Project page → header variants and settings rows (`views/ProjectDetailView.vue`, `components/project/*.vue`); workspace settings → Projects (`components/settings/ProjectsSettings.vue`)
- Tab strip → project switcher (`components/PrototypeTabs.vue`, `components/ProjectSwitcher.vue`, `components/ProjectSwitcherMenu.vue`)
- The real editor (`components/RealEditor.vue` around `src/views/GraphView.vue`, served by `mockBackend/`), run-target dialog (`components/RunTargetDialog.vue`, `RunTargetSelect.vue`), build lock (`components/BuildLockModal.vue`), ready toast, reload screen
- State: `stores/customCloudStore.ts`, tabs per project in `stores/tabsStore.ts`, data in `fixtures/customCloud.ts` + `fixtures/admin.ts`

## Editor approach

The editor tab is the real ComfyUI editor (`GraphView`): node graph, Nodes 2.0, sidebars, Run button, minimap. The deployed prototype has no ComfyUI server, so `src/prototype/mockBackend/` answers the editor's API calls in the browser:

- settings and userdata are kept in memory
- `object_info` follows the current project's deployment
- the queue is empty, and a stand-in WebSocket replaces the server's

Nothing executes. Run is accepted, and on a custom deployment the prototype shows the cold-start note.

How it ties into the prototype:

- **Tabs.** Each prototype tab maps to one real workflow. The editor's own workflow tabs are moved to its sidebar, so the prototype's tab strip is the only one on screen.
- **Switching projects.** The node types re-register for the new project's deployment, and the graph reloads against them. That is how `matte_pass` loads red on Comfy Cloud and clean on its own build.
- **Run with missing nodes.** It opens "choose where it runs" instead of queueing.

## Out of scope

- Usage per user, billing, invoices (Alex, real platform code).
- Node manager installs, workspace policies, staging and production (Pablo).
- The permission matrix (replaced by opinionated roles).
- Edge cases: a guest dropping a workflow, a workflow that needs a different deployment from the project's, failed builds, out of credits. In the selector, projects that lack nodes are listed for context but can't be picked.

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
