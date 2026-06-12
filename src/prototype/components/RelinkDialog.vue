<!--
  Implements:
    open-q: ../IA_Plan/wiki/open-questions.md#local-media-as-references
    log:    ../IA_Plan/wiki/prototype-log.md — Flow 03 (relink lifecycle)

  Relink dialog for a referenced file whose original moved or was deleted.
  Built on the design-system Dialog so it matches ComfyUI. "Locate file…"
  stands in for an OS file chooser (fills a deterministic recovered path);
  when other missing files share the folder, offers a one-shot batch relink.
-->
<template>
  <Dialog :open="true" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{{ t('prototype.relinkDialog.title') }}</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <div class="flex flex-col gap-4 px-4 py-2">
          <DialogDescription>
            {{ t('prototype.relinkDialog.subtitle') }}
          </DialogDescription>

          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-muted-foreground">
              {{ t('prototype.relinkDialog.lastKnown') }}
            </span>
            <span
              class="flex items-center gap-1.5 rounded-lg bg-secondary-background px-3 py-2 text-sm"
            >
              <i
                class="icon-[lucide--unlink] size-3.5 shrink-0 text-muted-foreground"
              />
              <span class="truncate text-muted-foreground line-through">
                {{ asset.sourcePath }}
              </span>
            </span>
          </div>

          <div v-if="located" class="flex flex-col gap-1">
            <span class="text-xs font-medium text-muted-foreground">
              {{ t('prototype.relinkDialog.newLocation') }}
            </span>
            <span
              class="flex items-center gap-1.5 rounded-lg bg-secondary-background px-3 py-2 text-sm text-base-foreground"
            >
              <i
                class="text-success icon-[lucide--hard-drive] size-3.5 shrink-0"
              />
              <span class="truncate">{{ newPath }}</span>
            </span>
          </div>

          <label
            v-if="located && siblingCount > 0"
            class="flex cursor-pointer items-center gap-2 text-sm text-base-foreground"
          >
            <input v-model="alsoSiblings" type="checkbox" class="size-4" />
            <span>
              {{
                t('prototype.relinkDialog.siblings', { count: siblingCount })
              }}
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="textonly" @click="emit('close')">
            {{ t('prototype.relinkDialog.cancel') }}
          </Button>
          <Button v-if="!located" variant="secondary" @click="locate">
            <i class="icon-[lucide--folder-search] size-4" />
            {{ t('prototype.relinkDialog.locate') }}
          </Button>
          <Button v-else variant="primary" @click="confirm">
            {{ t('prototype.relinkDialog.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogPortal>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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

import {
  relocatedPathFor,
  useMediaReferenceStore
} from '../stores/mediaReferenceStore'
import type { LibraryAsset } from '../types'

const { asset } = defineProps<{
  asset: LibraryAsset
}>()

const emit = defineEmits<{
  close: []
  confirm: [payload: { newPath: string; alsoSiblings: boolean }]
}>()

const { t } = useI18n()
const mediaStore = useMediaReferenceStore()

const located = ref(false)
const alsoSiblings = ref(true)
const newPath = computed(() => relocatedPathFor(asset))
const siblingCount = computed(() => mediaStore.missingSiblingCount(asset))

function onOpenChange(open: boolean) {
  if (!open) emit('close')
}

function locate() {
  located.value = true
}

function confirm() {
  emit('confirm', {
    newPath: newPath.value,
    alsoSiblings: siblingCount.value > 0 && alsoSiblings.value
  })
}
</script>
