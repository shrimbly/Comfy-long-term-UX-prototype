<template>
  <ContextMenu
    ref="contextMenuRef"
    :model="items"
    :pt="{
      root: {
        class: cn(
          'rounded-lg border border-border-default',
          'bg-secondary-background text-base-foreground',
          'shadow-lg'
        )
      }
    }"
    @hide="emit('hide')"
  >
    <template #item="{ item, props }">
      <Button
        variant="secondary"
        class="w-full justify-start gap-2"
        v-bind="props.action"
      >
        <i v-if="item.icon" :class="item.icon" class="size-4" />
        <span class="flex-1 text-left">{{ item.label }}</span>
      </Button>
    </template>
  </ContextMenu>
</template>

<script setup lang="ts">
import ContextMenu from 'primevue/contextmenu'
import type { MenuItem } from 'primevue/menuitem'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'
import { cn } from '@/utils/tailwindUtil'

const { t } = useI18n()

const target = ref<string | null>(null)

const emit = defineEmits<{
  rename: [group: string]
  deleteGroup: [group: string]
  deleteAllTags: [group: string]
  hide: []
}>()

const contextMenuRef = ref<InstanceType<typeof ContextMenu>>()

const items = computed<MenuItem[]>(() => {
  const name = target.value
  if (!name) return []
  return [
    {
      label: t('sideToolbar.mediaAssets.tagGroupContextMenu.rename'),
      icon: 'icon-[lucide--pencil]',
      command: () => emit('rename', name)
    },
    {
      label: t('sideToolbar.mediaAssets.tagGroupContextMenu.delete'),
      icon: 'icon-[lucide--folder-minus]',
      command: () => emit('deleteGroup', name)
    },
    {
      label: t('sideToolbar.mediaAssets.tagGroupContextMenu.deleteAllTags'),
      icon: 'icon-[lucide--trash-2]',
      command: () => emit('deleteAllTags', name)
    }
  ]
})

function show(event: MouseEvent, group: string) {
  target.value = group
  contextMenuRef.value?.show(event)
}

function hide() {
  contextMenuRef.value?.hide()
}

defineExpose({ show, hide })
</script>
