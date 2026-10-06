<!--
  Slide-over on the right edge for the quiet project header: the page stays
  in view behind it. Esc and the backdrop close it.
-->
<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex justify-end bg-black/30"
      @click.self="emit('close')"
    >
      <aside
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        class="flex h-full w-full max-w-sm flex-col gap-6 border-l border-border-subtle bg-base-background p-6 text-base-foreground"
      >
        <header class="flex items-center justify-between">
          <h2 :id="titleId" class="m-0 text-base font-medium">{{ title }}</h2>
          <Button
            variant="muted-textonly"
            size="icon"
            :aria-label="t('prototype.projectPage.sheet.close')"
            @click="emit('close')"
          >
            <i class="icon-[lucide--x] size-4" />
          </Button>
        </header>
        <slot />
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import { useId } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

defineProps<{
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const titleId = useId()

onKeyStroke('Escape', () => emit('close'))
</script>
