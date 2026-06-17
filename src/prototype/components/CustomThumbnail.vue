<!--
  A copy of the Comfy "Thumbnail" frame
    (Figma: hutzmEKvsruHfgpMBlPIRw, node 1:5)
  with the "UI DESIGN" subtitle swapped for the workflow name. Stands in
  for a user-supplied custom thumbnail. Drawn as an SVG with a 3:2 viewBox
  so the Comfy wordmark + title scale crisply at card, strip, and tile
  sizes (the card thumbnail areas are all 3:2).
-->
<template>
  <svg
    viewBox="0 0 300 200"
    preserveAspectRatio="xMidYMid meet"
    class="size-full"
  >
    <rect width="300" height="200" fill="#211927" />
    <image
      href="/wf-thumbs/comfy-wordmark.svg"
      x="90"
      y="50"
      width="120"
      height="73"
      preserveAspectRatio="xMidYMid meet"
    />
    <text
      x="150"
      y="162"
      fill="#f2ff59"
      font-family="Inter, ui-sans-serif, sans-serif"
      font-size="16"
      font-weight="500"
      text-anchor="middle"
    >
      {{ title }}
    </text>
  </svg>
</template>

<script setup lang="ts">
const { title } = defineProps<{ title: string }>()
</script>
