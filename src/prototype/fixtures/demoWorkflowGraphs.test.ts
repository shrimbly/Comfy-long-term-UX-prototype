import { describe, expect, it } from 'vitest'

import { objectInfo } from '../mockBackend/nodeDefs'
import { demoWorkflowGraph } from './demoWorkflowGraphs'

const coreNodes = objectInfo({ nodePacks: [], models: [] })

// Ids chosen to land on every setup.
const workflows = ['wf-a', 'wf-b', 'wf-c'].map((id) => ({
  id,
  name: `Workflow ${id}`
}))

function nodeTypes(id: string) {
  const graph = demoWorkflowGraph({ id, name: 'x' })
  return graph.nodes.map((node) => node.type).join(',')
}

describe('demoWorkflowGraph', () => {
  it.for(workflows)('$id loads with no missing nodes', (workflow) => {
    const graph = demoWorkflowGraph(workflow)
    const missing = graph.nodes.filter((node) => !(node.type in coreNodes))
    expect(missing.map((node) => node.type)).toEqual([])
  })

  it.for(workflows)('$id wires only matching socket types', (workflow) => {
    const graph = demoWorkflowGraph(workflow)
    const byId = new Map(graph.nodes.map((node) => [node.id, node]))
    const links = (graph.links ?? []).filter((link) => Array.isArray(link))
    expect(links).toHaveLength(graph.links?.length ?? -1)
    for (const [, fromId, fromSlot, toId, toSlot, type] of links) {
      const from = byId.get(Number(fromId))
      const to = byId.get(Number(toId))
      expect(from?.outputs?.[fromSlot]?.type).toBe(type)
      const input = to?.inputs?.[toSlot]
      const required = coreNodes[to?.type ?? '']?.input?.required ?? {}
      expect(required[input?.name ?? '']?.[0]).toBe(type)
    }
  })

  it('frames the graph in a group titled with the workflow name', () => {
    const graph = demoWorkflowGraph({ id: 'wf-1', name: 'Product hero' })
    expect(graph.groups?.map((group) => group.title)).toEqual(['Product hero'])
  })

  it('opens different workflows as different setups', () => {
    expect(new Set(workflows.map((w) => nodeTypes(w.id))).size).toBe(3)
  })
})
