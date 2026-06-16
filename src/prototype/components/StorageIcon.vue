<!--
  Cloud / local storage glyph as an inline lucide SVG so the stroke weight
  is controllable (the icon-[lucide--*] mask utilities bake in a 2px
  stroke and can't be thinned via CSS). Colour follows currentColor; size
  via a size-* class on the element.
-->
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    role="img"
    :aria-label="label"
  >
    <title v-if="label">{{ label }}</title>
    <template v-if="storage === 'local'">
      <line x1="22" x2="2" y1="12" y2="12" />
      <path
        d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
      />
      <line x1="6" x2="6.01" y1="16" y2="16" />
      <line x1="10" x2="10.01" y1="16" y2="16" />
    </template>
    <path v-else d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </svg>
</template>

<script setup lang="ts">
import type { AssetStorage } from '../types'

const { storage, label } = defineProps<{
  storage: AssetStorage
  label?: string
}>()
</script>
