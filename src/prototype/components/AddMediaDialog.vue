<!--
  Implements:
    open-q: ../IA_Plan/wiki/open-questions.md#local-media-as-references
    log:    ../IA_Plan/wiki/prototype-log.md — Flow 03 (add = always reference)

  Add-media dialog (design-system Dialog). The candidate list stands in for
  an OS file chooser; adding LINKS the files in place — Comfy stores a
  pointer and never copies the bytes.
-->
<template>
  <Dialog :open="true" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay />
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{{ t('prototype.addMediaDialog.title') }}</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <div class="flex flex-col gap-3 px-4 py-2">
          <DialogDescription>
            {{ t('prototype.addMediaDialog.subtitle') }}
          </DialogDescription>
          <ul class="flex flex-col gap-1">
            <li v-for="c in candidates" :key="c.path">
              <label
                class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary-background"
              >
                <input
                  v-model="selected"
                  type="checkbox"
                  :value="c.path"
                  class="size-4 shrink-0"
                />
                <i
                  class="icon-[lucide--hard-drive] size-3.5 shrink-0 text-muted-foreground"
                />
                <span
                  class="min-w-0 flex-1 truncate text-sm text-base-foreground"
                >
                  {{ c.path }}
                </span>
              </label>
            </li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="textonly" @click="emit('close')">
            {{ t('prototype.addMediaDialog.cancel') }}
          </Button>
          <Button
            variant="primary"
            :disabled="!selected.length"
            @click="confirm"
          >
            {{
              t('prototype.addMediaDialog.confirm', { count: selected.length })
            }}
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

const emit = defineEmits<{
  close: []
  confirm: [files: { path: string; tags: string[] }[]]
}>()

const { t } = useI18n()

const candidates: { path: string; tags: string[] }[] = [
  {
    path: '/Users/willie/Pictures/Shoots/2026-aurora/aurora_005.png',
    tags: ['photo', 'aurora']
  },
  {
    path: '/Users/willie/Pictures/renders/cyber-city/skyline_03.png',
    tags: ['render', 'cyber']
  },
  {
    path: '/Users/willie/Downloads/texture_pack/concrete_03.png',
    tags: ['texture']
  }
]

const selected = ref<string[]>(candidates.map((c) => c.path))

const tagsByPath = computed(() => {
  const map = new Map<string, string[]>()
  for (const c of candidates) map.set(c.path, c.tags)
  return map
})

function onOpenChange(open: boolean) {
  if (!open) emit('close')
}

function confirm() {
  emit(
    'confirm',
    selected.value.map((path) => ({
      path,
      tags: tagsByPath.value.get(path) ?? []
    }))
  )
}
</script>
