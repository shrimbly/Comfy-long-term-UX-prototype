<!--
  Implements:
    decision: ../IA_Plan/wiki/decisions/missing-nodes-choose-where-it-runs.md
              — build settings Platform owns open there
    decision: prototype/design-decisions.md — 2026-10-07 "Flow 07: the
              incompatible-workflow dialog, redesigned on a canvas"

  The "change this on Platform?" question asked over the incompatible-
  workflow dialog, styled as that dialog's panel so the two read as one.
-->
<template>
  <div
    class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
    role="alertdialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    :aria-describedby="messageId"
    @click.self="emit('cancel')"
    @keydown.escape.stop="emit('cancel')"
  >
    <div
      class="flex w-full max-w-[420px] flex-col gap-2 rounded-2xl border border-border-default bg-base-background p-6 text-base-foreground shadow-2xl"
    >
      <h3 :id="titleId" class="m-0 text-lg font-semibold">{{ title }}</h3>
      <p :id="messageId" class="m-0 text-sm text-muted-foreground">
        {{ message }}
      </p>
      <footer class="mt-4 flex justify-end gap-2">
        <Button variant="muted-textonly" size="md" @click="emit('cancel')">
          {{ t('g.cancel') }}
        </Button>
        <Button
          ref="confirmButton"
          variant="inverted"
          size="md"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
          <i class="icon-[lucide--external-link] size-3.5" />
        </Button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, useId, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

const { title, message, confirmLabel } = defineProps<{
  title: string
  message: string
  confirmLabel: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()
const titleId = useId()
const messageId = useId()
const confirmButton = useTemplateRef<{ $el: HTMLElement }>('confirmButton')

onMounted(() => confirmButton.value?.$el.focus())
</script>
