<!--
  Placeholder notice shown when the sidebar's "Media assets" item is clicked.
  The media library opens in a workbench tab in the real app; in this dashboard
  prototype we just acknowledge where it would go (design-system Dialog).
-->
<template>
  <Dialog :open="true" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{{
            t('prototype.mediaAssetsNotice.title')
          }}</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <div class="px-4 py-2">
          <DialogDescription>
            {{ t('prototype.mediaAssetsNotice.body') }}
          </DialogDescription>
        </div>

        <DialogFooter>
          <Button variant="primary" @click="emit('close')">
            {{ t('prototype.mediaAssetsNotice.ok') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogPortal>
  </Dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogClose from '@/components/ui/dialog/DialogClose.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogDescription from '@/components/ui/dialog/DialogDescription.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogOverlay from '@/components/ui/dialog/DialogOverlay.vue'
import DialogPortal from '@/components/ui/dialog/DialogPortal.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

function onOpenChange(open: boolean) {
  if (!open) emit('close')
}
</script>
