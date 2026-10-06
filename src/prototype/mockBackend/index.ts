// Implements:
//   decision: prototype/design-decisions.md — 2026-10-06 "Real node graph on
//             an in-browser backend"
//   concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — cold start
//
// The deployed prototype is a static site with no ComfyUI server. To show the
// real editor (GraphView, node graph, Run button, sidebars) the browser
// answers its API calls: settings and userdata in memory, node definitions
// for the current project's deployment, an empty queue, and a stand-in
// WebSocket. Nothing executes: Run is accepted, and on a custom deployment
// the prototype shows the cold-start note.
//
// Installed from src/main.ts for prototype deploy builds only.

import { objectInfo } from './nodeDefs'
import { policyErrors } from './policyValidation'
import type { DeploymentContents } from './nodeDefs'

type Json = Record<string, unknown> | unknown[]

export type MockRunState = 'idle' | 'starting'

interface MockDeployment extends DeploymentContents {
  // A custom deployment sleeps when idle, so a run starts a worker first.
  coldStart: boolean
}

export const COLD_START_MS = 4000

let deployment: MockDeployment = { nodePacks: [], models: [], coldStart: false }
let promptCount = 0
const runStateListeners = new Set<(state: MockRunState) => void>()

// Prototype defaults: no first-run tours, no unload prompt (Reset demo
// reloads the page), no restored drafts, and the editor's own workflow tabs
// moved off the top bar (the prototype draws its own tab strip). Nodes 2.0,
// as on Comfy Cloud: it rings missing nodes and models red with an "Error"
// footer, which needs the Errors tab setting on; the prototype keeps every
// warning silent, so the Errors overlay never opens.
const settings: Record<string, unknown> = {
  'Comfy.TutorialCompleted': true,
  'Comfy.InstalledVersion': __COMFYUI_FRONTEND_VERSION__,
  'Comfy.Window.UnloadConfirmation': false,
  'Comfy.Workflow.Persist': false,
  'Comfy.Workflow.WorkflowTabsPosition': 'Sidebar',
  'Comfy.VueNodes.Enabled': true,
  'Comfy.RightSidePanel.ShowErrorsTab': true,
  'Comfy.ColorPalette': 'dark'
}

const userdata = new Map<string, { content: string; modified: number }>()

