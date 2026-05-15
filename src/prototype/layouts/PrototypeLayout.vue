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
    <!-- PrimeVue Toast targets. GraphView.vue mounts <GlobalToast /> for the
         real app; the prototype path doesn't, so any useToast() add()s would
         be dropped. Mounting both default and grouped toast renderers here. -->
    <Toast />
    <Toast group="save-to-cloud">
      <template #message>
        <div
          v-if="uploadProgress"
          class="flex w-full items-center gap-3 px-3 py-2"
        >
          <i
            class="icon-[lucide--cloud-upload] size-5 shrink-0 text-primary-background"
          />
          <div class="flex min-w-0 flex-col">
            <span class="text-sm font-semibold">
              {{ t('mediaAsset.actions.savingToCloudSummary') }}
            </span>
            <span class="text-xs text-muted-foreground">
              {{
                t('mediaAsset.actions.savingToCloudDetail', {
                  current: uploadProgress.done,
                  total: uploadProgress.total,
                  destination: uploadProgress.destination
                })
              }}
            </span>
          </div>
        </div>
      </template>
    </Toast>
  </div>
</template>

<script setup lang="ts">
import Toast from 'primevue/toast'
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { uploadProgress } from '../composables/useSimulatedSaveToCloud'

const { t } = useI18n()

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
