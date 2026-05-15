// Mocks the network/upload cost of promoting locally-stored fixture
// assets to cloud. Wired to the "Save to cloud" context-menu action so
// the prototype demo feels like a real operation: a sticky progress
// toast updates as each asset "uploads", then a success toast confirms.
//
// Implements:
//   decision: ../IA_Plan/wiki/decisions/promoting-local-outputs-to-cloud.md

import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'

import type { AssetItem } from '@/platform/assets/schemas/assetSchema'

import { promotePrototypeAssetsToCloud } from '../fixtures/mediaAssets'

const PROGRESS_GROUP = 'save-to-cloud'
const PER_ASSET_DELAY_MS = 350

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

    const summary = t('mediaAsset.actions.savingToCloudSummary')
    const renderProgress = (done: number) =>
      toast.add({
        group: PROGRESS_GROUP,
        severity: 'info',
        summary,
        detail: t('mediaAsset.actions.savingToCloudDetail', {
          current: done,
          total,
          destination: destinationLabel
        }),
        life: 0,
        closable: false
      })

    renderProgress(0)

    for (let i = 0; i < total; i++) {
      await sleep(PER_ASSET_DELAY_MS)
      promotePrototypeAssetsToCloud([assets[i].id])
      toast.removeGroup(PROGRESS_GROUP)
      if (i < total - 1) renderProgress(i + 1)
    }

    toast.removeGroup(PROGRESS_GROUP)
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
