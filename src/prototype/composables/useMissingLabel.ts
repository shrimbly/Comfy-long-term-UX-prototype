import { useI18n } from 'vue-i18n'

interface Missing {
  nodePacks: string[]
  models: string[]
}

// What a deployment lacks, short enough for a menu row: "Missing 1 node
// pack", or "Missing 2 packs, 2 models" when it lacks both.
export function useMissingLabel() {
  const { t } = useI18n()
  return ({ nodePacks, models }: Missing) => {
    const both = nodePacks.length > 0 && models.length > 0
    const items = [
      nodePacks.length &&
        t(
          both
            ? 'prototype.customCloud.dialog.packsCount'
            : 'prototype.customCloud.dialog.nodePacksCount',
          nodePacks.length
        ),
      models.length &&
        t('prototype.customCloud.dialog.modelsCount', models.length)
    ].filter(Boolean)
    return t('prototype.customCloud.dialog.missingSummary', {
      items: items.join(', ')
    })
  }
}
