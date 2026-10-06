<!--
  Implements:
    concept:  ../IA_Plan/wiki/concepts/custom-comfy-cloud.md — happy path
              steps 4, 7 and 9
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
              — missing nodes show red; Run opens "choose where it runs"
    decision: prototype/design-decisions.md — 2026-10-06 "Real node graph on
              an in-browser backend"

  The real ComfyUI editor (GraphView: litegraph canvas, sidebars, Run
  button, queue) under the prototype's tab strip. It stays mounted, so the
  app boots once. This bridge keeps it in step with the prototype:
    - each prototype workflow tab shows its own real workflow;
    - the in-browser backend serves the current project's deployment, so
      matte_pass's nodes are red where the deployment lacks them and clean
      once it has them;
    - Run with missing nodes opens "choose where it runs" instead;
    - a run on a custom deployment shows the cold-start note under Run.
-->
<template>
  <!-- Hidden but still laid out, out of the flow: display:none would let
       the editor's nodes re-measure at zero width and keep those sizes. -->
  <div
    :class="
      cn(
        'relative isolate flex min-h-0 flex-1',
        !activeTab && 'pointer-events-none invisible absolute inset-0'
      )
    "
    :aria-hidden="!activeTab"
  >
    <GraphView embedded :active="!!activeTab" />
    <div
      v-if="customCloud.runState === 'starting' && coldStartAnchor"
      role="status"
      class="fixed z-50 flex w-75 flex-col gap-1.5 rounded-lg border border-border-default bg-base-background p-3 text-base-foreground shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
      :style="coldStartAnchor"
    >
      <span class="flex items-center gap-2 text-sm font-medium">
        <i
          class="icon-[lucide--loader-circle] size-4 animate-spin text-muted-foreground"
        />
        {{ t('prototype.customCloud.editor.coldStartTitle') }}
      </span>
      <span class="text-xs text-muted-foreground">
        {{ t('prototype.customCloud.editor.coldStartBody') }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'
import { until, useEventListener } from '@vueuse/core'
import { computed, onMounted, ref, toRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { LiteGraph } from '@/lib/litegraph/src/litegraph'
import { useWorkflowService } from '@/platform/workflow/core/services/workflowService'
import { useWorkflowStore } from '@/platform/workflow/management/stores/workflowStore'
import type { ComfyWorkflowJSON } from '@/platform/workflow/validation/schemas/workflowSchema'
import { app } from '@/scripts/app'
import { defaultGraph } from '@/scripts/defaultGraph'
import { useCommandStore } from '@/stores/commandStore'
import { useExecutionErrorStore } from '@/stores/executionErrorStore'
import GraphView from '@/views/GraphView.vue'

import { MATTE_PASS_GRAPH } from '../fixtures/mattePassGraph'
import { setMockDeployment } from '../mockBackend'
import { objectInfo, PACK_NODE_TYPES } from '../mockBackend/nodeDefs'
import { usePrototypeCustomCloudStore } from '../stores/customCloudStore'
import { usePrototypePolicyStore } from '../stores/policyStore'
import { usePrototypeTabsStore } from '../stores/tabsStore'

const RUN_BUTTON = '[data-testid="queue-button"]'
// Flag missing nodes and models on the nodes without opening anything.
const QUIET_LOAD = { deferWarnings: true, silentAssetErrors: true }

const { t } = useI18n()
const customCloud = usePrototypeCustomCloudStore()
const tabsStore = usePrototypeTabsStore()
const policies = usePrototypePolicyStore()
const workflowStore = useWorkflowStore()
const executionErrorStore = useExecutionErrorStore()

// Missing nodes lead to "choose where it runs", never the Errors overlay.
watch(
  () => executionErrorStore.isErrorOverlayOpen,
  (open) => {
    if (open) executionErrorStore.dismissErrorOverlay()
  }
)

const activeTab = computed(() => {
  const tab = tabsStore.openTabs.find((t) => t.id === tabsStore.activeTabId)
  return tab?.kind === 'workflow' ? tab : undefined
})

// What the current project's deployment can run. A deployment still
// building can't run anything yet.
const runnable = computed(() => {
  const deployment = customCloud.currentDeployment
  const usable = deployment.status !== 'building'
  return {
    nodePacks: usable ? deployment.nodePacks.filter(policies.isAllowed) : [],
    models: usable ? deployment.models.filter(policies.isAllowed) : [],
    allowedModelFiles: customCloud.isEnabled
      ? policies.allowedModelFiles
      : undefined,
    coldStart: deployment.kind === 'custom'
  }
})

// Editor work runs one task at a time, in order.
let pending = Promise.resolve()
function enqueue(task: () => Promise<void>) {
  pending = pending.then(task).catch((error: unknown) => {
    console.error('[prototype editor]', error)
  })
  return pending
}

// Re-register node types for the current deployment: new packs register,
// and packs it lacks are dropped so their nodes load as missing again.
async function registerDeploymentNodes() {
  await app.reloadNodeDefs()
  const offered = objectInfo(runnable.value)
  for (const type of PACK_NODE_TYPES) {
    if (!(type in offered) && type in LiteGraph.registered_node_types) {
      LiteGraph.unregisterNodeType(type)
    }
  }
}

function freshGraph(key: string | undefined): ComfyWorkflowJSON {
  const graph = key === 'matte_pass' ? MATTE_PASS_GRAPH : defaultGraph
  return { ...structuredClone(graph), id: crypto.randomUUID() }
}

// Show the active tab's workflow. `reload` re-resolves its nodes against the
// node types registered now. Missing nodes and models are flagged on the
// nodes, silently: no Errors overlay.
async function showActiveTab(reload: boolean) {
  const tab = activeTab.value
  if (!tab) return
  const existing = tab.workflowPath
    ? workflowStore.getWorkflowByPath(tab.workflowPath)
    : null
  if (existing?.isLoaded && (reload || !workflowStore.isActive(existing))) {
    await app.loadGraphData(
      toRaw(existing.activeState) as ComfyWorkflowJSON,
      true,
      true,
      existing,
      { ...QUIET_LOAD, checkForRerouteMigration: false }
    )
  } else if (!existing) {
    await app.loadGraphData(
      freshGraph(tab.workflowKey),
      true,
      true,
      tab.label,
      QUIET_LOAD
    )
    const path = workflowStore.activeWorkflow?.path
    if (path) tabsStore.setWorkflowPath(tab.id, path)
  }
  useWorkflowService().showPendingWarnings(undefined, { silent: true })
}

const ready = until(() => workflowStore.activeWorkflow).toBeTruthy()

const nodeDefsKey = computed(() => JSON.stringify(objectInfo(runnable.value)))
let registeredKey: string | null = null

// Only while a workflow tab is showing: re-measuring nodes in a hidden
// editor collapses them. Node types re-register only when the deployment
// changes what's available, and the graph then reloads against them.
async function syncEditor() {
  await ready
  await enqueue(async () => {
    setMockDeployment(runnable.value)
    if (!activeTab.value) return
    const changed = nodeDefsKey.value !== registeredKey
    if (changed) {
      await registerDeploymentNodes()
      registeredKey = nodeDefsKey.value
    }
    await showActiveTab(changed)
  })
}

onMounted(() => {
  customCloud.editorMounted = true
  void syncEditor()
})

watch(() => JSON.stringify(runnable.value), syncEditor)
watch(() => activeTab.value?.id, syncEditor)

watch(
  () => customCloud.runRequested,
  async (requested) => {
    if (!requested) return
    await ready
    await enqueue(async () => {
      customCloud.runRequested = false
      await useCommandStore().execute('Comfy.QueuePrompt')
    })
  }
)

// Run with missing nodes opens "choose where it runs" instead of queueing.
useEventListener(
  document,
  'click',
  (event: MouseEvent) => {
    const target = event.target
    if (!(target instanceof Element) || !target.closest(RUN_BUTTON)) return
    if (!customCloud.showsMissingNodes) return
    event.preventDefault()
    event.stopImmediatePropagation()
    customCloud.openRunTargetDialog()
  },
  { capture: true }
)

const coldStartAnchor = ref<Record<string, string> | null>(null)

watch(
  () => customCloud.runState,
  (state) => {
    const button = document.querySelector(RUN_BUTTON)
    if (state !== 'starting' || !button) {
      coldStartAnchor.value = null
      return
    }
    const rect = button.getBoundingClientRect()
    coldStartAnchor.value = {
      top: `${rect.bottom + 10}px`,
      left: `${Math.max(16, rect.right - 300)}px`
    }
  }
)
</script>
