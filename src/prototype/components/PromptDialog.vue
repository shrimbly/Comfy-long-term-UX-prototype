<!--
  Reusable styled single-field text-input dialog — the Comfy design-system
  replacement for the native window.prompt. The caller controls visibility
  (render with v-if) and supplies the copy; `confirm` emits the trimmed value.
  Built on the shared design-system Dialog.
-->
<template>
  <Dialog :open="true" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{{ title }}</DialogTitle>
        </DialogHeader>

        <div class="px-4 py-2">
          <input
            ref="inputRef"
            v-model="value"
            type="text"
            class="w-full rounded-md border border-border-default bg-base-background px-2.5 py-1.5 text-sm text-base-foreground outline-none placeholder:text-muted-foreground"
            :placeholder="placeholder"
            @keydown.enter="onConfirm"
          />
        </div>

        <DialogFooter>
          <Button variant="textonly" @click="emit('cancel')">
            {{ t('g.cancel') }}
          </Button>
          <Button
            variant="primary"
            :disabled="!value.trim()"
            @click="onConfirm"
          >
            {{ confirmLabel }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogPortal>
  </Dialog>
</template>

<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogOverlay from '@/components/ui/dialog/DialogOverlay.vue'
import DialogPortal from '@/components/ui/dialog/DialogPortal.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'

const {
  title,
  confirmLabel,
  initialValue = '',
  placeholder
} = defineProps<{
  title: string
  confirmLabel: string
  initialValue?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  confirm: [value: string]
  cancel: []
}>()

const { t } = useI18n()
const value = ref(initialValue)
const inputRef = useTemplateRef<HTMLInputElement>('inputRef')

onMounted(() => {
  inputRef.value?.focus()
  inputRef.value?.select()
})

function onConfirm() {
  const next = value.value.trim()
  if (!next) return
  emit('confirm', next)
}

function onOpenChange(open: boolean) {
  if (!open) emit('cancel')
}
</script>
