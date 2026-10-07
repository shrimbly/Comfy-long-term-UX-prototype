<!--
  Implements:
    decision: prototype/design-decisions.md — 2026-10-08 "Flow 07: the
              coding agent leads 'choose where it runs'"

  The two ways to get a deployment that runs the workflow: the user's own
  coding agent leads, the way Platform's "Use your coding agent" does, and
  building it here on Comfy Cloud is the alternative under it.
-->
<template>
  <div class="flex flex-col gap-3.5">
    <Button
      variant="inverted"
      size="lg"
      class="h-12 w-full gap-3"
      @click="emit('agent')"
    >
      <AgentIconStack />
      {{ t('prototype.customCloud.dialog.useAgent') }}
    </Button>
    <div
      class="flex items-center gap-4 text-xs text-muted-foreground"
      aria-hidden="true"
    >
      <span class="h-px flex-1 bg-border-subtle" />
      {{ t('prototype.customCloud.dialog.or') }}
      <span class="h-px flex-1 bg-border-subtle" />
    </div>
    <Button
      variant="outline"
      size="lg"
      class="h-12 w-full"
      @click="emit('here')"
    >
      {{ t('prototype.customCloud.dialog.buildHere') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import Button from '@/components/ui/button/Button.vue'

import AgentIconStack from './AgentIconStack.vue'

const emit = defineEmits<{
  agent: []
  here: []
}>()

const { t } = useI18n()
</script>
