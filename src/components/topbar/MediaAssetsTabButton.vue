<template>
  <div
    class="workflow-tab media-assets-tab group flex items-center gap-2 p-2"
    v-bind="$attrs"
  >
    <i class="icon-[comfy--image-ai-edit] size-4 shrink-0" />
    <span class="workflow-label inline-block max-w-[150px] truncate text-sm">
      {{ t('mediaAssets.tab.title') }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
