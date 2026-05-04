import type {
  DatePreset,
  MetadataField
} from '@/platform/assets/types/metadataFilter'
import { DATE_PRESETS } from '@/platform/assets/types/metadataFilter'

type Translator = (key: string, params?: Record<string, unknown>) => string

export function formatMetadataFilterValue(
  t: Translator,
  field: MetadataField,
  value: string
): string {
  if (field === 'date' && (DATE_PRESETS as string[]).includes(value)) {
    return t(`assets.metadata.datePresets.${value as DatePreset}`)
  }
  if (field === 'type') {
    return t(`assets.metadata.mediaTypes.${value}`)
  }
  return value
}
