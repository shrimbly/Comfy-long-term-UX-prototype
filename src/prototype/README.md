# Prototype navigation

Run `pnpm dev`, then open `/prototype/dashboard` for Home or `/` for the editor.
The editor needs a running ComfyUI backend (by default, `http://127.0.0.1:8188`).

Both views share the top workflow bar. The house tab always returns to Home;
workflow tabs restore their editor state, and `+` creates a blank workflow.
The editor mounts on first use and stays mounted while Home is open, preserving
unsaved work. Home's project and workflow cards still use prototype fixture data.
