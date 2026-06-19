<!--
  Shared empty state for workflow listings — the Home Recents strip, the
  Recents page, and the My Workflows page. A dashed-outline box on the page
  background with a heading and two CTAs: Blank canvas (secondary, presentational
  stub) and Open templates (primary → Templates). The surrounding heading/title
  is owned by each caller; this is just the box.
-->
<template>
  <div
    class="flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-border-subtle bg-base-background px-6 py-12 text-center"
  >
    <h3 class="text-base font-normal">{{ heading }}</h3>
    <div class="flex flex-wrap items-center justify-center gap-3">
      <Button variant="secondary" size="md">
        <i class="icon-[lucide--plus] size-4" />
        {{ t('prototype.workflowsEmpty.blankCanvas') }}
      </Button>
      <Button
        variant="primary"
        size="md"
        @click="uiStore.go({ kind: 'templates' })"
      >
        <i class="icon-[lucide--layout-template] size-4" />
        {{ t('prototype.workflowsEmpty.openTemplates') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import { usePrototypeUiStore } from '../stores/uiStore'

defineProps<{ heading: string }>()

const { t } = useI18n()
const uiStore = usePrototypeUiStore()
</script>
