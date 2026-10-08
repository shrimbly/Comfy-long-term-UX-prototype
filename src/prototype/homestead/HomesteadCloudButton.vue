<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import { useHomesteadStore } from './store'
const s = useHomesteadStore()
const { t } = useI18n()
</script>
<template>
  <Button
    v-if="s.enabled && s.entry === 'desktop'"
    variant="inverted"
    size="md"
    class="h-8 shrink-0 gap-2"
    data-testid="homestead-run-cloud"
    @click="s.dialog = 'desktop'"
    ><i class="icon-[lucide--cloud-upload] size-4" />{{
      t('homestead.runCloud')
    }}</Button
  >
</template>
