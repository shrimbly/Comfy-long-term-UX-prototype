<!--
  "Open" CTA shown on a published workflow card to the right of "Save a copy",
  only when the viewer already has at least one copy of the canonical. A single
  copy opens directly; multiple copies open a selector popover that lists each
  copy (name + last-modified). The popover is teleported to body so it escapes
  the card's overflow clip, mirroring WorkflowVersionBadge.
-->
<template>
  <span ref="rootRef" class="pointer-events-auto inline-flex">
    <Button variant="primary" size="sm" @click.stop="onTrigger">
      <i class="icon-[lucide--square-arrow-out-up-right] size-4" />
      {{ t('prototype.workflowCard.openAction') }}
      <i v-if="multiple" class="icon-[lucide--chevron-down] size-3.5" />
    </Button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="popRef"
        class="fixed z-50 flex w-64 flex-col gap-0.5 rounded-lg border border-border-default bg-interface-menu-surface p-1 shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
        :style="popStyle"
      >
        <p class="px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {{ t('prototype.workflowCard.openCopyHeading') }}
        </p>
        <button
          v-for="copy in copies"
          :key="copy.id"
          type="button"
          class="flex w-full cursor-pointer appearance-none items-center justify-between gap-2 rounded-sm border-0 bg-transparent px-2 py-1.5 text-left text-xs text-base-foreground transition-colors hover:bg-interface-menu-component-surface-hovered focus:bg-interface-menu-component-surface-hovered focus:outline-none"
          @click.stop="select(copy.id)"
        >
          <span class="min-w-0 flex-1 truncate font-medium">{{
            copy.name
          }}</span>
          <span class="shrink-0 text-muted-foreground">{{
            copy.updatedAt
          }}</span>
        </button>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import type { Workflow } from '../types'

const { copies } = defineProps<{
  copies: Workflow[]
}>()

const emit = defineEmits<{
  open: [workflowId: string]
}>()

const { t } = useI18n()

const multiple = computed(() => copies.length > 1)

const POPOVER_WIDTH = 256
const open = ref(false)
const rootRef = useTemplateRef<HTMLElement>('rootRef')
const popRef = useTemplateRef<HTMLElement>('popRef')
const popStyle = ref<Record<string, string>>({})

function onTrigger() {
  if (!multiple.value) {
    const only = copies[0]
    if (only) emit('open', only.id)
    return
  }
  if (open.value) {
    open.value = false
    return
  }
  const rect = rootRef.value?.getBoundingClientRect()
  if (rect) {
    const left = Math.max(
      8,
      Math.min(
        rect.right - POPOVER_WIDTH,
        window.innerWidth - POPOVER_WIDTH - 8
      )
    )
    popStyle.value = { top: `${rect.bottom + 4}px`, left: `${left}px` }
  }
  open.value = true
}

function select(workflowId: string) {
  emit('open', workflowId)
  open.value = false
}

onClickOutside(popRef, () => (open.value = false), { ignore: [rootRef] })
</script>
