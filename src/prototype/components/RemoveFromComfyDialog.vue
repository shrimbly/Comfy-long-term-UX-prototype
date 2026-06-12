<!--
  Implements:
    open-q: ../IA_Plan/wiki/open-questions.md#local-media-as-references
    log:    ../IA_Plan/wiki/prototype-log.md — Flow 03 (remove ≠ delete)

  Confirms removing a referenced file from Comfy (design-system Dialog).
  Removing drops the pointer only — the original stays on disk.
-->
<template>
  <Dialog :open="true" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{{
            t('prototype.removeMediaDialog.title')
          }}</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <div class="flex flex-col gap-3 px-4 py-2">
          <DialogDescription>
            {{ t('prototype.removeMediaDialog.body', { name: asset.name }) }}
          </DialogDescription>
          <span
            class="flex items-center gap-1.5 rounded-lg bg-secondary-background px-3 py-2 text-sm text-base-foreground"
          >
            <i
              class="icon-[lucide--hard-drive] size-3.5 shrink-0 text-muted-foreground"
            />
            <span class="truncate">{{ asset.sourcePath }}</span>
          </span>
        </div>

        <DialogFooter>
          <Button variant="textonly" @click="emit('close')">
            {{ t('prototype.removeMediaDialog.cancel') }}
          </Button>
          <Button variant="destructive" @click="emit('confirm')">
            {{ t('prototype.removeMediaDialog.confirm') }}
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
import type { LibraryAsset } from '../types'

const { asset } = defineProps<{
  asset: LibraryAsset
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const { t } = useI18n()

function onOpenChange(open: boolean) {
  if (!open) emit('close')
}
</script>
