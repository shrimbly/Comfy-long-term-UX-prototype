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

const targets = ref<string[]>([])

const emit = defineEmits<{
  delete: [tags: string[]]
  group: [tags: string[]]
  rename: [tag: string]
  hide: []
}>()

const contextMenuRef = ref<InstanceType<typeof ContextMenu>>()

const items = computed<MenuItem[]>(() => {
  const tags = targets.value
  const isSingle = tags.length === 1
  const result: MenuItem[] = []
  if (isSingle) {
    result.push({
      label: t('sideToolbar.mediaAssets.tagContextMenu.rename'),
      icon: 'icon-[lucide--pencil]',
      command: () => emit('rename', tags[0])
    })
  }
  result.push({
    label: t('sideToolbar.mediaAssets.tagContextMenu.group'),
    icon: 'icon-[lucide--folder-plus]',
    command: () => emit('group', tags.slice())
  })
  result.push({
    label: isSingle
      ? t('sideToolbar.mediaAssets.tagContextMenu.delete')
      : t('sideToolbar.mediaAssets.tagContextMenu.deleteMulti', {
          count: tags.length
        }),
    icon: 'icon-[lucide--trash-2]',
    command: () => emit('delete', tags.slice())
  })
  return result
})

function show(event: MouseEvent, nextTargets: string[]) {
  targets.value = nextTargets.slice()
  contextMenuRef.value?.show(event)
}

function hide() {
  contextMenuRef.value?.hide()
}

defineExpose({ show, hide })
</script>
