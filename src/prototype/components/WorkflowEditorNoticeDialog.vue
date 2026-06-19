<!--
  Placeholder notice shown when a workflow would open in the editor (e.g. the
  project page's "+ Workflow"). The editor is out of scope for this dashboard
  prototype, so we acknowledge that it would open in a tab (design-system
  Dialog), and the tab strip already shows the new tab.
-->
<template>
  <Dialog :open="true" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{{
            t('prototype.workflowEditorNotice.title')
          }}</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <div class="px-4 py-2">
          <DialogDescription>
            {{ t('prototype.workflowEditorNotice.body') }}
          </DialogDescription>
        </div>

        <DialogFooter>
          <Button variant="primary" @click="emit('close')">
            {{ t('prototype.workflowEditorNotice.ok') }}
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
