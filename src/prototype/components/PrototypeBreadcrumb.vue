<!--
  Breadcrumb trail for prototype pages. Items render left→right with chevron
  separators; the last item is the current location (non-interactive) and every
  earlier item is a link that emits `navigate` with its index.
-->
<template>
  <nav
    class="flex items-center gap-1.5 text-sm"
    :aria-label="t('prototype.breadcrumb.aria')"
  >
    <template v-for="(item, i) in items" :key="i">
      <i
        v-if="i > 0"
        class="icon-[lucide--chevron-right] size-4 text-muted-foreground"
      />
      <span
        v-if="i === items.length - 1"
        class="font-medium text-base-foreground"
      >
        {{ item }}
      </span>
      <button
        v-else
        type="button"
        class="cursor-pointer text-muted-foreground transition-colors hover:text-base-foreground"
        @click="emit('navigate', i)"
      >
        {{ item }}
      </button>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { items } = defineProps<{ items: string[] }>()

const emit = defineEmits<{ navigate: [index: number] }>()

const { t } = useI18n()
</script>
