<!--
  A copy of the Comfy "Thumbnail" frame
    (Figma: hutzmEKvsruHfgpMBlPIRw, node 1:5)
  with the "UI DESIGN" subtitle swapped for the workflow name. Stands in
  for a user-supplied custom thumbnail. Sizes everything in container-query
  units so the same frame reads correctly at card, strip, and tile scales.
-->
<template>
  <div
    class="@container flex size-full flex-col items-center justify-center gap-[6cqw] bg-[#211927] px-[8cqw]"
  >
    <img
      src="/wf-thumbs/comfy-wordmark.svg"
      alt=""
      class="w-[44cqw] max-w-[180px]"
    />
    <p
      class="m-0 line-clamp-2 text-center text-[8cqw] leading-[1.15] font-medium text-[#f2ff59]"
    >
      {{ title }}
    </p>
  </div>
</template>

<script setup lang="ts">
const { title } = defineProps<{ title: string }>()
</script>
