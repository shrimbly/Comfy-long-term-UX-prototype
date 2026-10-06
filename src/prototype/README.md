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

## Workspace settings preview

The workspace menu sits at the bottom of the sidebar. It opens account settings,
workspace settings, and billing. The editor shows the same menu as a workspace
thumbnail below Settings in its left toolbar. Settings keep the Home tab and open workflows.

Workspace policies have separate model and custom-node allowlists. Owners and
admins can edit them. Members can view them. Changes apply to every project in
the current workspace and remain in memory until the page reloads. Built-in nodes
remain available. The mock backend filters model choices and rejects runs that
use removed items. This is prototype behavior, not a production security control.

Usage shows sample spend by member and project for September and October 2026.
Both views use the same records. CSV exports include the selected view and month.
Catalog metadata and usage are sample data. Billing, account creation, and logout
are not connected to live services.
