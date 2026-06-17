<!--
  Provider logo badge, ported from the prod template gallery's LogoOverlay:
  a pill in the top-left of the thumbnail showing the partner/provider logo +
  name. Logo media resolves against the same upstream CDN as the thumbnails
  (utils/thumbnail.ts). If the logo image fails to load, the pill hides itself.

  Scrim + white text sit ON TOP of arbitrary media for legibility, so they are
  intentionally theme-independent (not a `dark:`/token concern).
-->
<template>
  <span
    v-if="logoUrl && !failed"
    class="pointer-events-none absolute top-2 left-2 z-20 flex items-center gap-1.5 rounded-full bg-black/20 py-1 pr-2 pl-0.5"
    :style="{ opacity: 0.85 }"
  >
    <img
      :src="logoUrl"
      :alt="provider"
      draggable="false"
      class="size-6 rounded-full border-2 border-white object-cover"
      @error="failed = true"
    />
    <span class="text-sm font-medium text-white">{{ provider }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { templateProviderLogoUrl } from '../utils/thumbnail'

const { provider } = defineProps<{ provider: string }>()

const failed = ref(false)
const logoUrl = computed(() => templateProviderLogoUrl(provider))
</script>
