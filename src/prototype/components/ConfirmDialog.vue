<!--
  Reusable styled confirmation dialog — the Comfy design-system replacement for
  the native window.confirm. The caller controls visibility (render with v-if)
  and supplies the copy; it emits `confirm` / `cancel`. Built on the shared
  design-system Dialog.
-->
<template>
  <Dialog :open="true" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{{ title }}</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <div class="px-4 py-2">
          <DialogDescription>{{ message }}</DialogDescription>
        </div>

        <DialogFooter>
          <Button variant="textonly" @click="emit('cancel')">
            {{ cancelLabel ?? t('g.cancel') }}
          </Button>
          <Button
            :variant="danger ? 'destructive' : 'primary'"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
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

const {
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false
} = defineProps<{
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()

function onOpenChange(open: boolean) {
  if (!open) emit('cancel')
}
</script>
