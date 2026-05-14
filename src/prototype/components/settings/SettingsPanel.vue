<!--
  Implements:
    prototype/design-decisions.md (2026-05-13) — Settings design system.

  Standardized panel chrome used by every Workspace Settings section.
  Header slot accepts an `actions` slot for right-aligned controls.
-->
<template>
  <section
    class="flex flex-col gap-6 rounded-2xl border border-interface-stroke p-6"
  >
    <header
      v-if="title || $slots.header"
      class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4"
    >
      <div class="flex flex-col gap-1">
        <h2 v-if="title" class="m-0 text-sm font-bold text-text-primary">
          {{ title }}
        </h2>
        <p v-if="description" class="m-0 text-sm text-text-secondary">
          {{ description }}
        </p>
        <slot name="header" />
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </header>

    <slot />
  </section>
</template>

<script setup lang="ts">
const { title, description } = defineProps<{
  title?: string
  description?: string
}>()
</script>
