// Implements:
//   decision: ../IA_Plan/wiki/decisions/custom-nodes-as-configuration.md
//   decision: prototype/design-decisions.md — 2026-10-07 "Custom nodes
//             modal: Platform's table, with pinned versions"
//
// What the editor's Custom nodes modal shows beside each node pack in the
// policy catalog: its GitHub repository and stars, and its releases, newest
// first. A private pack has no public repository, so no stars.

export interface PackRelease {
  version: string
  date: string
}

export interface NodePackDetails {
  repo?: string
  stars?: number
  releases: PackRelease[]
}

export const NODE_PACK_DETAILS: Record<string, NodePackDetails> = {
  'comfyui-rmbg': {
    repo: '1038lab/ComfyUI-RMBG',
    stars: 1400,
    releases: [
      { version: '2.0.0', date: '2026-09-24' },
      { version: '1.9.3', date: '2026-08-30' },
      { version: '1.9.2', date: '2026-08-11' }
    ]
  },
  'acme-matte-tools': {
    releases: [
      { version: '1.2.0', date: '2026-09-15' },
      { version: '1.1.4', date: '2026-08-02' }
    ]
  },
  'impact-pack': {
    repo: 'ltdrdata/ComfyUI-Impact-Pack',
    stars: 2600,
    releases: [
      { version: '8.29.1', date: '2026-10-04' },
      { version: '8.28.3', date: '2026-09-12' },
      { version: '8.28.2', date: '2026-09-02' },
      { version: '8.27.0', date: '2026-08-18' }
    ]
  },
  'comfyui-kjnodes': {
    repo: 'kijai/ComfyUI-KJNodes',
    stars: 1900,
    releases: [
      { version: '1.5.0', date: '2026-09-29' },
      { version: '1.4.2', date: '2026-09-08' },
      { version: '1.4.1', date: '2026-08-27' }
    ]
  },
  'rgthree-comfy': {
    repo: 'rgthree/rgthree-comfy',
    stars: 2200,
    releases: [
      { version: '1.0.0', date: '2026-09-18' },
      { version: '0.9.8', date: '2026-08-21' }
    ]
  },
  'video-helper': {
    repo: 'Kosinkadink/ComfyUI-VideoHelperSuite',
    stars: 1200,
    releases: [
      { version: '1.7.9', date: '2026-09-26' },
      { version: '1.7.8', date: '2026-09-01' }
    ]
  },
  essentials: {
    repo: 'cubiq/ComfyUI_essentials',
    stars: 900,
    releases: [
      { version: '1.1.0', date: '2026-07-30' },
      { version: '1.0.9', date: '2026-06-14' }
    ]
  },
  'comfyui-easy-use': {
    repo: 'yolain/ComfyUI-Easy-Use',
    stars: 1800,
    releases: [{ version: '1.3.6', date: '2026-09-22' }]
  },
  'controlnet-aux': {
    repo: 'Fannovel16/comfyui_controlnet_aux',
    stars: 3100,
    releases: [{ version: '1.1.5', date: '2026-09-20' }]
  },
  'comfyui-gguf': {
    repo: 'city96/ComfyUI-GGUF',
    stars: 2400,
    releases: [{ version: '1.1.10', date: '2026-09-27' }]
  },
  'layer-style': {
    repo: 'chflame163/ComfyUI_LayerStyle',
    stars: 2300,
    releases: [{ version: '2.0.40', date: '2026-09-25' }]
  }
}

// Versions each deployment holds a pack at. A pack with no entry follows its
// latest release, taken at each rebuild.
export const SEEDED_PINS: Record<string, Record<string, string>> = {
  'dep-acme-studio': {
    'acme-matte-tools': '1.2.0',
    'impact-pack': '8.28.3'
  }
}
