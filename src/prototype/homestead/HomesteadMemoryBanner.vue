<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import { useHomesteadStore } from './store'
const s = useHomesteadStore()
const { t } = useI18n()
const dismissed = ref(false)
watch(
  () => [s.openRequest, s.oom],
  () => {
    dismissed.value = false
  }
)
</script>
<template>
  <div
    v-if="s.entry === 'desktop' && s.allowed && !dismissed"
    role="status"
    class="flex shrink-0 flex-wrap items-center gap-3 border-b border-gold-400/20 bg-gold-400/5 px-5 py-2 text-base-foreground"
  >
    <i
      class="icon-[lucide--triangle-alert] size-5 shrink-0 text-gold-400"
      aria-hidden="true"
    />
    <p class="min-w-52 flex-1 text-sm font-medium">
      {{ t('homestead.memoryBannerTitle') }}
    </p>
    <div class="ml-auto flex items-center gap-2">
      <Button variant="inverted" size="sm" @click="s.dialog = 'desktop'"
        ><i class="icon-[lucide--cloud-upload] size-3.5" />{{
          t('homestead.deployCloud')
        }}</Button
      ><Button
        variant="muted-textonly"
        size="icon-sm"
        :aria-label="t('homestead.dismissMemoryBanner')"
        @click="dismissed = true"
        ><i class="icon-[lucide--x] size-4"
      /></Button>
    </div>
  </div>
</template>
