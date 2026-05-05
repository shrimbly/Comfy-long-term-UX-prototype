import MediaAssetsModal from '@/platform/assets/components/MediaAssetsModal.vue'
import { useDialogService } from '@/services/dialogService'
import { useDialogStore } from '@/stores/dialogStore'

const DIALOG_KEY = 'global-media-assets-browser'

export function useMediaAssetBrowserDialog() {
  const dialogService = useDialogService()
  const dialogStore = useDialogStore()

  function hide() {
    dialogStore.closeDialog({ key: DIALOG_KEY })
  }

  function show() {
    dialogService.showLayoutDialog({
      key: DIALOG_KEY,
      component: MediaAssetsModal,
      props: {
        onClose: hide
      }
    })
  }

  return { show, hide }
}
