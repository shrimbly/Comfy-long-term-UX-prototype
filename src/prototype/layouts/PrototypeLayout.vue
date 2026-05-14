<!--
  Implements:
    prototype scaffolding — wraps every /prototype/* route.

  Standalone layout so the prototype runs without the upstream
  WorkspaceAuthGate. Toggles the `dark-theme` body class on mount/unmount
  to flip the design-system tokens into their dark variants (matching how
  the upstream GraphView opts into the dark palette).

  The <style> block below is a deliberate exception to the "no <style>"
  rule — the design-system stylesheet omits tailwindcss/preflight, so bare
  <button> elements fall through to native WebKit rendering (grey
  gradient, inset border, focus ring). Scoping a reset to .prototype-root
  fixes it once for the entire prototype without affecting upstream code.
-->
<template>
  <div
    class="prototype-root size-full bg-base-background text-sm text-base-foreground"
  >
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

const DARK_THEME_CLASS = 'dark-theme'

onMounted(() => {
  document.body.classList.add(DARK_THEME_CLASS)
})
onBeforeUnmount(() => {
  document.body.classList.remove(DARK_THEME_CLASS)
})
</script>

<style>
/*
 * Placed in @layer base so Tailwind utility classes (in @layer utilities,
 * declared later in design-system/style.css) override these defaults.
 * Without the layer, the reset would be unlayered and would win over
 * every layered utility — killing hover:bg-* on bare <button> elements.
 */
@layer base {
  .prototype-root button {
    background-color: transparent;
    background-image: none;
    border: 0;
    padding: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
    appearance: none;
  }
  .prototype-root button:focus {
    outline: none;
  }
  .prototype-root input,
  .prototype-root textarea,
  .prototype-root select {
    appearance: none;
    border: 0;
    padding: 0;
    background: transparent;
    color: inherit;
    font: inherit;
  }
  .prototype-root ul,
  .prototype-root ol {
    list-style: none;
    margin: 0;
    padding: 0;
  }
}
</style>
