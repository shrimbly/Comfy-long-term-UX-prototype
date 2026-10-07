<template>
  <span
    class="rounded-full bg-warning-background px-1.5 text-[10px] font-medium tracking-wide text-base-foreground uppercase"
  >
    {{ t('prototype.customCloud.edit.changed') }}
  </span>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
