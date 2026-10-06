import { getMediaTypeFromFilename } from '@/utils/formatUtil'
import type { AugmentedResultItem } from '@/utils/resultItem'

import type { AssetItem } from '../schemas/assetSchema'

export function assetToResultItem(asset: AssetItem): AugmentedResultItem {
  const mediaType = getMediaTypeFromFilename(asset.name)
  return {
    filename: asset.name,
    subfolder: '',
    type: 'output',
    nodeId: '0',
    mediaType: mediaType === 'image' ? 'images' : mediaType,
    url: asset.preview_url || ''
  }
}
