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
   - In Coca-Cola Ad, click **Settings**. The Deployment section shows:
     - Runs on: Acme Studio pipeline · v3 · ready
     - GPU: RTX 5090
     - Stays warm: 2 minutes after a run
     - **Manage on Platform ↗**, and **Change deployment** (admins only)
   - Optional: switch the persona to Workspace Member and open the same page. "Change deployment" is gone.
4. **Open a workflow, drop in an incompatible one.**
   - Open **Marketing 2026** and click **+ Workflow**.
   - The app reloads into Marketing 2026: a short "Opening Marketing 2026" screen, then the editor. The switcher next to the Home tab now reads Marketing 2026.
   - Drag any file onto the editor. It opens as `matte_pass` in a new tab.
   - Load Diffusion Model and AcmeMatteRefine show red, with an Error tab. There is no error toast and no Issues panel.
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
   - The switcher next to the Home tab shows a spinner and the minutes left.
   - Optional: click **Switch to another project**. The project menu opens and the tab strip stays live. Press Esc to stay.
7. **Ready: the red nodes are gone.**
   - The modal closes, the nodes are no longer red, and the status dot turns green.
   - A toast says "Matte R&D is ready" and offers **Run matte_pass**.
8. **Cold start.**
   - Click **Run matte_pass** in the toast, or the editor's **Run** button.
   - A small note under Run says "Starting a worker. The first run takes a little longer: usually under 20 seconds." The run counter shows "1 active".
   - There is no warm/cold indicator anywhere else.
9. **Switch projects from the tab bar.**
   - Click the project switcher, just right of the Home tab. Each project shows where it runs.
   - Pick **Coca-Cola Ad**. A short reload screen shows, then Coca-Cola Ad with its own tabs (none yet).
   - Switch back to **Matte R&D**. Its `matte_pass` tab is still there.

Then click **Reset demo** and run it again.

## Shortcut and alternative

- **Demo: drop incompatible workflow** does the same as step 4's drop, in whatever project is current. From a fresh reset that is My Workflows, which runs on Comfy Cloud.
- In step 5, keep **Coca-Cola Ad** selected and click **Switch and reload**. `matte_pass` moves into Coca-Cola Ad and runs there with no red nodes.
- Close the dialog with **Not now**. The nodes stay red, and pressing **Run** reopens the dialog.

## Surfaces touched

- Projects page → project cards (`views/ProjectsView.vue`, `components/ProjectCard.vue`)
- Project page → Settings → Deployment (`views/ProjectDetailView.vue`, `components/ProjectDeploymentSection.vue`)
- Tab strip → project switcher (`components/PrototypeTabs.vue`, `components/ProjectSwitcher.vue`)
- Demo editor (`views/DemoEditorView.vue`), run-target dialog (`components/RunTargetDialog.vue`, `RunTargetSelect.vue`), build lock (`components/BuildLockModal.vue`), ready toast, reload screen
- State: `stores/customCloudStore.ts`, tabs per project in `stores/tabsStore.ts`, data in `fixtures/customCloud.ts` + `fixtures/admin.ts`

## Editor approach

The deployed prototype has no ComfyUI backend, so the real `GraphView` cannot boot. It fails in `userStore.initialize`. The editor tab instead shows a real editor capture (`public/prototype-fixtures/editor-capture.png`), scaled to fit. Live overlays sit on top of it: the `matte_pass` node patches, red rings and Error tabs, the Run button, the run counter and the cold-start note. ComfyUI's own tab bar is cropped off the capture, and the prototype draws its real tab strip instead.

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
