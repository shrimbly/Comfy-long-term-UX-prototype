# Prototype navigation

Run `PROTOTYPE_DEPLOY=true pnpm exec vite`, then open `/prototype/dashboard`.
That flag installs the in-browser mock backend (`mockBackend/`), so the real
editor runs without a ComfyUI server. Plain `pnpm dev` needs a running ComfyUI
backend (by default, `http://127.0.0.1:8188`).

One tab bar sits above Home and the editor. The house tab always returns to
Home. Workflow tabs are the prototype's tabs, remembered per Cloud project, and
each one shows the real ComfyUI editor embedded in the dashboard (`RealEditor`).
The editor mounts once and stays mounted while Home is open, so it keeps its
state. `+` opens a blank workflow. Home's project and workflow cards use
prototype fixture data.

The house stays at the far left, before the Cloud project switcher. The
standalone editor route (`/`) still works against a real backend and shows its
own workflow tabs in the same bar.
