<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import { useHomesteadStore } from './store'
const s = useHomesteadStore()
const { t } = useI18n()
const now = useNow({ interval: 1000 })
const job = computed(() =>
  s.activeJob?.status === 'cold-start' ? s.activeJob : undefined
)
const elapsed = computed(() => {
  const seconds = Math.max(
    0,
    Math.floor(
      (now.value.getTime() - (job.value?.startedAt ?? now.value.getTime())) /
        1000
    )
  )
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
})
</script>
<template>
  <aside
    v-if="job && s.entry === 'cloud'"
    class="absolute top-16 right-4 z-30 w-96 max-w-[calc(100%-2rem)] rounded-xl border border-border-default bg-base-background p-4 text-base-foreground shadow-lg"
    :aria-label="t('homestead.jobStatus')"
  >
    <div role="status" class="space-y-2">
      <div class="flex items-center gap-2 text-sm font-medium">
        <i
          class="icon-[lucide--loader-circle] size-4 shrink-0 animate-spin text-azure-300"
          aria-hidden="true"
        />
        <span>{{ t('homestead.jobColdTitle') }}</span>
        <span
          class="ml-auto rounded-sm bg-secondary-background px-2 py-1 text-xs font-normal text-muted-foreground"
          >{{ t('homestead.jobColdBadge') }}</span
        >
      </div>
      <p class="truncate text-xs text-muted-foreground">
        {{ job.workflow }} · {{ job.revision }}
      </p>
      <p class="text-xs leading-5 text-muted-foreground">
        {{ t('homestead.jobColdBody') }}
      </p>
    </div>
    <div class="mt-3 flex items-center justify-between gap-3">
      <span class="text-xs text-muted-foreground tabular-nums">{{
        t('homestead.jobElapsed', { time: elapsed })
      }}</span>
      <Button variant="muted-textonly" size="sm" @click="s.cancelJob()">{{
        t('homestead.cancelJob')
      }}</Button>
    </div>
  </aside>
</template>
