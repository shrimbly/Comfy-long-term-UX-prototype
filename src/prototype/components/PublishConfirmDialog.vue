<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/published-workflow-model.md

  Confirms publishing a draft over its source canonical. Publishing is an
  ungated overwrite that everyone with project access sees, so it gets an
  explicit confirm step (the prior version is retained in history).
-->
<template>
  <Dialog :open="true" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            <i18n-t keypath="prototype.publishConfirm.title" tag="span">
              <template #workflow>{{ workflowName }}</template>
              <template #n>{{ nextVersion }}</template>
            </i18n-t>
          </DialogTitle>
          <DialogClose />
        </DialogHeader>

        <div class="flex flex-col gap-2 px-4 py-2">
          <DialogDescription>
            <i18n-t keypath="prototype.publishConfirm.body" tag="span">
              <template #project>{{ projectName }}</template>
            </i18n-t>
          </DialogDescription>

          <textarea
            v-model="comment"
            rows="3"
            :placeholder="t('prototype.publishConfirm.commentPlaceholder')"
            class="w-full resize-none rounded-md border border-border-default bg-base-background px-2.5 py-1.5 text-sm text-base-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <DialogFooter>
          <Button variant="textonly" @click="emit('close')">
            {{ t('prototype.publishConfirm.cancel') }}
          </Button>
          <Button variant="secondary" @click="emit('publish-new')">
            {{ t('prototype.publishConfirm.publishNew') }}
          </Button>
          <Button variant="primary" @click="emit('confirm', comment.trim())">
            {{ t('prototype.publishConfirm.confirm', { n: nextVersion }) }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogPortal>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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

const { workflowName, projectName, nextVersion } = defineProps<{
  workflowName: string
  projectName: string
  nextVersion: number
}>()

const emit = defineEmits<{
  close: []
  confirm: [comment: string]
  'publish-new': []
}>()

const { t } = useI18n()
const comment = ref('')

function onOpenChange(open: boolean) {
  if (!open) emit('close')
}
</script>
