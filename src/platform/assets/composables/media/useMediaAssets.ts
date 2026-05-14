import { isCloud } from '@/platform/distribution/types'
import { usePrototypeAssetsProvider } from '@/prototype/composables/usePrototypeAssetsProvider'

import type { IAssetsProvider, IFolderNavigation } from './IAssetsProvider'
import { useAssetsApi } from './useAssetsApi'
import { useInternalFilesApi } from './useInternalFilesApi'

const isPrototypeRoute = () =>
  typeof window !== 'undefined' &&
  window.location.pathname.startsWith('/prototype')

/**
 * Factory function that returns the appropriate media assets implementation
 * based on the current distribution (cloud vs internal). When mounted under
 * /prototype, swaps in a fixture-driven provider so the prototype demo runs
 * without a backend.
 */
export function useMediaAssets(
  directory: 'input' | 'output'
): IAssetsProvider & IFolderNavigation {
  if (isPrototypeRoute()) return usePrototypeAssetsProvider(directory)
  return isCloud ? useAssetsApi(directory) : useInternalFilesApi(directory)
}
