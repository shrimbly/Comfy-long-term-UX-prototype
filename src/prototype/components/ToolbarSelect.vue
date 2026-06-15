<!--
  Small toolbar dropdown select for list toolbars (filter, sort). The
  trigger shows the active option's label; the menu lists options with a
  check on the current one. Closes on outside-click or select. Generic
  over the option value so callers keep their union types.
-->
<template>
  <div ref="rootRef" class="relative inline-flex">
    <Button
      variant="secondary"
      size="md"
      class="gap-1.5"
      :aria-label="ariaLabel"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span>{{ selectedLabel }}</span>
      <i class="icon-[lucide--chevron-down] size-3.5 text-muted-foreground" />
    </Button>
    <div
      v-if="isOpen"
      class="absolute top-full right-0 z-20 mt-1 flex w-44 flex-col gap-0.5 rounded-lg border border-border-default bg-interface-menu-surface p-1 shadow-[1px_1px_8px_0_rgb(0_0_0/0.4)]"
    >
      <Button
        v-for="opt in options"
        :key="opt.value"
        variant="textonly"
        size="unset"
        class="justify-between gap-2 rounded-sm px-3 py-2 text-left"
        @click="onSelect(opt.value)"
      >
        <span>{{ opt.label }}</span>
        <i
          v-if="opt.value === model"
          class="icon-[lucide--check] size-3.5 text-muted-foreground"
        />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
import { onClickOutside } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'

import Button from '@/components/ui/button/Button.vue'

const { options, ariaLabel } = defineProps<{
  options: Array<{ value: T; label: string }>
  ariaLabel?: string
}>()

const model = defineModel<T>({ required: true })

const isOpen = ref(false)
const rootRef = useTemplateRef<HTMLElement>('rootRef')
onClickOutside(rootRef, () => {
  isOpen.value = false
})

const selectedLabel = computed(
  () => options.find((o) => o.value === model.value)?.label ?? ''
)

function onSelect(value: T) {
  model.value = value
  isOpen.value = false
}
</script>
