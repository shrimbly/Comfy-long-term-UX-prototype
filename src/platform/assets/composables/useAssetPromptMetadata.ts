import { shallowReactive } from 'vue'

import { api } from '@/scripts/api'
import { getFromPngBuffer } from '@/scripts/metadata/png'
import type { AssetItem } from '@/platform/assets/schemas/assetSchema'
import type { PromptMetadata } from '@/platform/assets/utils/promptMetadataParser'
import { parsePromptMetadata } from '@/platform/assets/utils/promptMetadataParser'
import { useWorkflowStore } from '@/platform/workflow/management/stores/workflowStore'

/**
 * Each PNG metadata extraction fetches a full image. Without a cap, a batch
 * of thousands floods the renderer with parallel `fetch()` calls until Chrome
 * fails them with `ERR_INSUFFICIENT_RESOURCES`, which also starves the
 * `<img>` thumbnail requests of connection slots. This keeps a few slots free.
 */
const MAX_CONCURRENT_METADATA_FETCHES = 3

export function useAssetPromptMetadata() {
  const cache = shallowReactive(new Map<string, PromptMetadata>())
  const inFlight = new Map<string, Promise<PromptMetadata | null>>()
  const queue: Array<() => void> = []
  let activeCount = 0

  function acquireSlot(): Promise<void> {
    if (activeCount < MAX_CONCURRENT_METADATA_FETCHES) {
      activeCount++
      return Promise.resolve()
    }
    return new Promise<void>((resolve) => {
      queue.push(() => {
        activeCount++
        resolve()
      })
    })
  }

  function releaseSlot(): void {
    activeCount--
    const next = queue.shift()
    if (next) next()
  }

  function scheduleFetch(asset: AssetItem): Promise<PromptMetadata | null> {
    const cached = inFlight.get(asset.id)
    if (cached) return cached
    const promise = (async () => {
      await acquireSlot()
      try {
        const metadata = await fetchMetadata(asset)
        if (metadata) cache.set(asset.id, metadata)
        return metadata
      } finally {
        inFlight.delete(asset.id)
        releaseSlot()
      }
    })()
    inFlight.set(asset.id, promise)
    return promise
  }

  async function extractMetadata(
    asset: AssetItem
  ): Promise<PromptMetadata | null> {
    if (cache.has(asset.id)) return cache.get(asset.id)!
    return scheduleFetch(asset)
  }

  function getCached(assetId: string): PromptMetadata | null {
    return cache.get(assetId) ?? null
  }

  function extractBatch(assets: AssetItem[]): void {
    for (const asset of assets) {
      if (cache.has(asset.id) || inFlight.has(asset.id)) continue
      void scheduleFetch(asset)
    }
  }

  function getAvailableValues(
    field: 'model' | 'lora' | 'workflowTitle'
  ): string[] {
    const seen = new Set<string>()
    for (const meta of cache.values()) {
      const raw = meta[field]
      if (!raw) continue
      if (field === 'lora') {
        for (const part of raw.split(',')) {
          const trimmed = part.trim()
          if (trimmed) seen.add(trimmed)
        }
      } else {
        seen.add(raw)
      }
    }
    return [...seen].sort((a, b) => a.localeCompare(b))
  }

  return { extractMetadata, getCached, extractBatch, getAvailableValues }
}

function hasData(meta: PromptMetadata | null): meta is PromptMetadata {
  if (!meta) return false
  return (
    meta.model !== null ||
    meta.lora !== null ||
    meta.vae !== null ||
    meta.workflowTitle !== null ||
    meta.prompt !== null ||
    meta.steps !== null ||
    meta.seed !== null
  )
}

async function fetchMetadata(asset: AssetItem): Promise<PromptMetadata | null> {
  const jobId = asset.user_metadata?.jobId as string | undefined
  if (jobId) {
    const result = await fetchFromJob(jobId)
    if (hasData(result)) return result
  }

  if (asset.preview_url && asset.name.endsWith('.png')) {
    return fetchFromPng(asset.preview_url)
  }

  return null
}

function resolveWorkflowTitle(
  workflowId: string | null | undefined
): string | null {
  if (!workflowId) return null
  const store = useWorkflowStore()
  for (const wf of store.openWorkflows) {
    if (wf.activeState?.id === workflowId) {
      return wf.filename
    }
  }
  return workflowId
}

async function fetchFromJob(jobId: string): Promise<PromptMetadata | null> {
  try {
    const detail = await api.getJobDetail(jobId)
    if (!detail) return null

    const workflowTitle = resolveWorkflowTitle(detail.workflow_id)

    if (!detail.workflow) {
      return workflowTitle
        ? {
            model: null,
            lora: null,
            vae: null,
            workflowTitle,
            prompt: null,
            steps: null,
            seed: null
          }
        : null
    }

    const workflow = detail.workflow as Record<string, unknown>
    const prompt = workflow.prompt ?? workflow
    const parsed = parsePromptMetadata(prompt)
    if (!parsed) {
      return workflowTitle
        ? {
            model: null,
            lora: null,
            vae: null,
            workflowTitle,
            prompt: null,
            steps: null,
            seed: null
          }
        : null
    }
    return { ...parsed, workflowTitle }
  } catch {
    return null
  }
}

async function fetchFromPng(url: string): Promise<PromptMetadata | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const buffer = await response.arrayBuffer()
    const chunks = await getFromPngBuffer(buffer)
    if (!chunks.prompt) return null

    const promptData = JSON.parse(chunks.prompt)
    return parsePromptMetadata(promptData)
  } catch {
    return null
  }
}
