<!--
  The other way to run a project, offered inside Edit deployment: Comfy
  Cloud from a custom deployment, a custom deployment from Comfy Cloud.
  One card, one line, one button. Nothing changes until the summary step.
-->
<template>
  <div
    class="flex items-center gap-4 rounded-xl border border-border-subtle bg-secondary-background/40 p-4"
  >
    <span
      class="grid size-10 shrink-0 place-items-center rounded-lg bg-base-background"
    >
      <i :class="cn(icon, 'size-5')" />
    </span>
    <span class="flex min-w-0 flex-1 flex-col gap-0.5">
      <span class="text-sm font-medium">{{ title }}</span>
      <span class="text-xs text-muted-foreground">{{ body }}</span>
    </span>
    <Button variant="outline" size="md" @click="emit('switch')">
      {{ action }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@comfyorg/tailwind-utils'

import Button from '@/components/ui/button/Button.vue'

const { icon, title, body, action } = defineProps<{
  icon: string
  title: string
  body: string
  action: string
}>()

const emit = defineEmits<{
  switch: []
}>()
</script>
