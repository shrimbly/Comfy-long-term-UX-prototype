<template>
  <span
    class="inline-flex max-w-full items-center gap-1 rounded-sm bg-modal-card-tag-background px-1.5 py-0.5 font-mono text-2xs text-modal-card-tag-foreground"
  >
    <span class="truncate">{{ name }}</span>
    <button
      v-if="removable"
      type="button"
      :disabled="disabled"
      :aria-label="t('mediaAsset.tags.removeTag', { name })"
      class="-mr-0.5 inline-flex size-3 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-modal-card-tag-foreground opacity-60 transition-opacity hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
      @click="emit('remove')"
      @pointerdown.stop
    >
      <i class="icon-[lucide--x] size-2.5" aria-hidden="true" />
    </button>
  </span>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const {
  name,
  removable = false,
  disabled = false
} = defineProps<{
  name: string
  removable?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{ remove: [] }>()

const { t } = useI18n()
</script>
