// Mocks the network/upload cost of promoting locally-stored fixture
// assets to cloud. Wired to the "Save to cloud" context-menu action so
// the prototype demo feels like a real operation: a sticky progress
// toast updates as each asset "uploads", then a success toast confirms.
//
// Implements:
//   decision: ../IA_Plan/wiki/decisions/promoting-local-outputs-to-cloud.md
//
// The progress toast is a SINGLE PrimeVue toast in the "save-to-cloud"
// group whose body is rendered via PrototypeLayout's <Toast #message>
// slot. The slot reads `uploadProgress` (this module's reactive ref) on
// every tick, so the same toast updates in place rather than flickering
// through add/remove cycles.

import { useToast } from 'primevue/usetoast'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { AssetItem } from '@/platform/assets/schemas/assetSchema'

import { promotePrototypeAssetsToCloud } from '../fixtures/mediaAssets'

const PROGRESS_GROUP = 'save-to-cloud'
const PER_ASSET_DELAY_MS = 350

interface UploadProgress {
  done: number
  total: number
  destination: string
}

export const uploadProgress = ref<UploadProgress | null>(null)

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export function useSimulatedSaveToCloud() {
  const toast = useToast()
  const { t } = useI18n()

  async function saveToCloud(
    assets: AssetItem[],
    destinationLabel: string
  ): Promise<void> {
    const total = assets.length
    if (total === 0) return

    uploadProgress.value = { done: 0, total, destination: destinationLabel }
    toast.add({
      group: PROGRESS_GROUP,
      severity: 'info',
      life: 0,
      closable: false
    })

    for (let i = 0; i < total; i++) {
      await sleep(PER_ASSET_DELAY_MS)
      promotePrototypeAssetsToCloud([assets[i].id])
      uploadProgress.value = {
        done: i + 1,
        total,
        destination: destinationLabel
      }
    }

    toast.removeGroup(PROGRESS_GROUP)
    uploadProgress.value = null

    toast.add({
      severity: 'success',
      summary: t('mediaAsset.actions.promotedToCloudSummary'),
      detail:
        total === 1
          ? t('mediaAsset.actions.promotedToCloudDetail', {
              destination: destinationLabel
            })
          : t('mediaAsset.selection.promotedSelectedDetail', { count: total }),
      life: 4000
    })
  }

  return { saveToCloud }
}
