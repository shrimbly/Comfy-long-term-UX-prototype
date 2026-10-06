<!--
  One setting: a muted label on the left, the value on the right, an
  optional detail line under the value.
-->
<template>
  <div class="flex items-start justify-between gap-6 py-3">
    <dt class="shrink-0 text-sm text-muted-foreground">{{ label }}</dt>
    <dd class="m-0 flex min-w-0 flex-col items-end gap-0.5 text-sm">
      <slot />
      <span v-if="detail" class="text-xs text-muted-foreground">
        {{ detail }}
      </span>
    </dd>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  detail?: string
}>()
</script>
