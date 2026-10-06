import { useI18n } from 'vue-i18n'

import { MATTE_PASS } from '../fixtures/customCloud'

interface Missing {
  nodePacks: string[]
  models: string[]
}

// What a deployment lacks for matte_pass, short enough for a menu row:
// "lacks acme-matte-tools", or "lacks all 4" when it has none of it.
export function useLacksLabel() {
  const { t } = useI18n()
  const needed = MATTE_PASS.nodePacks.length + MATTE_PASS.models.length
  return (missing: Missing) => {
    const items = [...missing.nodePacks, ...missing.models]
    return items.length === needed
      ? t('prototype.customCloud.dialog.lacksAll', { count: needed })
      : t('prototype.customCloud.dialog.lacks', { items: items.join(', ') })
  }
}
