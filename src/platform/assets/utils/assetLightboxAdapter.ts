import { ResultItemImpl } from '@/stores/queueStore'
import { getMediaTypeFromFilename } from '@/utils/formatUtil'

import type { AssetItem } from '../schemas/assetSchema'

export function assetToResultItem(asset: AssetItem): ResultItemImpl {
  const mediaType = getMediaTypeFromFilename(asset.name)
  const item = new ResultItemImpl({
    filename: asset.name,
    subfolder: '',
    type: 'output',
    nodeId: '0',
    mediaType: mediaType === 'image' ? 'images' : mediaType
  })
  Object.defineProperty(item, 'url', {
    get() {
      return asset.preview_url || ''
    },
    configurable: true
  })
  return item
}
