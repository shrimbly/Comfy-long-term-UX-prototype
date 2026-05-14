<!--
  Implements:
    Modeled on ../../../../../ComfyUI_frontend/src/components/widget/nav/NavTitle.vue.
-->
<template>
  <div class="flex flex-col gap-1">
    <h2
      v-if="label && showHeader"
      class="m-0 px-3 pt-5 pb-0 text-xs font-bold text-text-secondary uppercase"
    >
      {{ label }}
    </h2>
    <slot />
  </div>
</template>

<script setup lang="ts">
const { label, showHeader = true } = defineProps<{
  label?: string
  showHeader?: boolean
}>()
</script>