function json(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

const notFound = () => json({ error: 'not found' }, 404)

// "/prototype/api/settings" or "/api/settings" → "/settings"
function apiRoute(url: URL): string | null {
  const match = url.pathname.match(/\/api(\/.*)$/)
  return match ? match[1] : null
}

function setRunState(state: MockRunState) {
  for (const listener of runStateListeners) listener(state)
}

function listUserdata(dir: string, fullInfo: boolean) {
  const prefix = `${dir}/`
  const entries = [...userdata.entries()].filter(([path]) =>
    path.startsWith(prefix)
  )
  return fullInfo
    ? entries.map(([path, file]) => ({
        path: path.slice(prefix.length),
        size: file.content.length,
        modified: file.modified
      }))
    : entries.map(([path]) => path.slice(prefix.length))
}

// Accepts the prompt without running it. A custom deployment sleeps when
// idle, so the first thing a run does there is start a worker.
function queuePrompt(body: string | undefined) {
  const nodeErrors = policyErrors(body, deployment)
  if (Object.keys(nodeErrors).length)
    return json(
      {
        error: {
          type: 'prompt_outputs_failed_validation',
          message: 'Workspace policy blocks this workflow.',
          details:
            'Allow the required models and custom nodes in workspace settings.',
          extra_info: {}
        },
        node_errors: nodeErrors
      },
      400
    )
  promptCount += 1
  if (deployment.coldStart) {
    setRunState('starting')
    setTimeout(() => setRunState('idle'), COLD_START_MS)
  }
  return json({
    prompt_id: `prototype-${promptCount}`,
    number: promptCount,
    node_errors: {}
  })
}

async function handle(
  route: string,
  url: URL,
  init: RequestInit | undefined
): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const body = typeof init?.body === 'string' ? init.body : undefined

  if (route === '/users') return json({ storage: 'server', migrated: true })
  if (route === '/settings' && method === 'GET') return json(settings)
  if (route === '/settings' && method === 'POST') {
    Object.assign(settings, body ? JSON.parse(body) : {})
    return json({})
  }
  if (route.startsWith('/settings/')) {
    const id = decodeURIComponent(route.slice('/settings/'.length))
    if (method === 'POST') settings[id] = body ? JSON.parse(body) : null
    return method === 'GET' ? json(settings[id] as Json) : json({})
  }

  if (route === '/userdata' && method === 'GET') {
    const dir = url.searchParams.get('dir') ?? ''
    return json(listUserdata(dir, url.searchParams.get('full_info') === 'true'))
  }
  if (route.startsWith('/userdata/')) {
    const path = decodeURIComponent(route.slice('/userdata/'.length))
    if (method === 'POST' || method === 'PUT') {
      const modified = Date.now()
      userdata.set(path, { content: body ?? '', modified })
      return json({ path, size: body?.length ?? 0, modified })
    }
    if (method === 'DELETE') {
      userdata.delete(path)
      return json({})
    }
    const file = userdata.get(path)
    return file ? new Response(file.content) : notFound()
  }

  if (route === '/object_info') return json(objectInfo(deployment))
  if (route === '/extensions') return json([])
  if (route === '/global_subgraphs') return json({})
  if (route === '/workflow_templates') return json({})
  if (route === '/embeddings') return json([])
  if (route === '/system_stats') {
    return json({
      system: {
        os: 'posix',
        python_version: '3.12.9',
        embedded_python: false,
        comfyui_version: '0.3.80',
        pytorch_version: '2.8.0',
        argv: ['main.py'],
        ram_total: 137438953472,
        ram_free: 120259084288
      },
      devices: [
        {
          name: 'cuda:0 NVIDIA GeForce RTX 5090',
          type: 'cuda',
          index: 0,
          vram_total: 34359738368,
          vram_free: 32212254720,
          torch_vram_total: 0,
          torch_vram_free: 0
        }
      ]
    })
  }
  if (route === '/jobs') {
    return json({
      jobs: [],
      pagination: { offset: 0, limit: 0, total: 0, has_more: false }
    })
  }
  if (route === '/prompt' && method === 'POST') return queuePrompt(body)
  if (route === '/prompt') return json({ exec_info: { queue_remaining: 0 } })
  if (route === '/queue') return json({ queue_running: [], queue_pending: [] })
  if (route.startsWith('/history')) return json({})

  return notFound()
}

class FakeSocket extends EventTarget {
  readonly url: string
  readyState = 0
  binaryType: BinaryType = 'blob'

  constructor(url: string) {
    super()
    this.url = url
    setTimeout(() => {
      this.readyState = 1
      this.dispatchEvent(new Event('open'))
      this.receive({
        type: 'status',
        data: {
          status: { exec_info: { queue_remaining: 0 } },
          sid: 'prototype'
        }
      })
    }, 0)
  }

  send() {}

  close() {
    this.readyState = 3
  }

  receive(message: { type: string; data: unknown }) {
    this.dispatchEvent(
      new MessageEvent('message', { data: JSON.stringify(message) })
    )
  }
}

export function setMockDeployment(next: MockDeployment) {
  deployment = next
}

export function onMockRunStateChange(listener: (state: MockRunState) => void) {
  runStateListeners.add(listener)
  return () => runStateListeners.delete(listener)
}

export function installMockBackend() {
  const realFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const url = new URL(
      input instanceof Request ? input.url : String(input),
      window.location.href
    )
    const route = url.origin === window.location.origin ? apiRoute(url) : null
    if (route === null) return realFetch(input, init)
    return handle(route, url, init)
  }

  const RealWebSocket = window.WebSocket
  window.WebSocket = new Proxy(RealWebSocket, {
    construct(target, args: ConstructorParameters<typeof WebSocket>) {
      const url = String(args[0])
      if (new URL(url).pathname.endsWith('/ws')) {
        return new FakeSocket(url)
      }
      return new target(...args)
    }
  })
}
